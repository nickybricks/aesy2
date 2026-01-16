import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MarketRiskPremiumData {
  country: string
  continent: string
  totalEquityRiskPremium: number
  countryRiskPremium: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const fmpApiKey = Deno.env.get('FMP_API_KEY')
    if (!fmpApiKey) {
      throw new Error('FMP_API_KEY not configured')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Fetching market risk premiums from FMP API...')
    
    // Fetch data from FMP API
    const fmpUrl = `https://financialmodelingprep.com/api/v4/market_risk_premium?apikey=${fmpApiKey}`
    const response = await fetch(fmpUrl)
    
    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status} ${response.statusText}`)
    }

    const data: MarketRiskPremiumData[] = await response.json()
    console.log(`Fetched ${data.length} market risk premiums`)

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No data received from FMP API')
    }

    const today = new Date().toISOString().split('T')[0]
    let insertedCount = 0
    let updatedCount = 0
    let errorCount = 0

    // Process each country's data
    for (const item of data) {
      try {
        const { country, totalEquityRiskPremium } = item

        if (!country || totalEquityRiskPremium === undefined) {
          console.warn(`Skipping invalid entry:`, item)
          errorCount++
          continue
        }

        // Try to upsert (insert or update if exists)
        const { error } = await supabase
          .from('market_risk_premiums')
          .upsert(
            {
              country,
              total_equity_risk_premium: totalEquityRiskPremium,
              valid_date: today,
              updated_at: new Date().toISOString()
            },
            {
              onConflict: 'country,valid_date',
              ignoreDuplicates: false
            }
          )

        if (error) {
          console.error(`Error upserting data for ${country}:`, error)
          errorCount++
        } else {
          // Check if it was an insert or update by querying
          const { data: existing } = await supabase
            .from('market_risk_premiums')
            .select('created_at')
            .eq('country', country)
            .eq('valid_date', today)
            .single()

          if (existing && existing.created_at === today) {
            insertedCount++
          } else {
            updatedCount++
          }
        }
      } catch (itemError) {
        console.error(`Error processing item:`, itemError)
        errorCount++
      }
    }

    const summary = {
      success: true,
      date: today,
      total_fetched: data.length,
      inserted: insertedCount,
      updated: updatedCount,
      errors: errorCount,
      message: `Market risk premiums updated successfully`
    }

    console.log('Summary:', summary)

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in fetch-market-risk-premium:', error)
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
