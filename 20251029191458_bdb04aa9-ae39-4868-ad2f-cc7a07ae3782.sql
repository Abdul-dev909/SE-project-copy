-- Create provider_profiles table to store provider-specific information
CREATE TABLE public.provider_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  skill_category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

-- Providers can view their own profile
CREATE POLICY "Providers can view their own profile"
ON public.provider_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Providers can insert their own profile during signup
CREATE POLICY "Providers can create their own profile"
ON public.provider_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Providers can update their own profile
CREATE POLICY "Providers can update their own profile"
ON public.provider_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Homeowners can view provider profiles (for browsing providers)
CREATE POLICY "Anyone can view provider profiles"
ON public.provider_profiles
FOR SELECT
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_provider_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_provider_profiles_updated_at
BEFORE UPDATE ON public.provider_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_provider_updated_at();