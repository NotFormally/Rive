-- ============================================================================
-- Migration v14: Enhanced Reservation System — Polling, Sync Logs & Stats
-- 
-- This migration extends the existing webhook-based reservation system with:
--   1. Polling support fields on reservation_providers (API keys, config, error tracking)
--   2. A reservation_sync_log table for auditing every sync operation
--   3. Performance indexes for common query patterns
--   4. An automatic cleanup function for old sync logs
--   5. A daily stats materialized view for the dashboard
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enrich reservation_providers with polling fields
-- ---------------------------------------------------------------------------

-- API key for providers that support polling (stored encrypted at app level)
ALTER TABLE public.reservation_providers
  ADD COLUMN IF NOT EXISTS api_key TEXT;

-- Toggle: does this provider use polling in addition to (or instead of) webhooks?
ALTER TABLE public.reservation_providers
  ADD COLUMN IF NOT EXISTS polling_enabled BOOLEAN DEFAULT false;

-- How often to poll, in minutes (default 15 min, minimum enforced in app code)
ALTER TABLE public.reservation_providers
  ADD COLUMN IF NOT EXISTS polling_interval_minutes INTEGER DEFAULT 15;

-- Running count of consecutive sync errors (reset on success, used by circuit breaker)
ALTER TABLE public.reservation_providers
  ADD COLUMN IF NOT EXISTS sync_errors_count INTEGER DEFAULT 0;

-- Flexible JSON config per provider (e.g. venue_id for Resy, restaurant_slug for Zenchef)
ALTER TABLE public.reservation_providers
  ADD COLUMN IF NOT EXISTS provider_config JSONB DEFAULT '{}'::jsonb;

-- Timestamp of the last successful poll (distinct from last_sync_at which covers webhooks too)
ALTER TABLE public.reservation_providers
  ADD COLUMN IF NOT EXISTS last_poll_at TIMESTAMPTZ;

-- Comment for clarity
COMMENT ON COLUMN public.reservation_providers.api_key IS 'Provider API key for polling. Encrypted at application level before storage.';
COMMENT ON COLUMN public.reservation_providers.polling_enabled IS 'When true, the cron job will actively poll this provider for new reservations.';
COMMENT ON COLUMN public.reservation_providers.sync_errors_count IS 'Consecutive sync failures. Circuit breaker trips at 5. Reset to 0 on success.';
COMMENT ON COLUMN public.reservation_providers.provider_config IS 'Provider-specific config: { venue_id, restaurant_slug, location_id, etc. }';

-- ---------------------------------------------------------------------------
-- 2. Create reservation_sync_log — Audit trail for every sync operation
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reservation_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES public.reservation_providers(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    
    -- What kind of sync triggered this log entry
    sync_type TEXT NOT NULL CHECK (sync_type IN ('webhook', 'polling', 'manual')),
    
    -- Outcome
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
    
    -- Metrics: how many reservations were created, updated, or failed in this sync
    reservations_created INTEGER DEFAULT 0,
    reservations_updated INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    
    -- If status = 'error', store the error message and details for debugging
    error_message TEXT,
    error_details JSONB,
    
    -- How long did this sync take (milliseconds)
    duration_ms INTEGER,
    
    -- Raw API response summary (truncated, not full payload) for debugging
    api_response_summary JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reservation_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only see sync logs for their own restaurants
CREATE POLICY "Users can view their own sync logs"
    ON public.reservation_sync_log FOR SELECT
    USING (restaurant_id IN (
        SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid()
    ));

-- Admin/service role can insert (used by cron and webhook handlers)
-- Note: supabaseAdmin() bypasses RLS, so no INSERT policy needed for server-side code

-- ---------------------------------------------------------------------------
-- 3. Performance indexes
-- ---------------------------------------------------------------------------

-- Fast lookup for polling cron: "give me all providers that need polling now"
CREATE INDEX IF NOT EXISTS idx_providers_polling_active
    ON public.reservation_providers (polling_enabled, status)
    WHERE polling_enabled = true AND status = 'active';

-- Sync log queries: most recent logs per provider (used in dashboard)
CREATE INDEX IF NOT EXISTS idx_sync_log_provider_created
    ON public.reservation_sync_log (provider_id, created_at DESC);

-- Sync log queries: filter by restaurant and date range (used in stats route)
CREATE INDEX IF NOT EXISTS idx_sync_log_restaurant_created
    ON public.reservation_sync_log (restaurant_id, created_at DESC);

-- Reservation lookups by status and date (used in dashboard filters)
CREATE INDEX IF NOT EXISTS idx_reservations_status_time
    ON public.reservations (restaurant_id, status, reservation_time DESC);

-- ---------------------------------------------------------------------------
-- 4. Automatic cleanup function for old sync logs (keep 90 days)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cleanup_old_sync_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.reservation_sync_log
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Cleaned up % old sync log entries', deleted_count;
    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_sync_logs() IS 'Deletes sync log entries older than 90 days. Call via pg_cron or Supabase scheduled function.';

-- ---------------------------------------------------------------------------
-- 5. Daily reservation stats view (used by /api/reservations/stats)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.reservation_daily_stats AS
SELECT
    r.restaurant_id,
    DATE(r.reservation_time AT TIME ZONE 'UTC') AS reservation_date,
    COUNT(*) AS total_reservations,
    SUM(CASE WHEN r.status = 'booked' THEN 1 ELSE 0 END) AS booked_count,
    SUM(CASE WHEN r.status = 'seated' THEN 1 ELSE 0 END) AS seated_count,
    SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
    SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
    SUM(CASE WHEN r.status = 'no_show' THEN 1 ELSE 0 END) AS no_show_count,
    SUM(r.guest_count) AS total_guests,
    ROUND(AVG(r.guest_count), 1) AS avg_party_size,
    COUNT(DISTINCT r.provider_id) AS active_providers
FROM public.reservations r
GROUP BY r.restaurant_id, DATE(r.reservation_time AT TIME ZONE 'UTC');

COMMENT ON VIEW public.reservation_daily_stats IS 'Aggregated daily reservation metrics per restaurant. Used by the stats API route and dashboard.';

-- ---------------------------------------------------------------------------
-- Done! Summary of changes:
--   - 6 new columns on reservation_providers (api_key, polling_enabled, 
--     polling_interval_minutes, sync_errors_count, provider_config, last_poll_at)
--   - 1 new table: reservation_sync_log (with RLS)
--   - 4 new indexes for performance
--   - 1 cleanup function (cleanup_old_sync_logs)
--   - 1 view (reservation_daily_stats)
-- ---------------------------------------------------------------------------
