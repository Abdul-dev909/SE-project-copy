-- Fix infinite recursion by using SECURITY DEFINER functions

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Service providers can view open jobs" ON public.jobs;
DROP POLICY IF EXISTS "Homeowners can view requests for their jobs" ON public.job_requests;

-- Create helper function to check if provider has applied to a job
CREATE OR REPLACE FUNCTION has_applied_to_job(_user_id uuid, _job_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM job_requests
    WHERE job_id = _job_id AND provider_id = _user_id
  )
$$;

-- Recreate jobs policy using SECURITY DEFINER function (no recursion)
CREATE POLICY "Service providers can view open jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (
  (status = 'open'::job_status) OR 
  public.has_applied_to_job(auth.uid(), id)
);

-- Recreate job_requests policy using SECURITY DEFINER function (no recursion)
CREATE POLICY "Homeowners can view requests for their jobs"
ON public.job_requests FOR SELECT
TO authenticated
USING (
  public.is_job_owner(auth.uid(), job_id)
);