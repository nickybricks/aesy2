import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StockData {
  id: number;
  symbol: string;
  name: string;
  currency: string;
  price: number | null;
  market_cap: number | null;
}

interface HistoricalPrice {
  date: string;
  close: number;
}

interface FinancialStatement {
  fiscal_date: string;
  period: string;
  net_income_usd: number | null;
  net_income_eur: number | null;
  net_income_orig: number | null;
  eps_diluted_usd: number | null;
  eps_diluted_eur: number | null;
  eps_diluted_orig: number | null;
  ebit_usd: number | null;
  ebit_eur: number | null;
  ebit_orig: number | null;
  ebitda_usd: number | null;
  ebitda_eur: number | null;
  ebitda_orig: number | null;
  revenue_usd: number | null;
  revenue_eur: number | null;
  revenue_orig: number | null;
  free_cash_flow_usd: number | null;
  free_cash_flow_eur: number | null;
  free_cash_flow_orig: number | null;
  operating_cash_flow_usd: number | null;
  operating_cash_flow_eur: number | null;
  operating_cash_flow_orig: number | null;
  total_debt_usd: number | null;
  total_debt_eur: number | null;
  total_debt_orig: number | null;
  total_stockholders_equity_usd: number | null;
  total_stockholders_equity_eur: number | null;
  total_stockholders_equity_orig: number | null;
  total_assets_usd: number | null;
  total_assets_eur: number | null;
  total_assets_orig: number | null;
  total_current_assets_usd: number | null;
  total_current_assets_eur: number | null;
  total_current_assets_orig: number | null;
  total_current_liabilities_usd: number | null;
  total_current_liabilities_eur: number | null;
  total_current_liabilities_orig: number | null;
  cash_and_equivalents_usd: number | null;
  cash_and_equivalents_eur: number | null;
  cash_and_equivalents_orig: number | null;
  interest_expense_usd: number | null;
  interest_expense_eur: number | null;
  interest_expense_orig: number | null;
  income_tax_expense_usd: number | null;
  income_tax_expense_eur: number | null;
  income_tax_expense_orig: number | null;
  income_before_tax_usd: number | null;
  income_before_tax_eur: number | null;
  income_before_tax_orig: number | null;
  intangible_assets_usd: number | null;
  intangible_assets_eur: number | null;
  intangible_assets_orig: number | null;
  research_and_development_expenses_usd: number | null;
  research_and_development_expenses_eur: number | null;
  research_and_development_expenses_orig: number | null;
  invested_capital_usd: number | null;
  invested_capital_eur: number | null;
  invested_capital_orig: number | null;
  working_capital_usd: number | null;
  working_capital_eur: number | null;
  working_capital_orig: number | null;
  book_value_per_share: number | null;
  tangible_book_value_per_share: number | null;
  weighted_avg_shares_diluted: number | null;
  full_time_employees: number | null;
  tax_rate: number | null;
  // Allow dynamic string indexing for currency-suffixed fields
  // deno-lint-ignore no-explicit-any
  [key: string]: any;
}

// Helper function to calculate TTM (Trailing Twelve Months) values by summing last 4 quarters
function calculateTTM(
  statements: FinancialStatement[],
  field: string,
  suffix: string
): number | null {
  const quarterly = statements
    .filter(f => f.period.startsWith('q') && f.period !== 'quarter')
    .sort((a, b) => new Date(b.fiscal_date).getTime() - new Date(a.fiscal_date).getTime())
    .slice(0, 4);

  if (quarterly.length < 4) {
    return null;
  }

  const ttmValue = quarterly.reduce((sum, q) => {
    const value = q[`${field}_${suffix}` as keyof FinancialStatement];
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);

  return ttmValue || null;
}

// Helper function to get average value from last 4 quarters (for balance sheet items)
function calculateAverageTTM(
  statements: FinancialStatement[],
  field: string,
  suffix: string
): number | null {
  const quarterly = statements
    .filter(f => f.period.startsWith('q') && f.period !== 'quarter')
    .sort((a, b) => new Date(b.fiscal_date).getTime() - new Date(a.fiscal_date).getTime())
    .slice(0, 4);

  if (quarterly.length < 4) {
    return null;
  }

  const sum = quarterly.reduce((total, q) => {
    const value = q[`${field}_${suffix}` as keyof FinancialStatement];
    return total + (typeof value === 'number' ? value : 0);
  }, 0);

  return sum / 4;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fmpApiKey = Deno.env.get('FMP_API_KEY')!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { testSymbol } = await req.json().catch(() => ({}));
    
    console.log('Starting precomputed metrics calculation (TTM-based)...');
    
    // Get stocks to process
    let query = supabaseClient
      .from('stocks')
      .select('id, symbol, name, currency, price, market_cap')
      .eq('is_actively_trading', true);
    
    if (testSymbol) {
      query = query.eq('symbol', testSymbol);
      console.log(`Test mode: Processing only ${testSymbol}`);
    }
    
    const { data: stocks, error: stocksError } = await query;
    
    if (stocksError) {
      throw new Error(`Failed to fetch stocks: ${stocksError.message}`);
    }
    
    console.log(`Processing ${stocks?.length || 0} stocks...`);
    
    const results = [];
    
    for (const stock of stocks || []) {
      try {
        console.log(`\n=== Processing ${stock.symbol} ===`);
        const metrics = await calculateMetricsForStock(stock, supabaseClient, fmpApiKey);
        
        if (metrics) {
          // Upsert metrics (replaces old data based on stock_id)
          const { error: upsertError } = await supabaseClient
            .from('precomputed_metrics')
            .upsert({
              stock_id: stock.id,
              symbol: stock.symbol,
              company_name: stock.name,
              currency: stock.currency,
              calculation_date: new Date().toISOString().split('T')[0],
              ...metrics,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'stock_id'
            });
          
          if (upsertError) {
            console.error(`Failed to upsert metrics for ${stock.symbol}:`, upsertError);
            results.push({ symbol: stock.symbol, success: false, error: upsertError.message });
          } else {
            console.log(`✓ Successfully calculated metrics for ${stock.symbol}`);
            results.push({ symbol: stock.symbol, success: true });
          }
        } else {
          results.push({ symbol: stock.symbol, success: false, error: 'No metrics calculated' });
        }
      } catch (error) {
        console.error(`Error processing ${stock.symbol}:`, error);
        results.push({ 
          symbol: stock.symbol, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n=== Completed: ${successCount}/${results.length} successful ===`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        successful: successCount,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in calculate-precomputed-metrics:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function calculateMetricsForStock(
  stock: StockData,
  supabaseClient: any,
  fmpApiKey: string
): Promise<Record<string, any> | null> {
  // Fetch financial statements from database
  const { data: financialStatements, error: financialsError } = await supabaseClient
    .from('financial_statements')
    .select('*')
    .eq('symbol', stock.symbol)
    .order('date', { ascending: false });
  
  if (financialsError || !financialStatements || financialStatements.length === 0) {
    console.warn(`No financial statements for ${stock.symbol}`);
    return null;
  }

  console.log(`Found ${financialStatements.length} financial statements for ${stock.symbol}`);

  const metrics: Record<string, any> = {};

  // Calculate metrics for ALL currency suffixes (usd, eur, orig)
  const suffixes = ['usd', 'eur', 'orig'];
  
  for (const suffix of suffixes) {
    console.log(`Calculating metrics for ${suffix}...`);

    // Always store TTM absolute values for all currencies
    storeAbsoluteValuesTTM(financialStatements, suffix, metrics);

    // Always calculate Graham Number (doesn't depend on price)
    calculateGrahamNumber(financialStatements, suffix, metrics);

    // Fetch historical prices (needed for valuation ratios)
    const historicalPrices = await fetchHistoricalPrices(stock.symbol, fmpApiKey);

    // Get current price from API (no fallback!)
    const currentPrice = historicalPrices.length > 0 ? historicalPrices[0].close : null;

    if (!currentPrice) {
      console.warn(`No current price from API for ${stock.symbol} - skipping valuation ratios`);
    } else {
      console.log(`Using current price ${currentPrice} for ${stock.symbol}`);
      calculateValuationRatiosTTM(financialStatements, currentPrice, suffix, metrics);
    }

    // Calculate growth metrics
    calculateGrowthMetrics(financialStatements, suffix, metrics);
    
    // Calculate profitability metrics using TTM
    calculateProfitabilityMetricsTTM(financialStatements, suffix, metrics);
    
    // Calculate liquidity and leverage ratios using TTM
    calculateLiquidityLeverageRatiosTTM(financialStatements, stock.market_cap, suffix, metrics);
    
    // Calculate return ratios using TTM
    calculateReturnRatiosTTM(financialStatements, suffix, metrics);
  }

  // Calculate price changes (only once)
  await calculatePriceChanges(metrics, stock.symbol, fmpApiKey);

  // Calculate efficiency metrics (only once)
  calculateEfficiencyMetrics(financialStatements, metrics);

  return metrics;
}

// Store TTM absolute values (always, regardless of price availability)
function storeAbsoluteValuesTTM(
  statements: FinancialStatement[],
  suffix: string,
  metrics: Record<string, any>
) {
  // Use TTM values (sum of last 4 quarters)
  metrics[`net_income_${suffix}`] = calculateTTM(statements, 'net_income', suffix);
  metrics[`eps_diluted_${suffix}`] = calculateTTM(statements, 'eps_diluted', suffix);
  metrics[`ebitda_${suffix}`] = calculateTTM(statements, 'ebitda', suffix);
  metrics[`ebit_${suffix}`] = calculateTTM(statements, 'ebit', suffix);
  metrics[`gross_profit_${suffix}`] = calculateTTM(statements, 'ebitda', suffix); // Using EBITDA as proxy
}

// Calculate Graham Number using TTM EPS and latest book value
function calculateGrahamNumber(
  statements: FinancialStatement[],
  suffix: string,
  metrics: Record<string, any>
) {
  // Get TTM EPS
  const ttmEps = calculateTTM(statements, 'eps_diluted', suffix);
  
  // Get latest book value per share
  const latestQuarterly = statements
    .filter(f => f.period.startsWith('q') && f.period !== 'quarter')
    .sort((a, b) => new Date(b.fiscal_date).getTime() - new Date(a.fiscal_date).getTime())[0];
  
  if (!latestQuarterly) return;
  
  const bookValuePerShare = latestQuarterly.book_value_per_share;
  
  if (ttmEps && bookValuePerShare && ttmEps > 0 && bookValuePerShare > 0) {
    metrics[`graham_number_${suffix}`] = Math.sqrt(22.5 * ttmEps * bookValuePerShare);
  }
}

async function fetchHistoricalPrices(symbol: string, apiKey: string): Promise<HistoricalPrice[]> {
  const from = '1990-01-01';
  const url = `https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=${symbol}&from=${from}&apikey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch historical prices for ${symbol}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return (data || [])
      .map((item: any) => ({
        date: item.date,
        close: item.close
      }))
      .sort((a: HistoricalPrice, b: HistoricalPrice) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  } catch (error) {
    console.error(`Error fetching historical prices for ${symbol}:`, error);
    return [];
  }
}

async function calculatePriceChanges(metrics: Record<string, any>, symbol: string, apiKey: string) {
  const url = `https://financialmodelingprep.com/stable/stock-price-change?symbol=${symbol}&apikey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch price changes for ${symbol}: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    if (!data || data.length === 0) {
      console.warn(`No price change data for ${symbol}`);
      return;
    }
    
    const priceChange = data[0];
    
    metrics.price_change_1d = priceChange['1D'] || null;
    metrics.price_change_5d = priceChange['5D'] || null;
    metrics.price_change_1m = priceChange['1M'] || null;
    metrics.price_change_3m = priceChange['3M'] || null;
    metrics.price_change_6m = priceChange['6M'] || null;
    metrics.price_change_ytd = priceChange['ytd'] || null;
    metrics.price_change_1y = priceChange['1Y'] || null;
    metrics.price_change_3y = priceChange['3Y'] || null;
    metrics.price_change_5y = priceChange['5Y'] || null;
    metrics.price_change_10y = priceChange['10Y'] || null;
    metrics.price_change_max = priceChange['max'] || null;
  } catch (error) {
    console.error(`Error fetching price changes for ${symbol}:`, error);
  }
}

// Calculate valuation ratios using TTM values
function calculateValuationRatiosTTM(
  statements: FinancialStatement[],
  currentPrice: number | null,
  suffix: string,
  metrics: Record<string, any>
) {
  if (!currentPrice) {
    console.log(`No current price available for valuation ratios calculation`);
    return;
  }

  // Get latest quarterly statement for shares outstanding and book value
  const latestQuarterly = statements
    .filter(f => f.period.startsWith('q') && f.period !== 'quarter')
    .sort((a, b) => new Date(b.fiscal_date).getTime() - new Date(a.fiscal_date).getTime())[0];

  if (!latestQuarterly) return;

  // Calculate TTM values
  const ttmRevenue = calculateTTM(statements, 'revenue', suffix);
  const ttmEps = calculateTTM(statements, 'eps_diluted', suffix);
  const ttmFreeCashFlow = calculateTTM(statements, 'free_cash_flow', suffix);
  const ttmOperatingCashFlow = calculateTTM(statements, 'operating_cash_flow', suffix);
  
  const bookValue = latestQuarterly.book_value_per_share;
  const sharesOutstanding = latestQuarterly.weighted_avg_shares_diluted;

  // Only calculate if we're on the first suffix iteration (to avoid duplicates)
  if (suffix === 'usd' || (suffix === 'eur' && !metrics.pe_ratio)) {
    // PE Ratio using TTM EPS
    if (ttmEps && ttmEps > 0) {
      metrics.pe_ratio = currentPrice / ttmEps;
    }

    // PS Ratio using TTM Revenue
    if (ttmRevenue && sharesOutstanding && sharesOutstanding > 0) {
      const revenuePerShare = ttmRevenue / sharesOutstanding;
      if (revenuePerShare > 0) {
        metrics.ps_ratio = currentPrice / revenuePerShare;
      }
    }

    // PB Ratio (uses latest book value, not TTM)
    if (bookValue && bookValue > 0) {
      metrics.pb_ratio = currentPrice / bookValue;
    }

    // P/FCF Ratio using TTM FCF
    if (ttmFreeCashFlow && sharesOutstanding && sharesOutstanding > 0) {
      const fcfPerShare = ttmFreeCashFlow / sharesOutstanding;
      if (fcfPerShare > 0) {
        metrics.p_fcf_ratio = currentPrice / fcfPerShare;
      }
    }

    // P/OCF Ratio using TTM OCF
    if (ttmOperatingCashFlow && sharesOutstanding && sharesOutstanding > 0) {
      const ocfPerShare = ttmOperatingCashFlow / sharesOutstanding;
      if (ocfPerShare > 0) {
        metrics.p_ocf_ratio = currentPrice / ocfPerShare;
      }
    }
  }
}

// Calculate growth metrics
function calculateGrowthMetrics(
  statements: FinancialStatement[],
  suffix: string,
  metrics: Record<string, any>
) {
  // Use 'quarter' for TTM data
  const ttmAnnual = statements.filter(f => f.period === 'quarter');
  // Use lowercase 'q' for quarterly data
  const quarterly = statements.filter(f => f.period.startsWith('q') && f.period !== 'quarter');
  
  if (ttmAnnual.length >= 2) {
    const current = ttmAnnual[0];
    const prev1y = ttmAnnual[1];
    const prev3y = ttmAnnual[3];
    const prev5y = ttmAnnual[5];
    const prev10y = ttmAnnual[10];
    
    // Net Income Growth
    metrics.net_income_growth_yoy = calculatePercentChange(
      current[`net_income_${suffix}`],
      prev1y?.[`net_income_${suffix}`]
    );
    metrics.net_income_growth_3y_cagr = calculateCAGR(
      current[`net_income_${suffix}`],
      prev3y?.[`net_income_${suffix}`],
      3
    );
    metrics.net_income_growth_5y_cagr = calculateCAGR(
      current[`net_income_${suffix}`],
      prev5y?.[`net_income_${suffix}`],
      5
    );
    
    // EPS Growth
    metrics.eps_growth_yoy = calculatePercentChange(
      current[`eps_diluted_${suffix}`],
      prev1y?.[`eps_diluted_${suffix}`]
    );
    metrics.eps_growth_3y_cagr = calculateCAGR(
      current[`eps_diluted_${suffix}`],
      prev3y?.[`eps_diluted_${suffix}`],
      3
    );
    metrics.eps_growth_5y_cagr = calculateCAGR(
      current[`eps_diluted_${suffix}`],
      prev5y?.[`eps_diluted_${suffix}`],
      5
    );
    
    // EBIT Growth
    metrics.ebit_growth_yoy = calculatePercentChange(
      current[`ebit_${suffix}`],
      prev1y?.[`ebit_${suffix}`]
    );
    metrics.ebit_growth_3y_cagr = calculateCAGR(
      current[`ebit_${suffix}`],
      prev3y?.[`ebit_${suffix}`],
      3
    );
    metrics.ebit_growth_5y_cagr = calculateCAGR(
      current[`ebit_${suffix}`],
      prev5y?.[`ebit_${suffix}`],
      5
    );
    metrics.ebit_growth_10y_cagr = calculateCAGR(
      current[`ebit_${suffix}`],
      prev10y?.[`ebit_${suffix}`],
      10
    );
    
    // FCF Growth
    metrics.fcf_growth_yoy = calculatePercentChange(
      current[`free_cash_flow_${suffix}`],
      prev1y?.[`free_cash_flow_${suffix}`]
    );
    metrics.fcf_growth_3y_cagr = calculateCAGR(
      current[`free_cash_flow_${suffix}`],
      prev3y?.[`free_cash_flow_${suffix}`],
      3
    );
    metrics.fcf_growth_5y_cagr = calculateCAGR(
      current[`free_cash_flow_${suffix}`],
      prev5y?.[`free_cash_flow_${suffix}`],
      5
    );
    
    // Debt Growth
    metrics.debt_growth_yoy = calculatePercentChange(
      current[`total_debt_${suffix}`],
      prev1y?.[`total_debt_${suffix}`]
    );
    metrics.debt_growth_3y_cagr = calculateCAGR(
      current[`total_debt_${suffix}`],
      prev3y?.[`total_debt_${suffix}`],
      3
    );
    metrics.debt_growth_5y_cagr = calculateCAGR(
      current[`total_debt_${suffix}`],
      prev5y?.[`total_debt_${suffix}`],
      5
    );
    
    // Profitable years counting
    metrics.net_income_profitable_10years = ttmAnnual
      .slice(0, 10)
      .filter(f => (f[`net_income_${suffix}`] || 0) > 0)
      .length;
    metrics.net_income_profitable_20years = ttmAnnual
      .slice(0, 20)
      .filter(f => (f[`net_income_${suffix}`] || 0) > 0)
      .length;
    
    // Growth streaks
    let netIncomeGrowthYears = 0;
    let epsGrowthYears = 0;
    for (let i = 0; i < ttmAnnual.length - 1; i++) {
      const growth = calculatePercentChange(
        ttmAnnual[i][`net_income_${suffix}`],
        ttmAnnual[i + 1][`net_income_${suffix}`]
      );
      if (growth && growth > 0) netIncomeGrowthYears++;
      else break;
    }
    for (let i = 0; i < ttmAnnual.length - 1; i++) {
      const growth = calculatePercentChange(
        ttmAnnual[i][`eps_diluted_${suffix}`],
        ttmAnnual[i + 1][`eps_diluted_${suffix}`]
      );
      if (growth && growth > 0) epsGrowthYears++;
      else break;
    }
    metrics.net_income_growth_years = netIncomeGrowthYears;
    metrics.eps_growth_years = epsGrowthYears;
  }
  
  // Quarterly growth
  if (quarterly.length >= 2) {
    const currentQ = quarterly[0];
    const prevQ = quarterly[1];
    
    metrics.net_income_growth_qoq = calculatePercentChange(
      currentQ[`net_income_${suffix}`],
      prevQ[`net_income_${suffix}`]
    );
    metrics.eps_growth_qoq = calculatePercentChange(
      currentQ[`eps_diluted_${suffix}`],
      prevQ[`eps_diluted_${suffix}`]
    );
    metrics.ebit_growth_qoq = calculatePercentChange(
      currentQ[`ebit_${suffix}`],
      prevQ[`ebit_${suffix}`]
    );
    metrics.fcf_growth_qoq = calculatePercentChange(
      currentQ[`free_cash_flow_${suffix}`],
      prevQ[`free_cash_flow_${suffix}`]
    );
    metrics.debt_growth_qoq = calculatePercentChange(
      currentQ[`total_debt_${suffix}`],
      prevQ[`total_debt_${suffix}`]
    );
    
    // Quarterly growth streaks
    let netIncomeGrowthQuarters = 0;
    let epsGrowthQuarters = 0;
    for (let i = 0; i < quarterly.length - 1; i++) {
      const niGrowth = calculatePercentChange(
        quarterly[i][`net_income_${suffix}`],
        quarterly[i + 1][`net_income_${suffix}`]
      );
      if (niGrowth && niGrowth > 0) netIncomeGrowthQuarters++;
      else break;
    }
    for (let i = 0; i < quarterly.length - 1; i++) {
      const epsGrowth = calculatePercentChange(
        quarterly[i][`eps_diluted_${suffix}`],
        quarterly[i + 1][`eps_diluted_${suffix}`]
      );
      if (epsGrowth && epsGrowth > 0) epsGrowthQuarters++;
      else break;
    }
    metrics.net_income_growth_quarters = netIncomeGrowthQuarters;
    metrics.eps_growth_quarters = epsGrowthQuarters;
  }
}

// Calculate profitability metrics using TTM values
function calculateProfitabilityMetricsTTM(
  statements: FinancialStatement[],
  suffix: string,
  metrics: Record<string, any>
) {
  // Calculate TTM values
  const ttmRevenue = calculateTTM(statements, 'revenue', suffix);
  const ttmEbitda = calculateTTM(statements, 'ebitda', suffix);
  const ttmEbit = calculateTTM(statements, 'ebit', suffix);
  const ttmNetIncome = calculateTTM(statements, 'net_income', suffix);
  const ttmFreeCashFlow = calculateTTM(statements, 'free_cash_flow', suffix);
  const ttmIncomeBeforeTax = calculateTTM(statements, 'income_before_tax', suffix);
  const ttmIncomeTax = calculateTTM(statements, 'income_tax_expense', suffix);
  const ttmRndExpenses = calculateTTM(statements, 'research_and_development_expenses', suffix);

  if (ttmRevenue && ttmRevenue > 0) {
    // Using TTM EBITDA as proxy for gross profit
    const grossProfit = ttmEbitda;
    if (grossProfit) {
      metrics.gross_margin = (grossProfit / ttmRevenue) * 100;
      metrics[`gross_profit_${suffix}`] = grossProfit;
    }

    if (ttmEbit) metrics.operating_margin = (ttmEbit / ttmRevenue) * 100;
    if (ttmEbitda) metrics.ebitda_margin = (ttmEbitda / ttmRevenue) * 100;
    if (ttmIncomeBeforeTax) metrics.pretax_margin = (ttmIncomeBeforeTax / ttmRevenue) * 100;
    if (ttmNetIncome) metrics.profit_margin = (ttmNetIncome / ttmRevenue) * 100;
    if (ttmFreeCashFlow) metrics.fcf_margin = (ttmFreeCashFlow / ttmRevenue) * 100;
    if (ttmEbit) metrics.ebit_margin = (ttmEbit / ttmRevenue) * 100;
    
    if (ttmRndExpenses) {
      metrics.rnd_to_revenue_ratio = (ttmRndExpenses / ttmRevenue) * 100;
      metrics[`rnd_expenses_${suffix}`] = ttmRndExpenses;
    }

    if (ttmIncomeTax) {
      metrics.tax_to_revenue_ratio = (ttmIncomeTax / ttmRevenue) * 100;
    }
  }
}

// Calculate liquidity and leverage ratios using TTM and latest balance sheet values
function calculateLiquidityLeverageRatiosTTM(
  statements: FinancialStatement[],
  marketCap: number | null,
  suffix: string,
  metrics: Record<string, any>
) {
  const latestQuarterly = statements
    .filter(f => f.period.startsWith('q') && f.period !== 'quarter')
    .sort((a, b) => new Date(b.fiscal_date).getTime() - new Date(a.fiscal_date).getTime())[0];

  if (!latestQuarterly) return;

  // Balance sheet items use latest quarterly values (not TTM)
  const currentAssets = latestQuarterly[`total_current_assets_${suffix}`];
  const currentLiabilities = latestQuarterly[`total_current_liabilities_${suffix}`];
  const totalDebt = latestQuarterly[`total_debt_${suffix}`];
  const totalEquity = latestQuarterly[`total_stockholders_equity_${suffix}`];
  const cash = latestQuarterly[`cash_and_equivalents_${suffix}`];
  const bookValuePerShare = latestQuarterly.book_value_per_share;
  const tangibleBookValuePerShare = latestQuarterly.tangible_book_value_per_share;
  const workingCapital = latestQuarterly[`working_capital_${suffix}`];

  // Income statement items use TTM values
  const ttmEbitda = calculateTTM(statements, 'ebitda', suffix);
  const ttmFreeCashFlow = calculateTTM(statements, 'free_cash_flow', suffix);
  const ttmInterestExpense = calculateTTM(statements, 'interest_expense', suffix);

  // Only calculate once per stock (not per currency)
  if (suffix === 'usd' || (suffix === 'eur' && metrics.current_ratio === undefined)) {
    if (currentAssets && currentLiabilities && currentLiabilities > 0) {
      metrics.current_ratio = currentAssets / currentLiabilities;
    }

    if (totalDebt && totalEquity && totalEquity > 0) {
      metrics.debt_to_equity = totalDebt / totalEquity;
    }

    if (totalDebt && ttmEbitda && ttmEbitda > 0) {
      metrics.debt_to_ebitda = totalDebt / ttmEbitda;
    }

    if (totalDebt && ttmFreeCashFlow && ttmFreeCashFlow > 0) {
      metrics.debt_to_fcf = totalDebt / ttmFreeCashFlow;
    }

    if (ttmEbitda && ttmInterestExpense && ttmInterestExpense > 0) {
      metrics.interest_coverage = ttmEbitda / ttmInterestExpense;
    }

    if (bookValuePerShare) {
      metrics.bvps = bookValuePerShare;
    }

    if (tangibleBookValuePerShare) {
      metrics.tbvps = tangibleBookValuePerShare;
    }

    if (workingCapital) {
      metrics.working_capital = workingCapital;
    }
  }

  // Net cash calculation (per currency)
  if (cash && totalDebt) {
    const netCash = cash - totalDebt;
    metrics[`net_cash_${suffix}`] = netCash;

    // Calculate net cash growth YoY
    const quarterly = statements
      .filter(f => f.period.startsWith('q') && f.period !== 'quarter')
      .sort((a, b) => new Date(b.fiscal_date).getTime() - new Date(a.fiscal_date).getTime());

    if (quarterly.length >= 5) {
      const currentNetCash = (quarterly[0][`cash_and_equivalents_${suffix}`] || 0) - 
                            (quarterly[0][`total_debt_${suffix}`] || 0);
      const previousNetCash = (quarterly[4][`cash_and_equivalents_${suffix}`] || 0) - 
                              (quarterly[4][`total_debt_${suffix}`] || 0);
      
      if (previousNetCash !== 0) {
        metrics.net_cash_growth_yoy = ((currentNetCash - previousNetCash) / Math.abs(previousNetCash)) * 100;
      }
    }

    // Cash to market cap (only once)
    if (marketCap && marketCap > 0 && (suffix === 'usd' || (suffix === 'eur' && !metrics.cash_to_market_cap))) {
      metrics.cash_to_market_cap = (cash / marketCap) * 100;
    }
  }
}

// Calculate return ratios (ROE, ROA, ROIC, ROCE) using TTM values
function calculateReturnRatiosTTM(
  statements: FinancialStatement[],
  suffix: string,
  metrics: Record<string, any>
) {
  const quarterly = statements
    .filter(f => f.period.startsWith('q') && f.period !== 'quarter')
    .sort((a, b) => new Date(b.fiscal_date).getTime() - new Date(a.fiscal_date).getTime());

  if (quarterly.length < 4) return;

  // Get TTM income statement values
  const ttmNetIncome = calculateTTM(statements, 'net_income', suffix);
  const ttmEbit = calculateTTM(statements, 'ebit', suffix);

  // Get average balance sheet values (average of last 4 quarters)
  const avgTotalAssets = calculateAverageTTM(statements, 'total_assets', suffix);
  const avgTotalEquity = calculateAverageTTM(statements, 'total_stockholders_equity', suffix);
  const avgInvestedCapital = calculateAverageTTM(statements, 'invested_capital', suffix);
  const avgCurrentLiabilities = calculateAverageTTM(statements, 'total_current_liabilities', suffix);

  // Get latest tax rate
  const latestQuarterly = quarterly[0];
  const taxRate = latestQuarterly.tax_rate || 0.21; // Default 21% if not available
  
  // NOPAT calculation for ROIC using TTM EBIT
  const nopat = ttmEbit ? ttmEbit * (1 - taxRate) : null;

  // Only calculate once per stock (not per currency)
  if (suffix === 'usd' || (suffix === 'eur' && metrics.roe === undefined)) {
    // ROE = TTM Net Income / Average Total Equity
    if (ttmNetIncome && avgTotalEquity && avgTotalEquity > 0) {
      metrics.roe = (ttmNetIncome / avgTotalEquity) * 100;
    }

    // ROA = TTM Net Income / Average Total Assets
    if (ttmNetIncome && avgTotalAssets && avgTotalAssets > 0) {
      metrics.roa = (ttmNetIncome / avgTotalAssets) * 100;
    }

    // ROIC = TTM NOPAT / Average Invested Capital
    if (nopat && avgInvestedCapital && avgInvestedCapital > 0) {
      metrics.roic = (nopat / avgInvestedCapital) * 100;
    }

    // ROCE = TTM EBIT / Average Capital Employed
    if (ttmEbit && avgTotalAssets && avgCurrentLiabilities) {
      const capitalEmployed = avgTotalAssets - avgCurrentLiabilities;
      if (capitalEmployed > 0) {
        metrics.roce = (ttmEbit / capitalEmployed) * 100;
      }
    }

    // Calculate 5-year averages (using TTM values for each year)
    if (quarterly.length >= 20) { // Need at least 5 years of quarterly data
      const roeValues: number[] = [];
      const roaValues: number[] = [];
      const roicValues: number[] = [];

      // Calculate TTM ratios for last 5 years (every 4 quarters)
      for (let i = 0; i < 5; i++) {
        const offset = i * 4;
        if (quarterly.length < offset + 4) break;

        const yearQuarterlies = quarterly.slice(offset, offset + 4);
        
        // Calculate TTM values for this year
        const yearNetIncome = yearQuarterlies.reduce((sum, q) => 
          sum + ((q[`net_income_${suffix}`] as number) || 0), 0);
        const yearEbit = yearQuarterlies.reduce((sum, q) => 
          sum + ((q[`ebit_${suffix}`] as number) || 0), 0);
        
        // Calculate average balance sheet values
        const yearAvgEquity = yearQuarterlies.reduce((sum, q) => 
          sum + ((q[`total_stockholders_equity_${suffix}`] as number) || 0), 0) / 4;
        const yearAvgAssets = yearQuarterlies.reduce((sum, q) => 
          sum + ((q[`total_assets_${suffix}`] as number) || 0), 0) / 4;
        const yearAvgInvestedCapital = yearQuarterlies.reduce((sum, q) => 
          sum + ((q[`invested_capital_${suffix}`] as number) || 0), 0) / 4;

        // Calculate ratios
        if (yearNetIncome && yearAvgEquity > 0) {
          roeValues.push((yearNetIncome / yearAvgEquity) * 100);
        }
        if (yearNetIncome && yearAvgAssets > 0) {
          roaValues.push((yearNetIncome / yearAvgAssets) * 100);
        }
        if (yearEbit && yearAvgInvestedCapital > 0) {
          const yearNopat = yearEbit * (1 - taxRate);
          roicValues.push((yearNopat / yearAvgInvestedCapital) * 100);
        }
      }

      if (roeValues.length > 0) {
        metrics.roe_5y_avg = roeValues.reduce((a, b) => a + b, 0) / roeValues.length;
      }
      if (roaValues.length > 0) {
        metrics.roa_5y_avg = roaValues.reduce((a, b) => a + b, 0) / roaValues.length;
      }
      if (roicValues.length > 0) {
        metrics.roic_5y_avg = roicValues.reduce((a, b) => a + b, 0) / roicValues.length;
      }
    }
  }
}

// Calculate efficiency metrics
function calculateEfficiencyMetrics(
  statements: FinancialStatement[],
  metrics: Record<string, any>
) {
  const latestQuarterly = statements
    .filter(f => f.period.startsWith('q') && f.period !== 'quarter')
    .sort((a, b) => new Date(b.fiscal_date).getTime() - new Date(a.fiscal_date).getTime())[0];

  if (!latestQuarterly) return;

  const employees = latestQuarterly.full_time_employees;
  
  // Use TTM values for revenue and net income
  const ttmRevenue = calculateTTM(statements, 'revenue', 'usd');
  const ttmNetIncome = calculateTTM(statements, 'net_income', 'usd');

  if (employees && employees > 0) {
    metrics.revenue_per_employee = ttmRevenue ? ttmRevenue / employees : null;
    metrics.profits_per_employee = ttmNetIncome ? ttmNetIncome / employees : null;
  }
}

// Helper functions
function calculatePercentChange(current: number | null | undefined, previous: number | null | undefined): number | null {
  if (!current || !previous || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function calculateCAGR(current: number | null | undefined, previous: number | null | undefined, years: number): number | null {
  if (!current || !previous || previous === 0 || years === 0) return null;
  return (Math.pow(current / previous, 1 / years) - 1) * 100;
}
