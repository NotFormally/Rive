-- ============================================
-- Rive — Migration v3: Subscription Tiers
-- ============================================
-- Exécuter dans le Supabase SQL Editor

-- 1. Ajouter les colonnes de gestion d'abonnement
ALTER TABLE restaurant_settings
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_tier IN ('trial', 'essential', 'performance', 'enterprise')),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 2. Mettre à jour les comptes existants en "trial" avec 14 jours à partir de maintenant
UPDATE restaurant_settings
  SET subscription_tier = 'trial',
      trial_ends_at = NOW() + INTERVAL '14 days'
  WHERE subscription_tier IS NULL OR subscription_tier = 'trial';

-- 3. Créer un index pour les lookups Stripe
CREATE INDEX IF NOT EXISTS idx_settings_stripe_customer 
  ON restaurant_settings(stripe_customer_id) 
  WHERE stripe_customer_id IS NOT NULL;
