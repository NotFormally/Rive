-- Rive — Migration: Labor Cost (coût main-d'œuvre)
-- Ajoute les champs de temps, rendement et taux horaire
-- pour calculer la marge réelle (ingrédients + main-d'œuvre)

-- 1. Sur recipes : temps de préparation, cuisson et nombre de portions
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS cook_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS yield_portions INTEGER DEFAULT 1;

-- 2. Sur restaurant_profiles : taux horaire moyen ($/h)
ALTER TABLE restaurant_profiles
  ADD COLUMN IF NOT EXISTS hourly_labor_cost NUMERIC(8,2);
