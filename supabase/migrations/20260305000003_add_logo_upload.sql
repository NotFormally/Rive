-- Add logo_url to restaurant_profiles if it doesn't exist
ALTER TABLE IF EXISTS public.restaurant_profiles 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create the restaurant-logos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-logos', 'restaurant-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for the storage bucket
-- (Note: RLS is already enabled natively by Supabase for storage.objects)

-- Allow public viewing
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'restaurant-logos');

-- Allow authenticated users to upload logos
CREATE POLICY "Auth Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'restaurant-logos' AND auth.role() = 'authenticated');

-- Allow users to update their own uploads (optional, but good practice)
CREATE POLICY "Auth Update" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'restaurant-logos' AND auth.role() = 'authenticated');

-- Allow users to delete their own uploads
CREATE POLICY "Auth Delete" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'restaurant-logos' AND auth.role() = 'authenticated');
