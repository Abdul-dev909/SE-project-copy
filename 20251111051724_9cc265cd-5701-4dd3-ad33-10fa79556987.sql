-- Fix 1: Drop and recreate the broken RLS policy causing infinite recursion
DROP POLICY IF EXISTS "Service providers can view open jobs" ON public.jobs;

CREATE POLICY "Service providers can view open jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (
  (status = 'open'::job_status) OR 
  (auth.uid() IN (
    SELECT provider_id FROM job_requests 
    WHERE job_requests.job_id = jobs.id
  ))
);

-- Fix 2: Prevent privilege escalation - lock down user_roles table
CREATE POLICY "Prevent role updates"
ON public.user_roles FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Prevent role deletion"
ON public.user_roles FOR DELETE
TO authenticated
USING (false);

-- Fix 3: Add role whitelist validation to prevent client-side role manipulation
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

CREATE POLICY "Users can only assign approved roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  role IN ('homeowner', 'service_provider')
);

-- Fix 4: Allow homeowners to manage job applications (accept/reject)
-- Create helper function to avoid recursion
CREATE OR REPLACE FUNCTION is_job_owner(_user_id uuid, _job_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM jobs
    WHERE id = _job_id AND posted_by = _user_id
  )
$$;

CREATE POLICY "Homeowners can manage requests for their jobs"
ON public.job_requests FOR UPDATE
TO authenticated
USING (public.is_job_owner(auth.uid(), job_id))
WITH CHECK (
  -- Only allow status changes to valid values
  status IN ('pending', 'accepted', 'rejected')
);

-- Fix 5: Allow providers to withdraw pending applications
CREATE POLICY "Providers can delete pending applications"
ON public.job_requests FOR DELETE
TO authenticated
USING (
  auth.uid() = provider_id AND
  status = 'pending'
);