-- Drop the overly-broad policy that exposed full worker_profiles rows (PII) to businesses
DROP POLICY IF EXISTS "Businesses can view their applicants worker profiles" ON public.worker_profiles;

-- Recreate the applicant view as a SECURITY DEFINER view that only ever projects safe columns,
-- scoped to the calling business's own applicants. This removes the need for any direct
-- worker_profiles RLS grant to businesses, so the sensitive columns can no longer be read directly.
DROP VIEW IF EXISTS public.applicant_worker_profiles;

CREATE VIEW public.applicant_worker_profiles
WITH (security_invoker = off) AS
SELECT
  wp.user_id,
  wp.name,
  wp.main_role,
  wp.rating,
  wp.avatar_url,
  wp.verified
FROM public.worker_profiles wp
WHERE EXISTS (
  SELECT 1 FROM public.applications a
  WHERE a.worker_id = wp.user_id
    AND a.owner_id = auth.uid()
);

GRANT SELECT ON public.applicant_worker_profiles TO authenticated;