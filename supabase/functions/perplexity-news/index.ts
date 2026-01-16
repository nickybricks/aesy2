import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, query, prompt, analysisType } = await req.json();
    
    if (!companyName && !query && !prompt) {
      return new Response(
        JSON.stringify({ error: 'Company name, query or prompt is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    
    if (!perplexityApiKey) {
      console.error('PERPLEXITY_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Perplexity API key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Determine the search query and system prompt based on analysis type
    let searchQuery, systemContent, userContent;
    
    if (analysisType === 'qualitative') {
      // For qualitative analysis, use the provided prompt directly
      searchQuery = prompt;
      systemContent = 'Du bist ein Experte für Aktienanalysen nach Warren Buffetts Investmentprinzipien. Du analysierst Unternehmen anhand aktueller Informationen und bewertest sie strukturiert. Nutze die neuesten verfügbaren Daten und Nachrichten für deine Analyse. Antworte immer auf Deutsch und strukturiert.';
      userContent = prompt;
    } else {
      // For news analysis (default behavior)
      searchQuery = query || `${companyName} aktuelle Nachrichten Geschäftsergebnisse Quartalszahlen 2024 2025`;
      systemContent = 'Du bist ein hilfreicher Assistent für Aktienanalysen. Gib präzise, aktuelle Informationen über Unternehmen zurück. Konzentriere dich auf die wichtigsten aktuellen Entwicklungen, Quartalsergebnisse, strategische Änderungen und Marktposition. Antworte auf Deutsch.';
      userContent = `Gib mir die aktuellsten und wichtigsten Nachrichten zu ${searchQuery}. Fokussiere dich auf: Geschäftsergebnisse, Quartalszahlen, strategische Entwicklungen, Management-Änderungen, Marktposition und relevante Branchennews. Strukturiere die Antwort übersichtlich.`;
    }
    
    console.log('Making Perplexity API request for:', analysisType || 'news', searchQuery);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: analysisType === 'qualitative' ? 'sonar-pro' : 'sonar',
        messages: [
          {
            role: 'system',
            content: systemContent
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        temperature: analysisType === 'qualitative' ? 0.1 : 0.2,
        max_tokens: analysisType === 'qualitative' ? 800 : 1000,
        top_p: 0.9,
        return_related_questions: false,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Perplexity API error:', response.status, errorData);
      return new Response(
        JSON.stringify({ error: `Perplexity API error: ${response.status}` }), 
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('Perplexity API response received');

    if (data.choices && data.choices.length > 0) {
      const content = data.choices[0].message.content;
      
      if (analysisType === 'qualitative') {
        return new Response(
          JSON.stringify({ 
            content: content,
            company: companyName,
            analysisType: analysisType
          }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        return new Response(
          JSON.stringify({ 
            news: content,
            company: companyName,
            searchQuery: searchQuery
          }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'No content received from Perplexity API' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error in perplexity-news function:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});