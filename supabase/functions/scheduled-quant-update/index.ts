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
const FULL_ANALYSIS_DELAY_MS = 60000;
const PRICE_UPDATE_BATCH_SIZE = 700;
const PRICE_UPDATE_DELAY_MS = 60000;

// Cache age thresholds
const SKIP_IF_NEWER_THAN_HOURS = 4; // Skip if updated within 4 hours
const PRICE_ONLY_IF_NEWER_THAN_DAYS = 7; // Price-only update if 4h-7d old
// Full analysis if older than 7 days or new

interface JobStats {
  stocksFullAnalyzed: number;
  stocksPriceUpdated: number;
  stocksSkipped: number;
  stocksFailed: number;
  totalApiCalls: number;
  marketsProcessed: { market: string; stocks: number; fullAnalysis: number; priceUpdate: number; skipped: number; failed: number }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    let trigger = 'manual';
    try {
      const body = await req.json();
      trigger = body.trigger || 'manual';
    } catch {
      // No body or invalid JSON, use default
    }

    const jobName = `quant-update-${trigger}-${new Date().toISOString().split('T')[0]}`;
    
    console.log(`[${jobName}] Starting scheduled quant update...`);

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

    const jobId = jobLog?.id;

    // Use EdgeRuntime.waitUntil for background processing
    const backgroundTask = async () => {
      const stats: JobStats = {
        stocksFullAnalyzed: 0,
        stocksPriceUpdated: 0,
        stocksSkipped: 0,
        stocksFailed: 0,
        totalApiCalls: 0,
        marketsProcessed: []
      };

      try {
        // Process NYSE and NASDAQ
        const markets = ['NYSE', 'NASDAQ'];
        
        for (const marketId of markets) {
          console.log(`[${jobName}] Processing market: ${marketId}`);
          const marketStats = await processMarket(marketId, jobName, supabaseClient, stats);
          stats.marketsProcessed.push(marketStats);
          
          // Update job log after each market
          if (jobId) {
            await supabaseClient
              .from('scheduled_job_logs')
              .update({
                markets_processed: stats.marketsProcessed,
                stocks_full_analyzed: stats.stocksFullAnalyzed,
                stocks_price_updated: stats.stocksPriceUpdated,
                stocks_skipped: stats.stocksSkipped,
                stocks_failed: stats.stocksFailed,
                total_api_calls: stats.totalApiCalls
              })
              .eq('id', jobId);
          }
        }

        // Mark job as completed
        if (jobId) {
          await supabaseClient
            .from('scheduled_job_logs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              markets_processed: stats.marketsProcessed,
              stocks_full_analyzed: stats.stocksFullAnalyzed,
              stocks_price_updated: stats.stocksPriceUpdated,
              stocks_skipped: stats.stocksSkipped,
              stocks_failed: stats.stocksFailed,
              total_api_calls: stats.totalApiCalls
            })
            .eq('id', jobId);
        }

        console.log(`[${jobName}] Completed successfully!`, stats);
      } catch (error) {
        console.error(`[${jobName}] Fatal error:`, error);
        
        if (jobId) {
          await supabaseClient
            .from('scheduled_job_logs')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: error.message || String(error),
              markets_processed: stats.marketsProcessed,
              stocks_full_analyzed: stats.stocksFullAnalyzed,
              stocks_price_updated: stats.stocksPriceUpdated,
              stocks_skipped: stats.stocksSkipped,
              stocks_failed: stats.stocksFailed,
              total_api_calls: stats.totalApiCalls
            })
            .eq('id', jobId);
        }
      }
    };

    // Start background processing
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(backgroundTask());
    } else {
      // Fallback for testing
      backgroundTask();
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scheduled quant update started',
        jobId: jobId,
        jobName: jobName
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error starting scheduled quant update:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function processMarket(
  marketId: string,
  jobName: string,
  supabaseClient: any,
  stats: JobStats
): Promise<{ market: string; stocks: number; fullAnalysis: number; priceUpdate: number; skipped: number; failed: number }> {
  const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
  if (!FMP_API_KEY) {
    throw new Error('FMP_API_KEY not configured');
  }

  const marketStats = {
    market: marketId,
    stocks: 0,
    fullAnalysis: 0,
    priceUpdate: 0,
    skipped: 0,
    failed: 0
  };

  try {
    // Get all stocks for the market
    console.log(`[${jobName}] Fetching stock list for ${marketId}...`);
    const stocksResponse = await fetch(
      `https://financialmodelingprep.com/api/v3/stock/list?apikey=${FMP_API_KEY}`
    );
    stats.totalApiCalls++;
    
    const allStocks = await stocksResponse.json();
    
    // Filter for the specific market
    const marketStocks = allStocks.filter((s: any) => 
      s.exchangeShortName === marketId && s.type === 'stock' && !s.isEtf
    );

    marketStats.stocks = marketStocks.length;
    console.log(`[${jobName}] Found ${marketStocks.length} stocks in ${marketId}`);

    // Get existing cache data to determine update strategy
    const { data: existingCache } = await supabaseClient
      .from('stock_analysis_cache')
      .select('symbol, last_updated')
      .eq('market_id', marketId);

    const cacheMap = new Map<string, Date>();
    if (existingCache) {
      for (const item of existingCache) {
        cacheMap.set(item.symbol, new Date(item.last_updated));
      }
    }

    const now = Date.now();
    const skipThreshold = now - (SKIP_IF_NEWER_THAN_HOURS * 60 * 60 * 1000);
    const priceOnlyThreshold = now - (PRICE_ONLY_IF_NEWER_THAN_DAYS * 24 * 60 * 60 * 1000);

    // Categorize stocks
    const stocksNeedingFullAnalysis: any[] = [];
    const stocksNeedingPriceUpdate: any[] = [];
    const stocksToSkip: any[] = [];

    for (const stock of marketStocks) {
      const lastUpdate = cacheMap.get(stock.symbol);
      
      if (lastUpdate) {
        const lastUpdateTime = lastUpdate.getTime();
        if (lastUpdateTime > skipThreshold) {
          stocksToSkip.push(stock);
        } else if (lastUpdateTime > priceOnlyThreshold) {
          stocksNeedingPriceUpdate.push(stock);
        } else {
          stocksNeedingFullAnalysis.push(stock);
        }
      } else {
        stocksNeedingFullAnalysis.push(stock);
      }
    }

    console.log(`[${jobName}] ${marketId} categorization:`);
    console.log(`  - Full analysis needed: ${stocksNeedingFullAnalysis.length}`);
    console.log(`  - Price update needed: ${stocksNeedingPriceUpdate.length}`);
    console.log(`  - Skip (fresh): ${stocksToSkip.length}`);

    marketStats.skipped = stocksToSkip.length;
    stats.stocksSkipped += stocksToSkip.length;

    // Process full analysis stocks in batches
    if (stocksNeedingFullAnalysis.length > 0) {
      console.log(`[${jobName}] Starting full analysis for ${stocksNeedingFullAnalysis.length} stocks...`);
      await processFullAnalysisBatches(
        stocksNeedingFullAnalysis,
        marketId,
        jobName,
        supabaseClient,
        FMP_API_KEY,
        stats,
        marketStats
      );
    }

    // Process price-only updates in batches
    if (stocksNeedingPriceUpdate.length > 0) {
      console.log(`[${jobName}] Starting price updates for ${stocksNeedingPriceUpdate.length} stocks...`);
      await processPriceUpdateBatches(
        stocksNeedingPriceUpdate,
        marketId,
        jobName,
        supabaseClient,
        FMP_API_KEY,
        stats,
        marketStats
      );
    }

    console.log(`[${jobName}] Completed processing ${marketId}:`, marketStats);
    return marketStats;
  } catch (error) {
    console.error(`[${jobName}] Error processing ${marketId}:`, error);
    throw error;
  }
}

async function processFullAnalysisBatches(
  stocks: any[],
  marketId: string,
  jobName: string,
  supabaseClient: any,
  FMP_API_KEY: string,
  stats: JobStats,
  marketStats: { fullAnalysis: number; failed: number }
) {
  for (let i = 0; i < stocks.length; i += FULL_ANALYSIS_BATCH_SIZE) {
    const batch = stocks.slice(i, i + FULL_ANALYSIS_BATCH_SIZE);
    const batchNum = Math.floor(i / FULL_ANALYSIS_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(stocks.length / FULL_ANALYSIS_BATCH_SIZE);
    
    console.log(`[${jobName}] Full analysis batch ${batchNum}/${totalBatches} (${batch.length} stocks)`);

    for (const stock of batch) {
      try {
        await performFullAnalysis(stock, marketId, supabaseClient, FMP_API_KEY, stats);
        stats.stocksFullAnalyzed++;
        marketStats.fullAnalysis++;
      } catch (error) {
        console.error(`[${jobName}] Failed full analysis for ${stock.symbol}:`, error);
        stats.stocksFailed++;
        marketStats.failed++;
      }
    }

    // Wait between batches to respect rate limits
    if (i + FULL_ANALYSIS_BATCH_SIZE < stocks.length) {
      console.log(`[${jobName}] Waiting ${FULL_ANALYSIS_DELAY_MS / 1000}s before next batch...`);
      await new Promise(resolve => setTimeout(resolve, FULL_ANALYSIS_DELAY_MS));
    }
  }
}

async function processPriceUpdateBatches(
  stocks: any[],
  marketId: string,
  jobName: string,
  supabaseClient: any,
  FMP_API_KEY: string,
  stats: JobStats,
  marketStats: { priceUpdate: number; failed: number }
) {
  for (let i = 0; i < stocks.length; i += PRICE_UPDATE_BATCH_SIZE) {
    const batch = stocks.slice(i, i + PRICE_UPDATE_BATCH_SIZE);
    const batchNum = Math.floor(i / PRICE_UPDATE_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(stocks.length / PRICE_UPDATE_BATCH_SIZE);
    
    console.log(`[${jobName}] Price update batch ${batchNum}/${totalBatches} (${batch.length} stocks)`);

    // For price updates, we can batch the API call
    const symbols = batch.map((s: any) => s.symbol).join(',');
    
    try {
      const quoteResponse = await fetch(
        `https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${FMP_API_KEY}`
      );
      stats.totalApiCalls++;
      
      const quotes = await quoteResponse.json();
      
      if (Array.isArray(quotes)) {
        for (const quote of quotes) {
          try {
            // Update only price-related fields in the cache
            const { data: existing } = await supabaseClient
              .from('stock_analysis_cache')
              .select('analysis_result')
              .eq('symbol', quote.symbol)
              .eq('market_id', marketId)
              .single();

            if (existing?.analysis_result) {
              const updatedResult = {
                ...existing.analysis_result,
                price: quote.price,
                change: quote.change,
                changesPercentage: quote.changesPercentage,
                dayLow: quote.dayLow,
                dayHigh: quote.dayHigh,
                volume: quote.volume,
                marketCap: quote.marketCap
              };

              await supabaseClient
                .from('stock_analysis_cache')
                .update({
                  analysis_result: updatedResult,
                  last_updated: new Date().toISOString()
                })
                .eq('symbol', quote.symbol)
                .eq('market_id', marketId);

              stats.stocksPriceUpdated++;
              marketStats.priceUpdate++;
            }
          } catch (error) {
            console.error(`Price update failed for ${quote.symbol}:`, error);
            stats.stocksFailed++;
            marketStats.failed++;
          }
        }
      }
    } catch (error) {
      console.error(`[${jobName}] Batch quote fetch failed:`, error);
      stats.stocksFailed += batch.length;
      marketStats.failed += batch.length;
    }

    // Wait between batches
    if (i + PRICE_UPDATE_BATCH_SIZE < stocks.length) {
      console.log(`[${jobName}] Waiting ${PRICE_UPDATE_DELAY_MS / 1000}s before next batch...`);
      await new Promise(resolve => setTimeout(resolve, PRICE_UPDATE_DELAY_MS));
    }
  }
}

async function performFullAnalysis(
  stock: any,
  marketId: string,
  supabaseClient: any,
  FMP_API_KEY: string,
  stats: JobStats
) {
  // Fetch all data in parallel (9 API calls)
  const [ratiosTTM, profile, incomeStatements, balanceSheets, keyMetrics, cashFlow, quote, growthMetrics, enterpriseValues] = 
    await Promise.all([
      fetch(`https://financialmodelingprep.com/api/v3/ratios-ttm/${stock.symbol}?apikey=${FMP_API_KEY}`).then(r => r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/profile/${stock.symbol}?apikey=${FMP_API_KEY}`).then(r => r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/income-statement/${stock.symbol}?limit=10&apikey=${FMP_API_KEY}`).then(r => r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${stock.symbol}?limit=5&apikey=${FMP_API_KEY}`).then(r => r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/key-metrics-ttm/${stock.symbol}?apikey=${FMP_API_KEY}`).then(r => r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${stock.symbol}?limit=5&apikey=${FMP_API_KEY}`).then(r => r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/quote/${stock.symbol}?apikey=${FMP_API_KEY}`).then(r => r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/financial-growth/${stock.symbol}?limit=5&apikey=${FMP_API_KEY}`).then(r => r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/enterprise-values/${stock.symbol}?limit=1&apikey=${FMP_API_KEY}`).then(r => r.json())
    ]);

  stats.totalApiCalls += 9;

  // Basic validation
  if (!ratiosTTM || ratiosTTM.length === 0 || !profile || profile.length === 0) {
    throw new Error(`Insufficient data for ${stock.symbol}`);
  }

  const profileData = profile[0];
  const quoteData = quote[0] || {};
  const ratiosData = ratiosTTM[0] || {};
  const keyMetricsData = keyMetrics[0] || {};
  const latestIncome = incomeStatements[0] || {};
  const latestBalance = balanceSheets[0] || {};
  const latestCashFlow = cashFlow[0] || {};
  const growthData = growthMetrics[0] || {};
  const evData = enterpriseValues[0] || {};

  // Calculate Buffett Score components
  const buffettScore = calculateBuffettScore({
    ratios: ratiosData,
    keyMetrics: keyMetricsData,
    income: latestIncome,
    balance: latestBalance,
    cashFlow: latestCashFlow,
    growth: growthData,
    profile: profileData
  });

  // Store raw data in stock_data_cache
  await supabaseClient
    .from('stock_data_cache')
    .upsert({
      symbol: stock.symbol,
      company_name: profileData?.companyName,
      exchange: stock.exchangeShortName,
      sector: profileData?.sector,
      currency: profileData?.currency || 'USD',
      raw_data: {
        ratiosTTM,
        profile,
        incomeStatements,
        balanceSheets,
        keyMetrics,
        cashFlow,
        quote,
        growthMetrics,
        enterpriseValues
      },
      last_updated: new Date().toISOString()
    });

  // Store analysis result
  await supabaseClient
    .from('stock_analysis_cache')
    .upsert({
      symbol: stock.symbol,
      market_id: marketId,
      buffett_score: buffettScore.total,
      analysis_result: {
        symbol: stock.symbol,
        name: profileData?.companyName,
        sector: profileData?.sector,
        industry: profileData?.industry,
        exchange: stock.exchangeShortName,
        price: quoteData?.price || 0,
        currency: profileData?.currency || 'USD',
        marketCap: quoteData?.marketCap || profileData?.mktCap,
        buffettScore: buffettScore.total,
        buffettScoreDetails: buffettScore.details,
        // Valuation metrics
        peRatio: ratiosData?.peRatioTTM,
        pbRatio: ratiosData?.priceToBookRatioTTM,
        pfcfRatio: ratiosData?.priceToFreeCashFlowsRatioTTM,
        evToEbitda: keyMetricsData?.enterpriseValueOverEBITDATTM,
        // Profitability
        roe: ratiosData?.returnOnEquityTTM,
        roa: ratiosData?.returnOnAssetsTTM,
        roic: ratiosData?.roicTTM || keyMetricsData?.roicTTM,
        grossMargin: ratiosData?.grossProfitMarginTTM,
        netMargin: ratiosData?.netProfitMarginTTM,
        operatingMargin: ratiosData?.operatingProfitMarginTTM,
        // Financial strength
        currentRatio: ratiosData?.currentRatioTTM,
        debtToEquity: ratiosData?.debtEquityRatioTTM,
        interestCoverage: ratiosData?.interestCoverageTTM,
        // Growth
        revenueGrowth: growthData?.revenueGrowth,
        epsGrowth: growthData?.epsgrowth,
        // Dividends
        dividendYield: ratiosData?.dividendYieldTTM || keyMetricsData?.dividendYieldTTM,
        payoutRatio: ratiosData?.payoutRatioTTM,
        // Other
        beta: profileData?.beta,
        description: profileData?.description,
        change: quoteData?.change,
        changesPercentage: quoteData?.changesPercentage
      },
      last_updated: new Date().toISOString()
    });
}

function calculateBuffettScore(data: {
  ratios: any;
  keyMetrics: any;
  income: any;
  balance: any;
  cashFlow: any;
  growth: any;
  profile: any;
}): { total: number; details: any } {
  const { ratios, keyMetrics, income, balance, cashFlow, growth, profile } = data;
  
  let totalScore = 0;
  const maxScore = 100;
  const details: any = {};

  // 1. ROE > 15% (10 points)
  const roe = ratios?.returnOnEquityTTM || 0;
  if (roe >= 0.20) {
    totalScore += 10;
    details.roe = { score: 10, value: roe, status: 'excellent' };
  } else if (roe >= 0.15) {
    totalScore += 7;
    details.roe = { score: 7, value: roe, status: 'good' };
  } else if (roe >= 0.10) {
    totalScore += 4;
    details.roe = { score: 4, value: roe, status: 'fair' };
  } else {
    details.roe = { score: 0, value: roe, status: 'poor' };
  }

  // 2. ROIC > 10% (10 points)
  const roic = ratios?.roicTTM || keyMetrics?.roicTTM || 0;
  if (roic >= 0.15) {
    totalScore += 10;
    details.roic = { score: 10, value: roic, status: 'excellent' };
  } else if (roic >= 0.10) {
    totalScore += 7;
    details.roic = { score: 7, value: roic, status: 'good' };
  } else if (roic >= 0.07) {
    totalScore += 4;
    details.roic = { score: 4, value: roic, status: 'fair' };
  } else {
    details.roic = { score: 0, value: roic, status: 'poor' };
  }

  // 3. Debt to Equity < 0.5 (10 points)
  const debtToEquity = ratios?.debtEquityRatioTTM || 0;
  if (debtToEquity < 0.3) {
    totalScore += 10;
    details.debtToEquity = { score: 10, value: debtToEquity, status: 'excellent' };
  } else if (debtToEquity < 0.5) {
    totalScore += 7;
    details.debtToEquity = { score: 7, value: debtToEquity, status: 'good' };
  } else if (debtToEquity < 1) {
    totalScore += 4;
    details.debtToEquity = { score: 4, value: debtToEquity, status: 'fair' };
  } else {
    details.debtToEquity = { score: 0, value: debtToEquity, status: 'poor' };
  }

  // 4. Current Ratio > 1.5 (10 points)
  const currentRatio = ratios?.currentRatioTTM || 0;
  if (currentRatio >= 2) {
    totalScore += 10;
    details.currentRatio = { score: 10, value: currentRatio, status: 'excellent' };
  } else if (currentRatio >= 1.5) {
    totalScore += 7;
    details.currentRatio = { score: 7, value: currentRatio, status: 'good' };
  } else if (currentRatio >= 1) {
    totalScore += 4;
    details.currentRatio = { score: 4, value: currentRatio, status: 'fair' };
  } else {
    details.currentRatio = { score: 0, value: currentRatio, status: 'poor' };
  }

  // 5. Gross Margin > 40% (10 points)
  const grossMargin = ratios?.grossProfitMarginTTM || 0;
  if (grossMargin >= 0.50) {
    totalScore += 10;
    details.grossMargin = { score: 10, value: grossMargin, status: 'excellent' };
  } else if (grossMargin >= 0.40) {
    totalScore += 7;
    details.grossMargin = { score: 7, value: grossMargin, status: 'good' };
  } else if (grossMargin >= 0.30) {
    totalScore += 4;
    details.grossMargin = { score: 4, value: grossMargin, status: 'fair' };
  } else {
    details.grossMargin = { score: 0, value: grossMargin, status: 'poor' };
  }

  // 6. Net Margin > 10% (10 points)
  const netMargin = ratios?.netProfitMarginTTM || 0;
  if (netMargin >= 0.15) {
    totalScore += 10;
    details.netMargin = { score: 10, value: netMargin, status: 'excellent' };
  } else if (netMargin >= 0.10) {
    totalScore += 7;
    details.netMargin = { score: 7, value: netMargin, status: 'good' };
  } else if (netMargin >= 0.05) {
    totalScore += 4;
    details.netMargin = { score: 4, value: netMargin, status: 'fair' };
  } else {
    details.netMargin = { score: 0, value: netMargin, status: 'poor' };
  }

  // 7. P/E Ratio (valuation) - lower is better (10 points)
  const pe = ratios?.peRatioTTM || 0;
  if (pe > 0 && pe < 15) {
    totalScore += 10;
    details.peRatio = { score: 10, value: pe, status: 'excellent' };
  } else if (pe > 0 && pe < 20) {
    totalScore += 7;
    details.peRatio = { score: 7, value: pe, status: 'good' };
  } else if (pe > 0 && pe < 30) {
    totalScore += 4;
    details.peRatio = { score: 4, value: pe, status: 'fair' };
  } else {
    details.peRatio = { score: 0, value: pe, status: 'poor' };
  }

  // 8. Free Cash Flow positive (10 points)
  const fcf = cashFlow?.freeCashFlow || 0;
  if (fcf > 0) {
    totalScore += 10;
    details.freeCashFlow = { score: 10, value: fcf, status: 'excellent' };
  } else {
    details.freeCashFlow = { score: 0, value: fcf, status: 'poor' };
  }

  // 9. Revenue Growth (10 points)
  const revenueGrowth = growth?.revenueGrowth || 0;
  if (revenueGrowth >= 0.10) {
    totalScore += 10;
    details.revenueGrowth = { score: 10, value: revenueGrowth, status: 'excellent' };
  } else if (revenueGrowth >= 0.05) {
    totalScore += 7;
    details.revenueGrowth = { score: 7, value: revenueGrowth, status: 'good' };
  } else if (revenueGrowth >= 0) {
    totalScore += 4;
    details.revenueGrowth = { score: 4, value: revenueGrowth, status: 'fair' };
  } else {
    details.revenueGrowth = { score: 0, value: revenueGrowth, status: 'poor' };
  }

  // 10. Interest Coverage > 5 (10 points)
  const interestCoverage = ratios?.interestCoverageTTM || 0;
  if (interestCoverage >= 10) {
    totalScore += 10;
    details.interestCoverage = { score: 10, value: interestCoverage, status: 'excellent' };
  } else if (interestCoverage >= 5) {
    totalScore += 7;
    details.interestCoverage = { score: 7, value: interestCoverage, status: 'good' };
  } else if (interestCoverage >= 2) {
    totalScore += 4;
    details.interestCoverage = { score: 4, value: interestCoverage, status: 'fair' };
  } else {
    details.interestCoverage = { score: 0, value: interestCoverage, status: 'poor' };
  }

  return {
    total: Math.round((totalScore / maxScore) * 100),
    details
  };
}
