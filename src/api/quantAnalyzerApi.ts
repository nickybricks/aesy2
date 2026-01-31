import axios from 'axios';
import { DEFAULT_FMP_API_KEY } from '@/components/ApiKeyInput';
import { calculateEpsWithoutNri } from '@/services/EpsWithoutNriService';

const BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Helper function for API requests
const fetchFromFMP = async (endpoint: string, params = {}) => {
  try {
    // Always use the hardcoded API key
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      params: {
        apikey: DEFAULT_FMP_API_KEY,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw new Error(`Fehler beim Abrufen von Daten. Bitte versuchen Sie es später erneut.`);
  }
};

// Available exchanges and indices
export const marketOptions = [
  // Börsen
  { id: 'XETRA', name: 'XETRA (Deutschland)', currency: 'EUR', type: 'exchange' },
  { id: 'NYSE', name: 'NYSE (New York)', currency: 'USD', type: 'exchange' },
  { id: 'NASDAQ', name: 'NASDAQ', currency: 'USD', type: 'exchange' },
  { id: 'LSE', name: 'LSE (London)', currency: 'GBP', type: 'exchange' },
  { id: 'EURONEXT', name: 'EURONEXT', currency: 'EUR', type: 'exchange' },
  { id: 'TSX', name: 'TSX (Toronto)', currency: 'CAD', type: 'exchange' },
  { id: 'HKSE', name: 'HKSE (Hong Kong)', currency: 'HKD', type: 'exchange' },
  
  // Major Indices
  { id: 'SP500', name: 'S&P 500', currency: 'USD', type: 'index' },
  { id: 'DOW', name: 'Dow Jones', currency: 'USD', type: 'index' },
  { id: 'NASDAQ100', name: 'NASDAQ 100', currency: 'USD', type: 'index' },
  { id: 'DAX', name: 'DAX (Deutschland)', currency: 'EUR', type: 'index' },
  { id: 'FTSE100', name: 'FTSE 100', currency: 'GBP', type: 'index' },
  { id: 'NIKKEI', name: 'Nikkei 225', currency: 'JPY', type: 'index' }
];

// Backwards compatibility
export const exchanges = marketOptions.filter(option => option.type === 'exchange');

// Get tickers for an exchange or index
export const getStocksByMarket = async (marketId: string) => {
  const marketOption = marketOptions.find(option => option.id === marketId);
  
  if (!marketOption) {
    throw new Error(`Unknown market: ${marketId}`);
  }
  
  if (marketOption.type === 'exchange') {
    // Existing exchange logic
    const stocks = await fetchFromFMP('/stock/list');
    
    // XETRA includes XETRA (.DE), FRA and FSX (.F) - all are German exchanges
    const exchangesToInclude = marketId === 'XETRA' 
      ? ['XETRA', 'FRA', 'FSX'] 
      : [marketId];
    
    return stocks.filter((stock: any) => 
      exchangesToInclude.includes(stock.exchangeShortName) && 
      stock.type === 'stock' && 
      !stock.isEtf && 
      !stock.isActivelyTrading !== false
    );
  } else if (marketOption.type === 'index') {
    // Index constituent logic
    return await getIndexConstituents(marketId);
  }
  
  return [];
};

// Get index constituents
const getIndexConstituents = async (indexId: string) => {
  try {
    let endpoint = '';
    
    switch (indexId) {
      case 'SP500':
        endpoint = '/sp500_constituent';
        break;
      case 'DOW':
        endpoint = '/dowjones_constituent';  
        break;
      case 'NASDAQ100':
        endpoint = '/nasdaq_constituent';
        break;
      case 'DAX':
        // DAX constituents via custom logic or fallback to German exchanges
        const germanStocks = await fetchFromFMP('/stock/list');
        return germanStocks.filter((stock: any) => 
          stock.exchangeShortName === 'XETRA' && 
          stock.type === 'stock' && 
          !stock.isEtf
        ).slice(0, 40); // Approximate DAX size
      case 'FTSE100':
        const ukStocks = await fetchFromFMP('/stock/list');
        return ukStocks.filter((stock: any) => 
          stock.exchangeShortName === 'LSE' && 
          stock.type === 'stock' && 
          !stock.isEtf
        ).slice(0, 100);
      case 'NIKKEI':
        // Fallback for Nikkei - would need more sophisticated mapping
        return [];
      default:
        return [];
    }
    
    if (endpoint) {
      const constituents = await fetchFromFMP(endpoint);
      return constituents.map((constituent: any) => ({
        symbol: constituent.symbol,
        name: constituent.name || constituent.companyName,
        exchangeShortName: constituent.exchange || 'NYSE', // Default fallback
        type: 'stock'
      }));
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching index constituents for ${indexId}:`, error);
    return [];
  }
};

// Backwards compatibility
export const getStocksByExchange = getStocksByMarket;

// Function types for Quantitative Analysis
export interface QuantAnalysisResult {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  country: string;
  buffettScore: number; // Max 14 points
  criteria: {
    yearsOfProfitability: { 
      value: number | null; // Years profitable of 10
      pass: boolean;
      profitableYearsLast3: number | null;
    },
    pe: { 
      value: number | null; 
      pass: boolean;
      revenueCagr5y?: number | null;
      fcfMarginTrend?: 'steigend' | 'fallend' | 'stabil' | null;
      roicTrend?: 'steigend' | 'fallend' | 'stabil' | null;
      netDebtToEbitda?: number | null;
    },
    roic: { value: number | null; pass: boolean },
    roe: { value: number | null; pass: boolean },
    dividendYield: { value: number | null; pass: boolean },
    epsGrowth: { 
      value: number | null; // 5-Y CAGR
      pass: boolean;
      median3y?: number | null;
      cagr3y?: number | null; // 3-Y CAGR
      cagr10y?: number | null; // 10-Y CAGR
    },
    revenueGrowth: { 
      value: number | null; // 5-Y CAGR
      pass: boolean;
      cagr3y?: number | null; // 3-Y CAGR
      cagr10y?: number | null; // 10-Y CAGR
    },
    netDebtToEbitda: { value: number | null; pass: boolean },
    netMargin: { value: number | null; pass: boolean },
    fcfMargin: { value: number | null; pass: boolean }
  };
  price: number;
  currency: string;
  intrinsicValue?: number | null; // Display only, not evaluated
  marginOfSafety?: number | null;
  bookValuePerShare?: number | null;
  originalValues?: {
    roe?: number | null;
    roic?: number | null;
    netMargin?: number | null;
    price?: number | null;
    intrinsicValue?: number | null;
  };
}

// Safe value extractor
const safeValue = (value: any) => {
  if (value === undefined || value === null) return null;
  const numValue = Number(value);
  return isNaN(numValue) ? null : numValue;
};

// Helper: Format CAGR for logging (prevents "undefined" in logs)
const formatCAGR = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(2)}%`;
};

// Calculate simplified intrinsic value using multiple methods
const calculateSimplifiedIntrinsicValue = (
  eps: number | null,
  bookValue: number | null,
  pe: number | null,
  revenue: number | null,
  netMargin: number | null,
  sharesOutstanding: number | null
): number | null => {
  console.log('Calculating intrinsic value with:', { eps, bookValue, pe, revenue, netMargin, sharesOutstanding });
  
  const results: number[] = [];
  
  // Method 1: Graham Number (conservative)
  if (eps !== null && eps > 0 && bookValue !== null && bookValue > 0) {
    const grahamNumber = Math.sqrt(22.5 * eps * bookValue);
    if (!isNaN(grahamNumber) && grahamNumber > 0) {
      results.push(grahamNumber);
      console.log(`Graham Number: ${grahamNumber}`);
    }
  }
  
  // Method 2: Simple P/E based valuation (using conservative P/E of 12-15)
  if (eps !== null && eps > 0) {
    const conservativePE = 12; // Buffett's preferred range
    const peBasedValue = eps * conservativePE;
    if (!isNaN(peBasedValue) && peBasedValue > 0) {
      results.push(peBasedValue);
      console.log(`P/E based value (12x): ${peBasedValue}`);
    }
  }
  
  // Method 3: Revenue-based valuation (for growth companies)
  if (revenue !== null && revenue > 0 && netMargin !== null && netMargin > 0 && sharesOutstanding !== null && sharesOutstanding > 0) {
    const estimatedEarnings = (revenue * (netMargin / 100)) / sharesOutstanding;
    const revenueBasedValue = estimatedEarnings * 10; // Conservative 10x multiple
    if (!isNaN(revenueBasedValue) && revenueBasedValue > 0) {
      results.push(revenueBasedValue);
      console.log(`Revenue based value: ${revenueBasedValue}`);
    }
  }
  
  if (results.length === 0) {
    console.log('No valid intrinsic value calculation possible');
    return null;
  }
  
  // Use median of available methods for robustness
  results.sort((a, b) => a - b);
  const median = results.length % 2 === 0 
    ? (results[results.length / 2 - 1] + results[results.length / 2]) / 2
    : results[Math.floor(results.length / 2)];
  
  console.log(`Intrinsic value methods used: ${results.length}, median: ${median}`);
  return parseFloat(median.toFixed(2));
};

// Sleep function for delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Calculate Years of Profitability
const calculateYearsOfProfitability = (
  incomeStatements: any[]
): { total: number; last3Years: number } | null => {
  if (!incomeStatements || incomeStatements.length < 3) return null;
  
  const statements = incomeStatements.slice(0, 10); // Up to 10 years
  let profitableYears = 0;
  let profitableLast3 = 0;
  
  statements.forEach((statement, index) => {
    const netIncome = safeValue(statement.netIncome);
    if (netIncome !== null && netIncome > 0) {
      profitableYears++;
      if (index < 3) profitableLast3++;
    }
  });
  
  return {
    total: profitableYears,
    last3Years: profitableLast3
  };
};

// Helper: Calculate CAGR for specific periods
const calculateCAGR = (values: (number | null)[], years: number): number | null => {
  if (!values || values.length < years + 1) return null;
  const startValue = values[years]; // n years ago
  const endValue = values[0]; // Current
  if (startValue === null || endValue === null) return null;
  if (startValue <= 0 || endValue <= 0) return null;
  const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
  return isFinite(cagr) ? cagr : null;
};

// Helper: Calculate 3-Year CAGR
const calculate3YearCAGR = (values: number[]): number | null => {
  return calculateCAGR(values, 3);
};

// Helper: Calculate 5-Year CAGR
const calculate5YearCAGR = (values: number[]): number | null => {
  return calculateCAGR(values, 5);
};

// Helper: Calculate 10-Year CAGR
const calculate10YearCAGR = (values: number[]): number | null => {
  return calculateCAGR(values, 10);
};

// Helper: Calculate 3-Year Median
const calculate3YearMedian = (values: number[]): number | null => {
  if (values.length < 3) return null;
  
  const threeYears = [...values.slice(0, 3)].sort((a, b) => a - b);
  return threeYears[1]; // Middle value
};

// Helper: Calculate Trend (for FCF Margin & ROIC)
const calculateTrend = (values: number[]): 'steigend' | 'fallend' | 'stabil' | null => {
  if (values.length < 3) return null;
  
  const current = values[0];
  const previousAvg = values.slice(1, 3).reduce((sum, v) => sum + v, 0) / Math.min(2, values.length - 1);
  
  if (previousAvg === 0) return null;
  const change = ((current - previousAvg) / Math.abs(previousAvg)) * 100;
  
  if (change > 5) return 'steigend';
  if (change < -5) return 'fallend';
  return 'stabil';
};

// Helper: Calculate FCF Margin
const calculateFCFMargin = (fcf: number | null, revenue: number | null): number | null => {
  if (revenue === null || revenue === 0 || fcf === null) return null;
  return (fcf / revenue) * 100;
};

// Helper: Calculate Net Debt to EBITDA
const calculateNetDebtToEbitda = (
  totalDebt: number | null,
  cash: number | null,
  ebitda: number | null
): number | null => {
  if (ebitda === null || ebitda === 0) return null;
  
  const netDebt = (totalDebt || 0) - (cash || 0);
  return netDebt / ebitda;
};

// Analyze a single ticker by Buffett criteria (NEW 9-CRITERIA VERSION)
export const analyzeStockByBuffettCriteria = async (ticker: string): Promise<QuantAnalysisResult | null> => {
  try {
    // Fetch all necessary data in parallel
    const [
      ratiosTTM, 
      ratiosHistorical,
      profile, 
      incomeStatements, 
      balanceSheets,
      keyMetrics,
      keyMetricsHistorical,
      cashFlowStatements,
      quote
    ] = await Promise.all([
      fetchFromFMP(`/ratios-ttm/${ticker}`),
      fetchFromFMP(`/ratios/${ticker}?limit=3`),
      fetchFromFMP(`/profile/${ticker}`),
      fetchFromFMP(`/income-statement/${ticker}?limit=15`), // 15 years to ensure 10-year CAGR
      fetchFromFMP(`/balance-sheet-statement/${ticker}?limit=5`),
      fetchFromFMP(`/key-metrics-ttm/${ticker}`),
      fetchFromFMP(`/key-metrics/${ticker}?limit=5`), // For ROIC trend
      fetchFromFMP(`/cash-flow-statement/${ticker}?limit=5`), // For FCF
      fetchFromFMP(`/quote/${ticker}`)
    ]);

    // Check if we have enough data
    if (!ratiosTTM || ratiosTTM.length === 0 || !profile || profile.length === 0) {
      console.warn(`Not enough data for ${ticker}`);
      return null;
    }

    const companyProfile = profile[0];
    const ratios = ratiosTTM[0];
    const metrics = keyMetrics && keyMetrics.length > 0 ? keyMetrics[0] : null;
    const quoteData = quote && quote.length > 0 ? quote[0] : null;
    
    // Extract currency info
    const stockCurrency = companyProfile.currency || 'USD';
    console.log(`Analyzing ${ticker} with currency: ${stockCurrency}`);
    
    // Store original values
    const currentPrice = quoteData ? quoteData.price : 0;
    const originalValues = {
      roe: safeValue(ratios.returnOnEquityTTM) * 100,
      roic: metrics ? safeValue(metrics.roicTTM) * 100 : null,
      netMargin: safeValue(ratios.netProfitMarginTTM) * 100,
      price: currentPrice
    };

    // ===== NEW 9 CRITERIA =====
    
    // 1. Years of Profitability ≥ 8/10 (or ≥ 6/10 + no losses in last 3Y)
    const profitabilityYears = calculateYearsOfProfitability(incomeStatements);
    const profitYearsPass = profitabilityYears 
      ? (profitabilityYears.total >= 8) || 
        (profitabilityYears.total >= 6 && profitabilityYears.last3Years === 3)
      : false;

    // 2. KGV < 20 (or > 20 with growth conditions)
    // Use TTM P/E from quote data (most current), fallback to ratios
    const pe = quoteData && safeValue(quoteData.pe) !== null 
      ? safeValue(quoteData.pe) 
      : safeValue(ratios.priceEarningsRatioTTM);
    let pePass = pe !== null && pe > 0 && pe < 20; // Base rule
    
    let revenueCagr5y: number | null = null;
    let fcfMarginTrend: 'steigend' | 'fallend' | 'stabil' | null = null;
    let roicTrend: 'steigend' | 'fallend' | 'stabil' | null = null;
    let netDebtToEbitdaForPE: number | null = null;
    
    // Alternative for Growth: P/E > 20 allowed if all 4 conditions met
    if (pe !== null && pe >= 20) {
      // Revenue 5-Y CAGR
      const revenueValues = incomeStatements.slice(0, 6)
        .map(s => safeValue(s.revenue));
      revenueCagr5y = calculate5YearCAGR(revenueValues);
      
      // FCF Margin Trend
      const fcfMargins: number[] = [];
      for (let i = 0; i < Math.min(3, cashFlowStatements.length); i++) {
        const fcf = safeValue(cashFlowStatements[i].freeCashFlow);
        const revenue = incomeStatements[i] ? safeValue(incomeStatements[i].revenue) : null;
        const margin = calculateFCFMargin(fcf, revenue);
        if (margin !== null) fcfMargins.push(margin);
      }
      fcfMarginTrend = calculateTrend(fcfMargins);
      
      // ROIC Trend
      const roicValues = keyMetricsHistorical
        .slice(0, 3)
        .map(m => safeValue(m.roic) * 100)
        .filter(v => v !== null) as number[];
      roicTrend = calculateTrend(roicValues);
      
      // NetDebt/EBITDA
      netDebtToEbitdaForPE = calculateNetDebtToEbitda(
        balanceSheets[0] ? safeValue(balanceSheets[0].totalDebt) : null,
        balanceSheets[0] ? safeValue(balanceSheets[0].cashAndCashEquivalents) : null,
        incomeStatements[0] ? safeValue(incomeStatements[0].ebitda) : null
      );
      
      // All 4 conditions must be met
      pePass = (revenueCagr5y !== null && revenueCagr5y >= 15) && 
               fcfMarginTrend === 'steigend' && 
               roicTrend === 'steigend' && 
               netDebtToEbitdaForPE !== null && netDebtToEbitdaForPE <= 1;
    }

    // 3. ROIC ≥ 12%
    const roic = metrics ? safeValue(metrics.roicTTM) * 100 : null;
    const roicPass = roic !== null && roic >= 12;

    // 4. ROE ≥ 15%
    const roe = safeValue(ratios.returnOnEquityTTM) * 100;
    const roePass = roe !== null && roe >= 15;

    // 5. Dividend Yield > 2%
    let dividendYield = safeValue(ratios.dividendYieldTTM) * 100;
    if (dividendYield === 0 && ratiosHistorical && ratiosHistorical.length > 1) {
      const previousDividendYield = safeValue(ratiosHistorical[1].dividendYield) * 100;
      if (previousDividendYield > 0) {
        dividendYield = previousDividendYield;
      }
    }
    const dividendYieldPass = dividendYield !== null && dividendYield > 2;

    // 6. Stable EPS Growth (5-Y CAGR ≥ 5% + no negative 3-Y median)
    // Use EPS w/o NRI from quarterly data (more robust than annual GAAP EPS)
    let epsCagr3y: number | null = null;
    let epsCagr5y: number | null = null;
    let epsCagr10y: number | null = null;
    let eps3yMedian: number | null = null;
    
    try {
      const epsWoNriResult = await calculateEpsWithoutNri(ticker, currentPrice);
      epsCagr3y = epsWoNriResult.growth.cagr3y !== null ? epsWoNriResult.growth.cagr3y * 100 : null;
      epsCagr5y = epsWoNriResult.growth.cagr5y !== null ? epsWoNriResult.growth.cagr5y * 100 : null;
      epsCagr10y = epsWoNriResult.growth.cagr10y !== null ? epsWoNriResult.growth.cagr10y * 100 : null;
      
      // Calculate 3Y median from annual data
      if (epsWoNriResult.annual.length >= 3) {
        const last3Annual = epsWoNriResult.annual.slice(-3);
        const validEps = last3Annual
          .map(a => a.epsWoNri)
          .filter((v): v is number => v !== null && isFinite(v))
          .sort((a, b) => a - b);
        eps3yMedian = validEps.length >= 2 ? validEps[Math.floor(validEps.length / 2)] : null;
      }
      
      console.log(`${ticker} EPS w/o NRI - 3Y: ${formatCAGR(epsCagr3y)}, 5Y: ${formatCAGR(epsCagr5y)}, 10Y: ${formatCAGR(epsCagr10y)}, 3Y Median: ${eps3yMedian?.toFixed(2) || 'N/A'}`);
    } catch (error) {
      console.warn(`${ticker} EPS w/o NRI calculation failed, falling back to null:`, error);
      // All values remain null
    }
    
    const epsGrowthPass = epsCagr5y !== null && epsCagr5y >= 5 && 
                          eps3yMedian !== null && eps3yMedian >= 0;

    // 7. Stable Revenue Growth (5-Y CAGR ≥ 5%)
    const revenueValues5y = incomeStatements.slice(0, 6)
      .map(s => safeValue(s.revenue));
    const revenueGrowthCagr = calculate5YearCAGR(revenueValues5y);
    
    const revenueValues3y = incomeStatements.slice(0, 4)
      .map(s => safeValue(s.revenue));
    const revenueCagr3y = calculate3YearCAGR(revenueValues3y);
    
    const revenueValues10y = incomeStatements.slice(0, 11)
      .map(s => safeValue(s.revenue));
    const revenueCagr10y = calculate10YearCAGR(revenueValues10y);
    
    console.log(`${ticker} Revenue - 3Y: ${formatCAGR(revenueCagr3y)}, 5Y: ${formatCAGR(revenueGrowthCagr)}, 10Y: ${formatCAGR(revenueCagr10y)}`);
    
    const revenueGrowthPass = revenueGrowthCagr !== null && revenueGrowthCagr >= 5;

    // 8. NetDebt / EBITDA < 2.5
    const netDebtToEbitda = calculateNetDebtToEbitda(
      balanceSheets[0] ? safeValue(balanceSheets[0].totalDebt) : null,
      balanceSheets[0] ? safeValue(balanceSheets[0].cashAndCashEquivalents) : null,
      incomeStatements[0] ? safeValue(incomeStatements[0].ebitda) : null
    );
    const netDebtToEbitdaPass = netDebtToEbitda !== null && netDebtToEbitda < 2.5;

    // 9. Net Margin ≥ 10%
    const netMargin = safeValue(ratios.netProfitMarginTTM) * 100;
    const netMarginPass = netMargin !== null && netMargin >= 10;

    // 10. FCF Margin ≥ 8%
    const latestFcf = cashFlowStatements && cashFlowStatements.length > 0 ? safeValue(cashFlowStatements[0].freeCashFlow) : null;
    const latestRevenue = incomeStatements && incomeStatements.length > 0 ? safeValue(incomeStatements[0].revenue) : null;
    const fcfMargin = calculateFCFMargin(latestFcf, latestRevenue);
    const fcfMarginPass = fcfMargin !== null && fcfMargin >= 8;

    // Calculate Intrinsic Value (display only, NOT evaluated)
    const currentEps = incomeStatements && incomeStatements.length > 0 ? safeValue(incomeStatements[0].eps) : null;
    const bookValuePerShare = balanceSheets && balanceSheets.length > 0 ? 
      safeValue(balanceSheets[0].totalStockholdersEquity) / safeValue(companyProfile.mktCap / currentPrice) : null;
    const currentRevenue = incomeStatements && incomeStatements.length > 0 ? safeValue(incomeStatements[0].revenue) : null;
    const sharesOutstanding = safeValue(companyProfile.mktCap / currentPrice);

    const intrinsicValueCalc = calculateSimplifiedIntrinsicValue(
      currentEps,
      bookValuePerShare, 
      pe,
      currentRevenue,
      netMargin,
      sharesOutstanding
    );

    let marginOfSafety = null;
    if (intrinsicValueCalc !== null && currentPrice > 0) {
      marginOfSafety = ((intrinsicValueCalc - currentPrice) / currentPrice) * 100;
    }

    // Store intrinsic value
    const updatedOriginalValues = {
      ...originalValues,
      intrinsicValue: intrinsicValueCalc
    };

    // Calculate Buffett Score (max 14 points - all displayed columns count)
    const epsGrowth3yPass = epsCagr3y !== null && epsCagr3y >= 5;
    const epsGrowth10yPass = epsCagr10y !== null && epsCagr10y >= 5;
    const revenueGrowth3yPass = revenueCagr3y !== null && revenueCagr3y >= 5;
    const revenueGrowth10yPass = revenueCagr10y !== null && revenueCagr10y >= 5;
    
    const buffettScore = [
      profitYearsPass,
      pePass,
      roicPass,
      roePass,
      dividendYieldPass,
      epsGrowth3yPass,
      epsGrowthPass,
      epsGrowth10yPass,
      revenueGrowth3yPass,
      revenueGrowthPass,
      revenueGrowth10yPass,
      netDebtToEbitdaPass,
      netMarginPass,
      fcfMarginPass
    ].filter(Boolean).length;

    console.log(`${ticker} Score: ${buffettScore}/14 - Profitable years: ${profitabilityYears?.total}/10, P/E: ${pe}, ROIC: ${roic}%, ROE: ${roe}%, FCF Margin: ${fcfMargin}%`);

    return {
      symbol: ticker,
      name: companyProfile.companyName,
      exchange: companyProfile.exchangeShortName,
      sector: companyProfile.sector || 'Unknown',
      country: companyProfile.country || 'Unknown',
      buffettScore,
      criteria: {
        yearsOfProfitability: { 
          value: profitabilityYears?.total || null, 
          pass: profitYearsPass,
          profitableYearsLast3: profitabilityYears?.last3Years || null
        },
        pe: { 
          value: pe, 
          pass: pePass,
          revenueCagr5y,
          fcfMarginTrend,
          roicTrend,
          netDebtToEbitda: netDebtToEbitdaForPE
        },
        roic: { value: roic, pass: roicPass },
        roe: { value: roe, pass: roePass },
        dividendYield: { value: dividendYield, pass: dividendYieldPass },
        epsGrowth: { 
          value: epsCagr5y, 
          pass: epsGrowthPass,
          median3y: eps3yMedian,
          cagr3y: epsCagr3y,
          cagr10y: epsCagr10y
        },
        revenueGrowth: { 
          value: revenueGrowthCagr, 
          pass: revenueGrowthPass,
          cagr3y: revenueCagr3y,
          cagr10y: revenueCagr10y
        },
        netDebtToEbitda: { value: netDebtToEbitda, pass: netDebtToEbitdaPass },
        netMargin: { value: netMargin, pass: netMarginPass },
        fcfMargin: { value: fcfMargin, pass: fcfMarginPass }
      },
      price: currentPrice,
      currency: stockCurrency,
      intrinsicValue: intrinsicValueCalc,
      marginOfSafety: marginOfSafety,
      bookValuePerShare: bookValuePerShare,
      originalValues: updatedOriginalValues
    };
  } catch (error) {
    console.error(`Error analyzing ${ticker}:`, error);
    return null;
  }
};

// Batch-Analyse für mehrere Aktien einer Börse oder eines Index mit Rate-Limiting
export const analyzeMarket = async (
  marketId: string, 
  limit: number = 1000,
  onProgress?: (progress: number, currentOperation: string) => void
) => {
  try {
    const marketOption = marketOptions.find(option => option.id === marketId);
    const marketName = marketOption ? marketOption.name : marketId;
    
    // Aktien des Marktes abrufen (Börse oder Index)
    const marketStocks = await getStocksByMarket(marketId);
    const stocksToAnalyze = marketStocks.slice(0, limit);
    
    console.log(`Analysiere ${stocksToAnalyze.length} Aktien von ${marketName} in Batches`);
    
    const results: QuantAnalysisResult[] = [];
    const batchSize = 100; // Etwa 100 Aktien pro Minute (750 API calls / 7 calls per stock)
    const totalBatches = Math.ceil(stocksToAnalyze.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, stocksToAnalyze.length);
      const batch = stocksToAnalyze.slice(startIndex, endIndex);
      
      console.log(`Batch ${batchIndex + 1}/${totalBatches}: Analysiere Aktien ${startIndex + 1}-${endIndex}`);
      
      if (onProgress) {
        const progress = Math.round((batchIndex / totalBatches) * 100);
        onProgress(progress, `Batch ${batchIndex + 1}/${totalBatches}: Analysiere ${batch.length} Aktien...`);
      }
      
      // Analyze stocks in current batch
      for (const stock of batch) {
        try {
          const analysis = await analyzeStockByBuffettCriteria(stock.symbol);
          if (analysis) {
            results.push(analysis);
          }
        } catch (error) {
          console.error(`Fehler bei der Analyse von ${stock.symbol}:`, error);
        }
      }
      
      // Wait 60 seconds between batches (to ensure we don't hit the rate limit)
      if (batchIndex < totalBatches - 1) {
        console.log(`Warte 60 Sekunden vor dem nächsten Batch...`);
        if (onProgress) {
          onProgress(
            Math.round((batchIndex / totalBatches) * 100), 
            `Warte 60 Sekunden vor Batch ${batchIndex + 2}/${totalBatches}...`
          );
        }
        await sleep(60000); // 60 seconds delay
      }
    }
    
    if (onProgress) {
      onProgress(100, `Analyse abgeschlossen: ${results.length} Aktien analysiert`);
    }
    
    // Nach Buffett-Score sortieren (absteigend)
    return results.sort((a, b) => b.buffettScore - a.buffettScore);
  } catch (error) {
    console.error('Fehler bei der Marktanalyse:', error);
    throw error;
  }
};

// Backwards compatibility
export const analyzeExchange = analyzeMarket;

// Exportieren der CSV-Datei
export const exportToExcel = (results: QuantAnalysisResult[]) => {
  // Dynamically import xlsx
  import('xlsx').then((XLSX) => {
    const headers = [
      'Symbol', 'Name', 'Sektor', 'Börse', 'Preis', 'Währung',
      'Buffett Score (max 14)',
      'Jahre Profitabel (von 10)', 'Pass',
      'Kurs-Gewinn-Verhältnis (KGV / P/E Ratio)', 'Pass',
      'ROIC (%)', 'Pass',
      'ROE (%)', 'Pass',
      'Dividendenrendite (Dividend Yield)', 'Pass',
      'EPS w/o NRI 3Y CAGR (%)', 'Pass', 'EPS w/o NRI 5Y CAGR (%)', 'Pass', 'EPS w/o NRI 10Y CAGR (%)', 'Pass',
      'Umsatz 3Y CAGR (%)', 'Pass', 'Umsatz 5Y CAGR (%)', 'Pass', 'Umsatz 10Y CAGR (%)', 'Pass',
      'NetDebt/EBITDA', 'Pass',
      'Nettomarge (Net Margin)', 'Pass',
      'FCF-Marge (FCF Margin)', 'Pass'
    ];
    
    const rows = results.map(result => [
      result.symbol,
      result.name,
      result.sector,
      result.exchange,
      parseFloat(result.price.toFixed(2)),
      result.currency,
      result.buffettScore,
      result.criteria.yearsOfProfitability.value || 'N/A',
      result.criteria.yearsOfProfitability.pass ? 'Ja' : 'Nein',
      result.criteria.pe.value !== null ? parseFloat(result.criteria.pe.value.toFixed(2)) : 'N/A',
      result.criteria.pe.pass ? 'Ja' : 'Nein',
      result.criteria.roic.value !== null ? parseFloat(result.criteria.roic.value.toFixed(2)) : 'N/A',
      result.criteria.roic.pass ? 'Ja' : 'Nein',
      result.criteria.roe.value !== null ? parseFloat(result.criteria.roe.value.toFixed(2)) : 'N/A',
      result.criteria.roe.pass ? 'Ja' : 'Nein',
      result.criteria.dividendYield.value !== null ? parseFloat(result.criteria.dividendYield.value.toFixed(2)) : 'N/A',
      result.criteria.dividendYield.pass ? 'Ja' : 'Nein',
      result.criteria.epsGrowth.cagr3y !== null ? parseFloat(result.criteria.epsGrowth.cagr3y.toFixed(2)) : 'N/A',
      result.criteria.epsGrowth.cagr3y !== null && result.criteria.epsGrowth.cagr3y >= 5 ? 'Ja' : 'Nein',
      result.criteria.epsGrowth.value !== null ? parseFloat(result.criteria.epsGrowth.value.toFixed(2)) : 'N/A',
      result.criteria.epsGrowth.pass ? 'Ja' : 'Nein',
      result.criteria.epsGrowth.cagr10y !== null ? parseFloat(result.criteria.epsGrowth.cagr10y.toFixed(2)) : 'N/A',
      result.criteria.epsGrowth.cagr10y !== null && result.criteria.epsGrowth.cagr10y >= 5 ? 'Ja' : 'Nein',
      result.criteria.revenueGrowth.cagr3y !== null ? parseFloat(result.criteria.revenueGrowth.cagr3y.toFixed(2)) : 'N/A',
      result.criteria.revenueGrowth.cagr3y !== null && result.criteria.revenueGrowth.cagr3y >= 5 ? 'Ja' : 'Nein',
      result.criteria.revenueGrowth.value !== null ? parseFloat(result.criteria.revenueGrowth.value.toFixed(2)) : 'N/A',
      result.criteria.revenueGrowth.pass ? 'Ja' : 'Nein',
      result.criteria.revenueGrowth.cagr10y !== null ? parseFloat(result.criteria.revenueGrowth.cagr10y.toFixed(2)) : 'N/A',
      result.criteria.revenueGrowth.cagr10y !== null && result.criteria.revenueGrowth.cagr10y >= 5 ? 'Ja' : 'Nein',
      result.criteria.netDebtToEbitda.value !== null ? parseFloat(result.criteria.netDebtToEbitda.value.toFixed(2)) : 'N/A',
      result.criteria.netDebtToEbitda.pass ? 'Ja' : 'Nein',
      result.criteria.netMargin.value !== null ? parseFloat(result.criteria.netMargin.value.toFixed(2)) : 'N/A',
      result.criteria.netMargin.pass ? 'Ja' : 'Nein',
      result.criteria.fcfMargin?.value !== null ? parseFloat(result.criteria.fcfMargin.value.toFixed(2)) : 'N/A',
      result.criteria.fcfMargin?.pass ? 'Ja' : 'Nein'
    ]);
    
    // Create worksheet with headers and data
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Create workbook and add the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Buffett Analysis');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `buffett-analysis-${new Date().toISOString().split('T')[0]}.xlsx`);
  });
};
