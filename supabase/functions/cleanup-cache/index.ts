import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Deleting entries without criteria object from stock_analysis_cache...')
    
    // First count how many will be deleted
    const { count: beforeCount } = await supabaseClient
      .from('stock_analysis_cache')
      .select('*', { count: 'exact', head: true })

    // Delete entries where analysis_result->'criteria' is null
    const { error, count: deletedCount } = await supabaseClient
      .from('stock_analysis_cache')
      .delete()
      .is('analysis_result->criteria', null)

    if (error) {
      console.error('Error deleting records:', error)
      throw error
    }

    // Count remaining
    const { count: afterCount } = await supabaseClient
      .from('stock_analysis_cache')
      .select('*', { count: 'exact', head: true })

    console.log(`Successfully deleted ${deletedCount ?? 'unknown'} records. Before: ${beforeCount}, After: ${afterCount}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Cleaned up stock_analysis_cache`,
        before: beforeCount,
        deleted: deletedCount,
        after: afterCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in cleanup-cache:', error)
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
