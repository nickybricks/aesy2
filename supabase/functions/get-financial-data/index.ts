import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GetFinancialDataRequest {
  ticker: string;
  startDate?: string;
  endDate?: string;
  period?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'TTM' | 'all';
  includeRaw?: boolean;
  minQuality?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const url = new URL(req.url);
    const ticker = url.searchParams.get('ticker');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const period = url.searchParams.get('period') as any || 'all';
    const includeRaw = url.searchParams.get('includeRaw') === 'true';
    const minQuality = parseInt(url.searchParams.get('minQuality') || '50');
    
    if (!ticker) {
      return new Response(
        JSON.stringify({ error: 'Missing ticker parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Get financial data: ${ticker}, period=${period}, startDate=${startDate}, endDate=${endDate}`);
    
    // Build query
    let query = supabase
      .from('financial_data_quarterly')
      .select(includeRaw ? '*' : `
        id,
        symbol,
        fiscal_date,
        calendar_year,
        period,
        is_ttm,
        reported_currency,
        fx_rate_to_usd,
        net_income,
        revenue,
        ebit,
        ebitda,
        eps,
        eps_diluted,
        eps_wo_nri,
        interest_expense,
        income_before_tax,
        income_tax_expense,
        unusual_items,
        goodwill_impairment,
        impairment_of_assets,
        restructuring_charges,
        total_equity,
        total_assets,
        current_assets,
        total_debt,
        short_term_debt,
        long_term_debt,
        current_liabilities,
        cash_and_equivalents,
        book_value_per_share,
        operating_cash_flow,
        free_cash_flow,
        capex,
        weighted_avg_shares_diluted,
        dividend_per_share,
        stock_price_close,
        stock_price_date,
        tax_rate,
        nopat,
        invested_capital,
        wacc,
        data_quality_score,
        missing_fields,
        data_source,
        fmp_filing_date,
        created_at,
        updated_at
      `)
      .eq('symbol', ticker.toUpperCase())
      .gte('data_quality_score', minQuality)
      .order('fiscal_date', { ascending: false });
    
    // Apply filters
    if (startDate) {
      query = query.gte('fiscal_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('fiscal_date', endDate);
    }
    
    if (period && period !== 'all') {
      if (period === 'TTM') {
        query = query.eq('is_ttm', true);
      } else {
        query = query.eq('period', period).eq('is_ttm', false);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Query error:', error);
      throw error;
    }
    
    // Calculate metadata
    const dataArray = data as any[];
    const meta = {
      count: dataArray?.length || 0,
      avgQualityScore: dataArray && dataArray.length > 0
        ? Math.round(dataArray.reduce((acc: number, item: any) => acc + (item.data_quality_score || 0), 0) / dataArray.length)
        : 0,
      currency: dataArray && dataArray.length > 0 ? dataArray[0].reported_currency : null,
      dateRange: dataArray && dataArray.length > 0 ? {
        from: dataArray[dataArray.length - 1].fiscal_date,
        to: dataArray[0].fiscal_date
      } : null
    };
    
    console.log(`Found ${meta.count} records with avg quality score ${meta.avgQualityScore}`);
    
    return new Response(
      JSON.stringify({ data, meta }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in get-financial-data:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
