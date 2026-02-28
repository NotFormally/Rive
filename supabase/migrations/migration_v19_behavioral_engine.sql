-- =============================================================================
-- Migration V19: Behavioral Engine
-- Adds tables for intelligence scoring, daily insights, chef streaks,
-- referral links, and monthly learning reports.
-- =============================================================================

-- 1. Restaurant Intelligence Score (Goal Gradient - Levier 4)
CREATE TABLE IF NOT EXISTS restaurant_intelligence_score (
  restaurant_id UUID PRIMARY KEY REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  level TEXT DEFAULT 'discovery' CHECK (level IN ('discovery', 'operational', 'predictive', 'calibrated', 'expert')),
  libro_connected BOOLEAN DEFAULT false,
  pos_connected BOOLEAN DEFAULT false,
  recipes_entered INTEGER DEFAULT 0,
  feedback_days INTEGER DEFAULT 0,
  feedback_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_feedback_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE restaurant_intelligence_score ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own restaurant intelligence score"
  ON restaurant_intelligence_score FOR SELECT
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own restaurant intelligence score"
  ON restaurant_intelligence_score FOR UPDATE
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own restaurant intelligence score"
  ON restaurant_intelligence_score FOR INSERT
  WITH CHECK (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
  ));

-- 2. Daily Insights (Hook Model - Levier 5)
CREATE TABLE IF NOT EXISTS daily_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  insight_text TEXT NOT NULL,
  insight_type TEXT CHECK (insight_type IN ('discovery', 'record', 'trend', 'correlation')),
  insight_data JSONB DEFAULT '{}',
  shown_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE daily_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own restaurant insights"
  ON daily_insights FOR SELECT
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can insert insights"
  ON daily_insights FOR INSERT
  WITH CHECK (true);

-- 3. Chef Streaks (Hook Model - Levier 5)
CREATE TABLE IF NOT EXISTS chef_streaks (
  restaurant_id UUID PRIMARY KEY REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_feedback_date DATE,
  total_feedback_days INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chef_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chef streaks"
  ON chef_streaks FOR SELECT
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own chef streaks"
  ON chef_streaks FOR UPDATE
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own chef streaks"
  ON chef_streaks FOR INSERT
  WITH CHECK (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
  ));

-- 4. Referral Links (Social Proof - Levier 8)
CREATE TABLE IF NOT EXISTS referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  referred_restaurant_id UUID REFERENCES restaurant_profiles(id),
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral links"
  ON referral_links FOR SELECT
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own referral links"
  ON referral_links FOR INSERT
  WITH CHECK (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
  ));

-- 5. Monthly Reports (Accumulated Loss Aversion - Levier 7)
CREATE TABLE IF NOT EXISTS monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  report_month DATE NOT NULL,
  learnings JSONB NOT NULL DEFAULT '[]',
  stats JSONB NOT NULL DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, report_month)
);

ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own monthly reports"
  ON monthly_reports FOR SELECT
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can insert monthly reports"
  ON monthly_reports FOR INSERT
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_insights_restaurant_date ON daily_insights(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_restaurant_month ON monthly_reports(restaurant_id, report_month DESC);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(code);
