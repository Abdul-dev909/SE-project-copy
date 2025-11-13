-- Add bidding system columns to existing tables

-- Add proposed_rate to job_requests table
ALTER TABLE public.job_requests 
ADD COLUMN proposed_rate DECIMAL(10,2);

-- Add assigned_provider_id to jobs table
ALTER TABLE public.jobs
ADD COLUMN assigned_provider_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update job status when offer is accepted (trigger)
CREATE OR REPLACE FUNCTION public.handle_offer_acceptance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a job_request is accepted, update the job
  IF NEW.status = 'accepted' THEN
    -- Update the job to assigned status and set the provider
    UPDATE public.jobs
    SET status = 'assigned', 
        assigned_provider_id = NEW.provider_id
    WHERE id = NEW.job_id;
    
    -- Reject all other pending offers for this job
    UPDATE public.job_requests
    SET status = 'rejected'
    WHERE job_id = NEW.job_id 
      AND id != NEW.id 
      AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for offer acceptance
DROP TRIGGER IF EXISTS on_offer_accepted ON public.job_requests;
CREATE TRIGGER on_offer_accepted
AFTER UPDATE OF status ON public.job_requests
FOR EACH ROW
WHEN (NEW.status = 'accepted')
EXECUTE FUNCTION public.handle_offer_acceptance();

-- Update RLS policies for new workflow

-- Homeowners cannot delete assigned jobs
DROP POLICY IF EXISTS "Homeowners can delete their own jobs" ON public.jobs;
CREATE POLICY "Homeowners can delete their own jobs"
ON public.jobs FOR DELETE
TO authenticated
USING (
  auth.uid() = posted_by AND 
  status != 'assigned'
);

-- Homeowners cannot update assigned jobs to open
DROP POLICY IF EXISTS "Homeowners can update their own jobs" ON public.jobs;
CREATE POLICY "Homeowners can update their own jobs"
ON public.jobs FOR UPDATE
TO authenticated
USING (auth.uid() = posted_by);

-- Assigned providers can update job status
CREATE POLICY "Assigned providers can update job status"
ON public.jobs FOR UPDATE
TO authenticated
USING (auth.uid() = assigned_provider_id);

-- Providers can view jobs they're assigned to
DROP POLICY IF EXISTS "Service providers can view open jobs" ON public.jobs;
CREATE POLICY "Service providers can view open jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (
  (status = 'open') OR 
  public.has_applied_to_job(auth.uid(), id) OR
  (auth.uid() = assigned_provider_id)
);

-- Update job_status enum to include new statuses
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'in_progress' AND enumtypid = 'job_status'::regtype) THEN
    ALTER TYPE job_status ADD VALUE 'in_progress';
  END IF;
END $$;

-- Providers cannot update their offers once submitted
DROP POLICY IF EXISTS "Providers can update their own requests" ON public.job_requests;
CREATE POLICY "Providers can update their own requests"
ON public.job_requests FOR UPDATE
TO authenticated
USING (auth.uid() = provider_id AND status = 'pending');

-- Add index for better performance on assigned jobs
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_provider ON public.jobs(assigned_provider_id);
CREATE INDEX IF NOT EXISTS idx_job_requests_status ON public.job_requests(status);