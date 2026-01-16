import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValuationInput {
  currentPrice: number;
  sector: string;
  
  // Peter Lynch Discount (max 3 points)
  peterLynchFairValue: number | null;
  
  // P/E Ratio (max 3 points)
  currentPE: number | null;
  industryPE: number | null;
  
  // Dividend Yield (max 4 points)
  dividendYield: number | null;
  payoutRatioFCF: number | null;
  payoutRatioEPS: number | null;
  dividendStreak: number;
  dividendCAGR3Y: number | null;
  dividendCAGR5Y: number | null;
  dividendCAGR10Y: number | null;
  
  // Price to Book (max 3 points)
  bookValuePerShare: number | null;
  
  // Price to Cash Flow (max 4 points)
  fcfPerShare: number | null;
  historicalFCF: Array<{ year: string; value: number }>;
  
  // Price to Median P/S (max 4 points)
  priceToMedianPSDiscount: number | null;
}

interface ScoreResult {
  score: number;
  maxScore: number;
}

interface ValuationScoresResult {
  scores: {
    peterLynchDiscount: ScoreResult;
    peRatio: ScoreResult;
    dividendYield: ScoreResult;
    priceToBook: ScoreResult;
    priceToCashFlow: ScoreResult;
    priceToMedianPS: ScoreResult;
  };
  totalScore: number;
  maxTotalScore: number;
}

// Get MoS target based on sector
function getMoSTarget(sector: string): number {
  const sectorLower = sector?.toLowerCase() || '';
  
  if (sectorLower.includes('tech') || sectorLower.includes('software') || sectorLower.includes('internet')) {
    return 30; // High growth, high uncertainty
  }
  if (sectorLower.includes('healthcare') || sectorLower.includes('biotech') || sectorLower.includes('pharma')) {
    return 25;
  }
  if (sectorLower.includes('financial') || sectorLower.includes('bank') || sectorLower.includes('insurance')) {
    return 20;
  }
  if (sectorLower.includes('utility') || sectorLower.includes('utilities') || sectorLower.includes('consumer staples')) {
    return 15; // Defensive, stable
  }
  
  return 20; // Default
}

// Calculate Peter Lynch Discount Score (max 3 points)
function calculatePeterLynchScore(peterLynchFairValue: number | null, currentPrice: number): ScoreResult {
  if (!peterLynchFairValue || peterLynchFairValue <= 0) {
    return { score: 0, maxScore: 3 };
  }
  
  const ratio = currentPrice / peterLynchFairValue;
  
  let score = 0;
  if (ratio <= 0.75) score = 3;
  else if (ratio <= 0.95) score = 2;
  else if (ratio <= 1.10) score = 1;
  
  return { score, maxScore: 3 };
}

// Calculate P/E Ratio Score (max 3 points)
function calculatePERatioScore(currentPE: number | null, industryPE: number | null): ScoreResult {
  if (!currentPE || currentPE <= 0) {
    return { score: 0, maxScore: 3 };
  }
  
  // Absolute score (0-1.5 points)
  let absoluteScore = 0;
  if (currentPE <= 10) absoluteScore = 1.5;
  else if (currentPE <= 15) absoluteScore = 1.0;
  else if (currentPE <= 20) absoluteScore = 0.5;
  
  // Relative score (0-1.5 points)
  let relativeScore = 0;
  if (industryPE && industryPE > 0) {
    const peRel = currentPE / industryPE;
    if (peRel <= 0.80) relativeScore = 1.5;
    else if (peRel <= 0.95) relativeScore = 1.0;
    else if (peRel <= 1.10) relativeScore = 1.0;
    else if (peRel <= 1.30) relativeScore = 0.5;
  }
  
  const totalScore = absoluteScore + relativeScore;
  return { score: totalScore, maxScore: 3 };
}

// NEW Scoring function (applies to both EPS and FCF)
function getPayoutRatioScore(ratio: number | null): number {
  if (ratio === null || ratio < 0 || ratio > 80) return 0;
  if (ratio >= 40 && ratio <= 65) return 1;
  if (ratio < 40) return 0.5; // Conservative, growth room
  if (ratio > 65 && ratio <= 80) return 0.5; // OK, less buffer
  return 0;
}

// Calculate Dividend Yield Score (max 4 points)
function calculateDividendScore(
  dividendYield: number | null,
  payoutRatioFCF: number | null,
  payoutRatioEPS: number | null,
  dividendStreak: number,
  cagr3y: number | null,
  cagr5y: number | null,
  cagr10y: number | null
): ScoreResult {
  if (!dividendYield || dividendYield <= 0) {
    return { score: 0, maxScore: 4 };
  }
  
  // Calculate scores for both payout ratios (max 1 point each)
  const payoutScoreFCF = getPayoutRatioScore(payoutRatioFCF);
  const payoutScoreEPS = getPayoutRatioScore(payoutRatioEPS);
  const totalPayoutScore = payoutScoreFCF + payoutScoreEPS; // max 2 points
  
  // Growth score (0-2 points)
  const medianCAGR = [cagr3y, cagr5y, cagr10y]
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b)[1] || null;
  
  let streakScore = 0;
  if (dividendStreak >= 10) streakScore = 1;
  else if (dividendStreak >= 5) streakScore = 0.66;
  else if (dividendStreak >= 1) streakScore = 0.34;
  
  let cagrScore = 0;
  if (medianCAGR !== null) {
    if (medianCAGR >= 6) cagrScore = 1;
    else if (medianCAGR >= 3) cagrScore = 0.66;
    else if (medianCAGR >= 0) cagrScore = 0.34;
  }
  
  const growthScore = streakScore + cagrScore;
  const totalScore = totalPayoutScore + growthScore;
  return { score: totalScore, maxScore: 4 };
}

// Calculate Price to Book Score (max 3 points)
function calculatePriceToBookScore(bookValuePerShare: number | null, currentPrice: number): ScoreResult {
  if (!bookValuePerShare || bookValuePerShare <= 0) {
    return { score: 0, maxScore: 3 };
  }
  
  const pb = currentPrice / bookValuePerShare;
  
  let score = 0;
  if (pb <= 1.5) score = 3;
  else if (pb <= 2.5) score = 2;
  else if (pb <= 3.5) score = 1;
  
  return { score, maxScore: 3 };
}

// Calculate Price to Cash Flow Score (max 4 points)
function calculatePriceToCashFlowScore(
  fcfPerShare: number | null,
  currentPrice: number,
  historicalFCF: Array<{ year: string; value: number }>
): ScoreResult {
  if (!fcfPerShare || fcfPerShare <= 0) {
    return { score: 0, maxScore: 4 };
  }
  
  // Check if FCF was negative in 2 out of last 3 years
  if (historicalFCF && historicalFCF.length >= 3) {
    const lastThreeYears = historicalFCF.slice(0, 3);
    const negativeCount = lastThreeYears.filter(item => item.value < 0).length;
    if (negativeCount >= 2) {
      return { score: 0, maxScore: 4 };
    }
  }
  
  const pcf = currentPrice / fcfPerShare;
  
  let score = 0;
  if (pcf <= 12) score = 4;
  else if (pcf <= 16) score = 3;
  else if (pcf <= 20) score = 2;
  else if (pcf <= 25) score = 1;
  
  return { score, maxScore: 4 };
}

// Calculate Price to Median P/S Score (max 3 points)
function calculatePriceToMedianPSScore(discount: number | null): ScoreResult {
  if (discount === null) {
    return { score: 0, maxScore: 3 };
  }
  
  let score = 0;
  if (discount >= 35) score = 3;
  else if (discount >= 23) score = 2;
  else if (discount >= 12) score = 1;
  else if (discount >= 0) score = 0.5;
  
  return { score, maxScore: 3 };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: ValuationInput = await req.json();
    
    // Calculate individual scores
    const peterLynchDiscount = calculatePeterLynchScore(
      input.peterLynchFairValue,
      input.currentPrice
    );
    
    const peRatio = calculatePERatioScore(
      input.currentPE,
      input.industryPE
    );
    
    const dividendYield = calculateDividendScore(
      input.dividendYield,
      input.payoutRatioFCF,
      input.payoutRatioEPS,
      input.dividendStreak,
      input.dividendCAGR3Y,
      input.dividendCAGR5Y,
      input.dividendCAGR10Y
    );
    
    const priceToBook = calculatePriceToBookScore(
      input.bookValuePerShare,
      input.currentPrice
    );
    
    const priceToCashFlow = calculatePriceToCashFlowScore(
      input.fcfPerShare,
      input.currentPrice,
      input.historicalFCF || []
    );
    
    const priceToMedianPS = calculatePriceToMedianPSScore(
      input.priceToMedianPSDiscount
    );
    
    // Calculate total score
    const maxTotalScore = 20; // Sum of all max scores (3+3+4+3+4+3)
    const totalScore =
      peterLynchDiscount.score +
      peRatio.score +
      dividendYield.score +
      priceToBook.score +
      priceToCashFlow.score +
      priceToMedianPS.score;
    
    const result: ValuationScoresResult = {
      scores: {
        peterLynchDiscount,
        peRatio,
        dividendYield,
        priceToBook,
        priceToCashFlow,
        priceToMedianPS,
      },
      totalScore,
      maxTotalScore,
    };

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error calculating valuation scores:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  }
});
