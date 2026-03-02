-- Add country column to signup_notifications for geographic tracking
ALTER TABLE signup_notifications ADD COLUMN IF NOT EXISTS country TEXT;
