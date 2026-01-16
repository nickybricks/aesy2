import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Sector mapping: English -> German
const SECTOR_MAPPING: Record<string, string> = {
  "Basic Materials": "Rohstoffe",
  "Communication Services": "Kommunikationsdienste",
  "Consumer Cyclical": "Verbrauchsgüter (zyklisch)",
  "Consumer Defensive": "Verbrauchsgüter des Alltags",
  "Energy": "Energie",
  "Financial Services": "Finanzdienste",
  "Healthcare": "Gesundheitswesen",
  "Industrials": "Industrie",
  "Real Estate": "Immobilien",
  "Technology": "Technologie",
  "Utilities": "Versorger"
}

// Industry mapping: English -> German (reversed from provided mapping)
const INDUSTRY_MAPPING: Record<string, string> = {
  "Agricultural Inputs": "Dünger und Saatgut",
  "Construction Materials": "Baustoffe",
  "Chemicals": "Allgemeine Chemikalien",
  "Chemicals - Specialty": "Spezielle Chemikalien",
  "Paper, Lumber & Forest Products": "Papier, Holz und Waldprodukte",
  "Aluminum": "Aluminium",
  "Copper": "Kupfer",
  "Gold": "Gold",
  "Silver": "Silber",
  "Other Precious Metals": "Andere Edelmetalle",
  "Steel": "Stahl",
  "Industrial Materials": "Industrielle Materialien",
  "Auto - Dealerships": "Autohändler",
  "Auto - Manufacturers": "Autohersteller",
  "Auto - Parts": "Autoteile",
  "Auto - Recreational Vehicles": "Freizeitfahrzeuge",
  "Furnishings, Fixtures & Appliances": "Möbel und Haushaltsgeräte",
  "Residential Construction": "Wohnungsbau",
  "Apparel - Manufacturers": "Kleidungshersteller",
  "Apparel - Footwear & Accessories": "Schuhe und Zubehör",
  "Packaging & Containers": "Verpackungen",
  "Restaurants": "Restaurants",
  "Apparel - Retail": "Kleidungsläden",
  "Department Stores": "Warenhäuser",
  "Home Improvement": "Heimwerkerbedarf",
  "Luxury Goods": "Luxusartikel",
  "Specialty Retail": "Spezialgeschäfte",
  "Gambling, Resorts & Casinos": "Glücksspiel, Resorts und Casinos",
  "Leisure": "Freizeitaktivitäten",
  "Travel Lodging": "Unterkünfte",
  "Travel Services": "Reisedienste",
  "Personal Products & Services": "Persönliche Produkte und Dienstleistungen",
  "Asset Management": "Vermögensverwaltung",
  "Asset Management - Bonds": "Anleihenfonds",
  "Asset Management - Income": "Einkommensfonds",
  "Asset Management - Leveraged": "Hebelprodukte",
  "Asset Management - Cryptocurrency": "Kryptowährungsfonds",
  "Asset Management - Global": "Globale Fonds",
  "Banks": "Banken",
  "Banks - Diversified": "Große Universalbanken",
  "Banks - Regional": "Regionale Banken",
  "Financial - Capital Markets": "Finanzmärkte",
  "Financial - Data & Stock Exchanges": "Finanzdaten und Börsen",
  "Financial - Credit Services": "Kredite und Darlehen",
  "Insurance - Life": "Lebensversicherungen",
  "Insurance - Property & Casualty": "Sach- und Unfallversicherungen",
  "Insurance - Reinsurance": "Rückversicherungen",
  "Insurance - Specialty": "Spezialversicherungen",
  "Insurance - Diversified": "Verschiedene Versicherungen",
  "Insurance - Brokers": "Versicherungsmakler",
  "Financial - Conglomerates": "Finanzkonglomerate",
  "Financial - Mortgages": "Hypotheken",
  "Financial - Diversified": "Verschiedene Finanzdienste",
  "Shell Companies": "Leere Firmen",
  "Real Estate - Development": "Immobilienentwicklung",
  "Real Estate - Diversified": "Verschiedene Immobilien",
  "Real Estate - Services": "Immobiliendienste",
  "Real Estate - General": "Allgemeine Immobilien",
  "REIT - Healthcare Facilities": "Gesundheitseinrichtungen",
  "REIT - Hotel & Motel": "Hotels und Motels",
  "REIT - Industrial": "Industrieimmobilien",
  "REIT - Office": "Büros",
  "REIT - Residential": "Wohnungen",
  "REIT - Retail": "Einzelhandel",
  "REIT - Mortgage": "Hypotheken",
  "REIT - Specialty": "Spezielle Immobilien",
  "REIT - Diversified": "Verschiedene",
  "Beverages - Alcoholic": "Bier und andere",
  "Beverages - Wineries & Distilleries": "Wein und Spirituosen",
  "Beverages - Non-Alcoholic": "Nicht-alkoholische Getränke",
  "Food Confectioners": "Süßigkeiten",
  "Agricultural Farm Products": "Landwirtschaftliche Produkte",
  "Packaged Foods": "Fertigessen",
  "Food Distribution": "Lebensmittelvertrieb",
  "Household & Personal Products": "Haushalts- und Pflegeprodukte",
  "Education & Training Services": "Bildung und Schulungen",
  "Discount Stores": "Discounter",
  "Grocery Stores": "Supermärkte",
  "Tobacco": "Tabak",
  "Biotechnology": "Biotechnologie",
  "Drug Manufacturers - General": "Große Pharmafirmen",
  "Drug Manufacturers - Specialty & Generic": "Spezielle und Generika",
  "Medical - Devices": "Medizinische Geräte",
  "Medical - Instruments & Supplies": "Instrumente und Zubehör",
  "Medical - Healthcare Plans": "Krankenversicherungen",
  "Medical - Care Facilities": "Kliniken und Pflege",
  "Medical - Pharmaceuticals": "Arzneimittelhandel",
  "Medical - Healthcare Information Services": "Gesundheitsinfos",
  "Medical - Diagnostics & Research": "Diagnostik und Forschung",
  "Medical - Distribution": "Medizinvertrieb",
  "Medical - Equipment & Services": "Medizinausrüstung und Dienstleistungen",
  "Medical - Specialties": "Medizinische Spezialgebiete",
  "Regulated Water": "Wasserversorgung",
  "Regulated Gas": "Gasversorgung",
  "Regulated Electric": "Stromversorgung",
  "Independent Power Producers": "Unabhängige Stromproduzenten",
  "Renewable Utilities": "Erneuerbare Energien",
  "Diversified Utilities": "Verschiedene Versorger",
  "General Utilities": "Allgemeine Versorger",
  "Telecommunications Services": "Telekommunikation",
  "Advertising Agencies": "Werbeagenturen",
  "Broadcasting": "Rundfunk",
  "Publishing": "Verlagswesen",
  "Entertainment": "Unterhaltung",
  "Internet Content & Information": "Internetinhalte",
  "Electronic Gaming & Multimedia": "Gaming und Multimedia",
  "Oil & Gas Drilling": "Bohren",
  "Oil & Gas Exploration & Production": "Förderung und Produktion",
  "Oil & Gas Integrated": "Integrierte Firmen",
  "Oil & Gas Midstream": "Transport",
  "Oil & Gas Refining & Marketing": "Raffinerie und Verkauf",
  "Oil & Gas Equipment & Services": "Ausrüstung und Dienstleistungen",
  "Coal": "Kohle",
  "Uranium": "Uran",
  "Solar": "Solar",
  "Aerospace & Defense": "Luft- und Raumfahrt, Verteidigung",
  "Marine Shipping": "Seeschifffahrt",
  "Railroads": "Eisenbahnen",
  "Trucking": "Lkw-Transport",
  "Integrated Freight & Logistics": "Fracht und Logistik",
  "Airlines, Airports & Air Services": "Fluglinien und Flughäfen",
  "General Transportation": "Allgemeiner Transport",
  "Business Equipment & Supplies": "Bürogeräte",
  "Electrical Equipment & Parts": "Elektrogeräte",
  "Manufacturing - Metal Fabrication": "Metallverarbeitung",
  "Manufacturing - Tools & Accessories": "Werkzeuge",
  "Industrial - Pollution & Treatment Controls": "Umweltschutztechnik",
  "Industrial - Distribution": "Industrieller Vertrieb",
  "Waste Management": "Abfallentsorgung",
  "Specialty Business Services": "Spezielle Dienste",
  "Consulting Services": "Beratung",
  "Rental & Leasing Services": "Vermietung",
  "Security & Protection Services": "Sicherheitsdienste",
  "Staffing & Employment Services": "Personaldienste",
  "Conglomerates": "Konglomerate",
  "Engineering & Construction": "Ingenieurwesen und Bau",
  "Construction": "Bauprojekte",
  "Infrastructure Operations": "Infrastrukturbetrieb",
  "Industrial - Infrastructure Operations": "Infrastrukturbetrieb",
  "Agricultural - Machinery": "Landmaschinen",
  "Industrial - Machinery": "Industriemaschinen",
  "Industrial - Specialties": "Industrielle Spezialitäten",
  "Environmental Services": "Umweltdienste",
  "Agricultural - Commodities/Milling": "Landwirtschaftliche Rohstoffe",
  "Manufacturing - Miscellaneous": "Sonstige Fertigung",
  "Manufacturing - Textiles": "Textilherstellung",
  "Information Technology Services": "IT-Dienste",
  "Software - Application": "Anwendungssoftware",
  "Software - Infrastructure": "Infrastruktursoftware",
  "Software - Services": "Software-Dienste",
  "Communication Equipment": "Kommunikationsgeräte",
  "Computer Hardware": "Computerhardware",
  "Consumer Electronics": "Unterhaltungselektronik",
  "Hardware, Equipment & Parts": "Hardware und Teile",
  "Semiconductors": "Halbleiter",
  "Technology Distributors": "Technologievertrieb",
  "Media & Entertainment": "Medien und Unterhaltung"
}

interface StockListItem {
  symbol: string
  name: string
  exchange: string
  exchangeShortName: string
  price?: number
  type?: string
}

interface StockProfile {
  symbol: string
  companyName: string
  sector: string
  industry: string
  country: string
  exchange: string
  currency: string
  mktCap?: number
  price?: number
  isin?: string
  website?: string
  description?: string
  ceo?: string
  fullTimeEmployees?: number
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  image?: string
  ipoDate?: string
  isEtf?: boolean
  isActivelyTrading?: boolean
  isAdr?: boolean
  isFund?: boolean
}

interface QuoteData {
  symbol: string
  price: number
  marketCap?: number
}

interface DividendData {
  historical?: Array<{
    date: string
    dividend: number
  }>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    
    // Handle both testMode and testmode (case-insensitive)
    const testMode = body.testMode || body.testmode || false
    
    // Handle both testSymbol (singular) and testSymbols (plural)
    let testSymbols = body.testSymbols || []
    if (body.testSymbol && typeof body.testSymbol === 'string') {
      testSymbols = [body.testSymbol]
    }
    
    const startIndex = body.startIndex || 0
    // Only use batchSize if explicitly provided, otherwise process all stocks
    const batchSize = body.batchSize || null
    
    const FMP_API_KEY = Deno.env.get('FMP_API_KEY') || 'uxE1jVMvI8QQen0a4AEpLFTaqf3KQO0y'
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Starting stock metadata import (testMode: ${testMode}, startIndex: ${startIndex}, batchSize: ${batchSize})`)

    let symbols: string[] = []
    
    if (testMode && testSymbols.length > 0) {
      // Test mode with provided symbols
      symbols = testSymbols
      console.log(`Test mode: Using ${symbols.length} test symbols`)
    } else {
      // Fetch full stock list from FMP API
      console.log('Fetching stock list from FMP API...')
      const listUrl = `https://financialmodelingprep.com/api/v3/stock/list?apikey=${FMP_API_KEY}`
      const listResponse = await fetch(listUrl)
      
      if (!listResponse.ok) {
        throw new Error(`FMP API stock list failed: ${listResponse.status}`)
      }
      
      const stockList: StockListItem[] = await listResponse.json()
      console.log(`Received ${stockList.length} stocks from API`)
      
      // Filter for US stocks (NASDAQ or NYSE)
      const filteredStocks = stockList.filter(stock => 
        stock.type === 'stock' &&
        (stock.exchangeShortName === 'NASDAQ' || stock.exchangeShortName === 'NYSE')
      )
      
      symbols = filteredStocks.map(s => s.symbol)
      console.log(`Filtered to ${symbols.length} US stocks (NASDAQ/NYSE)`)
      
      // Apply startIndex and batchSize for incremental loading (only if batchSize is provided)
      if (batchSize !== null) {
        const endIndex = Math.min(startIndex + batchSize, symbols.length)
        symbols = symbols.slice(startIndex, endIndex)
        console.log(`Processing batch: ${startIndex} to ${endIndex} (${symbols.length} stocks)`)
      } else {
        // Process all stocks
        if (startIndex > 0) {
          symbols = symbols.slice(startIndex)
        }
        console.log(`Processing all stocks: ${symbols.length} stocks (starting from index ${startIndex})`)
      }
    }

    // Rate limit: 750 calls/minute
    // We make 3 API calls per stock (profile, quote, dividend)
    // For 100 stocks = 300 calls
    // Time needed: (300 / 750) * 60 seconds = 24 seconds
    const CALL_DELAY_MS = 120 // 120ms between calls = ~8.3 calls/second = ~500 calls/minute (safe buffer)
    
    let totalProcessed = 0
    let totalInserted = 0
    let totalErrors = 0
    const stockData: any[] = []

    console.log(`Processing ${symbols.length} symbols...`)
    
    // Process each symbol
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i]
      
      try {
        // 1. Fetch profile
        const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_API_KEY}`
        const profileResponse = await fetch(profileUrl)
        await new Promise(resolve => setTimeout(resolve, CALL_DELAY_MS))
        
        if (!profileResponse.ok) {
          console.warn(`Failed to fetch profile for ${symbol}: ${profileResponse.status}`)
          totalErrors++
          continue
        }
        
        const profiles: StockProfile[] = await profileResponse.json()
        
        if (!profiles || profiles.length === 0) {
          console.warn(`No profile data for ${symbol}`)
          totalErrors++
          continue
        }
        
        const profile = profiles[0]
        
        // 2. Fetch quote for current price
        let price = profile.price || null
        let marketCap = profile.mktCap || null
        
        try {
          const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`
          const quoteResponse = await fetch(quoteUrl)
          await new Promise(resolve => setTimeout(resolve, CALL_DELAY_MS))
          
          if (quoteResponse.ok) {
            const quoteData: QuoteData[] = await quoteResponse.json()
            if (quoteData && quoteData.length > 0) {
              price = quoteData[0].price || price
              marketCap = quoteData[0].marketCap || marketCap
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`Could not fetch quote for ${symbol}:`, errorMessage)
        }
        
        // 3. Fetch dividend data
        let lastDividend = null
        
        try {
          const dividendUrl = `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${symbol}?apikey=${FMP_API_KEY}`
          const dividendResponse = await fetch(dividendUrl)
          await new Promise(resolve => setTimeout(resolve, CALL_DELAY_MS))
          
          if (dividendResponse.ok) {
            const dividendData: DividendData = await dividendResponse.json()
            if (dividendData?.historical && dividendData.historical.length > 0) {
              lastDividend = dividendData.historical[0].dividend
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`Could not fetch dividend for ${symbol}:`, errorMessage)
        }
        
        // Translate sector and industry
        const sectorDe = profile.sector ? SECTOR_MAPPING[profile.sector] || null : null
        const industryDe = profile.industry ? INDUSTRY_MAPPING[profile.industry] || null : null
        
        stockData.push({
          symbol: profile.symbol,
          name: profile.companyName || null,
          sector: profile.sector || null,
          sector_de: sectorDe,
          industry: profile.industry || null,
          industry_de: industryDe,
          country: profile.country || null,
          exchange: profile.exchange || null,
          currency: profile.currency || null,
          price: price,
          market_cap: marketCap,
          last_dividend: lastDividend,
          isin: profile.isin || null,
          website: profile.website || null,
          description: profile.description || null,
          ceo: profile.ceo || null,
          full_time_employees: profile.fullTimeEmployees || null,
          phone: profile.phone || null,
          address: profile.address || null,
          city: profile.city || null,
          state: profile.state || null,
          zip: profile.zip || null,
          image: profile.image || null,
          ipo_date: profile.ipoDate || null,
          is_etf: profile.isEtf || false,
          is_actively_trading: profile.isActivelyTrading !== false,
          is_adr: profile.isAdr || false,
          is_fund: profile.isFund || false,
          last_updated: new Date().toISOString()
        })
        
        totalProcessed++
        
        // Log progress every 10 stocks
        if ((i + 1) % 10 === 0) {
          console.log(`Progress: ${i + 1}/${symbols.length} stocks processed`)
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error processing ${symbol}:`, errorMessage)
        totalErrors++
      }
    }
    
    // Insert/update all data in database
    if (stockData.length > 0) {
      console.log(`Upserting ${stockData.length} stocks to database...`)
      
      try {
        const { data, error } = await supabase
          .from('stocks')
          .upsert(stockData, { 
            onConflict: 'symbol',
            ignoreDuplicates: false 
          })
          .select()
        
        if (error) {
          console.error(`Database error:`, error)
          totalErrors += stockData.length
        } else {
          totalInserted = data?.length || 0
          console.log(`Successfully upserted ${totalInserted} stocks`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Database exception:`, errorMessage)
        totalErrors += stockData.length
      }
    }

    // Verify data for test mode
    let verificationResults = null
    if (testMode && testSymbols.length > 0) {
      console.log('Verifying inserted data...')
      const { data: verifyData, error: verifyError } = await supabase
        .from('stocks')
        .select('*')
        .in('symbol', testSymbols)
      
      if (!verifyError) {
        verificationResults = verifyData
        console.log(`Verification: Found ${verifyData?.length} records`)
      }
    }

    const summary = {
      success: true,
      totalProcessed,
      totalInserted,
      totalErrors,
      testMode,
      startIndex,
      endIndex: startIndex + symbols.length,
      hasMore: !testMode && (startIndex + batchSize < 11562), // Approximate total US stocks
      verificationResults
    }

    console.log('Import completed:', summary)

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Import failed:', error)
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
