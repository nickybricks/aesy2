import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration based on FMP API limits (750 calls/minute)
// Full analysis = 9 API calls per stock → max 83 stocks/minute
// Price-only update = 1 API call per stock → max 750 stocks/minute
const FULL_ANALYSIS_BATCH_SIZE = 80;
const PRICE_UPDATE_BATCH_SIZE = 700;

// Process one batch per invocation, then self-invoke for next batch
const BATCH_DELAY_MS = 5000; // 5 seconds between self-invocations

// Cache age thresholds
const SKIP_IF_NEWER_THAN_HOURS = 4;
const PRICE_ONLY_IF_NEWER_THAN_DAYS = 7;

interface ContinuationState {
  jobId: string;
  jobName: string;
  trigger: string;
  currentMarketIndex: number;
  markets: string[];
  currentPhase: 'full_analysis' | 'price_update';
  batchOffset: number;
  stocksToProcess: string[]; // Symbol list for current phase
  stats: {
    stocksFullAnalyzed: number;
    stocksPriceUpdated: number;
    stocksSkipped: number;
    stocksFailed: number;
    totalApiCalls: number;
    marketsProcessed: any[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
  if (!FMP_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'FMP_API_KEY not configured' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON
    }

    // Check if this is a continuation call
    if (body.continuation) {
      return await handleContinuation(body.continuation, supabaseClient, FMP_API_KEY);
    }

    // Fresh start - initialize new job
    const trigger = body.trigger || 'manual';
    const jobName = `quant-update-${trigger}-${new Date().toISOString().split('T')[0]}`;
    
    console.log(`[${jobName}] Starting scheduled quant update...`);

    // MUTEX CHECK: Ensure no other job is currently running
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const { data: runningJobs, error: runningError } = await supabaseClient
      .from('scheduled_job_logs')
      .select('id, job_name, started_at')
      .eq('status', 'running');

    if (!runningError && runningJobs && runningJobs.length > 0) {
      // Check if any running job is recent (< 3 hours old)
      const recentRunningJobs = runningJobs.filter(j => j.started_at >= threeHoursAgo);
      
      if (recentRunningJobs.length > 0) {
        console.log(`[${jobName}] Skipping - another job is already running: ${recentRunningJobs[0].job_name}`);
        return new Response(
          JSON.stringify({
            error: 'Another job is already running',
            runningJob: recentRunningJobs[0].job_name,
            skipped: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        );
      }

      // Mark old running jobs as stale
      for (const oldJob of runningJobs.filter(j => j.started_at < threeHoursAgo)) {
        console.log(`[${jobName}] Marking stale job: ${oldJob.job_name}`);
        await supabaseClient
          .from('scheduled_job_logs')
          .update({
            status: 'stale',
            completed_at: new Date().toISOString(),
            error_message: 'Job timed out - marked as stale by new job start'
          })
          .eq('id', oldJob.id);
      }
    }

    // Create job log entry
    const { data: jobLog, error: jobError } = await supabaseClient
      .from('scheduled_job_logs')
      .insert({
        job_name: jobName,
        trigger_source: trigger,
        status: 'running',
        markets_processed: []
      })
      .select()
      .single();

    if (jobError) {
      console.error(`[${jobName}] Failed to create job log:`, jobError);
    }

    const jobId = jobLog?.id || 'unknown';
    const markets = ['NYSE', 'NASDAQ'];

    // Get stocks for first market and categorize
    const firstMarketStocks = await getAndCategorizeStocks(
      markets[0], jobName, supabaseClient, FMP_API_KEY
    );

    console.log(`[${jobName}] ${markets[0]} stocks: ${firstMarketStocks.fullAnalysis.length} full, ${firstMarketStocks.priceUpdate.length} price, ${firstMarketStocks.skipped} skipped`);

    // Initialize continuation state
    const state: ContinuationState = {
      jobId,
      jobName,
      trigger,
      currentMarketIndex: 0,
      markets,
      currentPhase: 'full_analysis',
      batchOffset: 0,
      stocksToProcess: firstMarketStocks.fullAnalysis,
      stats: {
        stocksFullAnalyzed: 0,
        stocksPriceUpdated: 0,
        stocksSkipped: firstMarketStocks.skipped,
        stocksFailed: 0,
        totalApiCalls: 1, // stock list API call
        marketsProcessed: []
      }
    };

    // Store price update stocks for later (in job log metadata)
    await supabaseClient
      .from('scheduled_job_logs')
      .update({
        error_message: JSON.stringify({
          priceUpdateStocks: { [markets[0]]: firstMarketStocks.priceUpdate }
        })
      })
      .eq('id', jobId);

    // Process first batch immediately
    const result = await processOneBatch(state, supabaseClient, FMP_API_KEY);

    if (result.hasMore) {
      // Schedule self-invocation for next batch
      await scheduleContinuation(result.nextState, supabaseClient);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scheduled quant update started',
        jobId: jobId,
        jobName: jobName,
        totalStocks: firstMarketStocks.fullAnalysis.length + firstMarketStocks.priceUpdate.length,
        skipped: firstMarketStocks.skipped
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in scheduled quant update:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function handleContinuation(
  state: ContinuationState,
  supabaseClient: any,
  FMP_API_KEY: string
): Promise<Response> {
  console.log(`[${state.jobName}] Continuing: market=${state.markets[state.currentMarketIndex]}, phase=${state.currentPhase}, batch=${Math.floor(state.batchOffset / FULL_ANALYSIS_BATCH_SIZE) + 1}`);

  try {
    const result = await processOneBatch(state, supabaseClient, FMP_API_KEY);

    if (result.hasMore) {
      // Schedule next batch
      await scheduleContinuation(result.nextState, supabaseClient);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Batch processed, continuation scheduled',
          progress: {
            market: state.markets[state.currentMarketIndex],
            phase: state.currentPhase,
            processed: state.batchOffset + FULL_ANALYSIS_BATCH_SIZE,
            total: state.stocksToProcess.length
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      // Job completed
      await supabaseClient
        .from('scheduled_job_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          markets_processed: result.nextState.stats.marketsProcessed,
          stocks_full_analyzed: result.nextState.stats.stocksFullAnalyzed,
          stocks_price_updated: result.nextState.stats.stocksPriceUpdated,
          stocks_skipped: result.nextState.stats.stocksSkipped,
          stocks_failed: result.nextState.stats.stocksFailed,
          total_api_calls: result.nextState.stats.totalApiCalls,
          error_message: null
        })
        .eq('id', state.jobId);

      console.log(`[${state.jobName}] Job completed!`, result.nextState.stats);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Job completed',
          stats: result.nextState.stats
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
  } catch (error) {
    console.error(`[${state.jobName}] Error in continuation:`, error);
    
    // Update job status to failed
    await supabaseClient
      .from('scheduled_job_logs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : String(error)
      })
      .eq('id', state.jobId);

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

async function processOneBatch(
  state: ContinuationState,
  supabaseClient: any,
  FMP_API_KEY: string
): Promise<{ hasMore: boolean; nextState: ContinuationState }> {
  const nextState = { ...state, stats: { ...state.stats, marketsProcessed: [...state.stats.marketsProcessed] } };
  
  if (state.currentPhase === 'full_analysis') {
    const batchSize = FULL_ANALYSIS_BATCH_SIZE;
    const batch = state.stocksToProcess.slice(state.batchOffset, state.batchOffset + batchSize);
    
    if (batch.length > 0) {
      console.log(`[${state.jobName}] Full analysis batch: ${batch.length} stocks (${state.batchOffset + 1}-${state.batchOffset + batch.length} of ${state.stocksToProcess.length})`);
      
      for (const symbol of batch) {
        try {
          await performFullAnalysis(symbol, state.markets[state.currentMarketIndex], supabaseClient, FMP_API_KEY);
          nextState.stats.stocksFullAnalyzed++;
          nextState.stats.totalApiCalls += 9;
        } catch (error) {
          console.error(`[${state.jobName}] Failed: ${symbol}`, error);
          nextState.stats.stocksFailed++;
        }
      }

      nextState.batchOffset = state.batchOffset + batchSize;

      // Update job log with progress
      await updateJobProgress(state.jobId, nextState.stats, supabaseClient);
    }

    // Check if more full analysis batches remain
    if (nextState.batchOffset < state.stocksToProcess.length) {
      return { hasMore: true, nextState };
    }

    // Switch to price update phase
    const { data: jobLog } = await supabaseClient
      .from('scheduled_job_logs')
      .select('error_message')
      .eq('id', state.jobId)
      .single();

    let priceUpdateStocks: string[] = [];
    try {
      const metadata = JSON.parse(jobLog?.error_message || '{}');
      priceUpdateStocks = metadata.priceUpdateStocks?.[state.markets[state.currentMarketIndex]] || [];
    } catch {}

    if (priceUpdateStocks.length > 0) {
      nextState.currentPhase = 'price_update';
      nextState.batchOffset = 0;
      nextState.stocksToProcess = priceUpdateStocks;
      return { hasMore: true, nextState };
    }

    // Move to next market or finish
    return await moveToNextMarket(nextState, supabaseClient, FMP_API_KEY);
  }

  if (state.currentPhase === 'price_update') {
    const batchSize = PRICE_UPDATE_BATCH_SIZE;
    const batch = state.stocksToProcess.slice(state.batchOffset, state.batchOffset + batchSize);
    
    if (batch.length > 0) {
      console.log(`[${state.jobName}] Price update batch: ${batch.length} stocks`);
      
      try {
        const updated = await performBatchPriceUpdate(batch, state.markets[state.currentMarketIndex], supabaseClient, FMP_API_KEY);
        nextState.stats.stocksPriceUpdated += updated;
        nextState.stats.totalApiCalls += 1;
      } catch (error) {
        console.error(`[${state.jobName}] Batch price update failed:`, error);
        nextState.stats.stocksFailed += batch.length;
      }

      nextState.batchOffset = state.batchOffset + batchSize;
      await updateJobProgress(state.jobId, nextState.stats, supabaseClient);
    }

    if (nextState.batchOffset < state.stocksToProcess.length) {
      return { hasMore: true, nextState };
    }

    // Move to next market or finish
    return await moveToNextMarket(nextState, supabaseClient, FMP_API_KEY);
  }

  return { hasMore: false, nextState };
}

async function moveToNextMarket(
  state: ContinuationState,
  supabaseClient: any,
  FMP_API_KEY: string
): Promise<{ hasMore: boolean; nextState: ContinuationState }> {
  const nextState = { ...state };

  // Record completed market stats
  nextState.stats.marketsProcessed.push({
    market: state.markets[state.currentMarketIndex],
    fullAnalysis: state.stats.stocksFullAnalyzed,
    priceUpdate: state.stats.stocksPriceUpdated,
    skipped: state.stats.stocksSkipped,
    failed: state.stats.stocksFailed
  });

  nextState.currentMarketIndex = state.currentMarketIndex + 1;

  if (nextState.currentMarketIndex >= state.markets.length) {
    // All markets done
    return { hasMore: false, nextState };
  }

  // Get stocks for next market
  const nextMarket = state.markets[nextState.currentMarketIndex];
  console.log(`[${state.jobName}] Moving to market: ${nextMarket}`);
  
  const marketStocks = await getAndCategorizeStocks(
    nextMarket, state.jobName, supabaseClient, FMP_API_KEY
  );

  nextState.currentPhase = 'full_analysis';
  nextState.batchOffset = 0;
  nextState.stocksToProcess = marketStocks.fullAnalysis;
  nextState.stats.stocksSkipped += marketStocks.skipped;
  nextState.stats.totalApiCalls += 1;

  // Store price update stocks
  const { data: jobLog } = await supabaseClient
    .from('scheduled_job_logs')
    .select('error_message')
    .eq('id', state.jobId)
    .single();

  let metadata: any = {};
  try {
    metadata = JSON.parse(jobLog?.error_message || '{}');
  } catch {}
  
  metadata.priceUpdateStocks = metadata.priceUpdateStocks || {};
  metadata.priceUpdateStocks[nextMarket] = marketStocks.priceUpdate;

  await supabaseClient
    .from('scheduled_job_logs')
    .update({ error_message: JSON.stringify(metadata) })
    .eq('id', state.jobId);

  console.log(`[${state.jobName}] ${nextMarket}: ${marketStocks.fullAnalysis.length} full, ${marketStocks.priceUpdate.length} price, ${marketStocks.skipped} skipped`);

  return { hasMore: true, nextState };
}

async function scheduleContinuation(state: ContinuationState, supabaseClient: any) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  // Use setTimeout equivalent via fetch with delay
  // Actually, we invoke immediately - the delay is just for rate limiting
  await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/scheduled-quant-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ continuation: state })
    });

    if (!response.ok) {
      console.error(`[${state.jobName}] Self-invoke failed:`, await response.text());
    }
  } catch (error) {
    console.error(`[${state.jobName}] Self-invoke error:`, error);
  }
}

async function updateJobProgress(jobId: string, stats: ContinuationState['stats'], supabaseClient: any) {
  await supabaseClient
    .from('scheduled_job_logs')
    .update({
      stocks_full_analyzed: stats.stocksFullAnalyzed,
      stocks_price_updated: stats.stocksPriceUpdated,
      stocks_skipped: stats.stocksSkipped,
      stocks_failed: stats.stocksFailed,
      total_api_calls: stats.totalApiCalls
    })
    .eq('id', jobId);
}

async function getAndCategorizeStocks(
  marketId: string,
  jobName: string,
  supabaseClient: any,
  FMP_API_KEY: string
): Promise<{ fullAnalysis: string[]; priceUpdate: string[]; skipped: number }> {
  console.log(`[${jobName}] Fetching stock list for ${marketId}...`);
  
  const stocksResponse = await fetch(
    `https://financialmodelingprep.com/api/v3/stock/list?apikey=${FMP_API_KEY}`
  );
  const allStocks = await stocksResponse.json();

  const marketStocks = allStocks.filter((s: any) =>
    s.exchangeShortName === marketId && s.type === 'stock' && !s.isEtf
  );

  console.log(`[${jobName}] Found ${marketStocks.length} stocks in ${marketId}`);

  // Get cache data
  const { data: existingCache } = await supabaseClient
    .from('stock_analysis_cache')
    .select('symbol, last_updated')
    .eq('market_id', marketId);

  const cacheMap = new Map<string, number>();
  if (existingCache) {
    for (const item of existingCache) {
      cacheMap.set(item.symbol, new Date(item.last_updated).getTime());
    }
  }

  const now = Date.now();
  const skipThreshold = now - (SKIP_IF_NEWER_THAN_HOURS * 60 * 60 * 1000);
  const priceOnlyThreshold = now - (PRICE_ONLY_IF_NEWER_THAN_DAYS * 24 * 60 * 60 * 1000);

  const fullAnalysis: string[] = [];
  const priceUpdate: string[] = [];
  let skipped = 0;

  for (const stock of marketStocks) {
    const lastUpdate = cacheMap.get(stock.symbol);

    if (lastUpdate) {
      if (lastUpdate > skipThreshold) {
        skipped++;
      } else if (lastUpdate > priceOnlyThreshold) {
        priceUpdate.push(stock.symbol);
      } else {
        fullAnalysis.push(stock.symbol);
      }
    } else {
      fullAnalysis.push(stock.symbol);
    }
  }

  return { fullAnalysis, priceUpdate, skipped };
}

// Build criteria object for screener filtering
function buildCriteria(
  ratiosData: any, 
  keyMetricsData: any, 
  growthData: any, 
  incomeStatements: any[], 
  cashFlow: any[]
) {
  // SAFETY: Ensure inputs are arrays
  const safeIncomeStatements = Array.isArray(incomeStatements) ? incomeStatements : [];
  const safeCashFlow = Array.isArray(cashFlow) ? cashFlow : [];

  // Years of profitability (max 10 years)
  const yearsOfProfitability = safeIncomeStatements
    .slice(0, 10)
    .filter((stmt: any) => stmt.netIncome > 0).length;
  
  // Profitable last 3 years
  const profitableYearsLast3 = safeIncomeStatements
    .slice(0, 3)
    .filter((stmt: any) => stmt.netIncome > 0).length;
  
  // FCF Margin
  const latestCashFlow = safeCashFlow[0] || {};
  const latestIncome = safeIncomeStatements[0] || {};
  const fcfMargin = latestIncome.revenue > 0 
    ? (latestCashFlow.freeCashFlow / latestIncome.revenue) * 100 
    : null;
  
  // CAGR calculation helper
  const calculateCAGR = (values: number[], years: number): number | null => {
    if (values.length < years + 1) return null;
    const startValue = values[years];
    const endValue = values[0];
    if (startValue <= 0 || endValue <= 0) return null;
    const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
    return isFinite(cagr) ? cagr : null;
  };
  
  // Revenue CAGR values
  const revenueValues = safeIncomeStatements
    .slice(0, 11)
    .map((s: any) => s.revenue)
    .filter((v: any) => v > 0);
  
  // EPS CAGR values
  const epsValues = safeIncomeStatements
    .slice(0, 11)
    .map((s: any) => s.eps || s.epsdiluted)
    .filter((v: any) => v > 0);

  const roicValue = ratiosData?.roicTTM 
    ? ratiosData.roicTTM * 100 
    : (keyMetricsData?.roicTTM ? keyMetricsData.roicTTM * 100 : null);
  
  const roeValue = ratiosData?.returnOnEquityTTM 
    ? ratiosData.returnOnEquityTTM * 100 
    : null;
  
  const dividendYieldValue = ratiosData?.dividendYieldTTM 
    ? ratiosData.dividendYieldTTM * 100 
    : null;
  
  const epsGrowthValue = growthData?.epsgrowth 
    ? growthData.epsgrowth * 100 
    : null;
  
  const revenueGrowthValue = growthData?.revenueGrowth 
    ? growthData.revenueGrowth * 100 
    : null;
  
  const netMarginValue = ratiosData?.netProfitMarginTTM 
    ? ratiosData.netProfitMarginTTM * 100 
    : null;
  
  const netDebtToEbitdaValue = keyMetricsData?.netDebtToEBITDATTM ?? null;

  return {
    yearsOfProfitability: { 
      value: yearsOfProfitability,
      pass: yearsOfProfitability >= 8 || (yearsOfProfitability >= 6 && profitableYearsLast3 === 3),
      profitableYearsLast3: profitableYearsLast3
    },
    pe: { 
      value: ratiosData?.peRatioTTM ?? null,
      pass: ratiosData?.peRatioTTM != null && ratiosData.peRatioTTM > 0 && ratiosData.peRatioTTM < 20
    },
    roic: { 
      value: roicValue,
      pass: (roicValue ?? 0) >= 12
    },
    roe: { 
      value: roeValue,
      pass: (roeValue ?? 0) >= 15
    },
    dividendYield: { 
      value: dividendYieldValue,
      pass: (dividendYieldValue ?? 0) > 2
    },
    epsGrowth: { 
      value: epsGrowthValue,
      pass: (epsGrowthValue ?? 0) >= 5,
      cagr3y: calculateCAGR(epsValues, 3),
      cagr10y: calculateCAGR(epsValues, 10)
    },
    revenueGrowth: { 
      value: revenueGrowthValue,
      pass: (revenueGrowthValue ?? 0) >= 5,
      cagr3y: calculateCAGR(revenueValues, 3),
      cagr10y: calculateCAGR(revenueValues, 10)
    },
    netDebtToEbitda: { 
      value: netDebtToEbitdaValue,
      pass: (netDebtToEbitdaValue ?? 999) <= 3
    },
    netMargin: { 
      value: netMarginValue,
      pass: (netMarginValue ?? 0) >= 10
    },
    fcfMargin: { 
      value: fcfMargin,
      pass: (fcfMargin ?? 0) >= 10
    }
  };
}

async function performFullAnalysis(
  symbol: string,
  marketId: string,
  supabaseClient: any,
  FMP_API_KEY: string
) {
  const [ratiosTTM, profile, incomeStatements, balanceSheets, keyMetrics, cashFlow, quote, growthMetrics, enterpriseValues] =
    await Promise.all([
      fetch(`https://financialmodelingprep.com/api/v3/ratios-ttm/${symbol}?apikey=${FMP_API_KEY}`).then(r => r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_API_KEY}`).then(r => r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/income-statement/${symbol}?limit=10&apikey=${FMP_API_KEY}`).then(r => r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${symbol}?limit=5&apikey=${FMP_API_KEY}`).then(r => r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/key-metrics-ttm/${symbol}?apikey=${FMP_API_KEY}`).then(r => r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${symbol}?limit=5&apikey=${FMP_API_KEY}`).then(r => r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`).then(r => r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/financial-growth/${symbol}?limit=5&apikey=${FMP_API_KEY}`).then(r => r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/enterprise-values/${symbol}?limit=1&apikey=${FMP_API_KEY}`).then(r => r.json())
    ]);

  if (!ratiosTTM || ratiosTTM.length === 0 || !profile || profile.length === 0) {
    throw new Error(`Insufficient data for ${symbol}`);
  }

  const profileData = profile[0];
  const quoteData = quote[0] || {};
  const ratiosData = ratiosTTM[0] || {};
  const keyMetricsData = keyMetrics[0] || {};
  const latestIncome = incomeStatements[0] || {};
  const latestCashFlow = cashFlow[0] || {};
  const growthData = growthMetrics[0] || {};

  const buffettScore = calculateBuffettScore({
    ratios: ratiosData,
    keyMetrics: keyMetricsData,
    cashFlow: latestCashFlow,
    growth: growthData
  });

  // Build criteria object for screener filtering
  const criteria = buildCriteria(ratiosData, keyMetricsData, growthData, incomeStatements, cashFlow);

  // Store raw data
  await supabaseClient
    .from('stock_data_cache')
    .upsert({
      symbol,
      company_name: profileData?.companyName,
      exchange: marketId,
      sector: profileData?.sector,
      currency: profileData?.currency || 'USD',
      raw_data: { ratiosTTM, profile, incomeStatements, balanceSheets, keyMetrics, cashFlow, quote, growthMetrics, enterpriseValues },
      last_updated: new Date().toISOString()
    });

  // Store analysis with criteria object
  await supabaseClient
    .from('stock_analysis_cache')
    .upsert({
      symbol,
      market_id: marketId,
      buffett_score: buffettScore.total,
      analysis_result: {
        symbol,
        name: profileData?.companyName,
        sector: profileData?.sector,
        industry: profileData?.industry,
        exchange: marketId,
        price: quoteData?.price || 0,
        currency: profileData?.currency || 'USD',
        marketCap: quoteData?.marketCap || profileData?.mktCap,
        buffettScore: buffettScore.total,
        buffettScoreDetails: buffettScore.details,
        peRatio: ratiosData?.peRatioTTM,
        pbRatio: ratiosData?.priceToBookRatioTTM,
        pfcfRatio: ratiosData?.priceToFreeCashFlowsRatioTTM,
        evToEbitda: keyMetricsData?.enterpriseValueOverEBITDATTM,
        roe: ratiosData?.returnOnEquityTTM,
        roa: ratiosData?.returnOnAssetsTTM,
        roic: ratiosData?.roicTTM || keyMetricsData?.roicTTM,
        grossMargin: ratiosData?.grossProfitMarginTTM,
        netMargin: ratiosData?.netProfitMarginTTM,
        operatingMargin: ratiosData?.operatingProfitMarginTTM,
        currentRatio: ratiosData?.currentRatioTTM,
        debtToEquity: ratiosData?.debtEquityRatioTTM,
        interestCoverage: ratiosData?.interestCoverageTTM,
        revenueGrowth: growthData?.revenueGrowth,
        epsGrowth: growthData?.epsgrowth,
        dividendYield: ratiosData?.dividendYieldTTM || keyMetricsData?.dividendYieldTTM,
        payoutRatio: ratiosData?.payoutRatioTTM,
        beta: profileData?.beta,
        description: profileData?.description,
        change: quoteData?.change,
        changesPercentage: quoteData?.changesPercentage,
        criteria  // NEW: criteria object for screener filtering
      },
      last_updated: new Date().toISOString()
    });
}

async function performBatchPriceUpdate(
  symbols: string[],
  marketId: string,
  supabaseClient: any,
  FMP_API_KEY: string
): Promise<number> {
  const symbolsStr = symbols.join(',');
  const quoteResponse = await fetch(
    `https://financialmodelingprep.com/api/v3/quote/${symbolsStr}?apikey=${FMP_API_KEY}`
  );
  const quotes = await quoteResponse.json();

  let updated = 0;
  if (Array.isArray(quotes)) {
    for (const quote of quotes) {
      const { data: existing } = await supabaseClient
        .from('stock_analysis_cache')
        .select('analysis_result')
        .eq('symbol', quote.symbol)
        .eq('market_id', marketId)
        .single();

      if (existing?.analysis_result) {
        await supabaseClient
          .from('stock_analysis_cache')
          .update({
            analysis_result: {
              ...existing.analysis_result,
              price: quote.price,
              change: quote.change,
              changesPercentage: quote.changesPercentage,
              dayLow: quote.dayLow,
              dayHigh: quote.dayHigh,
              volume: quote.volume,
              marketCap: quote.marketCap
            },
            last_updated: new Date().toISOString()
          })
          .eq('symbol', quote.symbol)
          .eq('market_id', marketId);
        updated++;
      }
    }
  }
  return updated;
}

function calculateBuffettScore(data: {
  ratios: any;
  keyMetrics: any;
  cashFlow: any;
  growth: any;
}): { total: number; details: any } {
  const { ratios, keyMetrics, cashFlow, growth } = data;

  let totalScore = 0;
  const maxScore = 100;
  const details: any = {};

  // 1. ROE > 15% (10 points)
  const roe = ratios?.returnOnEquityTTM || 0;
  if (roe >= 0.20) { totalScore += 10; details.roe = { score: 10, value: roe, status: 'excellent' }; }
  else if (roe >= 0.15) { totalScore += 7; details.roe = { score: 7, value: roe, status: 'good' }; }
  else if (roe >= 0.10) { totalScore += 4; details.roe = { score: 4, value: roe, status: 'fair' }; }
  else { details.roe = { score: 0, value: roe, status: 'poor' }; }

  // 2. ROIC > 10% (10 points)
  const roic = ratios?.roicTTM || keyMetrics?.roicTTM || 0;
  if (roic >= 0.15) { totalScore += 10; details.roic = { score: 10, value: roic, status: 'excellent' }; }
  else if (roic >= 0.10) { totalScore += 7; details.roic = { score: 7, value: roic, status: 'good' }; }
  else if (roic >= 0.07) { totalScore += 4; details.roic = { score: 4, value: roic, status: 'fair' }; }
  else { details.roic = { score: 0, value: roic, status: 'poor' }; }

  // 3. Debt to Equity < 0.5 (10 points)
  const debtToEquity = ratios?.debtEquityRatioTTM || 0;
  if (debtToEquity < 0.3) { totalScore += 10; details.debtToEquity = { score: 10, value: debtToEquity, status: 'excellent' }; }
  else if (debtToEquity < 0.5) { totalScore += 7; details.debtToEquity = { score: 7, value: debtToEquity, status: 'good' }; }
  else if (debtToEquity < 1) { totalScore += 4; details.debtToEquity = { score: 4, value: debtToEquity, status: 'fair' }; }
  else { details.debtToEquity = { score: 0, value: debtToEquity, status: 'poor' }; }

  // 4. Current Ratio > 1.5 (10 points)
  const currentRatio = ratios?.currentRatioTTM || 0;
  if (currentRatio >= 2) { totalScore += 10; details.currentRatio = { score: 10, value: currentRatio, status: 'excellent' }; }
  else if (currentRatio >= 1.5) { totalScore += 7; details.currentRatio = { score: 7, value: currentRatio, status: 'good' }; }
  else if (currentRatio >= 1) { totalScore += 4; details.currentRatio = { score: 4, value: currentRatio, status: 'fair' }; }
  else { details.currentRatio = { score: 0, value: currentRatio, status: 'poor' }; }

  // 5. Gross Margin > 40% (10 points)
  const grossMargin = ratios?.grossProfitMarginTTM || 0;
  if (grossMargin >= 0.50) { totalScore += 10; details.grossMargin = { score: 10, value: grossMargin, status: 'excellent' }; }
  else if (grossMargin >= 0.40) { totalScore += 7; details.grossMargin = { score: 7, value: grossMargin, status: 'good' }; }
  else if (grossMargin >= 0.30) { totalScore += 4; details.grossMargin = { score: 4, value: grossMargin, status: 'fair' }; }
  else { details.grossMargin = { score: 0, value: grossMargin, status: 'poor' }; }

  // 6. Net Margin > 10% (10 points)
  const netMargin = ratios?.netProfitMarginTTM || 0;
  if (netMargin >= 0.15) { totalScore += 10; details.netMargin = { score: 10, value: netMargin, status: 'excellent' }; }
  else if (netMargin >= 0.10) { totalScore += 7; details.netMargin = { score: 7, value: netMargin, status: 'good' }; }
  else if (netMargin >= 0.05) { totalScore += 4; details.netMargin = { score: 4, value: netMargin, status: 'fair' }; }
  else { details.netMargin = { score: 0, value: netMargin, status: 'poor' }; }

  // 7. P/E Ratio (10 points)
  const pe = ratios?.peRatioTTM || 0;
  if (pe > 0 && pe < 15) { totalScore += 10; details.peRatio = { score: 10, value: pe, status: 'excellent' }; }
  else if (pe > 0 && pe < 20) { totalScore += 7; details.peRatio = { score: 7, value: pe, status: 'good' }; }
  else if (pe > 0 && pe < 30) { totalScore += 4; details.peRatio = { score: 4, value: pe, status: 'fair' }; }
  else { details.peRatio = { score: 0, value: pe, status: 'poor' }; }

  // 8. Free Cash Flow positive (10 points)
  const fcf = cashFlow?.freeCashFlow || 0;
  if (fcf > 0) { totalScore += 10; details.freeCashFlow = { score: 10, value: fcf, status: 'excellent' }; }
  else { details.freeCashFlow = { score: 0, value: fcf, status: 'poor' }; }

  // 9. Revenue Growth (10 points)
  const revenueGrowth = growth?.revenueGrowth || 0;
  if (revenueGrowth >= 0.10) { totalScore += 10; details.revenueGrowth = { score: 10, value: revenueGrowth, status: 'excellent' }; }
  else if (revenueGrowth >= 0.05) { totalScore += 7; details.revenueGrowth = { score: 7, value: revenueGrowth, status: 'good' }; }
  else if (revenueGrowth >= 0) { totalScore += 4; details.revenueGrowth = { score: 4, value: revenueGrowth, status: 'fair' }; }
  else { details.revenueGrowth = { score: 0, value: revenueGrowth, status: 'poor' }; }

  // 10. Interest Coverage > 5 (10 points)
  const interestCoverage = ratios?.interestCoverageTTM || 0;
  if (interestCoverage >= 10) { totalScore += 10; details.interestCoverage = { score: 10, value: interestCoverage, status: 'excellent' }; }
  else if (interestCoverage >= 5) { totalScore += 7; details.interestCoverage = { score: 7, value: interestCoverage, status: 'good' }; }
  else if (interestCoverage >= 2) { totalScore += 4; details.interestCoverage = { score: 4, value: interestCoverage, status: 'fair' }; }
  else { details.interestCoverage = { score: 0, value: interestCoverage, status: 'poor' }; }

  return { total: Math.round((totalScore / maxScore) * 100), details };
}
