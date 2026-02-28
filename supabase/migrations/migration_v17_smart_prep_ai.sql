-- ============================================================================
-- Migration v17: Smart Prep AI Extensions
--
-- Adds AI suggestion columns to prep lists and a context logs table for weather/events.
-- ============================================================================

-- 1. Add AI columns to prep_list_items
ALTER TABLE public.prep_list_items
    ADD COLUMN IF NOT EXISTS ai_suggestion_quantity INTEGER,
    ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;

-- 2. Create context logs for weather and external factors
CREATE TABLE IF NOT EXISTS public.restaurant_context_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurant_profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    weather_data JSONB DEFAULT '{}'::jsonb,
    events_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, log_date)
);

-- Enable RLS
ALTER TABLE public.restaurant_context_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own context logs"
    ON public.restaurant_context_logs FOR SELECT
    USING (restaurant_id IN (
        SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their own context logs"
    ON public.restaurant_context_logs FOR ALL
    USING (restaurant_id IN (
        SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid()
    ));
