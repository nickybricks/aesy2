import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Find all jobs that are "running" but started more than 3 hours ago
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    
    const { data: staleJobs, error: fetchError } = await supabaseClient
      .from('scheduled_job_logs')
      .select('id, job_name, started_at')
      .eq('status', 'running')
      .lt('started_at', threeHoursAgo);

    if (fetchError) throw fetchError;

    if (!staleJobs || staleJobs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No stale jobs found',
          cleaned: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Update all stale jobs to "stale" status
    const { error: updateError } = await supabaseClient
      .from('scheduled_job_logs')
      .update({
        status: 'stale',
        completed_at: new Date().toISOString(),
        error_message: 'Job timed out after 3 hours - marked as stale by cleanup'
      })
      .in('id', staleJobs.map(j => j.id));

    if (updateError) throw updateError;

    console.log(`Cleaned up ${staleJobs.length} stale jobs:`, staleJobs.map(j => j.job_name));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleaned up ${staleJobs.length} stale jobs`,
        cleaned: staleJobs.length,
        jobs: staleJobs.map(j => ({ id: j.id, name: j.job_name, startedAt: j.started_at }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error cleaning up stale jobs:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
