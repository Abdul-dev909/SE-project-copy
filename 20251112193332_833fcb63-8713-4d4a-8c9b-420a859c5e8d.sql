-- Create categories table for managing service categories
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- Insert default categories
INSERT INTO public.service_categories (name, description) VALUES
  ('Plumbing', 'Plumbing services and repairs'),
  ('Electrical', 'Electrical work and installations'),
  ('Cleaning', 'Cleaning and housekeeping services'),
  ('Painting', 'Painting and decorating'),
  ('Handyman', 'General handyman services'),
  ('Moving', 'Moving and relocation services'),
  ('Yard Work', 'Gardening and landscaping'),
  ('Assembly', 'Furniture assembly and installation')
ON CONFLICT (name) DO NOTHING;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- RLS Policies for service_categories

-- Anyone can view categories
CREATE POLICY "Anyone can view categories"
ON public.service_categories
FOR SELECT
USING (true);

-- Only admins can insert categories
CREATE POLICY "Admins can insert categories"
ON public.service_categories
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can update categories
CREATE POLICY "Admins can update categories"
ON public.service_categories
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Only admins can delete categories
CREATE POLICY "Admins can delete categories"
ON public.service_categories
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_category_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_service_categories_updated_at
BEFORE UPDATE ON public.service_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_category_updated_at();