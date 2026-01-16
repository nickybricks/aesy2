import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type BasisMode = 'EPS_WO_NRI' | 'FCF_PER_SHARE' | 'ADJUSTED_DIVIDEND';

interface ValuationInput {
  ticker: string;
  mode: BasisMode;
  currentPrice: number;
}

interface ValuationResponse {
  ticker: string;
  price: number;
  mode: BasisMode;
  fairValuePerShare: number;
  marginOfSafetyPct: number;
  assumptions: {
    discountRatePct: number;
    growthYears: number;
    growthRatePct: number;
    terminalYears: number;
    terminalRatePct: number;
    tangibleBookPerShare: number;
    includeTangibleBook: boolean;
    predictability: string;
  };
  components: {
    startValuePerShare: number;
    pvPhase1: number;
    pvPhase2: number;
    tangibleBookAdded: number;
  };
  asOf: string;
}

// Helper functions
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function trimmedMean(values: number[], trimPct: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const trimCount = Math.floor(sorted.length * trimPct);
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// Fetch financial data from FMP
async function fetchFinancialData(ticker: string) {
  const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
  if (!FMP_API_KEY) {
    throw new Error('FMP_API_KEY not configured');
  }

  console.log(`Fetching data for ${ticker}`);
  
  // Fetch income statements, balance sheets, cash flows, and profile
  const [incomeRes, balanceRes, cashFlowRes, profileRes, metricsRes] = await Promise.all([
    fetch(`https://financialmodelingprep.com/api/v3/income-statement/${ticker}?period=annual&limit=10&apikey=${FMP_API_KEY}`),
    fetch(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${ticker}?period=annual&limit=10&apikey=${FMP_API_KEY}`),
    fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}?period=annual&limit=10&apikey=${FMP_API_KEY}`),
    fetch(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FMP_API_KEY}`),
    fetch(`https://financialmodelingprep.com/api/v3/key-metrics-ttm/${ticker}?apikey=${FMP_API_KEY}`)
  ]);

  if (!incomeRes.ok || !balanceRes.ok || !cashFlowRes.ok || !profileRes.ok) {
    throw new Error('Failed to fetch financial data');
  }

  const income = await incomeRes.json();
  const balance = await balanceRes.json();
  const cashFlow = await cashFlowRes.json();
  const profile = await profileRes.json();
  const metrics = metricsRes.ok ? await metricsRes.json() : null;

  return { income, balance, cashFlow, profile: profile[0], metrics: metrics?.[0] };
}

// Calculate WACC with improved debt handling
async function calculateWACC(ticker: string, data: any): Promise<number> {
  const profile = data.profile;
  const balance = data.balance;
  const income = data.income;
  
  // Market cap (E)
  const marketCap = profile.mktCap || 0;
  
  // Average debt from last 4 quarters (including lease liabilities)
  const recentBalances = balance.slice(0, 4);
  const avgDebt = recentBalances.reduce((sum: number, b: any) => {
    const shortTermDebt = b.shortTermDebt || 0;
    const longTermDebt = b.longTermDebt || 0;
    const operatingLeases = b.operatingLeaseNonCurrent || 0; // Include lease liabilities
    const totalDebt = shortTermDebt + longTermDebt + operatingLeases;
    return sum + totalDebt;
  }, 0) / Math.max(1, recentBalances.length);
  
  const D = Math.max(0, avgDebt);
  const E = Math.max(1, marketCap);
  const V = E + D;
  
  // Risk-free rate (assume 4% for 10-year US Treasury)
  const rf = 0.04;
  
  // Beta (from profile, clamped between 0.5 and 2.5)
  const rawBeta = profile.beta || 1.0;
  const beta = clamp(rawBeta, 0.5, 2.5);
  
  // Market risk premium (6% default)
  const mrp = 0.06;
  
  // Cost of equity (Re = rf + beta * mrp)
  const Re = rf + beta * mrp;
  
  // Cost of debt (Rd = Interest / Average Debt)
  const recentIncome = income.slice(0, 4);
  const avgInterestExpense = recentIncome.reduce((sum: number, i: any) => {
    return sum + Math.abs(i.interestExpense || 0);
  }, 0) / Math.max(1, recentIncome.length);
  
  // Handle negative or zero interest
  const Rd = (D > 0 && avgInterestExpense > 0) ? avgInterestExpense / D : 0;
  
  // Tax rate (smoothed over last 4 years)
  const taxRates = recentIncome
    .filter((i: any) => i.incomeTaxExpense && i.incomeBeforeTax && i.incomeBeforeTax > 0)
    .map((i: any) => i.incomeTaxExpense / i.incomeBeforeTax);
  
  const taxRate = taxRates.length > 0
    ? clamp(taxRates.reduce((a: number, b: number) => a + b, 0) / taxRates.length, 0, 0.5)
    : 0.21;
  
  // WACC = (E/V)*Re + (D/V)*Rd*(1-Tc)
  const wacc = (E / V) * Re + (D / V) * Rd * (1 - taxRate);
  
  // Clamp WACC between 8% and 12%
  const clampedWacc = clamp(wacc * 100, 8, 12);
  
  console.log(`WACC calculation: E=${E.toFixed(2)}, D=${D.toFixed(2)}, Re=${(Re * 100).toFixed(2)}%, Rd=${(Rd * 100).toFixed(2)}%, Tax=${(taxRate * 100).toFixed(2)}%, WACC=${clampedWacc.toFixed(2)}%`);
  
  return parseFloat(clampedWacc.toFixed(2));
}

// Calculate EPS w/o NRI (quarterly adjusted)
async function calculateEpsWoNri(ticker: string): Promise<number> {
  const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
  if (!FMP_API_KEY) throw new Error('FMP_API_KEY not configured');

  const res = await fetch(`https://financialmodelingprep.com/api/v3/income-statement/${ticker}?period=quarter&limit=40&apikey=${FMP_API_KEY}`);
  if (!res.ok) return 0;
  
  const quarters = await res.json();
  if (!Array.isArray(quarters) || quarters.length < 4) return 0;

  // Calculate EPS w/o NRI for last 4 quarters (TTM)
  let ttmEpsWoNri = 0;
  for (let i = 0; i < 4; i++) {
    const q = quarters[i];
    
    // Get tax rate
    const preTax = q.incomeBeforeTax || 0;
    const tax = q.incomeTaxExpense || 0;
    const taxRate = (preTax > 0 && tax > 0) ? Math.min(Math.max(tax / preTax, 0), 0.5) : 0.21;
    
    // Get NI continuing ops
    const niCont = q.netIncomeFromContinuingOperations || q.netIncome || 0;
    
    // Get unusuals (pretax)
    const unusualPretax = (q.unusualItems || 0) + (q.goodwillImpairment || 0) + (q.impairmentOfGoodwillAndIntangibleAssets || 0);
    const unusualAfterTax = unusualPretax * (1 - taxRate);
    
    // Calculate NI w/o NRI
    const niWoNri = niCont - unusualAfterTax;
    
    // Get diluted shares
    const shares = q.weightedAverageShsOutDil || 0;
    if (shares <= 0) continue;
    
    // Add quarterly EPS w/o NRI
    ttmEpsWoNri += niWoNri / shares;
  }
  
  return ttmEpsWoNri;
}

// Calculate starting value based on mode with smoothing
function calculateStartValue(mode: BasisMode, data: any): number {
  const income = data.income;
  const cashFlow = data.cashFlow;
  const profile = data.profile;
  const metrics = data.metrics;
  
  const sharesOutstanding = profile.sharesOutstanding || 1;
  
  if (mode === 'EPS_WO_NRI') {
    // This will be calculated separately using quarterly data
    return 0; // Placeholder, will be replaced in main function
  }
  
  if (mode === 'FCF_PER_SHARE') {
    // Free Cash Flow per share with robust handling
    const recentCashFlows = cashFlow.slice(0, 5);
    const fcfPerShareValues = recentCashFlows
      .map((cf: any) => (cf.freeCashFlow || 0) / sharesOutstanding);
    
    // Filter positive values
    const positiveFcf = fcfPerShareValues.filter((v: number) => v > 0);
    
    // Use trimmed mean for smoothing if we have enough data
    if (positiveFcf.length >= 3) {
      return trimmedMean(positiveFcf, 0.2);
    }
    
    // If TTM is negative but median is positive, use median
    const allFcf = fcfPerShareValues.filter((v: number) => !isNaN(v));
    if (allFcf.length >= 3) {
      const medianFcf = median(allFcf);
      if (medianFcf > 0) {
        return medianFcf;
      }
    }
    
    // Last resort: use TTM if positive
    const ttmFcfPerShare = fcfPerShareValues[0] || 0;
    return Math.max(0, ttmFcfPerShare);
  }
  
  if (mode === 'ADJUSTED_DIVIDEND') {
    // Dividend + Net Buyback per share - smoothed over 3 years
    const dividendPerShare = metrics?.dividendPerShareTTM || 0;
    
    // Calculate net buyback smoothed over 3 years
    const recentCashFlows = cashFlow.slice(0, 3);
    const buybackPerShareValues = recentCashFlows.map((cf: any) => {
      const stockRepurchased = Math.abs(cf.commonStockRepurchased || 0);
      const stockIssued = cf.commonStockIssued || 0;
      const netBuyback = stockRepurchased - stockIssued;
      return netBuyback / sharesOutstanding;
    });
    
    const avgBuybackPerShare = buybackPerShareValues.length > 0
      ? buybackPerShareValues.reduce((a: number, b: number) => a + b, 0) / buybackPerShareValues.length
      : 0;
    
    return Math.max(0, dividendPerShare + avgBuybackPerShare);
  }
  
  return 0;
}

// Calculate historical growth rate (10Y CAGR preferred, fallback to 5Y, then 3Y)
function calculateGrowthRate(mode: BasisMode, data: any): number {
  const income = data.income;
  const cashFlow = data.cashFlow;
  
  if (mode === 'EPS_WO_NRI') {
    // Get EPS values for up to 11 years (10Y CAGR needs 11 data points)
    const epsValues = income.slice(0, 11)
      .map((i: any) => i.eps || i.epsdiluted || 0)
      .filter((v: number) => v > 0);
    
    // Try 10Y CAGR first
    if (epsValues.length >= 11) {
      const startEps = epsValues[10];
      const endEps = epsValues[0];
      const cagr = (Math.pow(endEps / startEps, 1 / 10) - 1) * 100;
      console.log(`Using 10Y EPS CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // Fallback to 5Y CAGR
    if (epsValues.length >= 6) {
      const startEps = epsValues[5];
      const endEps = epsValues[0];
      const cagr = (Math.pow(endEps / startEps, 1 / 5) - 1) * 100;
      console.log(`Using 5Y EPS CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // Fallback to 3Y CAGR
    if (epsValues.length >= 4) {
      const startEps = epsValues[3];
      const endEps = epsValues[0];
      const cagr = (Math.pow(endEps / startEps, 1 / 3) - 1) * 100;
      console.log(`Using 3Y EPS CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // If not enough data, return conservative default
    console.log('Not enough EPS data for CAGR, using 5% default');
    return 5;
  }
  
  if (mode === 'FCF_PER_SHARE') {
    const profile = data.profile;
    const sharesOutstanding = profile.sharesOutstanding || 1;
    const fcfValues = cashFlow.slice(0, 11)
      .map((cf: any) => (cf.freeCashFlow || 0) / sharesOutstanding)
      .filter((v: number) => v > 0);
    
    // Try 10Y CAGR first
    if (fcfValues.length >= 11) {
      const startFcf = fcfValues[10];
      const endFcf = fcfValues[0];
      const cagr = (Math.pow(endFcf / startFcf, 1 / 10) - 1) * 100;
      console.log(`Using 10Y FCF CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // Fallback to 5Y CAGR
    if (fcfValues.length >= 6) {
      const startFcf = fcfValues[5];
      const endFcf = fcfValues[0];
      const cagr = (Math.pow(endFcf / startFcf, 1 / 5) - 1) * 100;
      console.log(`Using 5Y FCF CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // Fallback to 3Y CAGR
    if (fcfValues.length >= 4) {
      const startFcf = fcfValues[3];
      const endFcf = fcfValues[0];
      const cagr = (Math.pow(endFcf / startFcf, 1 / 3) - 1) * 100;
      console.log(`Using 3Y FCF CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // If not enough data, return conservative default
    console.log('Not enough FCF data for CAGR, using 4% default');
    return 4;
  }
  
  if (mode === 'ADJUSTED_DIVIDEND') {
    // Calculate historical dividend growth using same approach
    const metrics = data.metrics;
    const currentDivPerShare = metrics?.dividendPerShareTTM || 0;
    
    // Get historical dividends from income statements
    const divValues = income.slice(0, 11)
      .map((i: any) => {
        const shares = data.profile.sharesOutstanding || 1;
        return (i.dividendsPaid ? Math.abs(i.dividendsPaid) / shares : 0);
      })
      .filter((v: number) => v > 0);
    
    // Try 10Y CAGR first
    if (divValues.length >= 11 && currentDivPerShare > 0) {
      const startDiv = divValues[10];
      const endDiv = currentDivPerShare;
      const cagr = (Math.pow(endDiv / startDiv, 1 / 10) - 1) * 100;
      console.log(`Using 10Y Dividend CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // Fallback to 5Y CAGR
    if (divValues.length >= 6 && currentDivPerShare > 0) {
      const startDiv = divValues[5];
      const endDiv = currentDivPerShare;
      const cagr = (Math.pow(endDiv / startDiv, 1 / 5) - 1) * 100;
      console.log(`Using 5Y Dividend CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // Fallback to 3Y CAGR
    if (divValues.length >= 4 && currentDivPerShare > 0) {
      const startDiv = divValues[3];
      const endDiv = currentDivPerShare;
      const cagr = (Math.pow(endDiv / startDiv, 1 / 3) - 1) * 100;
      console.log(`Using 3Y Dividend CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // If not enough data, return conservative default
    console.log('Not enough Dividend data for CAGR, using 5% default');
    return 5;
  }
  
  // Default conservative growth rate
  return 6;
}

// Calculate finite horizon valuation (20 years, 2 phases)
function calculateFiniteHorizonValuation(
  startValue: number,
  wacc: number,
  growthRate: number,
  terminalRate: number,
  growthYears: number,
  terminalYears: number,
  tangibleBook: number,
  includeTBV: boolean
): { fairValue: number; pvPhase1: number; pvPhase2: number; tbvAdded: number } {
  const r = wacc / 100;
  const g1 = growthRate / 100;
  const g2 = terminalRate / 100;
  
  let mt = startValue;
  let pvPhase1 = 0;
  
  // Phase 1: Growth years
  for (let t = 1; t <= growthYears; t++) {
    mt *= (1 + g1);
    pvPhase1 += mt / Math.pow(1 + r, t);
  }
  
  // Phase 2: Terminal years
  let pvPhase2 = 0;
  for (let t = 1; t <= terminalYears; t++) {
    mt *= (1 + g2);
    pvPhase2 += mt / Math.pow(1 + r, growthYears + t);
  }
  
  let fairValue = pvPhase1 + pvPhase2;
  const tbvAdded = (includeTBV && tangibleBook > 0) ? tangibleBook : 0;
  fairValue += tbvAdded;
  
  return {
    fairValue: parseFloat(fairValue.toFixed(2)),
    pvPhase1: parseFloat(pvPhase1.toFixed(2)),
    pvPhase2: parseFloat(pvPhase2.toFixed(2)),
    tbvAdded: parseFloat(tbvAdded.toFixed(2))
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const ticker = url.searchParams.get('ticker');
    const mode = (url.searchParams.get('mode') || 'EPS_WO_NRI') as BasisMode;
    const priceStr = url.searchParams.get('price');
    
    if (!ticker) {
      return new Response(
        JSON.stringify({ error: 'Missing ticker parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Valuation request: ticker=${ticker}, mode=${mode}`);
    
    // Fetch financial data
    const data = await fetchFinancialData(ticker);
    
    // Calculate WACC
    const wacc = await calculateWACC(ticker, data);
    console.log(`Calculated WACC: ${wacc.toFixed(2)}%`);
    
    // Calculate start value based on mode
    let startValue = calculateStartValue(mode, data);
    
    // For EPS_WO_NRI, use quarterly calculation
    if (mode === 'EPS_WO_NRI') {
      startValue = await calculateEpsWoNri(ticker);
      console.log(`EPS w/o NRI (TTM): ${startValue.toFixed(2)}`);
    }
    
    console.log(`Start value for mode ${mode}: ${startValue.toFixed(2)}`);
    
    // Warnings array for data quality issues
    const warnings: string[] = [];
    
    if (startValue <= 0) {
      warnings.push(`Keine ausreichenden Daten für Modus ${mode}. Berechnung mit konservativen Annahmen.`);
      // Don't throw error, continue with warning
    }
    
    // Use a minimum start value if needed
    const effectiveStartValue = Math.max(startValue, 0.01);
    
    // Calculate growth rate
    let growthRate = calculateGrowthRate(mode, data);
    console.log(`Calculated historical growth rate: ${growthRate.toFixed(2)}%`);
    
    // For EPS w/o NRI: Clamp g1 between 5% and 20%
    if (mode === 'EPS_WO_NRI') {
      if (growthRate > 20) {
        console.log(`Growth rate ${growthRate.toFixed(2)}% exceeds 20%, clamping to 20%`);
        growthRate = 20;
      } else if (growthRate < 5) {
        console.log(`Growth rate ${growthRate.toFixed(2)}% below 5%, clamping to 5%`);
        growthRate = 5;
      }
    }
    
    if (growthRate < 1) {
      warnings.push('Historisches Wachstum sehr niedrig. Ergebnis ist sehr konservativ.');
    }
    
    // Settings with conservative defaults
    // g2 (terminal rate): Default to 4% (inflation rate), must be smaller than discount rate
    const terminalRate = 4.0; // Fixed at 4% for terminal stage
    const growthYears = 10;
    const terminalYears = 10;
    const tangibleBook = data.metrics?.tangibleBookValuePerShareTTM || 0;
    const includeTBV = false; // Default to false
    
    // Calculate valuation
    const result = calculateFiniteHorizonValuation(
      effectiveStartValue,
      wacc,
      growthRate,
      terminalRate,
      growthYears,
      terminalYears,
      tangibleBook,
      includeTBV
    );
    
    // Current price
    const currentPrice = priceStr ? parseFloat(priceStr) : data.profile.price;
    
    // Margin of safety (MoS = (Fair Value - Price) / Fair Value × 100%)
    const marginOfSafety = ((result.fairValue - currentPrice) / result.fairValue) * 100;
    
    const response: ValuationResponse = {
      ticker: ticker.toUpperCase(),
      price: currentPrice,
      mode,
      fairValuePerShare: parseFloat(result.fairValue.toFixed(2)),
      marginOfSafetyPct: parseFloat(marginOfSafety.toFixed(2)),
      assumptions: {
        discountRatePct: parseFloat(wacc.toFixed(2)),
        growthYears,
        growthRatePct: parseFloat(growthRate.toFixed(2)),
        terminalYears,
        terminalRatePct: parseFloat(terminalRate.toFixed(2)),
        tangibleBookPerShare: parseFloat(tangibleBook.toFixed(2)),
        includeTangibleBook: includeTBV,
        predictability: 'medium'
      },
      components: {
        startValuePerShare: parseFloat(effectiveStartValue.toFixed(2)),
        pvPhase1: result.pvPhase1,
        pvPhase2: result.pvPhase2,
        tangibleBookAdded: result.tbvAdded
      },
      asOf: new Date().toISOString().split('T')[0]
    };
    
    // Add warnings to response if any
    if (warnings.length > 0) {
      (response as any).warnings = warnings;
    }
    
    console.log(`Valuation result:`, response);
    
    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Valuation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
