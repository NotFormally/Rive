-- Change utility usage from daily to monthly
ALTER TABLE IF EXISTS public.restaurant_profiles 
RENAME COLUMN daily_electricity_usage_kwh TO monthly_electricity_usage_kwh;

ALTER TABLE IF EXISTS public.restaurant_profiles 
RENAME COLUMN daily_water_usage_l TO monthly_water_usage_l;

ALTER TABLE IF EXISTS public.restaurant_profiles 
ALTER COLUMN monthly_electricity_usage_kwh SET DEFAULT 7350;

ALTER TABLE IF EXISTS public.restaurant_profiles 
ALTER COLUMN monthly_water_usage_l SET DEFAULT 126000;
