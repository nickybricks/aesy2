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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
    if (!FMP_API_KEY) {
      throw new Error('FMP_API_KEY not configured');
    }

    console.log('Starting daily price update...');

    // Get all cached stocks
    const { data: cachedStocks, error: fetchError } = await supabaseClient
      .from('stock_analysis_cache')
      .select('symbol, market_id, analysis_result');

    if (fetchError) {
      throw new Error(`Error fetching cached stocks: ${fetchError.message}`);
    }

    console.log(`Found ${cachedStocks?.length || 0} cached stocks to update`);

    const batchSize = 50;
    let updatedCount = 0;
    let errorCount = 0;

    // Process in batches
    for (let i = 0; i < (cachedStocks?.length || 0); i += batchSize) {
      const batch = cachedStocks!.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}, stocks ${i + 1}-${Math.min(i + batchSize, cachedStocks!.length)}`);

      await Promise.all(
        batch.map(async (stock) => {
          try {
            // Fetch fresh quote
            const quoteResponse = await fetch(
              `https://financialmodelingprep.com/api/v3/quote/${stock.symbol}?apikey=${FMP_API_KEY}`
            );
            const quoteData = await quoteResponse.json();
            
            if (!quoteData || quoteData.length === 0) {
              console.warn(`No quote data for ${stock.symbol}`);
              errorCount++;
              return;
            }

            const quote = quoteData[0];
            const analysisResult = stock.analysis_result as any;

            // Update price and related fields
            const updatedAnalysis = {
              ...analysisResult,
              price: quote.price,
              change: quote.change,
              changesPercentage: quote.changesPercentage
            };

            // Recalculate margin of safety if intrinsic value exists
            if (analysisResult.intrinsicValue && quote.price > 0) {
              updatedAnalysis.marginOfSafety = 
                ((analysisResult.intrinsicValue - quote.price) / quote.price) * 100;
            }

            // Update in database
            const { error: updateError } = await supabaseClient
              .from('stock_analysis_cache')
              .update({
                analysis_result: updatedAnalysis,
                last_updated: new Date().toISOString()
              })
              .eq('symbol', stock.symbol)
              .eq('market_id', stock.market_id);

            if (updateError) {
              console.error(`Error updating ${stock.symbol}:`, updateError);
              errorCount++;
            } else {
              updatedCount++;
            }
          } catch (error) {
            console.error(`Error processing ${stock.symbol}:`, error);
            errorCount++;
          }
        })
      );

      // Wait 5 seconds between batches to respect rate limits
      if (i + batchSize < (cachedStocks?.length || 0)) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log(`Daily price update completed. Updated: ${updatedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Daily price update completed`,
        updated: updatedCount,
        errors: errorCount,
        total: cachedStocks?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in daily-price-update:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
