-- Migration v13: Add customer contact fields to reservations table
-- These fields are populated by the universal webhook from Libro/Resy/Zenchef payloads

ALTER TABLE public.reservations 
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Add module_reservations toggle to restaurant_settings
ALTER TABLE public.restaurant_settings
  ADD COLUMN IF NOT EXISTS module_reservations BOOLEAN DEFAULT true;

-- Index for faster reservation queries by date range (used in dashboard)
CREATE INDEX IF NOT EXISTS idx_reservations_time 
  ON public.reservations (restaurant_id, reservation_time);

-- Index for webhook upsert performance (existing unique constraint helps, but explicit index is clearer)
CREATE INDEX IF NOT EXISTS idx_reservations_external 
  ON public.reservations (restaurant_id, external_id);

