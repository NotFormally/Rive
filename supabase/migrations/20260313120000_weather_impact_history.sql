-- =============================================================================
-- Weather Impact History — tracks predicted vs actual cover impact per weather event
-- Used to calibrate weather-based cover modifiers over time (self-improving accuracy)
-- =============================================================================

CREATE TABLE IF NOT EXISTS weather_impact_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  weather_date DATE NOT NULL,
  weather_alert_type TEXT NOT NULL CHECK (weather_alert_type IN ('rain', 'storm', 'cold', 'heat', 'snow', 'wind', 'clear')),
  weather_code INTEGER,                        -- WMO weather code (0-99)
  temp_max NUMERIC,                            -- °C
  temp_min NUMERIC,                            -- °C
  precipitation_mm NUMERIC,                    -- mm
  wind_speed_max NUMERIC,                      -- km/h
  predicted_cover_modifier NUMERIC NOT NULL DEFAULT 1.0,  -- What the engine predicted (e.g., 0.75)
  predicted_covers INTEGER,                    -- Estimated covers after weather adjustment
  actual_covers INTEGER,                       -- Actual covers counted (from POS or manual)
  actual_cover_modifier NUMERIC,               -- actual / baseline (computed post-facto)
  baseline_covers INTEGER,                     -- Historical average for this day of week (no weather)
  calibration_score NUMERIC,                   -- 0-100: how accurate the prediction was
  feedback_given_at TIMESTAMPTZ,               -- When chef/manager confirmed actual covers
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(restaurant_id, weather_date)
);

-- Indexes for efficient queries
CREATE INDEX idx_weather_impact_restaurant ON weather_impact_history(restaurant_id);
CREATE INDEX idx_weather_impact_date ON weather_impact_history(weather_date);
CREATE INDEX idx_weather_impact_alert_type ON weather_impact_history(weather_alert_type);

-- RLS
ALTER TABLE weather_impact_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own restaurant weather history"
  ON weather_impact_history FOR SELECT
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert own restaurant weather history"
  ON weather_impact_history FOR INSERT
  WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own restaurant weather history"
  ON weather_impact_history FOR UPDATE
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
    )
  );

-- Auto-update updated_at
CREATE TRIGGER handle_weather_impact_updated_at
  BEFORE UPDATE ON weather_impact_history
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- =============================================================================
-- Weather demand correlation — stores learned category multipliers per restaurant
-- =============================================================================

CREATE TABLE IF NOT EXISTS weather_demand_correlation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  weather_type TEXT NOT NULL CHECK (weather_type IN ('rain', 'storm', 'cold', 'heat', 'snow', 'wind', 'clear')),
  menu_category TEXT NOT NULL,                 -- e.g., 'soups', 'salads', 'hot_beverages', 'cold_desserts'
  demand_multiplier NUMERIC NOT NULL DEFAULT 1.0,  -- Learned multiplier (e.g., 1.35 = +35% demand)
  sample_count INTEGER NOT NULL DEFAULT 0,     -- Number of data points used to compute multiplier
  confidence NUMERIC NOT NULL DEFAULT 0.0,     -- 0-1 confidence based on sample size
  last_calibrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(restaurant_id, weather_type, menu_category)
);

-- Indexes
CREATE INDEX idx_weather_demand_restaurant ON weather_demand_correlation(restaurant_id);
CREATE INDEX idx_weather_demand_type ON weather_demand_correlation(weather_type);

-- RLS
ALTER TABLE weather_demand_correlation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own restaurant demand correlation"
  ON weather_demand_correlation FOR SELECT
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users upsert own restaurant demand correlation"
  ON weather_demand_correlation FOR INSERT
  WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own restaurant demand correlation"
  ON weather_demand_correlation FOR UPDATE
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
    )
  );

-- Auto-update updated_at
CREATE TRIGGER handle_weather_demand_updated_at
  BEFORE UPDATE ON weather_demand_correlation
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
