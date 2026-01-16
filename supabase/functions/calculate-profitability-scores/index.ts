import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Industry to Preset Mapping
const industryToPreset: Record<string, string> = {
  // Construction & Infrastructure
  "Residential Construction": "Industrials",
  "Engineering & Construction": "Industrials",
  "Construction": "Industrials",
  
  // Automotive
  "Auto - Parts": "Industrials",
  "Auto - Manufacturers": "Industrials",
  "Auto - Recreational Vehicles": "Industrials",
  
  // Transportation & Logistics
  "Packaging & Containers": "Industrials",
  "Trucking": "Industrials",
  "Railroads": "Industrials",
  "Marine Shipping": "Industrials",
  "Integrated Freight & Logistics": "Industrials",
  "Airlines, Airports & Air Services": "Industrials",
  "General Transportation": "Industrials",
  
  // Defense & Aerospace
  "Aerospace & Defense": "Industrials",
  
  // Manufacturing
  "Manufacturing - Tools & Accessories": "Industrials",
  "Manufacturing - Textiles": "Industrials",
  "Manufacturing - Miscellaneous": "Industrials",
  "Manufacturing - Metal Fabrication": "Industrials",
  
  // Industrial Equipment & Services
  "Industrial - Distribution": "Industrials",
  "Industrial - Specialties": "Industrials",
  "Industrial - Pollution & Treatment Controls": "Industrials",
  "Industrial - Machinery": "Industrials",
  "Industrial - Capital Goods": "Industrials",
  "Business Equipment & Supplies": "Industrials",
  "Rental & Leasing Services": "Industrials",
  "Electrical Equipment & Parts": "Industrials",
  "Agricultural - Machinery": "Industrials",
  
  // Technology Hardware
  "Hardware, Equipment & Parts": "Industrials",
  "Computer Hardware": "Industrials",
  "Semiconductors": "Industrials",
  "Communication Equipment": "Industrials",
  "Technology Distributors": "Industrials",
  "Consumer Electronics": "Industrials",
  
  // Conglomerates
  "Conglomerates": "Industrials",
  
  // Software, Media, IP-light (asset-leicht)
  "Software": "Software",
  "Software - Application": "Software",
  "Software - Infrastructure": "Software",
  "Software - Services": "Software",
  "Internet Content & Information": "Software",
  "Publishing": "Software",
  "Broadcasting": "Software",
  "Advertising Agencies": "Software",
  "Entertainment": "Software",
  "Education & Training Services": "Software",
  "Consulting Services": "Software",
  "Staffing & Employment Services": "Software",
  "Security & Protection Services": "Software",
  "Specialty Business Services": "Software",
  "Information Technology Services": "Software",
  "Electronic Gaming & Multimedia": "Software",
  "Media & Entertainment": "Software",
  
  // Staples (defensiv)
  "Tobacco": "Staples",
  "Grocery Stores": "Staples",
  "Discount Stores": "Staples",
  "Household & Personal Products": "Staples",
  "Packaged Foods": "Staples",
  "Food Distribution": "Staples",
  "Food Confectioners": "Staples",
  "Agricultural Farm Products": "Staples",
  "Beverages - Wineries & Distilleries": "Staples",
  "Beverages - Non-Alcoholic": "Staples",
  "Beverages - Alcoholic": "Staples",
  
  // Retail Logistics (margenschwach, WC-lastig)
  "Travel Lodging": "RetailLogistics",
  "Travel Services": "RetailLogistics",
  "Specialty Retail": "RetailLogistics",
  "Luxury Goods": "RetailLogistics",
  "Home Improvement": "RetailLogistics",
  "Department Stores": "RetailLogistics",
  "Personal Products & Services": "RetailLogistics",
  "Leisure": "RetailLogistics",
  "Gambling, Resorts & Casinos": "RetailLogistics",
  "Furnishings, Fixtures & Appliances": "RetailLogistics",
  "Restaurants": "RetailLogistics",
  "Auto - Dealerships": "RetailLogistics",
  "Apparel - Retail": "RetailLogistics",
  "Apparel - Manufacturers": "RetailLogistics",
  "Apparel - Footwear & Accessories": "RetailLogistics",
  
  // UtilitiesTelecom (reguliert)
  "Telecommunications Services": "UtilitiesTelecom",
  "Solar": "UtilitiesTelecom",
  "Waste Management": "UtilitiesTelecom",
  "Environmental Services": "UtilitiesTelecom",
  "Industrial - Infrastructure Operations": "UtilitiesTelecom",
  "REIT - Specialty": "UtilitiesTelecom",
  "REIT - Retail": "UtilitiesTelecom",
  "REIT - Residential": "UtilitiesTelecom",
  "REIT - Office": "UtilitiesTelecom",
  "REIT - Mortgage": "UtilitiesTelecom",
  "REIT - Industrial": "UtilitiesTelecom",
  "REIT - Hotel & Motel": "UtilitiesTelecom",
  "REIT - Healthcare Facilities": "UtilitiesTelecom",
  "REIT - Diversified": "UtilitiesTelecom",
  "Real Estate - Services": "UtilitiesTelecom",
  "Real Estate - Diversified": "UtilitiesTelecom",
  "Real Estate - Development": "UtilitiesTelecom",
  "Real Estate - General": "UtilitiesTelecom",
  "Renewable Utilities": "UtilitiesTelecom",
  "Regulated Water": "UtilitiesTelecom",
  "Regulated Gas": "UtilitiesTelecom",
  "Regulated Electric": "UtilitiesTelecom",
  "Independent Power Producers": "UtilitiesTelecom",
  "Diversified Utilities": "UtilitiesTelecom",
  "General Utilities": "UtilitiesTelecom",
  
  // EnergyMaterials (Commodity-Zykliker)
  "Steel": "EnergyMaterials",
  "Silver": "EnergyMaterials",
  "Other Precious Metals": "EnergyMaterials",
  "Gold": "EnergyMaterials",
  "Copper": "EnergyMaterials",
  "Aluminum": "EnergyMaterials",
  "Paper, Lumber & Forest Products": "EnergyMaterials",
  "Industrial Materials": "EnergyMaterials",
  "Construction Materials": "EnergyMaterials",
  "Chemicals - Specialty": "EnergyMaterials",
  "Chemicals": "EnergyMaterials",
  "Agricultural Inputs": "EnergyMaterials",
  "Uranium": "EnergyMaterials",
  "Oil & Gas Refining & Marketing": "EnergyMaterials",
  "Oil & Gas Midstream": "EnergyMaterials",
  "Oil & Gas Integrated": "EnergyMaterials",
  "Oil & Gas Exploration & Production": "EnergyMaterials",
  "Oil & Gas Equipment & Services": "EnergyMaterials",
  "Oil & Gas Energy": "EnergyMaterials",
  "Oil & Gas Drilling": "EnergyMaterials",
  "Coal": "EnergyMaterials",
  "Agricultural - Commodities/Milling": "EnergyMaterials",
  
  // Healthcare (Pharma/Biotech/Medtech)
  "Medical - Specialties": "Healthcare",
  "Medical - Pharmaceuticals": "Healthcare",
  "Medical - Instruments & Supplies": "Healthcare",
  "Medical - Healthcare Plans": "Healthcare",
  "Medical - Healthcare Information Services": "Healthcare",
  "Medical - Equipment & Services": "Healthcare",
  "Medical - Distribution": "Healthcare",
  "Medical - Diagnostics & Research": "Healthcare",
  "Medical - Devices": "Healthcare",
  "Medical - Care Facilities": "Healthcare",
  "Drug Manufacturers - Specialty & Generic": "Healthcare",
  "Drug Manufacturers - General": "Healthcare",
  "Biotechnology": "Healthcare",
  
  // Financials - Banks
  "Shell Companies": "Banks",
  "Investment - Banking & Investment Services": "Banks",
  "Financial - Mortgages": "Banks",
  "Financial - Diversified": "Banks",
  "Financial - Data & Stock Exchanges": "Banks",
  "Financial - Credit Services": "Banks",
  "Financial - Conglomerates": "Banks",
  "Financial - Capital Markets": "Banks",
  "Banks - Regional": "Banks",
  "Banks - Diversified": "Banks",
  "Banks": "Banks",
  "Asset Management": "Banks",
  "Asset Management - Bonds": "Banks",
  "Asset Management - Income": "Banks",
  "Asset Management - Leveraged": "Banks",
  "Asset Management - Cryptocurrency": "Banks",
  "Asset Management - Global": "Banks",
  
  // Financials - Insurance
  "Insurance - Specialty": "Insurance",
  "Insurance - Reinsurance": "Insurance",
  "Insurance - Property & Casualty": "Insurance",
  "Insurance - Life": "Insurance",
  "Insurance - Diversified": "Insurance",
  "Insurance - Brokers": "Insurance",
};

interface MetricsInput {
  industry: string;
  roic: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  roe: number | null;
  roa: number | null;
  wacc: number | null;
  profitableYears?: number;
  totalYears?: number;
}

interface ScoreResult {
  score: number;
  maxScore: number;
}

interface ScoringResponse {
  preset: string;
  scores: {
    roic: ScoreResult;
    operatingMargin: ScoreResult;
    netMargin: ScoreResult;
    years: ScoreResult;
    roe: ScoreResult;
    roa: ScoreResult;
  };
  totalScore: number;
  maxTotalScore: number;
}

// Industrials Scoring Logic
function scoreIndustrialsROIC(roic: number | null, wacc: number | null): ScoreResult {
  if (roic === null) return { score: 0, maxScore: 5 };
  
  const spread = wacc !== null ? roic - wacc : null;
  
  if (roic >= 14 && spread !== null && spread >= 5) return { score: 5, maxScore: 5 };
  if (roic >= 12 && spread !== null && spread >= 3) return { score: 4, maxScore: 5 };
  if (roic >= 10 && wacc !== null && roic > wacc) return { score: 3, maxScore: 5 };
  if (roic >= 8) return { score: 1, maxScore: 5 };
  
  return { score: 0, maxScore: 5 };
}

function scoreIndustrialsOperatingMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 4 };
  
  if (margin >= 16) return { score: 4, maxScore: 4 };
  if (margin >= 12) return { score: 3, maxScore: 4 };
  if (margin >= 9) return { score: 2, maxScore: 4 };
  if (margin >= 6) return { score: 1, maxScore: 4 };
  
  return { score: 0, maxScore: 4 };
}

function scoreIndustrialsNetMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 2 };
  
  // Handle decimal values (0.239 = 23.9%)
  const percentValue = margin < 1 ? margin * 100 : margin;
  
  if (percentValue >= 10) return { score: 2, maxScore: 2 };
  if (percentValue >= 7) return { score: 1, maxScore: 2 };
  
  return { score: 0, maxScore: 2 };
}

function scoreIndustrialsYears(profitableYears: number, totalYears: number): ScoreResult {
  if (totalYears === 0) return { score: 0, maxScore: 4 };
  
  if (profitableYears === 10 && totalYears === 10) return { score: 4, maxScore: 4 };
  if (profitableYears === 9 && totalYears === 10) return { score: 3, maxScore: 4 };
  if (profitableYears === 8 && totalYears >= 10) return { score: 2, maxScore: 4 };
  if (profitableYears === 7 && totalYears >= 10) return { score: 1, maxScore: 4 };
  
  return { score: 0, maxScore: 4 };
}

function scoreIndustrialsROE(roe: number | null): ScoreResult {
  if (roe === null) return { score: 0, maxScore: 3 };
  
  if (roe >= 14) return { score: 3, maxScore: 3 };
  if (roe >= 9) return { score: 2, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreIndustrialsROA(roa: number | null): ScoreResult {
  if (roa === null) return { score: 0, maxScore: 2 };
  
  if (roa >= 7) return { score: 2, maxScore: 2 };
  if (roa >= 5) return { score: 1, maxScore: 2 };
  
  return { score: 0, maxScore: 2 };
}

// Software Scoring Logic
function scoreSoftwareROIC(roic: number | null, wacc: number | null): ScoreResult {
  if (roic === null) return { score: 0, maxScore: 6 };
  
  const spread = wacc !== null ? roic - wacc : null;
  
  if (roic >= 18 && spread !== null && spread >= 8) return { score: 6, maxScore: 6 };
  if (roic >= 15 && spread !== null && spread >= 5) return { score: 5, maxScore: 6 };
  if (roic >= 12 && wacc !== null && roic > wacc) return { score: 4, maxScore: 6 };
  if (roic >= 9) return { score: 2, maxScore: 6 };
  
  return { score: 0, maxScore: 6 };
}

function scoreSoftwareOperatingMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 4 };
  
  if (margin >= 22) return { score: 4, maxScore: 4 };
  if (margin >= 18) return { score: 3, maxScore: 4 };
  if (margin >= 14) return { score: 2, maxScore: 4 };
  if (margin >= 10) return { score: 1, maxScore: 4 };
  
  return { score: 0, maxScore: 4 };
}

function scoreSoftwareNetMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 3 };
  
  // Handle decimal values (0.18 = 18%)
  const percentValue = margin < 1 ? margin * 100 : margin;
  
  if (percentValue >= 18) return { score: 3, maxScore: 3 };
  if (percentValue >= 14) return { score: 2, maxScore: 3 };
  if (percentValue >= 10) return { score: 1, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreSoftwareYears(profitableYears: number, totalYears: number): ScoreResult {
  if (totalYears === 0) return { score: 0, maxScore: 3 };
  
  if (profitableYears === 10 && totalYears === 10) return { score: 3, maxScore: 3 };
  if (profitableYears === 9 && totalYears === 10) return { score: 2, maxScore: 3 };
  if (profitableYears === 8 && totalYears >= 10) return { score: 1, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreSoftwareROE(roe: number | null): ScoreResult {
  if (roe === null) return { score: 0, maxScore: 2 };
  
  if (roe >= 18) return { score: 2, maxScore: 2 };
  if (roe >= 12) return { score: 1, maxScore: 2 };
  
  return { score: 0, maxScore: 2 };
}

function scoreSoftwareROA(roa: number | null): ScoreResult {
  if (roa === null) return { score: 0, maxScore: 2 };
  
  if (roa >= 10) return { score: 2, maxScore: 2 };
  if (roa >= 8) return { score: 1, maxScore: 2 };
  
  return { score: 0, maxScore: 2 };
}

// Staples Scoring Logic
function scoreStaplesROIC(roic: number | null, wacc: number | null): ScoreResult {
  if (roic === null) return { score: 0, maxScore: 6 };
  
  const spread = wacc !== null ? roic - wacc : null;
  
  if (roic >= 16 && spread !== null && spread >= 6) return { score: 6, maxScore: 6 };
  if (roic >= 13 && spread !== null && spread >= 4) return { score: 5, maxScore: 6 };
  if (roic >= 11 && wacc !== null && roic > wacc) return { score: 4, maxScore: 6 };
  if (roic >= 9) return { score: 2, maxScore: 6 };
  
  return { score: 0, maxScore: 6 };
}

function scoreStaplesOperatingMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 3 };
  
  if (margin >= 18) return { score: 3, maxScore: 3 };
  if (margin >= 15) return { score: 2, maxScore: 3 };
  if (margin >= 12) return { score: 1, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreStaplesNetMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 3 };
  
  // Handle decimal values (0.14 = 14%)
  const percentValue = margin < 1 ? margin * 100 : margin;
  
  if (percentValue >= 14) return { score: 3, maxScore: 3 };
  if (percentValue >= 10) return { score: 2, maxScore: 3 };
  if (percentValue >= 5) return { score: 1, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreStaplesYears(profitableYears: number, totalYears: number): ScoreResult {
  if (totalYears === 0) return { score: 0, maxScore: 4 };
  
  if (profitableYears === 10 && totalYears === 10) return { score: 4, maxScore: 4 };
  if (profitableYears === 9 && totalYears === 10) return { score: 3, maxScore: 4 };
  if (profitableYears === 8 && totalYears >= 10) return { score: 2, maxScore: 4 };
  if (profitableYears === 7 && totalYears >= 10) return { score: 1, maxScore: 4 };
  
  return { score: 0, maxScore: 4 };
}

function scoreStaplesROE(roe: number | null): ScoreResult {
  if (roe === null) return { score: 0, maxScore: 3 };
  
  if (roe >= 15) return { score: 3, maxScore: 3 };
  if (roe >= 10) return { score: 2, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreStaplesROA(roa: number | null): ScoreResult {
  if (roa === null) return { score: 0, maxScore: 1 };
  
  if (roa >= 8) return { score: 1, maxScore: 1 };
  
  return { score: 0, maxScore: 1 };
}

// Retail Logistics Scoring Logic
function scoreRetailLogisticsROIC(roic: number | null, wacc: number | null): ScoreResult {
  if (roic === null) return { score: 0, maxScore: 5 };
  
  const spread = wacc !== null ? roic - wacc : null;
  
  if (roic >= 12 && spread !== null && spread >= 4) return { score: 5, maxScore: 5 };
  if (roic >= 10 && spread !== null && spread >= 2) return { score: 4, maxScore: 5 };
  if (roic >= 9 && wacc !== null && roic > wacc) return { score: 3, maxScore: 5 };
  if (roic >= 7) return { score: 1, maxScore: 5 };
  
  return { score: 0, maxScore: 5 };
}

function scoreRetailLogisticsOperatingMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 3 };
  
  if (margin >= 10) return { score: 3, maxScore: 3 };
  if (margin >= 7) return { score: 2, maxScore: 3 };
  if (margin >= 5) return { score: 1, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreRetailLogisticsNetMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 2 };
  
  // Handle decimal values (0.06 = 6%)
  const percentValue = margin < 1 ? margin * 100 : margin;
  
  if (percentValue >= 6) return { score: 2, maxScore: 2 };
  if (percentValue >= 4) return { score: 1, maxScore: 2 };
  
  return { score: 0, maxScore: 2 };
}

function scoreRetailLogisticsYears(profitableYears: number, totalYears: number): ScoreResult {
  if (totalYears === 0) return { score: 0, maxScore: 4 };
  
  if (profitableYears === 10 && totalYears === 10) return { score: 4, maxScore: 4 };
  if (profitableYears === 9 && totalYears === 10) return { score: 3, maxScore: 4 };
  if (profitableYears === 8 && totalYears >= 10) return { score: 2, maxScore: 4 };
  if (profitableYears === 7 && totalYears >= 10) return { score: 1, maxScore: 4 };
  
  return { score: 0, maxScore: 4 };
}

function scoreRetailLogisticsROE(roe: number | null): ScoreResult {
  if (roe === null) return { score: 0, maxScore: 4 };
  
  if (roe >= 15) return { score: 4, maxScore: 4 };
  if (roe >= 12) return { score: 3, maxScore: 4 };
  if (roe >= 9) return { score: 2, maxScore: 4 };
  if (roe >= 6) return { score: 1, maxScore: 4 };
  
  return { score: 0, maxScore: 4 };
}

function scoreRetailLogisticsROA(roa: number | null): ScoreResult {
  if (roa === null) return { score: 0, maxScore: 2 };
  
  if (roa >= 6) return { score: 2, maxScore: 2 };
  if (roa >= 4) return { score: 1, maxScore: 2 };
  
  return { score: 0, maxScore: 2 };
}

// UtilitiesTelecom Scoring Logic
function scoreUtilitiesTelecomROIC(roic: number | null, wacc: number | null): ScoreResult {
  if (roic === null) return { score: 0, maxScore: 4 };
  
  const spread = wacc !== null ? roic - wacc : null;
  
  if (roic >= 10 && spread !== null && spread >= 2) return { score: 4, maxScore: 4 };
  if (roic >= 9 && spread !== null && spread >= 1) return { score: 3, maxScore: 4 };
  if (roic >= 8 && spread !== null && spread >= 0) return { score: 2, maxScore: 4 };
  if (roic >= 7) return { score: 1, maxScore: 4 };
  
  return { score: 0, maxScore: 4 };
}

function scoreUtilitiesTelecomOperatingMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 3 };
  
  if (margin >= 18) return { score: 3, maxScore: 3 };
  if (margin >= 15) return { score: 2, maxScore: 3 };
  if (margin >= 12) return { score: 1, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreUtilitiesTelecomNetMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 3 };
  
  // Handle decimal values (0.10 = 10%)
  const percentValue = margin < 1 ? margin * 100 : margin;
  
  if (percentValue >= 10) return { score: 3, maxScore: 3 };
  if (percentValue >= 8) return { score: 2, maxScore: 3 };
  if (percentValue >= 6) return { score: 1, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreUtilitiesTelecomYears(profitableYears: number, totalYears: number): ScoreResult {
  if (totalYears === 0) return { score: 0, maxScore: 5 };
  
  if (profitableYears === 10 && totalYears === 10) return { score: 5, maxScore: 5 };
  if (profitableYears === 9 && totalYears === 10) return { score: 4, maxScore: 5 };
  if (profitableYears === 8 && totalYears >= 10) return { score: 3, maxScore: 5 };
  if (profitableYears === 7 && totalYears >= 10) return { score: 2, maxScore: 5 };
  
  return { score: 0, maxScore: 5 };
}

function scoreUtilitiesTelecomROE(roe: number | null): ScoreResult {
  if (roe === null) return { score: 0, maxScore: 3 };
  
  if (roe >= 12) return { score: 3, maxScore: 3 };
  if (roe >= 8) return { score: 2, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreUtilitiesTelecomROA(roa: number | null): ScoreResult {
  if (roa === null) return { score: 0, maxScore: 2 };
  
  if (roa >= 6) return { score: 2, maxScore: 2 };
  if (roa >= 4) return { score: 1, maxScore: 2 };
  
  return { score: 0, maxScore: 2 };
}

// EnergyMaterials Scoring Logic
function scoreEnergyMaterialsROIC(roic: number | null, wacc: number | null): ScoreResult {
  if (roic === null) return { score: 0, maxScore: 5 };
  
  const spread = wacc !== null ? roic - wacc : null;
  
  if (roic >= 14 && spread !== null && spread >= 4) return { score: 5, maxScore: 5 };
  if (roic >= 12 && spread !== null && spread >= 2) return { score: 4, maxScore: 5 };
  if (roic >= 10 && wacc !== null && roic > wacc) return { score: 3, maxScore: 5 };
  if (roic >= 7) return { score: 1, maxScore: 5 };
  
  return { score: 0, maxScore: 5 };
}

function scoreEnergyMaterialsOperatingMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 3 };
  
  if (margin >= 22) return { score: 3, maxScore: 3 };
  if (margin >= 16) return { score: 2, maxScore: 3 };
  if (margin >= 12) return { score: 1, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreEnergyMaterialsNetMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 2 };
  
  // Handle decimal values (0.12 = 12%)
  const percentValue = margin < 1 ? margin * 100 : margin;
  
  if (percentValue >= 12) return { score: 2, maxScore: 2 };
  if (percentValue >= 8) return { score: 1, maxScore: 2 };
  
  return { score: 0, maxScore: 2 };
}

function scoreEnergyMaterialsYears(profitableYears: number, totalYears: number): ScoreResult {
  if (totalYears === 0) return { score: 0, maxScore: 4 };
  
  if (profitableYears === 10 && totalYears === 10) return { score: 4, maxScore: 4 };
  if (profitableYears === 9 && totalYears === 10) return { score: 3, maxScore: 4 };
  if (profitableYears === 8 && totalYears >= 10) return { score: 2, maxScore: 4 };
  if (profitableYears === 7 && totalYears >= 10) return { score: 1, maxScore: 4 };
  
  return { score: 0, maxScore: 4 };
}

function scoreEnergyMaterialsROE(roe: number | null): ScoreResult {
  if (roe === null) return { score: 0, maxScore: 4 };
  
  if (roe >= 16) return { score: 4, maxScore: 4 };
  if (roe >= 12) return { score: 3, maxScore: 4 };
  if (roe >= 9) return { score: 2, maxScore: 4 };
  if (roe >= 6) return { score: 1, maxScore: 4 };
  
  return { score: 0, maxScore: 4 };
}

function scoreEnergyMaterialsROA(roa: number | null): ScoreResult {
  if (roa === null) return { score: 0, maxScore: 2 };
  
  if (roa >= 7) return { score: 2, maxScore: 2 };
  if (roa >= 5) return { score: 1, maxScore: 2 };
  
  return { score: 0, maxScore: 2 };
}

// Healthcare Scoring Logic
function scoreHealthcareROIC(roic: number | null, wacc: number | null): ScoreResult {
  if (roic === null) return { score: 0, maxScore: 6 };
  
  const spread = wacc !== null ? roic - wacc : null;
  
  if (roic >= 16 && spread !== null && spread >= 6) return { score: 6, maxScore: 6 };
  if (roic >= 13 && spread !== null && spread >= 4) return { score: 5, maxScore: 6 };
  if (roic >= 11 && wacc !== null && roic > wacc) return { score: 4, maxScore: 6 };
  if (roic >= 9) return { score: 2, maxScore: 6 };
  
  return { score: 0, maxScore: 6 };
}

function scoreHealthcareOperatingMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 4 };
  
  if (margin >= 22) return { score: 4, maxScore: 4 };
  if (margin >= 18) return { score: 3, maxScore: 4 };
  if (margin >= 14) return { score: 2, maxScore: 4 };
  if (margin >= 10) return { score: 1, maxScore: 4 };
  
  return { score: 0, maxScore: 4 };
}

function scoreHealthcareNetMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 3 };
  
  // Handle decimal values (0.16 = 16%)
  const percentValue = margin < 1 ? margin * 100 : margin;
  
  if (percentValue >= 16) return { score: 3, maxScore: 3 };
  if (percentValue >= 12) return { score: 2, maxScore: 3 };
  if (percentValue >= 8) return { score: 1, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreHealthcareYears(profitableYears: number, totalYears: number): ScoreResult {
  if (totalYears === 0) return { score: 0, maxScore: 3 };
  
  if (profitableYears === 10 && totalYears === 10) return { score: 3, maxScore: 3 };
  if (profitableYears === 9 && totalYears === 10) return { score: 2, maxScore: 3 };
  if (profitableYears === 8 && totalYears >= 10) return { score: 1, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreHealthcareROE(roe: number | null): ScoreResult {
  if (roe === null) return { score: 0, maxScore: 3 };
  
  if (roe >= 15) return { score: 3, maxScore: 3 };
  if (roe >= 10) return { score: 2, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreHealthcareROA(roa: number | null): ScoreResult {
  if (roa === null) return { score: 0, maxScore: 1 };
  
  if (roa >= 8) return { score: 1, maxScore: 1 };
  
  return { score: 0, maxScore: 1 };
}

// Banks Scoring Logic (Op-Margin & Net-Margin nicht aussagekräftig)
function scoreBanksROIC(roic: number | null, wacc: number | null): ScoreResult {
  // ROIC wird bei Banks nicht gewertet
  return { score: 0, maxScore: 0 };
}

function scoreBanksOperatingMargin(margin: number | null): ScoreResult {
  // Operating Margin wird bei Banks nicht gewertet
  return { score: 0, maxScore: 0 };
}

function scoreBanksNetMargin(margin: number | null): ScoreResult {
  // Net Margin wird bei Banks nicht gewertet
  return { score: 0, maxScore: 0 };
}

function scoreBanksYears(profitableYears: number, totalYears: number): ScoreResult {
  if (totalYears === 0) return { score: 0, maxScore: 6 };
  
  if (profitableYears === 10 && totalYears === 10) return { score: 6, maxScore: 6 };
  if (profitableYears === 9 && totalYears === 10) return { score: 5, maxScore: 6 };
  if (profitableYears === 8 && totalYears >= 10) return { score: 4, maxScore: 6 };
  if (profitableYears === 7 && totalYears >= 10) return { score: 2, maxScore: 6 };
  
  return { score: 0, maxScore: 6 };
}

function scoreBanksROE(roe: number | null): ScoreResult {
  if (roe === null) return { score: 0, maxScore: 10 };
  
  if (roe >= 14) return { score: 10, maxScore: 10 };
  if (roe >= 12) return { score: 8, maxScore: 10 };
  if (roe >= 10) return { score: 6, maxScore: 10 };
  if (roe >= 8) return { score: 3, maxScore: 10 };
  
  return { score: 0, maxScore: 10 };
}

function scoreBanksROA(roa: number | null): ScoreResult {
  if (roa === null) return { score: 0, maxScore: 4 };
  
  if (roa >= 1.2) return { score: 4, maxScore: 4 };
  if (roa >= 1.0) return { score: 3, maxScore: 4 };
  if (roa >= 0.8) return { score: 2, maxScore: 4 };
  if (roa >= 0.6) return { score: 1, maxScore: 4 };
  
  return { score: 0, maxScore: 4 };
}

// Insurance Scoring Logic (kein Operating-Proxy, Net-Margin ist brauchbar)
function scoreInsuranceROIC(roic: number | null, wacc: number | null): ScoreResult {
  if (roic === null) return { score: 0, maxScore: 2 };
  
  const spread = wacc !== null ? roic - wacc : null;
  
  if (roic >= 12 && spread !== null && spread >= 3) return { score: 2, maxScore: 2 };
  if (roic >= 10 && spread !== null && spread >= 1) return { score: 1, maxScore: 2 };
  
  return { score: 0, maxScore: 2 };
}

function scoreInsuranceOperatingMargin(margin: number | null): ScoreResult {
  // Operating Margin wird bei Insurance nicht gewertet
  return { score: 0, maxScore: 0 };
}

function scoreInsuranceNetMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 3 };
  
  // Handle decimal values (0.08 = 8%)
  const percentValue = margin < 1 ? margin * 100 : margin;
  
  if (percentValue >= 8) return { score: 3, maxScore: 3 };
  if (percentValue >= 6) return { score: 2, maxScore: 3 };
  if (percentValue >= 4) return { score: 1, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreInsuranceYears(profitableYears: number, totalYears: number): ScoreResult {
  if (totalYears === 0) return { score: 0, maxScore: 5 };
  
  if (profitableYears === 10 && totalYears === 10) return { score: 5, maxScore: 5 };
  if (profitableYears === 9 && totalYears === 10) return { score: 4, maxScore: 5 };
  if (profitableYears === 8 && totalYears >= 10) return { score: 3, maxScore: 5 };
  if (profitableYears === 7 && totalYears >= 10) return { score: 2, maxScore: 5 };
  
  return { score: 0, maxScore: 5 };
}

function scoreInsuranceROE(roe: number | null): ScoreResult {
  if (roe === null) return { score: 0, maxScore: 8 };
  
  if (roe >= 14) return { score: 8, maxScore: 8 };
  if (roe >= 12) return { score: 6, maxScore: 8 };
  if (roe >= 10) return { score: 4, maxScore: 8 };
  if (roe >= 8) return { score: 2, maxScore: 8 };
  
  return { score: 0, maxScore: 8 };
}

function scoreInsuranceROA(roa: number | null): ScoreResult {
  if (roa === null) return { score: 0, maxScore: 2 };
  
  if (roa >= 1.0) return { score: 2, maxScore: 2 };
  if (roa >= 0.8) return { score: 1, maxScore: 2 };
  
  return { score: 0, maxScore: 2 };
}

function calculateScores(preset: string, metrics: MetricsInput): ScoringResponse {
  let scores: ScoringResponse['scores'];
  
  if (preset === "Industrials") {
    scores = {
      roic: scoreIndustrialsROIC(metrics.roic, metrics.wacc),
      operatingMargin: scoreIndustrialsOperatingMargin(metrics.operatingMargin),
      netMargin: scoreIndustrialsNetMargin(metrics.netMargin),
      years: scoreIndustrialsYears(metrics.profitableYears || 0, metrics.totalYears || 0),
      roe: scoreIndustrialsROE(metrics.roe),
      roa: scoreIndustrialsROA(metrics.roa),
    };
  } else if (preset === "Software") {
    scores = {
      roic: scoreSoftwareROIC(metrics.roic, metrics.wacc),
      operatingMargin: scoreSoftwareOperatingMargin(metrics.operatingMargin),
      netMargin: scoreSoftwareNetMargin(metrics.netMargin),
      years: scoreSoftwareYears(metrics.profitableYears || 0, metrics.totalYears || 0),
      roe: scoreSoftwareROE(metrics.roe),
      roa: scoreSoftwareROA(metrics.roa),
    };
  } else if (preset === "Staples") {
    scores = {
      roic: scoreStaplesROIC(metrics.roic, metrics.wacc),
      operatingMargin: scoreStaplesOperatingMargin(metrics.operatingMargin),
      netMargin: scoreStaplesNetMargin(metrics.netMargin),
      years: scoreStaplesYears(metrics.profitableYears || 0, metrics.totalYears || 0),
      roe: scoreStaplesROE(metrics.roe),
      roa: scoreStaplesROA(metrics.roa),
    };
  } else if (preset === "RetailLogistics") {
    scores = {
      roic: scoreRetailLogisticsROIC(metrics.roic, metrics.wacc),
      operatingMargin: scoreRetailLogisticsOperatingMargin(metrics.operatingMargin),
      netMargin: scoreRetailLogisticsNetMargin(metrics.netMargin),
      years: scoreRetailLogisticsYears(metrics.profitableYears || 0, metrics.totalYears || 0),
      roe: scoreRetailLogisticsROE(metrics.roe),
      roa: scoreRetailLogisticsROA(metrics.roa),
    };
  } else if (preset === "UtilitiesTelecom") {
    scores = {
      roic: scoreUtilitiesTelecomROIC(metrics.roic, metrics.wacc),
      operatingMargin: scoreUtilitiesTelecomOperatingMargin(metrics.operatingMargin),
      netMargin: scoreUtilitiesTelecomNetMargin(metrics.netMargin),
      years: scoreUtilitiesTelecomYears(metrics.profitableYears || 0, metrics.totalYears || 0),
      roe: scoreUtilitiesTelecomROE(metrics.roe),
      roa: scoreUtilitiesTelecomROA(metrics.roa),
    };
  } else if (preset === "EnergyMaterials") {
    scores = {
      roic: scoreEnergyMaterialsROIC(metrics.roic, metrics.wacc),
      operatingMargin: scoreEnergyMaterialsOperatingMargin(metrics.operatingMargin),
      netMargin: scoreEnergyMaterialsNetMargin(metrics.netMargin),
      years: scoreEnergyMaterialsYears(metrics.profitableYears || 0, metrics.totalYears || 0),
      roe: scoreEnergyMaterialsROE(metrics.roe),
      roa: scoreEnergyMaterialsROA(metrics.roa),
    };
  } else if (preset === "Healthcare") {
    scores = {
      roic: scoreHealthcareROIC(metrics.roic, metrics.wacc),
      operatingMargin: scoreHealthcareOperatingMargin(metrics.operatingMargin),
      netMargin: scoreHealthcareNetMargin(metrics.netMargin),
      years: scoreHealthcareYears(metrics.profitableYears || 0, metrics.totalYears || 0),
      roe: scoreHealthcareROE(metrics.roe),
      roa: scoreHealthcareROA(metrics.roa),
    };
  } else if (preset === "Banks") {
    scores = {
      roic: scoreBanksROIC(metrics.roic, metrics.wacc),
      operatingMargin: scoreBanksOperatingMargin(metrics.operatingMargin),
      netMargin: scoreBanksNetMargin(metrics.netMargin),
      years: scoreBanksYears(metrics.profitableYears || 0, metrics.totalYears || 0),
      roe: scoreBanksROE(metrics.roe),
      roa: scoreBanksROA(metrics.roa),
    };
  } else if (preset === "Insurance") {
    scores = {
      roic: scoreInsuranceROIC(metrics.roic, metrics.wacc),
      operatingMargin: scoreInsuranceOperatingMargin(metrics.operatingMargin),
      netMargin: scoreInsuranceNetMargin(metrics.netMargin),
      years: scoreInsuranceYears(metrics.profitableYears || 0, metrics.totalYears || 0),
      roe: scoreInsuranceROE(metrics.roe),
      roa: scoreInsuranceROA(metrics.roa),
    };
  } else {
    // Default/Fallback scoring
    scores = {
      roic: { score: 0, maxScore: 6 },
      operatingMargin: { score: 0, maxScore: 4 },
      netMargin: { score: 0, maxScore: 3 },
      years: { score: 0, maxScore: 3 },
      roe: { score: 0, maxScore: 2 },
      roa: { score: 0, maxScore: 1 },
    };
  }
  
  const totalScore = Object.values(scores).reduce((sum, s) => sum + s.score, 0);
  const maxTotalScore = Object.values(scores).reduce((sum, s) => sum + s.maxScore, 0);
  
  return {
    preset,
    scores,
    totalScore,
    maxTotalScore,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: MetricsInput = await req.json();
    
    console.log('Received input:', { 
      industry: input.industry,
      roic: input.roic,
      operatingMargin: input.operatingMargin,
      netMargin: input.netMargin,
      roe: input.roe,
      roa: input.roa,
      wacc: input.wacc
    });
    
    // Map industry to preset
    const preset = industryToPreset[input.industry] || "Default";
    
    console.log('Mapped to preset:', preset);
    
    // Calculate scores
    const result = calculateScores(preset, input);
    
    console.log('Calculated scores:', result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in calculate-profitability-scores:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
