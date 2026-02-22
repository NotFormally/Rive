-- Rive — Migration v2 : Auth Multi-Tenancy & Module Toggle
-- Exécuter dans le Supabase SQL Editor APRÈS migration.sql

-- 1. Table des profils restaurant (1 par auth.user)
CREATE TABLE IF NOT EXISTS restaurant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  restaurant_name TEXT NOT NULL DEFAULT 'Mon Restaurant',
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  hours TEXT DEFAULT '',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table des réglages de modules (toggles)
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE UNIQUE,
  module_logbook BOOLEAN DEFAULT true,
  module_menu_editor BOOLEAN DEFAULT true,
  module_food_cost BOOLEAN DEFAULT true,
  module_menu_engineering BOOLEAN DEFAULT true,
  module_instagram BOOLEAN DEFAULT false,
  module_receipt_scanner BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Ajouter restaurant_id aux tables existantes
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurant_profiles(id);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurant_profiles(id);

-- 4. RLS pour restaurant_profiles
ALTER TABLE restaurant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON restaurant_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON restaurant_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON restaurant_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. RLS pour restaurant_settings
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON restaurant_settings FOR SELECT
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own settings"
  ON restaurant_settings FOR UPDATE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own settings"
  ON restaurant_settings FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

-- 6. Mettre à jour les politiques RLS des tables existantes pour le multi-tenancy
-- D'abord, supprimer les anciennes politiques trop permissives
DROP POLICY IF EXISTS "Auth insert menu_categories" ON menu_categories;
DROP POLICY IF EXISTS "Auth update menu_categories" ON menu_categories;
DROP POLICY IF EXISTS "Auth delete menu_categories" ON menu_categories;
DROP POLICY IF EXISTS "Auth insert menu_items" ON menu_items;
DROP POLICY IF EXISTS "Auth update menu_items" ON menu_items;
DROP POLICY IF EXISTS "Auth delete menu_items" ON menu_items;
DROP POLICY IF EXISTS "Auth insert restaurant_info" ON restaurant_info;
DROP POLICY IF EXISTS "Auth update restaurant_info" ON restaurant_info;
DROP POLICY IF EXISTS "Auth delete restaurant_info" ON restaurant_info;

-- Nouvelles politiques tenant-isolées pour menu_categories
CREATE POLICY "Tenant insert menu_categories" ON menu_categories FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant update menu_categories" ON menu_categories FOR UPDATE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant delete menu_categories" ON menu_categories FOR DELETE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

-- Nouvelles politiques tenant-isolées pour menu_items
CREATE POLICY "Tenant insert menu_items" ON menu_items FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant update menu_items" ON menu_items FOR UPDATE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant delete menu_items" ON menu_items FOR DELETE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

-- Note : Le SELECT public reste ouvert pour les visiteurs du menu QR
-- Les données seed existantes n'ont pas de restaurant_id (NULL) et restent
-- accessibles en lecture publique. Les nouvelles données insérées par un
-- restaurateur authentifié seront automatiquement isolées.
