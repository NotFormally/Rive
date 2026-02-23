-- Create the signup_notifications table for tracking new signups
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

CREATE TABLE IF NOT EXISTS signup_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_name TEXT NOT NULL,
  email TEXT NOT NULL,
  locale TEXT DEFAULT 'fr',
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE signup_notifications ENABLE ROW LEVEL SECURITY;

-- Allow inserts from the API (anon key)
CREATE POLICY "Allow public inserts" ON signup_notifications
  FOR INSERT TO anon WITH CHECK (true);

-- Allow reads for authenticated users (admin page)
CREATE POLICY "Allow authenticated reads" ON signup_notifications
  FOR SELECT TO authenticated USING (true);
