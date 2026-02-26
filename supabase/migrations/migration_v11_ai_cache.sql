-- Rive — Migration v11 : AI Recommendations Cache
-- Exécuter dans le Supabase SQL Editor

CREATE TABLE IF NOT EXISTS menu_item_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  menu_item_id TEXT REFERENCES menu_items(id) ON DELETE CASCADE,
  recommendation TEXT NOT NULL,
  category TEXT NOT NULL, -- phare, ancre, derive, ecueil
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, menu_item_id) -- Pour que upsert soit facile
);

-- Row Level Security (RLS)
ALTER TABLE menu_item_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select ai_recommendations" ON menu_item_recommendations FOR SELECT
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant insert ai_recommendations" ON menu_item_recommendations FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant update ai_recommendations" ON menu_item_recommendations FOR UPDATE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant delete ai_recommendations" ON menu_item_recommendations FOR DELETE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
