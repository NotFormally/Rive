-- Migration v20: Smart Logbook persistence
-- Stores logbook entries in the database instead of client-only state

CREATE TABLE IF NOT EXISTS smartlogbook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  sentiment TEXT CHECK (sentiment IN ('Positive','Neutral','Negative')),
  original_language TEXT,
  summary TEXT,
  is_urgent BOOLEAN DEFAULT false,
  translations JSONB DEFAULT '{}',
  receipt_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logbook_restaurant ON smartlogbook_entries(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_logbook_created ON smartlogbook_entries(created_at DESC);

ALTER TABLE smartlogbook_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their restaurant logbook entries"
  ON smartlogbook_entries FOR ALL
  USING (restaurant_id IN (
    SELECT rm.restaurant_id FROM restaurant_members rm
    WHERE rm.user_id = auth.uid() AND rm.accepted_at IS NOT NULL
  ));
