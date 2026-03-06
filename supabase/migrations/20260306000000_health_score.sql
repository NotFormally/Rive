-- =============================================================================
-- Restaurant Health Score — Operational + Visibility Composite
-- =============================================================================

-- Main health score (one per restaurant, upserted on each calculation)
CREATE TABLE IF NOT EXISTS restaurant_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,

  -- Composite
  total_score INTEGER NOT NULL DEFAULT 0,
  grade TEXT NOT NULL DEFAULT 'D',
  confidence NUMERIC DEFAULT 0.0,

  -- Sub-scores (0-100)
  food_cost_score INTEGER DEFAULT 0,
  menu_completeness_score INTEGER DEFAULT 0,
  prep_accuracy_score INTEGER DEFAULT 0,
  variance_score INTEGER DEFAULT 0,
  team_engagement_score INTEGER DEFAULT 0,
  reservation_score INTEGER DEFAULT 0,
  visibility_score INTEGER DEFAULT 0,

  -- Detailed breakdowns + AI recommendations
  sub_score_details JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',

  -- External visibility (Google Places)
  google_place_id TEXT,
  google_rating NUMERIC,
  google_review_count INTEGER,
  google_photos_count INTEGER,
  competitor_data JSONB DEFAULT '[]',
  review_sentiment JSONB DEFAULT '{}',

  -- Bayesian rating state (OpenSkill mu/sigma)
  bayesian_mu NUMERIC DEFAULT 25.0,
  bayesian_sigma NUMERIC DEFAULT 8.333,

  -- Forecast
  trend_forecast JSONB DEFAULT '[]',

  -- Metadata
  active_modules TEXT[] DEFAULT '{}',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(restaurant_id)
);

-- Historical snapshots for trend charts
CREATE TABLE IF NOT EXISTS health_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL,
  food_cost_score INTEGER DEFAULT 0,
  menu_completeness_score INTEGER DEFAULT 0,
  prep_accuracy_score INTEGER DEFAULT 0,
  variance_score INTEGER DEFAULT 0,
  team_engagement_score INTEGER DEFAULT 0,
  reservation_score INTEGER DEFAULT 0,
  visibility_score INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public audit results (lead-gen, no auth required)
CREATE TABLE IF NOT EXISTS public_audit_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id TEXT NOT NULL,
  restaurant_name TEXT,
  address TEXT,
  rating NUMERIC,
  review_count INTEGER,
  photos_count INTEGER,
  attributes JSONB DEFAULT '{}',
  competitors JSONB DEFAULT '[]',
  review_sentiment JSONB DEFAULT '{}',
  gbp_score INTEGER DEFAULT 0,
  review_score INTEGER DEFAULT 0,
  competitive_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  user_email TEXT,
  converted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE restaurant_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own health scores"
  ON restaurant_health_scores FOR ALL
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Users see own health history"
  ON health_score_history FOR ALL
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_health_scores_restaurant ON restaurant_health_scores(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_health_history_restaurant_date ON health_score_history(restaurant_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_audits_place ON public_audit_results(place_id);

-- Module flag
ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS module_health_score BOOLEAN DEFAULT TRUE;
