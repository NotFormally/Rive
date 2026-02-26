-- Rive — Migration v12 : POS Integrations & API Keys
-- Exécuter dans le Supabase SQL Editor

-- 1. Table for storing POS integration API Keys
CREATE TABLE IF NOT EXISTS restaurant_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'stripe', 'square', 'lightspeed'
  access_token TEXT, -- Can be access token, api key, or secret
  refresh_token TEXT, -- Optional, if OAuth is used in the future
  is_active BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, provider)
);

-- Row Level Security (RLS) for integrations
ALTER TABLE restaurant_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select integrations" ON restaurant_integrations FOR SELECT
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant insert integrations" ON restaurant_integrations FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant update integrations" ON restaurant_integrations FOR UPDATE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant delete integrations" ON restaurant_integrations FOR DELETE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));


-- 2. Add pos_item_id to menu_items to map internal Rive items to POS systems
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS pos_item_id TEXT;
