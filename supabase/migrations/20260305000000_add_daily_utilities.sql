-- Add daily utility usages to restaurant_profiles
ALTER TABLE IF EXISTS public.restaurant_profiles 
ADD COLUMN IF NOT EXISTS daily_electricity_usage_kwh NUMERIC DEFAULT 245,
ADD COLUMN IF NOT EXISTS daily_water_usage_l NUMERIC DEFAULT 4200;
