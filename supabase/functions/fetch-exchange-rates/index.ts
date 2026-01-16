import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Fetching latest exchange rates from fxratesapi.com (USD & EUR bases)...')

    const nowIso = new Date().toISOString()
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // Extended target currencies including USD and EUR for cross-rates
    const allCurrencies = [
      'JPY', 'GBP', 'CHF', 'CAD', 'AUD', 'CNY', 'KRW', 'SEK', 'NOK', 'NZD',
      'INR', 'BRL', 'ZAR', 'MXN', 'SGD', 'HKD', 'TRY', 'ILS', 'DKK', 'PLN',
      'USD', 'EUR'
    ]

    // Fetch USD and EUR base in parallel
    const [usdResp, eurResp] = await Promise.all([
      fetch('https://api.fxratesapi.com/latest?base=USD'),
      fetch('https://api.fxratesapi.com/latest?base=EUR')
    ])

    let usdData: any | null = null
    let eurData: any | null = null

    if (usdResp.ok) {
      usdData = await usdResp.json()
      if (!usdData || !usdData.rates || typeof usdData.rates !== 'object') {
        console.warn('Invalid USD-base API response; ignoring USD block')
        usdData = null
      }
    } else {
      console.warn(`fxratesapi USD-base returned ${usdResp.status}`)
    }

    if (eurResp.ok) {
      eurData = await eurResp.json()
      if (!eurData || !eurData.rates || typeof eurData.rates !== 'object') {
        console.warn('Invalid EUR-base API response; ignoring EUR block')
        eurData = null
      }
    } else {
      console.warn(`fxratesapi EUR-base returned ${eurResp.status}`)
    }

    if (!usdData && !eurData) {
      throw new Error('No exchange rates fetched (both USD and EUR base failed)')
    }

    const updates: Array<{ base_currency: string; target_currency: string; rate: number; fetched_at: string; is_fallback: boolean }> = []

    if (usdData) {
      const ratesUSD = usdData.rates as Record<string, number>
      console.log(`Received ${Object.keys(ratesUSD).length} USD-base exchange rates`)
      // Filter to only our target currencies
      for (const currency of allCurrencies) {
        const rate = ratesUSD[currency]
        if (rate !== undefined) {
          updates.push({
            base_currency: 'USD',
            target_currency: currency,
            rate: Number(rate),
            fetched_at: nowIso,
            is_fallback: false,
          })
        }
      }
    }

    if (eurData) {
      const ratesEUR = eurData.rates as Record<string, number>
      console.log(`Received ${Object.keys(ratesEUR).length} EUR-base exchange rates`)
      // Filter to only our target currencies
      for (const currency of allCurrencies) {
        const rate = ratesEUR[currency]
        if (rate !== undefined) {
          updates.push({
            base_currency: 'EUR',
            target_currency: currency,
            rate: Number(rate),
            fetched_at: nowIso,
            is_fallback: false,
          })
        }
      }
    }

    // Upsert (insert or update) both bases
    const { error: upsertError } = await supabase
      .from('exchange_rates')
      .upsert(updates, { onConflict: 'base_currency,target_currency,valid_date', ignoreDuplicates: false })

    if (upsertError) throw upsertError

    console.log(`Successfully updated ${updates.length} exchange rates (USD & EUR bases)`) 

    return new Response(
      JSON.stringify({ success: true, updated: updates.length, timestamp: nowIso }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error fetching exchange rates:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
