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

    console.log('Starting live price update...');

    // Get all stocks from precomputed_metrics
    const { data: stocks, error: fetchError } = await supabaseClient
      .from('precomputed_metrics')
      .select('stock_id, symbol, currency');

    if (fetchError) {
      throw new Error(`Error fetching stocks: ${fetchError.message}`);
    }

    if (!stocks || stocks.length === 0) {
      console.log('No stocks found in precomputed_metrics');
      return new Response(
        JSON.stringify({ success: true, message: 'No stocks to update', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${stocks.length} stocks to update prices`);

    // FMP Quote API allows up to 100 symbols per request
    const BATCH_SIZE = 100;
    let updatedCount = 0;
    let errorCount = 0;

    // Get latest EUR/USD exchange rate for currency conversion
    const { data: exchangeRate } = await supabaseClient
      .from('exchange_rates')
      .select('rate')
      .eq('base_currency', 'USD')
      .eq('target_currency', 'EUR')
      .order('valid_date', { ascending: false })
      .limit(1)
      .single();

    const usdToEurRate = exchangeRate?.rate || 0.92; // Fallback rate

    // Process in batches
    for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
      const batch = stocks.slice(i, i + BATCH_SIZE);
      const symbols = batch.map(s => s.symbol).join(',');

      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}, stocks ${i + 1}-${Math.min(i + BATCH_SIZE, stocks.length)}`);

      try {
        // Fetch quotes from FMP
        const quoteResponse = await fetch(
          `https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${FMP_API_KEY}`
        );

        if (!quoteResponse.ok) {
          console.error(`FMP API error: ${quoteResponse.status}`);
          errorCount += batch.length;
          continue;
        }

        const quotes = await quoteResponse.json();

        if (!Array.isArray(quotes) || quotes.length === 0) {
          console.warn(`No quotes returned for batch`);
          errorCount += batch.length;
          continue;
        }

        // Create a map for quick lookup
        const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

        // Prepare updates
        const updates = batch.map(stock => {
          const quote = quoteMap.get(stock.symbol);
          
          if (!quote || !quote.price || quote.price <= 0) {
            console.warn(`Invalid quote for ${stock.symbol}`);
            errorCount++;
            return null;
          }

          const currentPriceUsd = quote.price;
          const currentPriceEur = currentPriceUsd * usdToEurRate;

          return {
            stock_id: stock.stock_id,
            current_price_usd: currentPriceUsd,
            current_price_eur: currentPriceEur,
            price_updated_at: new Date().toISOString()
          };
        }).filter(u => u !== null);

        // Batch upsert
        if (updates.length > 0) {
          const { error: upsertError } = await supabaseClient
            .from('precomputed_metrics')
            .upsert(updates, {
              onConflict: 'stock_id',
              ignoreDuplicates: false
            });

          if (upsertError) {
            console.error(`Error upserting prices:`, upsertError);
            errorCount += updates.length;
          } else {
            updatedCount += updates.length;
            console.log(`Successfully updated ${updates.length} prices`);
          }
        }

      } catch (error) {
        console.error(`Error processing batch:`, error);
        errorCount += batch.length;
      }

      // Rate limiting: wait 200ms between batches (FMP allows 300 calls/minute)
      if (i + BATCH_SIZE < stocks.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`Price update completed. Updated: ${updatedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Price update completed',
        updated: updatedCount,
        errors: errorCount,
        total: stocks.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in update-prices:', error);
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
