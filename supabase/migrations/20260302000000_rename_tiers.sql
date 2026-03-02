-- ============================================
-- Rive — Rename subscription tiers
-- essential → essence, enterprise → intelligence
-- ============================================

-- 1. Drop the old CHECK constraint
ALTER TABLE restaurant_settings
  DROP CONSTRAINT IF EXISTS restaurant_settings_subscription_tier_check;

-- 2. Migrate existing data
UPDATE restaurant_settings SET subscription_tier = 'essence' WHERE subscription_tier = 'essential';
UPDATE restaurant_settings SET subscription_tier = 'intelligence' WHERE subscription_tier = 'enterprise';

-- 3. Add updated CHECK constraint
ALTER TABLE restaurant_settings
  ADD CONSTRAINT restaurant_settings_subscription_tier_check
  CHECK (subscription_tier IN ('trial', 'free', 'essence', 'performance', 'intelligence'));
