-- Add profile_image_url and bio columns to provider_profiles table
ALTER TABLE public.provider_profiles 
ADD COLUMN IF NOT EXISTS profile_image_url text,
ADD COLUMN IF NOT EXISTS bio text;

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_pictures', 'profile_pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for profile_pictures bucket
CREATE POLICY "Providers can upload their own profile picture"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile_pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Providers can update their own profile picture"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile_pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Providers can delete their own profile picture"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile_pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Profile pictures are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile_pictures');