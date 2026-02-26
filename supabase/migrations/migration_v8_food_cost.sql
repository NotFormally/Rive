-- Rive — Migration v8 : Food Cost & Recipes
-- Exécuter dans le Supabase SQL Editor

-- 1. Table des ingrédients
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit_cost NUMERIC(10,4) NOT NULL, -- Plus de précision pour les coûts unitaires
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table des recettes (lien entre plat et ses ingrédients)
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  menu_item_id TEXT REFERENCES menu_items(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table de jointure: Ingrédients d'une recette
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC(10,4) NOT NULL,
  unit TEXT NOT NULL, -- L'unité utilisée dans la recette peut être différente de l'unité de base de l'ingrédient, nécessitant conversion côté client ou backend
  PRIMARY KEY (recipe_id, ingredient_id)
);

-- 4. Row Level Security (RLS)
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Politiques pour ingredients
CREATE POLICY "Tenant select ingredients" ON ingredients FOR SELECT
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant insert ingredients" ON ingredients FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant update ingredients" ON ingredients FOR UPDATE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant delete ingredients" ON ingredients FOR DELETE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

-- Politiques pour recipes
CREATE POLICY "Tenant select recipes" ON recipes FOR SELECT
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant insert recipes" ON recipes FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant update recipes" ON recipes FOR UPDATE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Tenant delete recipes" ON recipes FOR DELETE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

-- Politiques pour recipe_ingredients
CREATE POLICY "Tenant select recipe_ingredients" ON recipe_ingredients FOR SELECT
  USING (recipe_id IN (SELECT id FROM recipes WHERE restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Tenant insert recipe_ingredients" ON recipe_ingredients FOR INSERT
  WITH CHECK (recipe_id IN (SELECT id FROM recipes WHERE restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Tenant update recipe_ingredients" ON recipe_ingredients FOR UPDATE
  USING (recipe_id IN (SELECT id FROM recipes WHERE restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Tenant delete recipe_ingredients" ON recipe_ingredients FOR DELETE
  USING (recipe_id IN (SELECT id FROM recipes WHERE restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid())));

-- Optionnel: Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ingredients_modtime
    BEFORE UPDATE ON ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_recipes_modtime
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
