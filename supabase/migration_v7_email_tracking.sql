-- ============================================
-- Rive — Migration v7: Email Tracking
-- ============================================
-- Run in Supabase SQL Editor

ALTER TABLE restaurant_settings
  ADD COLUMN IF NOT EXISTS email_trial_7_sent   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_trial_3_sent   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_trial_expired_sent BOOLEAN NOT NULL DEFAULT FALSE;
