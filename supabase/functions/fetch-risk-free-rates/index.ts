import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapping of country codes to FRED series IDs for 10-year government bonds
const FRED_SERIES_MAP: Record<string, { seriesId: string; countryName: string }> = {
  'DE': { seriesId: 'IRLTLT01DEM156N', countryName: 'Deutschland' },
  'GB': { seriesId: 'IRLTLT01GBM156N', countryName: 'Großbritannien' },
  'FR': { seriesId: 'IRLTLT01FRM156N', countryName: 'Frankreich' },
  'IT': { seriesId: 'IRLTLT01ITM156N', countryName: 'Italien' },
  'ES': { seriesId: 'IRLTLT01ESM156N', countryName: 'Spanien' },
  'NL': { seriesId: 'IRLTLT01NLM156N', countryName: 'Niederlande' },
  'BE': { seriesId: 'IRLTLT01BEM156N', countryName: 'Belgien' },
  'AT': { seriesId: 'IRLTLT01ATM156N', countryName: 'Österreich' },
  'CH': { seriesId: 'IRLTLT01CHM156N', countryName: 'Schweiz' },
  'SE': { seriesId: 'IRLTLT01SEM156N', countryName: 'Schweden' },
  'NO': { seriesId: 'IRLTLT01NOM156N', countryName: 'Norwegen' },
  'DK': { seriesId: 'IRLTLT01DKM156N', countryName: 'Dänemark' },
  'FI': { seriesId: 'IRLTLT01FIM156N', countryName: 'Finnland' },
  'PL': { seriesId: 'IRLTLT01PLM156N', countryName: 'Polen' },
  'CZ': { seriesId: 'IRLTLT01CZM156N', countryName: 'Tschechien' },
  'JP': { seriesId: 'IRLTLT01JPM156N', countryName: 'Japan' },
  'CA': { seriesId: 'IRLTLT01CAM156N', countryName: 'Kanada' },
  'AU': { seriesId: 'IRLTLT01AUM156N', countryName: 'Australien' },
  'NZ': { seriesId: 'IRLTLT01NZM156N', countryName: 'Neuseeland' },
  'KR': { seriesId: 'IRLTLT01KRM156N', countryName: 'Südkorea' },
}

interface TreasuryRate {
  date: string
  month: number
  year: number
  year1?: number
  year2?: number
  year3?: number
  year5?: number
  year7?: number
  year10?: number
  year20?: number
  year30?: number
}

interface FREDObservation {
  realtime_start: string
  realtime_end: string
  date: string
  value: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const fmpApiKey = Deno.env.get('FMP_API_KEY')
    const fredApiKey = Deno.env.get('FRED_API_KEY')
    
    if (!fmpApiKey) {
      throw new Error('FMP_API_KEY not configured')
    }
    
    if (!fredApiKey) {
      throw new Error('FRED_API_KEY not configured')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let insertedCount = 0
    let updatedCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Fetch US treasury rates from FMP
    console.log('Fetching US treasury rates from FMP...')
    try {
      const fmpUrl = `https://financialmodelingprep.com/api/v4/treasury?apikey=${fmpApiKey}`
      const fmpResponse = await fetch(fmpUrl)
      
      if (!fmpResponse.ok) {
        throw new Error(`FMP API error: ${fmpResponse.status} ${fmpResponse.statusText}`)
      }

      const fmpData: TreasuryRate[] = await fmpResponse.json()
      
      if (Array.isArray(fmpData) && fmpData.length > 0) {
        // Get the latest entry
        const latest = fmpData[0]
        
        if (latest.year10 !== undefined && latest.year10 !== null) {
          const { error } = await supabase
            .from('risk_free_rates')
            .upsert(
              {
                country_code: 'US',
                country_name: 'Vereinigte Staaten',
                rate: latest.year10,
                valid_date: latest.date,
                data_source: 'FMP',
                updated_at: new Date().toISOString()
              },
              {
                onConflict: 'country_code,valid_date',
                ignoreDuplicates: false
              }
            )

          if (error) {
            console.error('Error upserting US rate:', error)
            errors.push(`US: ${error.message}`)
            errorCount++
          } else {
            insertedCount++
            console.log(`US rate saved: ${latest.year10}% on ${latest.date}`)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching US rates:', error)
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`US: ${errorMessage}`)
      errorCount++
    }

    // Fetch rates for other countries from FRED
    console.log('Fetching rates from FRED for other countries...')
    
    for (const [countryCode, config] of Object.entries(FRED_SERIES_MAP)) {
      try {
        const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${config.seriesId}&sort_order=desc&api_key=${fredApiKey}&file_type=json&limit=1`
        const fredResponse = await fetch(fredUrl)
        
        if (!fredResponse.ok) {
          throw new Error(`FRED API error: ${fredResponse.status} ${fredResponse.statusText}`)
        }

        const fredData = await fredResponse.json()
        
        if (fredData.observations && Array.isArray(fredData.observations) && fredData.observations.length > 0) {
          const observation: FREDObservation = fredData.observations[0]
          
          // Skip if value is "." (missing data in FRED)
          if (observation.value === '.') {
            console.log(`${countryCode}: No data available (value is ".")`)
            continue
          }
          
          const rate = parseFloat(observation.value)
          
          if (!isNaN(rate)) {
            const { error } = await supabase
              .from('risk_free_rates')
              .upsert(
                {
                  country_code: countryCode,
                  country_name: config.countryName,
                  rate: rate,
                  valid_date: observation.date,
                  data_source: 'FRED',
                  updated_at: new Date().toISOString()
                },
                {
                  onConflict: 'country_code,valid_date',
                  ignoreDuplicates: false
                }
              )

            if (error) {
              console.error(`Error upserting ${countryCode} rate:`, error)
              errors.push(`${countryCode}: ${error.message}`)
              errorCount++
            } else {
              insertedCount++
              console.log(`${countryCode} rate saved: ${rate}% on ${observation.date}`)
            }
          } else {
            console.warn(`${countryCode}: Invalid rate value: ${observation.value}`)
          }
        }
      } catch (error) {
        console.error(`Error fetching ${countryCode} rates:`, error)
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${countryCode}: ${errorMessage}`)
        errorCount++
      }
    }

    const summary = {
      success: true,
      total_countries: 1 + Object.keys(FRED_SERIES_MAP).length,
      inserted: insertedCount,
      updated: updatedCount,
      errors: errorCount,
      error_details: errors.length > 0 ? errors : undefined,
      message: `Risk-free rates updated successfully`
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
    console.error('Error in fetch-risk-free-rates:', error)
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
