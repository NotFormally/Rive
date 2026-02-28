-- Migration: Bar & Brewery Features
-- Includes: Unit conversions, Micro-recipes (batches), Keg yields, Deposits, Spoilage, Dynamic Prices, Production

-- 1. Unit Conversions (for dash, drops, oz, etc.)
CREATE TABLE IF NOT EXISTS unit_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  from_unit TEXT NOT NULL,
  to_unit TEXT NOT NULL,
  multiplier NUMERIC(15,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE unit_conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant select unit_conversions" ON unit_conversions FOR SELECT USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant insert unit_conversions" ON unit_conversions FOR INSERT WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant update unit_conversions" ON unit_conversions FOR UPDATE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant delete unit_conversions" ON unit_conversions FOR DELETE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

-- 2. Micro-recipes and Sub-recipes
-- Allow recipes to be marked as "batches" and link them to an ingredient id so they can be reused
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_batch BOOLEAN DEFAULT false;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS yield_quantity NUMERIC(10,4) DEFAULT 1;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS yield_unit TEXT;

-- 3. Keg Yields
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS expected_yield_percentage NUMERIC(5,2) DEFAULT 1.0; -- Default 100%

-- 4. Deposits Ledger
CREATE TABLE IF NOT EXISTS deposits_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL, -- Supplier name is text in invoices
  item_type TEXT NOT NULL, -- "Keg 50L", "Keg 30L", "Glass Bottle"
  deposit_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'held' CHECK (status IN ('held', 'returned', 'lost')),
  returned_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE deposits_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant select deposits_ledger" ON deposits_ledger FOR SELECT USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant insert deposits_ledger" ON deposits_ledger FOR INSERT WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant update deposits_ledger" ON deposits_ledger FOR UPDATE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant delete deposits_ledger" ON deposits_ledger FOR DELETE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

-- 5. Kickbacks & Freebies
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS is_freebie BOOLEAN DEFAULT false;

-- 6. Variance & Spoilage
CREATE TABLE IF NOT EXISTS variance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  period_start DATE,
  period_end DATE,
  theoretical_usage NUMERIC(10,4),
  actual_usage NUMERIC(10,4),
  variance_amount NUMERIC(10,4), -- actual - theoretical
  variance_cost NUMERIC(10,2),   -- variance_amount * unit_cost
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS spoilage_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC(10,4) NOT NULL,
  unit TEXT,
  reason TEXT CHECK (reason IN ('spill', 'spoil', 'comp', 'staff')),
  logged_by TEXT, -- Optional, staff name if no auth for staff
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE variance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant select variance" ON variance_logs FOR SELECT USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant insert variance" ON variance_logs FOR INSERT WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant update variance" ON variance_logs FOR UPDATE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant delete variance" ON variance_logs FOR DELETE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

ALTER TABLE spoilage_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant select spoilage" ON spoilage_reports FOR SELECT USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant insert spoilage" ON spoilage_reports FOR INSERT WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant update spoilage" ON spoilage_reports FOR UPDATE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant delete spoilage" ON spoilage_reports FOR DELETE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

-- 7. Dynamic Prices on Menu Items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS hh_price NUMERIC(10,2);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS late_night_price NUMERIC(10,2);

-- 8. Production Module (Micro-breweries)
CREATE TABLE IF NOT EXISTS production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE, -- the beer recipe
  name TEXT NOT NULL,
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ,
  expected_yield NUMERIC(10,4),
  actual_yield NUMERIC(10,4),
  yield_unit TEXT,
  status TEXT DEFAULT 'fermenting' CHECK (status IN ('fermenting', 'kegged', 'canned')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant select prod_batches" ON production_batches FOR SELECT USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant insert prod_batches" ON production_batches FOR INSERT WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant update prod_batches" ON production_batches FOR UPDATE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant delete prod_batches" ON production_batches FOR DELETE USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
