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
      markets[0], jobName, trigger, supabaseClient, FMP_API_KEY
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
    nextMarket, state.jobName, state.trigger, supabaseClient, FMP_API_KEY
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
  trigger: string,
  supabaseClient: any,
  FMP_API_KEY: string
): Promise<{ fullAnalysis: string[]; priceUpdate: string[]; skipped: number }> {
  console.log(`[${jobName}] Fetching stock list for ${marketId}...`);
  
  const stocksResponse = await fetch(
    `https://financialmodelingprep.com/api/v3/stock/list?apikey=${FMP_API_KEY}`
  );
  const allStocksRaw = await stocksResponse.json();

  // SAFETY CHECK: Ensure we have an array (FMP sometimes returns error object)
  if (!Array.isArray(allStocksRaw)) {
    console.error(`[${jobName}] FMP stock list API returned non-array:`, allStocksRaw);
    throw new Error(`FMP API error: ${allStocksRaw?.["Error Message"] || allStocksRaw?.message || 'Invalid response - expected array'}`);
  }

  const marketStocks = allStocksRaw.filter((s: any) =>
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

  // Determine if this is Monday morning (full analysis day)
  const today = new Date();
  const isMonday = today.getUTCDay() === 1;
  const isMorningJob = trigger === 'morning';
  const doFullAnalysisDay = isMonday && isMorningJob;

  console.log(`[${jobName}] Update strategy: isMonday=${isMonday}, isMorningJob=${isMorningJob}, fullAnalysisDay=${doFullAnalysisDay}`);

  const fullAnalysis: string[] = [];
  const priceUpdate: string[] = [];

  for (const stock of marketStocks) {
    const inCache = cacheMap.has(stock.symbol);

    if (doFullAnalysisDay) {
      // Monday morning: Full analysis for ALL stocks
      fullAnalysis.push(stock.symbol);
    } else {
      // All other jobs: Only price updates (if in cache), otherwise full analysis for new stocks
      if (inCache) {
        priceUpdate.push(stock.symbol);
      } else {
        // New stock, not in cache -> needs full analysis
        fullAnalysis.push(stock.symbol);
      }
    }
  }

  console.log(`[${jobName}] ${marketId}: ${fullAnalysis.length} full analysis, ${priceUpdate.length} price updates (no skips)`);

  return { fullAnalysis, priceUpdate, skipped: 0 };
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

// Calculate Buffett Score from criteria (0-14 scale)
function calculateBuffettScoreFromCriteria(criteria: any): number {
  if (!criteria) return 0;
  
  let score = 0;
  
  // 10 Base criteria
  if (criteria.yearsOfProfitability?.pass) score++;
  if (criteria.pe?.pass) score++;
  if (criteria.roic?.pass) score++;
  if (criteria.roe?.pass) score++;
  if (criteria.dividendYield?.pass) score++;
  if (criteria.netDebtToEbitda?.pass) score++;
  if (criteria.netMargin?.pass) score++;
  if (criteria.fcfMargin?.pass) score++;
  
  // EPS Growth: 3y, 5y (epsGrowth.pass), 10y
  if (criteria.epsGrowth?.cagr3y !== null && criteria.epsGrowth?.cagr3y !== undefined && criteria.epsGrowth.cagr3y >= 5) score++;
  if (criteria.epsGrowth?.pass) score++;  // 5y
  if (criteria.epsGrowth?.cagr10y !== null && criteria.epsGrowth?.cagr10y !== undefined && criteria.epsGrowth.cagr10y >= 5) score++;
  
  // Revenue Growth: 3y, 5y (revenueGrowth.pass), 10y
  if (criteria.revenueGrowth?.cagr3y !== null && criteria.revenueGrowth?.cagr3y !== undefined && criteria.revenueGrowth.cagr3y >= 5) score++;
  if (criteria.revenueGrowth?.pass) score++;  // 5y
  if (criteria.revenueGrowth?.cagr10y !== null && criteria.revenueGrowth?.cagr10y !== undefined && criteria.revenueGrowth.cagr10y >= 5) score++;
  
  return score; // 0-14
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

  // Build criteria object for screener filtering
  const criteria = buildCriteria(ratiosData, keyMetricsData, growthData, incomeStatements, cashFlow);

  // Calculate Buffett Score from criteria (0-14 scale)
  const buffettScore = calculateBuffettScoreFromCriteria(criteria);

  // Store EPS for later price updates (to recalculate P/E)
  const eps = latestIncome.eps || latestIncome.epsdiluted || null;

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

  // Store analysis with criteria object and 0-14 score
  await supabaseClient
    .from('stock_analysis_cache')
    .upsert({
      symbol,
      market_id: marketId,
      buffett_score: buffettScore, // 0-14 scale
      analysis_result: {
        symbol,
        name: profileData?.companyName,
        sector: profileData?.sector,
        industry: profileData?.industry,
        exchange: marketId,
        price: quoteData?.price || 0,
        currency: profileData?.currency || 'USD',
        marketCap: quoteData?.marketCap || profileData?.mktCap,
        buffettScore: buffettScore, // 0-14 scale
        eps: eps, // Store EPS for price update recalculations
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
        criteria  // Criteria object for screener filtering
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
        const analysisResult = existing.analysis_result;
        
        // Get existing EPS to recalculate P/E ratio
        const eps = analysisResult.eps || null;
        
        // Calculate new P/E ratio based on new price
        let newPE = analysisResult.peRatio;
        if (quote.price && quote.price > 0 && eps && eps > 0) {
          newPE = quote.price / eps;
        }

        // Update criteria.pe with new P/E value and pass status
        const updatedCriteria = {
          ...analysisResult.criteria,
          pe: {
            ...analysisResult.criteria?.pe,
            value: newPE,
            pass: newPE != null && newPE > 0 && newPE < 20
          }
        };

        // Recalculate Buffett Score from updated criteria
        const newBuffettScore = calculateBuffettScoreFromCriteria(updatedCriteria);

        await supabaseClient
          .from('stock_analysis_cache')
          .update({
            buffett_score: newBuffettScore, // 0-14 scale
            analysis_result: {
              ...analysisResult,
              price: quote.price,
              change: quote.change,
              changesPercentage: quote.changesPercentage,
              dayLow: quote.dayLow,
              dayHigh: quote.dayHigh,
              volume: quote.volume,
              marketCap: quote.marketCap,
              peRatio: newPE,
              buffettScore: newBuffettScore, // 0-14 scale
              criteria: updatedCriteria
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
