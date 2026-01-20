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
    const { jobId } = await req.json();

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'jobId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get current job status
    const { data: job, error: fetchError } = await supabaseClient
      .from('scheduled_job_logs')
      .select('id, job_name, status')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (job.status !== 'running') {
      return new Response(
        JSON.stringify({ error: `Job is not running (status: ${job.status})` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Update job status to cancelled
    const { error: updateError } = await supabaseClient
      .from('scheduled_job_logs')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        error_message: 'Job was manually cancelled by admin'
      })
      .eq('id', jobId);

    if (updateError) throw updateError;

    console.log(`Job ${job.job_name} (${jobId}) was manually cancelled`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Job ${job.job_name} was cancelled`,
        jobId: jobId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error stopping job:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
