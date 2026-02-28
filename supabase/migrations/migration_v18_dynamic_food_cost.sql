-- ============================================================================
-- Migration v18: Dynamic Food Cost Alerts
--
-- Creates the table to track margin drops and AI recommendations.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.food_cost_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurant_profiles(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    trigger_ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
    previous_cost NUMERIC(10,2),
    new_cost NUMERIC(10,2) NOT NULL,
    ai_recommendation TEXT,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'actioned', 'ignored')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.food_cost_alerts ENABLE ROW LEVEL SECURITY;

-- Team can select their restaurant's alerts
CREATE POLICY "Team select food_cost_alerts" ON public.food_cost_alerts FOR SELECT
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- Team can insert alerts (or the backend API holding service role key can bypass RLS)
CREATE POLICY "Team insert food_cost_alerts" ON public.food_cost_alerts FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));

-- Team can update alert status
CREATE POLICY "Team update food_cost_alerts" ON public.food_cost_alerts FOR UPDATE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Team delete food_cost_alerts" ON public.food_cost_alerts FOR DELETE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- Create an index to quickly pull unread alerts for the dashboard
CREATE INDEX IF NOT EXISTS idx_food_cost_alerts_unread 
  ON public.food_cost_alerts(restaurant_id, status) 
  WHERE status = 'unread';
