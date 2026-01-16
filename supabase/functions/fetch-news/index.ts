import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept-language',
}

interface NewsAPIArticle {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: {
    id: string | null;
    name: string;
  };
  content: string | null;
}

// Relevant financial news sources
const FINANCIAL_DOMAINS = [
  'bloomberg.com',
  'reuters.com',
  'ft.com',
  'wsj.com',
  'cnbc.com',
  'marketwatch.com',
  'barrons.com',
  'seekingalpha.com',
  'investopedia.com',
  'finance.yahoo.com',
  'businessinsider.com',
  'forbes.com'
].join(',');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { ticker, companyName } = await req.json()
    const newsApiKey = Deno.env.get('NEWS_API_KEY')
    
    if (!newsApiKey) {
      throw new Error('NEWS_API_KEY not configured')
    }

    console.log(`Fetching news for ${ticker} (${companyName}) from financial sources`)

    // Search query combining company name and ticker
    const query = `"${companyName}" OR ${ticker}`
    // Force US-only for now due to non-US limitations
    const language = 'en'
    
    // Fetch from NewsAPI with domain filtering
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=${language}&domains=${FINANCIAL_DOMAINS}&sortBy=publishedAt&pageSize=50&apiKey=${newsApiKey}`
    
    console.log(`NewsAPI URL: ${url.replace(newsApiKey, 'REDACTED')}`)
    
    const response = await fetch(url)
    const data = await response.json()

    console.log('NewsAPI Response Status:', response.status)
    console.log('NewsAPI Response Data:', JSON.stringify(data).substring(0, 500))

    if (!response.ok) {
      console.error('NewsAPI error:', data)
      throw new Error(data.message || 'Failed to fetch news')
    }

    console.log(`NewsAPI returned ${data.articles?.length || 0} articles`)
    console.log('Total results available:', data.totalResults)

    const articles = (data.articles || []) as NewsAPIArticle[]

    // Categorize articles
    const categorized = articles.map(article => {
      const isPressRelease = categorizePressRelease(article, companyName, ticker)
      
      return {
        title: article.title,
        image: article.urlToImage || '',
        url: article.url,
        publishedDate: article.publishedAt,
        site: article.source.name,
        symbol: ticker,
        text: article.description || article.content?.substring(0, 200) || '',
        isPressRelease
      }
    })

    const newsItems = categorized.filter(a => !a.isPressRelease)
    const pressReleases = categorized.filter(a => a.isPressRelease)

    console.log(`Categorized: ${newsItems.length} news, ${pressReleases.length} press releases`)

    return new Response(
      JSON.stringify({ newsItems, pressReleases }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in fetch-news function:', error)
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

function categorizePressRelease(article: NewsAPIArticle, companyName: string, ticker: string): boolean {
  const url = article.url.toLowerCase()
  const title = article.title.toLowerCase()
  const source = article.source.name.toLowerCase()
  
  // Check if domain is official company domain or investor relations
  const hasIRDomain = url.includes('investor') || url.includes('/ir/') || url.includes('ir.') || url.includes('investors.')
  
  // Check if source is the company itself
  const isOfficialSource = source.includes(companyName.toLowerCase()) || source.includes(ticker.toLowerCase())
  
  // Check for press release keywords in title
  const pressKeywords = [
    'announces', 'announcement', 'reports', 'reported', 'earnings', 'quarterly',
    'financial results', 'fiscal', 'q1', 'q2', 'q3', 'q4', 'press release',
    'bekanntgabe', 'berichtet', 'quartalsergebnis', 'geschäftsergebnis'
  ]
  const hasPressKeywords = pressKeywords.some(keyword => title.includes(keyword))
  
  // Weighted scoring
  let score = 0
  if (hasIRDomain) score += 3
  if (isOfficialSource) score += 2
  if (hasPressKeywords) score += 1
  
  return score >= 2
}
