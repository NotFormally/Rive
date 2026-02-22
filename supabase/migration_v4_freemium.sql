-- Rive — Migration v4 : Freemium Quotas
-- Exécuter dans le Supabase SQL Editor

-- 1. Ajouter la colonne usage_metrics à restaurant_settings
ALTER TABLE restaurant_settings
  ADD COLUMN IF NOT EXISTS usage_metrics JSONB DEFAULT '{
    "logbook_notes": 0,
    "corrective_actions": 0,
    "translations": 0,
    "menu_engineering": 0,
    "instagram_posts": 0,
    "receipt_scans": 0
  }'::jsonb;

-- 2. Créer une fonction RPC pour incrémenter un quota atomiquement
-- Cela évite les conditions de concurrence (race conditions) si deux employés utilisent l'app en même temps
CREATE OR REPLACE FUNCTION increment_usage(restaurant_uuid UUID, metric_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- S'exécute avec les privilèges du créateur de la fonction pour bypasser RLS sur la maj atomique
AS $$
BEGIN
  UPDATE restaurant_settings
  SET usage_metrics = jsonb_set(
    usage_metrics,
    array[metric_name],
    to_jsonb(COALESCE((usage_metrics->>metric_name)::int, 0) + 1)
  )
  WHERE restaurant_id = restaurant_uuid;
END;
$$;

-- 3. Donner accès à la fonction aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT) TO authenticated;
