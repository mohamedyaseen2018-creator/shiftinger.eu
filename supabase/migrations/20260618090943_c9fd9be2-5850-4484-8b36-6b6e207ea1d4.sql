-- Remove the SECURITY DEFINER view (flagged by linter) in favour of a scoped function
DROP VIEW IF EXISTS public.applicant_worker_profiles;

CREATE OR REPLACE FUNCTION public.get_applicant_worker_profiles(_worker_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  name text,
  main_role text,
  rating numeric,
  avatar_url text,
  verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wp.user_id, wp.name, wp.main_role, wp.rating, wp.avatar_url, wp.verified
  FROM public.worker_profiles wp
  WHERE wp.user_id = ANY(_worker_ids)
    AND EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.worker_id = wp.user_id
        AND a.owner_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.get_applicant_worker_profiles(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_applicant_worker_profiles(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_applicant_worker_profiles(uuid[]) TO authenticated;