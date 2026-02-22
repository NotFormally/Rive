-- Shore Restaurant Brain — Supabase Schema
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Table des catégories du menu
CREATE TABLE IF NOT EXISTS menu_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  icon TEXT
);

-- 2. Table des plats
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(8,2) NOT NULL,
  category_id TEXT REFERENCES menu_categories(id) ON DELETE CASCADE,
  allergens TEXT[] DEFAULT '{}',
  available BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  translations JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table des infos restaurant
CREATE TABLE IF NOT EXISTS restaurant_info (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL,
  tagline TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  hours TEXT DEFAULT '',
  logo_url TEXT
);

-- 4. Row Level Security (RLS)
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_info ENABLE ROW LEVEL SECURITY;

-- Public read access (for QR menu visitors)
CREATE POLICY "Public read menu_categories" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Public read menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public read restaurant_info" ON restaurant_info FOR SELECT USING (true);

-- Authenticated write access (for dashboard admin)
CREATE POLICY "Auth insert menu_categories" ON menu_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update menu_categories" ON menu_categories FOR UPDATE USING (true);
CREATE POLICY "Auth delete menu_categories" ON menu_categories FOR DELETE USING (true);

CREATE POLICY "Auth insert menu_items" ON menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update menu_items" ON menu_items FOR UPDATE USING (true);
CREATE POLICY "Auth delete menu_items" ON menu_items FOR DELETE USING (true);

CREATE POLICY "Auth insert restaurant_info" ON restaurant_info FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update restaurant_info" ON restaurant_info FOR UPDATE USING (true);
CREATE POLICY "Auth delete restaurant_info" ON restaurant_info FOR DELETE USING (true);

-- 5. Seed data: Categories
INSERT INTO menu_categories (id, name, sort_order, icon) VALUES
  ('entrees', 'Entrées', 0, '🥗'),
  ('plats', 'Plats Principaux', 1, '🍽️'),
  ('desserts', 'Desserts', 2, '🍰'),
  ('boissons', 'Boissons', 3, '🥂')
ON CONFLICT (id) DO NOTHING;

-- 6. Seed data: Menu Items
INSERT INTO menu_items (id, name, description, price, category_id, allergens, available, translations) VALUES
  ('1', 'Soupe à l''oignon gratinée', 'Bouillon de bœuf riche, oignons caramélisés, croûton et gruyère fondu.', 12.00, 'entrees', ARRAY['Gluten', 'Produits laitiers'], true,
   '{"en": {"name": "French Onion Soup", "description": "Rich beef broth, caramelized onions, crusty bread, and melted Gruyère."}, "es": {"name": "Sopa de Cebolla Gratinada", "description": "Caldo de res, cebollas caramelizadas, crutón y queso Gruyère fundido."}}'),
  ('2', 'Tartare de Saumon', 'Saumon frais coupé au couteau, avocat, câpres, vinaigrette aux agrumes.', 18.00, 'entrees', ARRAY['Poisson'], true,
   '{"en": {"name": "Salmon Tartare", "description": "Hand-cut fresh salmon, avocado, capers, citrus vinaigrette."}, "es": {"name": "Tartar de Salmón", "description": "Salmón fresco cortado a cuchillo, aguacate, alcaparras, vinagreta cítrica."}}'),
  ('3', 'Bavette de Bœuf Grillée', 'Bavette AAA grillée au charbon, frites maison, sauce au poivre vert.', 32.00, 'plats', ARRAY[]::text[], true,
   '{"en": {"name": "Grilled Flank Steak", "description": "AAA charcoal-grilled flank steak, house-cut fries, green peppercorn sauce."}, "es": {"name": "Bavette de Res a la Parrilla", "description": "Bavette AAA a la parrilla, papas fritas caseras, salsa de pimienta verde."}}'),
  ('4', 'Risotto aux Champignons Sauvages', 'Riz arborio crémeux, cèpes et girolles, parmesan vieilli 24 mois.', 26.00, 'plats', ARRAY['Produits laitiers'], true,
   '{"en": {"name": "Wild Mushroom Risotto", "description": "Creamy arborio rice with porcini and chanterelle mushrooms, 24-month aged Parmesan."}, "es": {"name": "Risotto de Setas Silvestres", "description": "Arroz arborio cremoso, boletus y rebozuelos, parmesano añejado 24 meses."}}'),
  ('5', 'Crème Brûlée à la Vanille', 'Crème infusée à la vanille de Madagascar, caramel croustillant.', 11.00, 'desserts', ARRAY['Produits laitiers', 'Œufs'], true,
   '{"en": {"name": "Vanilla Crème Brûlée", "description": "Madagascar vanilla-infused custard, crisp caramel top."}, "es": {"name": "Crème Brûlée de Vainilla", "description": "Crema infusionada con vainilla de Madagascar, caramelo crujiente."}}'),
  ('6', 'Vin Rouge Maison', 'Cabernet Sauvignon, Vallée de l''Okanagan. Verre 5oz.', 14.00, 'boissons', ARRAY['Sulfites'], true,
   '{"en": {"name": "House Red Wine", "description": "Cabernet Sauvignon, Okanagan Valley. 5oz glass."}, "es": {"name": "Vino Tinto de la Casa", "description": "Cabernet Sauvignon, Valle de Okanagan. Copa de 5oz."}}')
ON CONFLICT (id) DO NOTHING;

-- 7. Seed data: Restaurant Info
INSERT INTO restaurant_info (id, name, tagline, address, phone, hours) VALUES
  ('default', 'Chez Marcel', 'Cuisine française contemporaine', '1234 Rue Saint-Denis, Montréal, QC', '(514) 555-0147', 'Mar-Sam : 17h-23h | Dim : 10h-15h (Brunch)')
ON CONFLICT (id) DO NOTHING;
