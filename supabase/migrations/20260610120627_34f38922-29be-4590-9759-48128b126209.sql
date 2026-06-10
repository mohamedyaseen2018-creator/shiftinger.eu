-- Views are owned by postgres; writes through auto-updatable views would bypass RLS.
-- Make all public projection views strictly read-only for client roles.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.worker_profiles_public, public.business_profiles_public, public.applicant_worker_profiles
  FROM anon, authenticated;

-- The applicant view is only meaningful for signed-in job owners (it filters on auth.uid()).
REVOKE ALL ON public.applicant_worker_profiles FROM anon;

-- Re-assert read access for the public directory views.
GRANT SELECT ON public.worker_profiles_public, public.business_profiles_public TO anon, authenticated;
GRANT SELECT ON public.applicant_worker_profiles TO authenticated;