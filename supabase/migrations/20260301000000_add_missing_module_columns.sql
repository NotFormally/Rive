-- Add missing module columns to restaurant_settings
-- These modules exist in TIER_CONFIG (subscription-tiers.ts) but had no DB columns

ALTER TABLE public.restaurant_settings
  ADD COLUMN IF NOT EXISTS module_deposits BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_variance BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_production BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- Fix existing free-tier users who have module_menu_engineering/instagram/receipt_scanner
-- incorrectly set to false (signup bug — these modules are available on free tier with quotas)
UPDATE public.restaurant_settings
SET
  module_menu_engineering = true,
  module_instagram = true,
  module_receipt_scanner = true
WHERE (subscription_tier = 'free' OR subscription_tier IS NULL)
  AND (module_menu_engineering = false OR module_instagram = false OR module_receipt_scanner = false);
