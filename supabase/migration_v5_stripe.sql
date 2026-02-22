-- Rive — Migration v5 : Stripe Webhook Securisé
-- Exécuter dans le Supabase SQL Editor

-- Fonction pour permettre au backend (via Webhook Stripe validé) de modifier les forfaits 
-- sans avoir besoin de la clé SUPABASE_SERVICE_ROLE_KEY (grâce à SECURITY DEFINER)
CREATE OR REPLACE FUNCTION update_subscription_from_stripe(
  p_restaurant_id UUID,
  p_stripe_customer_id TEXT,
  p_stripe_subscription_id TEXT,
  p_tier TEXT
) RETURNS void AS $$
BEGIN
  UPDATE restaurant_settings
  SET 
    stripe_customer_id = p_stripe_customer_id,
    stripe_subscription_id = p_stripe_subscription_id,
    subscription_tier = p_tier
  WHERE restaurant_id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- S'assurer que le rôle anonyme ou authentifié peut l'appeler :
GRANT EXECUTE ON FUNCTION update_subscription_from_stripe(UUID, TEXT, TEXT, TEXT) TO authenticated, anon;
