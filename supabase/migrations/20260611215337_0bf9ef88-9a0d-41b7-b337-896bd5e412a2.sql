-- Allow anonymous (logged-out) visitors to view open jobs on the public Jobs page.
GRANT SELECT ON public.jobs TO anon;

CREATE POLICY "Anyone can view open jobs"
  ON public.jobs
  FOR SELECT
  TO anon
  USING (status = 'open'::job_status);

-- Allow anonymous visitors to read the safe, verified-only public business view
-- (used to show business name/city/area/rating on job cards).
GRANT SELECT ON public.business_profiles_public TO anon;