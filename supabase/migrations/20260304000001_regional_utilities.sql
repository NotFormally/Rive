-- Add country, region, and utilities pricing to restaurant_profiles
ALTER TABLE IF EXISTS public.restaurant_profiles 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS electricity_price_kwh NUMERIC DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS water_price_l NUMERIC DEFAULT 0.0;
