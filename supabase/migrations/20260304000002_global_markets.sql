-- Create global_markets reference table
CREATE TABLE IF NOT EXISTS public.global_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(3) NOT NULL,
  country_name TEXT NOT NULL,
  region TEXT,
  avg_electricity_price_kwh NUMERIC,
  avg_water_price_l NUMERIC,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS setup for global_markets (readable by all authenticated users, editable by admins)
ALTER TABLE public.global_markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read global markets"
  ON public.global_markets FOR SELECT
  USING (auth.role() = 'authenticated');

-- We won't add insert/update policies as this should be an admin-managed reference table for now. 
