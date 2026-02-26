-- Migration: v8 Native Integrations (Libro, Resy, Zenchef)

-- Modify reservation_providers to support standalone API keys and OAuth
ALTER TABLE public.reservation_providers
ADD COLUMN api_key TEXT,
ADD COLUMN oauth_token TEXT,
ADD COLUMN refresh_token TEXT,
ADD COLUMN token_expires_at TIMESTAMPTZ;

-- The webhook_token shouldn't be strictly required anymore, since some integrations might be purely polling (pull)
ALTER TABLE public.reservation_providers
ALTER COLUMN webhook_token DROP NOT NULL;
