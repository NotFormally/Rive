-- Rive — Migration v10 : POS Sales
-- Exécuter dans le Supabase SQL Editor

CREATE TABLE IF NOT EXISTS pos_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  menu_item_id TEXT REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity_sold_weekly INT NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, menu_item_id) -- Pour que upsert soit facile
);

-- Row Level Security (RLS)
ALTER TABLE pos_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select pos_sales" ON pos_sales FOR SELECT
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant insert pos_sales" ON pos_sales FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant update pos_sales" ON pos_sales FOR UPDATE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant delete pos_sales" ON pos_sales FOR DELETE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
