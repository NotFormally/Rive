-- Rive — MEGA SCRIPT MIGRATION (Food Cost, Invoices, POS, Integrations, OCR)
-- Exécuter dans le Supabase SQL Editor

-----------------------------------------------------------
-- V8: FOOD COST & RECIPES
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit_cost NUMERIC(10,4) NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  menu_item_id TEXT REFERENCES menu_items(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC(10,4) NOT NULL,
  unit TEXT NOT NULL,
  PRIMARY KEY (recipe_id, ingredient_id)
);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select ingredients" ON ingredients FOR SELECT USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant insert ingredients" ON ingredients FOR INSERT WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant update ingredients" ON ingredients FOR UPDATE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant delete ingredients" ON ingredients FOR DELETE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant select recipes" ON recipes FOR SELECT USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant insert recipes" ON recipes FOR INSERT WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant update recipes" ON recipes FOR UPDATE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant delete recipes" ON recipes FOR DELETE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant select recipe_ingredients" ON recipe_ingredients FOR SELECT USING (recipe_id IN (SELECT id FROM recipes WHERE restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Tenant insert recipe_ingredients" ON recipe_ingredients FOR INSERT WITH CHECK (recipe_id IN (SELECT id FROM recipes WHERE restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Tenant update recipe_ingredients" ON recipe_ingredients FOR UPDATE USING (recipe_id IN (SELECT id FROM recipes WHERE restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Tenant delete recipe_ingredients" ON recipe_ingredients FOR DELETE USING (recipe_id IN (SELECT id FROM recipes WHERE restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid())));

CREATE OR REPLACE FUNCTION update_modified_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_ingredients_modtime BEFORE UPDATE ON ingredients FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_recipes_modtime BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-----------------------------------------------------------
-- V9: INVOICES HEADER
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  total_amount TEXT NOT NULL,
  date DATE NOT NULL,
  top_items TEXT[] DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select invoices" ON invoices FOR SELECT USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant insert invoices" ON invoices FOR INSERT WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant update invoices" ON invoices FOR UPDATE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant delete invoices" ON invoices FOR DELETE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

-----------------------------------------------------------
-- V10: POS SALES
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS pos_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  menu_item_id TEXT REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity_sold_weekly INT NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, menu_item_id)
);

ALTER TABLE pos_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select pos_sales" ON pos_sales FOR SELECT USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant insert pos_sales" ON pos_sales FOR INSERT WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant update pos_sales" ON pos_sales FOR UPDATE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant delete pos_sales" ON pos_sales FOR DELETE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

-----------------------------------------------------------
-- V11: AI CACHE
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_item_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  menu_item_id TEXT REFERENCES menu_items(id) ON DELETE CASCADE,
  recommendation TEXT NOT NULL,
  category TEXT NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, menu_item_id)
);

ALTER TABLE menu_item_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select ai_recommendations" ON menu_item_recommendations FOR SELECT USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant insert ai_recommendations" ON menu_item_recommendations FOR INSERT WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant update ai_recommendations" ON menu_item_recommendations FOR UPDATE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant delete ai_recommendations" ON menu_item_recommendations FOR DELETE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

-----------------------------------------------------------
-- V12: POS INTEGRATIONS & ITEM MAPPING
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurant_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  is_active BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, provider)
);

ALTER TABLE restaurant_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select integrations" ON restaurant_integrations FOR SELECT USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant insert integrations" ON restaurant_integrations FOR INSERT WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant update integrations" ON restaurant_integrations FOR UPDATE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant delete integrations" ON restaurant_integrations FOR DELETE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS pos_item_id TEXT;

-----------------------------------------------------------
-- V13: ADVANCED OCR (INVOICE LINE ITEMS)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC(10,4) NOT NULL DEFAULT 1,
  unit TEXT,
  unit_price NUMERIC(10,4) NOT NULL,
  total_price NUMERIC(10,4) NOT NULL,
  matched_ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select invoice_items" ON invoice_items FOR SELECT USING (invoice_id IN (SELECT id FROM invoices WHERE restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Tenant insert invoice_items" ON invoice_items FOR INSERT WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Tenant update invoice_items" ON invoice_items FOR UPDATE USING (invoice_id IN (SELECT id FROM invoices WHERE restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Tenant delete invoice_items" ON invoice_items FOR DELETE USING (invoice_id IN (SELECT id FROM invoices WHERE restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid())));
