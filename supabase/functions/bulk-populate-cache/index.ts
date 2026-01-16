import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { marketId, limit = 10000 } = await req.json();

    if (!marketId) {
      return new Response(
        JSON.stringify({ error: 'marketId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
    if (!FMP_API_KEY) {
      throw new Error('FMP_API_KEY not configured');
    }

    console.log(`Starting bulk population for market: ${marketId}, limit: ${limit}`);

    // Get all stocks for the market
    const stocksResponse = await fetch(
      `https://financialmodelingprep.com/api/v3/stock/list?apikey=${FMP_API_KEY}`
    );
    const allStocks = await stocksResponse.json();

    // Filter based on market type (simplified)
    let marketStocks = allStocks.filter((s: any) => 
      s.exchangeShortName === marketId && s.type === 'stock' && !s.isEtf
    ).slice(0, limit);

    console.log(`Found ${marketStocks.length} stocks to analyze`);

    // This is a long-running operation - in production, you'd want to:
    // 1. Use a queue system
    // 2. Implement resume capability
    // 3. Send progress updates via webhooks or Supabase Realtime

    const batchSize = 100;
    let processedCount = 0;
    let successCount = 0;

    for (let i = 0; i < marketStocks.length; i += batchSize) {
      const batch = marketStocks.slice(i, i + batchSize);
      console.log(`Processing batch starting at ${i}, size: ${batch.length}`);

      for (const stock of batch) {
        try {
          // Check if already cached and fresh (< 7 days old)
          const { data: existing } = await supabaseClient
            .from('stock_analysis_cache')
            .select('last_updated')
            .eq('symbol', stock.symbol)
            .eq('market_id', marketId)
            .single();

          if (existing) {
            const lastUpdate = new Date(existing.last_updated).getTime();
            const now = Date.now();
            const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
            
            if (daysSinceUpdate < 7) {
              console.log(`Skipping ${stock.symbol} - cached and fresh`);
              processedCount++;
              continue;
            }
          }

          // Fetch all data in parallel (7 API calls)
          const [ratiosTTM, profile, incomeStatements, balanceSheets, keyMetrics, cashFlow, quote] = 
            await Promise.all([
              fetch(`https://financialmodelingprep.com/api/v3/ratios-ttm/${stock.symbol}?apikey=${FMP_API_KEY}`).then(r => r.json()),
              fetch(`https://financialmodelingprep.com/api/v3/profile/${stock.symbol}?apikey=${FMP_API_KEY}`).then(r => r.json()),
              fetch(`https://financialmodelingprep.com/api/v3/income-statement/${stock.symbol}?limit=10&apikey=${FMP_API_KEY}`).then(r => r.json()),
              fetch(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${stock.symbol}?limit=5&apikey=${FMP_API_KEY}`).then(r => r.json()),
              fetch(`https://financialmodelingprep.com/api/v3/key-metrics-ttm/${stock.symbol}?apikey=${FMP_API_KEY}`).then(r => r.json()),
              fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${stock.symbol}?limit=5&apikey=${FMP_API_KEY}`).then(r => r.json()),
              fetch(`https://financialmodelingprep.com/api/v3/quote/${stock.symbol}?apikey=${FMP_API_KEY}`).then(r => r.json())
            ]);

          // Basic validation
          if (!ratiosTTM || ratiosTTM.length === 0 || !profile || profile.length === 0) {
            console.warn(`Insufficient data for ${stock.symbol}`);
            processedCount++;
            continue;
          }

          // Store raw data in stock_data_cache
          await supabaseClient
            .from('stock_data_cache')
            .upsert({
              symbol: stock.symbol,
              company_name: profile[0]?.companyName,
              exchange: stock.exchangeShortName,
              sector: profile[0]?.sector,
              currency: profile[0]?.currency || 'USD',
              raw_data: {
                ratiosTTM,
                profile,
                incomeStatements,
                balanceSheets,
                keyMetrics,
                cashFlow,
                quote
              },
              last_updated: new Date().toISOString()
            });

          // Calculate Buffett Score (simplified - you'd implement full logic here)
          const buffettScore = 0; // Placeholder - implement full calculation

          // Store analysis result
          await supabaseClient
            .from('stock_analysis_cache')
            .upsert({
              symbol: stock.symbol,
              market_id: marketId,
              buffett_score: buffettScore,
              analysis_result: {
                symbol: stock.symbol,
                name: profile[0]?.companyName,
                sector: profile[0]?.sector,
                exchange: stock.exchangeShortName,
                price: quote[0]?.price || 0,
                currency: profile[0]?.currency || 'USD',
                buffettScore,
                // ... full analysis would be here
              },
              last_updated: new Date().toISOString()
            });

          successCount++;
          processedCount++;
        } catch (error) {
          console.error(`Error processing ${stock.symbol}:`, error);
          processedCount++;
        }
      }

      // Wait 60 seconds between batches
      if (i + batchSize < marketStocks.length) {
        console.log('Waiting 60 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Bulk population completed',
        processed: processedCount,
        successful: successCount,
        total: marketStocks.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in bulk-populate-cache:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
