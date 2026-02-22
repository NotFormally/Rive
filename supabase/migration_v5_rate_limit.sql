-- Rive — Migration v5: AI Usage Log for Rate Limiting
-- Run in Supabase SQL Editor

-- 1. Create the usage log table
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE NOT NULL,
  route TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Index for fast rate-limit lookups (restaurant + time range)
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_rate_limit
  ON ai_usage_log (restaurant_id, created_at DESC);

-- 3. Index for usage analytics (route breakdown)
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_route
  ON ai_usage_log (restaurant_id, route);

-- 4. Enable RLS
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

-- 5. Users can only insert/read their own restaurant's logs
CREATE POLICY "Users can insert own usage logs"
  ON ai_usage_log FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own usage logs"
  ON ai_usage_log FOR SELECT
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
