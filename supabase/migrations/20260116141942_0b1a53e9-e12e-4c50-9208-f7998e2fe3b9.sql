-- Create table for tracking scheduled job runs
CREATE TABLE public.scheduled_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  trigger_source TEXT DEFAULT 'cron',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  markets_processed JSONB DEFAULT '[]'::jsonb,
  stocks_full_analyzed INTEGER DEFAULT 0,
  stocks_price_updated INTEGER DEFAULT 0,
  stocks_skipped INTEGER DEFAULT 0,
  stocks_failed INTEGER DEFAULT 0,
  total_api_calls INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_job_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view all logs
CREATE POLICY "Admins can view scheduled job logs"
ON public.scheduled_job_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Service role can insert/update (for edge functions)
CREATE POLICY "Service role can manage scheduled job logs"
ON public.scheduled_job_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_scheduled_job_logs_job_name ON public.scheduled_job_logs(job_name);
CREATE INDEX idx_scheduled_job_logs_started_at ON public.scheduled_job_logs(started_at DESC);
CREATE INDEX idx_scheduled_job_logs_status ON public.scheduled_job_logs(status);

-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;