-- Freemium model: all modules accessible for all tiers (quotas limit AI usage, not module access)

-- 1. Ensure ALL module columns exist (some migrations may not have been applied)
ALTER TABLE public.restaurant_settings
  ADD COLUMN IF NOT EXISTS module_logbook BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS module_menu_editor BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS module_food_cost BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_menu_engineering BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS module_instagram BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS module_receipt_scanner BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS module_reservations BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS module_smart_prep BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS module_deposits BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS module_variance BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS module_production BOOLEAN DEFAULT true;

-- 2. Enable all modules for existing users (old defaults had many set to false)
UPDATE public.restaurant_settings
SET
  module_logbook = true,
  module_menu_editor = true,
  module_food_cost = true,
  module_menu_engineering = true,
  module_instagram = true,
  module_receipt_scanner = true,
  module_reservations = true,
  module_smart_prep = true,
  module_deposits = true,
  module_variance = true,
  module_production = true;
