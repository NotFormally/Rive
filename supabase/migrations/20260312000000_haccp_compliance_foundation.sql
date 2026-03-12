-- =============================================================================
-- HACCP Compliance Foundation — Phase 1 Tables
-- regulatory_profiles, haccp_checklists, checklist_items,
-- checklist_completions, temperature_logs, temperature_alerts
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. regulatory_profiles — Geo-adaptive compliance engine
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS regulatory_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Jurisdiction identification
  country_code TEXT NOT NULL,            -- ISO 3166-1 alpha-2 (CA, US, FR, JP...)
  region_code TEXT,                       -- Province/state (QC, ON, BC, NY...)
  jurisdiction_name TEXT NOT NULL,        -- Human-readable: "Québec", "New York City"
  regulatory_body TEXT NOT NULL,          -- "MAPAQ", "FDA", "DDPP/DDCSPP"

  -- Temperature limits (Celsius)
  cold_holding_max_c NUMERIC(4,1) NOT NULL DEFAULT 4.0,
  hot_holding_min_c NUMERIC(4,1) NOT NULL DEFAULT 60.0,
  cooking_min_c JSONB DEFAULT '{}',      -- {"poultry": 74, "ground_meat": 71, "fish": 63}
  danger_zone_min_c NUMERIC(4,1) DEFAULT 4.0,
  danger_zone_max_c NUMERIC(4,1) DEFAULT 60.0,
  max_danger_zone_minutes INTEGER DEFAULT 120,

  -- Allergen requirements
  allergen_list JSONB NOT NULL DEFAULT '[]',  -- ["milk","eggs","fish","shellfish",...]
  allergen_count INTEGER NOT NULL DEFAULT 0,
  allergen_display_required BOOLEAN DEFAULT true,

  -- HACCP requirements
  haccp_mandatory BOOLEAN DEFAULT false,
  haccp_plan_required BOOLEAN DEFAULT false,
  digital_records_ok BOOLEAN DEFAULT true,

  -- Inspection & penalties
  inspection_frequency TEXT,              -- "4-6 months", "annual", etc.
  max_fine_local TEXT,                    -- "26 300$ CAD", "Illimité"
  max_fine_usd NUMERIC(12,2),            -- Normalized USD for comparison
  penalty_details JSONB DEFAULT '{}',

  -- Training requirements
  training_required TEXT,                 -- "Manipulation d'aliments", "14h (4h pratique)"
  training_renewal_months INTEGER,

  -- Documentation format
  report_format JSONB DEFAULT '{}',      -- Template config per jurisdiction
  documentation_requirements JSONB DEFAULT '[]',

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  source_url TEXT,                        -- Link to official regulation
  last_verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(country_code, region_code)
);

CREATE INDEX IF NOT EXISTS idx_regulatory_profiles_country ON regulatory_profiles(country_code);
CREATE INDEX IF NOT EXISTS idx_regulatory_profiles_region ON regulatory_profiles(country_code, region_code);

-- ---------------------------------------------------------------------------
-- 2. Link restaurants to their regulatory profile
-- ---------------------------------------------------------------------------
ALTER TABLE restaurant_profiles
  ADD COLUMN IF NOT EXISTS regulatory_profile_id UUID REFERENCES regulatory_profiles(id),
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);

CREATE INDEX IF NOT EXISTS idx_restaurant_regulatory ON restaurant_profiles(regulatory_profile_id);

-- ---------------------------------------------------------------------------
-- 3. haccp_checklists — Template definitions (opening/closing/shift)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS haccp_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,

  name TEXT NOT NULL,                     -- "Ouverture matin", "Fermeture soir"
  description TEXT,
  checklist_type TEXT NOT NULL CHECK (checklist_type IN ('opening', 'closing', 'shift', 'receiving', 'custom')),

  -- Schedule / assignment
  frequency TEXT DEFAULT 'daily',         -- daily, weekly, per_shift
  assigned_roles TEXT[] DEFAULT '{}',     -- ['cook', 'manager', 'all']
  escalation_minutes INTEGER DEFAULT 60,  -- Alert if not completed within N minutes

  -- Template source
  template_source TEXT DEFAULT 'custom',  -- 'mapaq', 'fda', 'custom', 'ai_generated'
  regulatory_profile_id UUID REFERENCES regulatory_profiles(id),

  -- Config
  require_photo BOOLEAN DEFAULT false,
  require_signature BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_haccp_checklists_restaurant ON haccp_checklists(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_haccp_checklists_type ON haccp_checklists(restaurant_id, checklist_type);

-- ---------------------------------------------------------------------------
-- 4. checklist_items — Individual items within a checklist template
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES haccp_checklists(id) ON DELETE CASCADE,

  label TEXT NOT NULL,                    -- "Température frigo 1"
  description TEXT,                       -- Instructions/help text
  item_type TEXT NOT NULL CHECK (item_type IN ('boolean', 'temperature', 'number', 'text', 'photo', 'select')),

  -- Validation rules (type-dependent)
  min_value NUMERIC,                      -- For temperature/number
  max_value NUMERIC,                      -- For temperature/number
  unit TEXT,                              -- "°C", "°F", "ppm"
  options JSONB,                          -- For select: ["Oui","Non","N/A"]

  -- Geo-adaptive: inherit limits from regulatory profile
  use_regulatory_limits BOOLEAN DEFAULT false,  -- If true, min/max come from regulatory_profiles
  regulatory_limit_field TEXT,            -- "cold_holding_max_c", "hot_holding_min_c"

  -- Display
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  category TEXT,                          -- "Réfrigération", "Nettoyage", "Réception"

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist ON checklist_items(checklist_id);

-- ---------------------------------------------------------------------------
-- 5. checklist_completions — Filled checklists (immutable audit trail)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  checklist_id UUID NOT NULL REFERENCES haccp_checklists(id) ON DELETE RESTRICT,
  completed_by UUID NOT NULL REFERENCES auth.users(id),

  -- Completion data
  responses JSONB NOT NULL DEFAULT '{}',  -- { "item_uuid": { "value": 3.5, "passed": true, "photo_url": "..." } }

  -- Summary
  total_items INTEGER NOT NULL DEFAULT 0,
  passed_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  compliance_score NUMERIC(5,2),          -- 0-100%

  -- Deviations
  has_deviations BOOLEAN DEFAULT false,
  deviation_count INTEGER DEFAULT 0,
  corrective_actions_required BOOLEAN DEFAULT false,

  -- Signature & integrity
  signature_data TEXT,                    -- Base64 signature image
  signature_hash TEXT,                    -- SHA-256 of responses + timestamp
  gps_latitude NUMERIC(10,7),
  gps_longitude NUMERIC(10,7),

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ DEFAULT now(),
  duration_seconds INTEGER,

  -- Immutable timestamp
  created_at TIMESTAMPTZ DEFAULT now()
  -- No updated_at: completions are immutable
);

CREATE INDEX IF NOT EXISTS idx_checklist_completions_restaurant ON checklist_completions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_checklist ON checklist_completions(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_date ON checklist_completions(restaurant_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_user ON checklist_completions(completed_by);

-- ---------------------------------------------------------------------------
-- 6. temperature_logs — Individual temperature readings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS temperature_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES auth.users(id),

  -- What was measured
  equipment_name TEXT NOT NULL,           -- "Walk-in cooler 1", "Prep fridge", "Hot line"
  equipment_type TEXT CHECK (equipment_type IN ('cooler', 'freezer', 'hot_holding', 'cooking', 'receiving', 'other')),
  location TEXT,                          -- "Kitchen", "Storage", "Bar"

  -- Reading
  temperature_c NUMERIC(5,1) NOT NULL,
  unit TEXT DEFAULT '°C' CHECK (unit IN ('°C', '°F')),

  -- Validation (computed from regulatory_profiles)
  min_acceptable NUMERIC(5,1),
  max_acceptable NUMERIC(5,1),
  is_within_limits BOOLEAN NOT NULL DEFAULT true,
  deviation_c NUMERIC(5,1),              -- How far outside limits (NULL if within)

  -- Source
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'bluetooth', 'iot', 'probe')),
  sensor_id TEXT,                         -- For IoT/Bluetooth sensors

  -- Context
  food_item TEXT,                         -- "Poulet", "Soupe du jour" (for cooking/receiving)
  batch_id TEXT,                          -- Link to batch/lot tracking
  notes TEXT,
  photo_url TEXT,

  -- Integrity
  gps_latitude NUMERIC(10,7),
  gps_longitude NUMERIC(10,7),

  created_at TIMESTAMPTZ DEFAULT now()
  -- No updated_at: logs are immutable
);

CREATE INDEX IF NOT EXISTS idx_temperature_logs_restaurant ON temperature_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_temperature_logs_date ON temperature_logs(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_temperature_logs_equipment ON temperature_logs(restaurant_id, equipment_name);
CREATE INDEX IF NOT EXISTS idx_temperature_logs_deviations ON temperature_logs(restaurant_id, is_within_limits) WHERE NOT is_within_limits;

-- ---------------------------------------------------------------------------
-- 7. temperature_alerts — Triggered when temp is out of limits
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS temperature_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  temperature_log_id UUID NOT NULL REFERENCES temperature_logs(id) ON DELETE CASCADE,

  -- Alert details
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical', 'emergency')),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('high_temp', 'low_temp', 'danger_zone', 'equipment_failure')),
  message TEXT NOT NULL,

  -- Response tracking
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  corrective_action TEXT,

  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'escalated')),
  escalated_at TIMESTAMPTZ,

  -- Timing
  response_time_seconds INTEGER,         -- Time from alert to acknowledgement

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_temperature_alerts_restaurant ON temperature_alerts(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_temperature_alerts_status ON temperature_alerts(restaurant_id, status) WHERE status != 'resolved';
CREATE INDEX IF NOT EXISTS idx_temperature_alerts_log ON temperature_alerts(temperature_log_id);

-- ---------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

-- regulatory_profiles: public read, admin write
ALTER TABLE regulatory_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read regulatory profiles"
  ON regulatory_profiles FOR SELECT
  USING (true);

-- haccp_checklists: tenant isolation
ALTER TABLE haccp_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view checklists"
  ON haccp_checklists FOR SELECT
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Members can insert checklists"
  ON haccp_checklists FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Members can update checklists"
  ON haccp_checklists FOR UPDATE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Members can delete checklists"
  ON haccp_checklists FOR DELETE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- checklist_items: tenant isolation via parent
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view checklist items"
  ON checklist_items FOR SELECT
  USING (checklist_id IN (
    SELECT id FROM haccp_checklists WHERE restaurant_id IN (SELECT user_restaurant_ids())
  ));

CREATE POLICY "Members can insert checklist items"
  ON checklist_items FOR INSERT
  WITH CHECK (checklist_id IN (
    SELECT id FROM haccp_checklists WHERE restaurant_id IN (SELECT user_restaurant_ids())
  ));

CREATE POLICY "Members can update checklist items"
  ON checklist_items FOR UPDATE
  USING (checklist_id IN (
    SELECT id FROM haccp_checklists WHERE restaurant_id IN (SELECT user_restaurant_ids())
  ));

CREATE POLICY "Members can delete checklist items"
  ON checklist_items FOR DELETE
  USING (checklist_id IN (
    SELECT id FROM haccp_checklists WHERE restaurant_id IN (SELECT user_restaurant_ids())
  ));

-- checklist_completions: tenant isolation + immutability
ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view completions"
  ON checklist_completions FOR SELECT
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Members can insert completions"
  ON checklist_completions FOR INSERT
  WITH CHECK (
    restaurant_id IN (SELECT user_restaurant_ids())
    AND completed_by = auth.uid()
  );

-- NO UPDATE policy: completions are immutable (regulatory compliance)
-- NO DELETE policy: completions cannot be manually deleted

-- temperature_logs: tenant isolation + immutability
ALTER TABLE temperature_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view temperature logs"
  ON temperature_logs FOR SELECT
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Members can insert temperature logs"
  ON temperature_logs FOR INSERT
  WITH CHECK (
    restaurant_id IN (SELECT user_restaurant_ids())
    AND logged_by = auth.uid()
  );

-- NO UPDATE/DELETE: temperature logs are immutable

-- temperature_alerts: tenant isolation with update for resolution
ALTER TABLE temperature_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view alerts"
  ON temperature_alerts FOR SELECT
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Members can insert alerts"
  ON temperature_alerts FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "Members can update alerts"
  ON temperature_alerts FOR UPDATE
  USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- ---------------------------------------------------------------------------
-- 9. Module flag on restaurant_settings
-- ---------------------------------------------------------------------------
ALTER TABLE restaurant_settings
  ADD COLUMN IF NOT EXISTS module_haccp_compliance BOOLEAN DEFAULT TRUE;

-- ---------------------------------------------------------------------------
-- 10. updated_at triggers (for mutable tables only)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_modified_column') THEN
    CREATE TRIGGER update_regulatory_profiles_modtime
      BEFORE UPDATE ON regulatory_profiles
      FOR EACH ROW EXECUTE FUNCTION update_modified_column();

    CREATE TRIGGER update_haccp_checklists_modtime
      BEFORE UPDATE ON haccp_checklists
      FOR EACH ROW EXECUTE FUNCTION update_modified_column();

    CREATE TRIGGER update_temperature_alerts_modtime
      BEFORE UPDATE ON temperature_alerts
      FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;
