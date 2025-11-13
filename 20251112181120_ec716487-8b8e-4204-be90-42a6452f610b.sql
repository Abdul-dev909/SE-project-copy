-- Create ratings table for provider reviews
CREATE TABLE public.provider_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL,
  homeowner_id uuid NOT NULL,
  job_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_ratings ENABLE ROW LEVEL SECURITY;

-- Homeowners can create ratings for completed jobs
CREATE POLICY "Homeowners can create ratings for their completed jobs"
ON public.provider_ratings
FOR INSERT
WITH CHECK (
  auth.uid() = homeowner_id AND
  EXISTS (
    SELECT 1 FROM jobs
    WHERE id = job_id 
    AND posted_by = homeowner_id 
    AND assigned_provider_id = provider_id
    AND status = 'completed'
  )
);

-- Everyone can view ratings
CREATE POLICY "Anyone can view ratings"
ON public.provider_ratings
FOR SELECT
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_provider_ratings_provider_id ON public.provider_ratings(provider_id);
CREATE INDEX idx_provider_ratings_job_id ON public.provider_ratings(job_id);