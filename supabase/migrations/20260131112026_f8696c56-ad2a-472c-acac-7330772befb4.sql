-- Drop the broken trigger that expects 'updated_at' column
DROP TRIGGER IF EXISTS update_stock_analysis_cache_updated_at ON public.stock_analysis_cache;