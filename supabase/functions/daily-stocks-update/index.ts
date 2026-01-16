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

    console.log('Starting daily stocks update...');

    // Get all stocks
    const { data: stocks, error: fetchError } = await supabaseClient
      .from('stocks')
      .select('id, symbol, exchange');

    if (fetchError) {
      throw new Error(`Error fetching stocks: ${fetchError.message}`);
    }

    console.log(`Found ${stocks?.length || 0} stocks to update`);

    const batchSize = 50;
    let updatedCount = 0;
    let errorCount = 0;

    // Process in batches
    for (let i = 0; i < (stocks?.length || 0); i += batchSize) {
      const batch = stocks!.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}, stocks ${i + 1}-${Math.min(i + batchSize, stocks!.length)}`);

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

            // Fetch dividend data
            let lastDividend = null;
            try {
              const dividendResponse = await fetch(
                `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${stock.symbol}?apikey=${FMP_API_KEY}`
              );
              const dividendData = await dividendResponse.json();
              
              if (dividendData?.historical && dividendData.historical.length > 0) {
                // Get the most recent dividend
                lastDividend = dividendData.historical[0].dividend;
              }
            } catch (dividendError) {
              console.warn(`Could not fetch dividend for ${stock.symbol}:`, dividendError);
            }

            // Update in database
            const { error: updateError } = await supabaseClient
              .from('stocks')
              .update({
                price: quote.price,
                market_cap: quote.marketCap,
                last_dividend: lastDividend
              })
              .eq('id', stock.id);

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
      if (i + batchSize < (stocks?.length || 0)) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log(`Daily stocks update completed. Updated: ${updatedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Daily stocks update completed`,
        updated: updatedCount,
        errors: errorCount,
        total: stocks?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in daily-stocks-update:', error);
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
