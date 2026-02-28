-- Add social_media_context column to restaurant_profiles table
ALTER TABLE public.restaurant_profiles 
ADD COLUMN IF NOT EXISTS social_media_context TEXT;
