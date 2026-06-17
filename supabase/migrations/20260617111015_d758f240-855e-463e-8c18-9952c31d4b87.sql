-- 1. Remove broad public SELECT policies that exposed full rows (incl. sensitive
--    columns) to anon/authenticated. Public listings are served via service-role
--    server functions that project only safe columns.
DROP POLICY IF EXISTS "Public can view verified business profiles" ON public.business_profiles;
DROP POLICY IF EXISTS "Public can view verified worker profiles" ON public.worker_profiles;

-- 2. Prevent self-elevation of approval flags. Triggers run even for service_role,
--    so we explicitly allow the privileged service_role path and admins.
CREATE OR REPLACE FUNCTION public.guard_worker_verification_flags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.verified IS DISTINCT FROM OLD.verified
      OR NEW.haccp_verified IS DISTINCT FROM OLD.haccp_verified) THEN
    IF auth.role() <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only administrators can change verification status.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_worker_verification_flags ON public.worker_profiles;
CREATE TRIGGER guard_worker_verification_flags
  BEFORE UPDATE ON public.worker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_worker_verification_flags();

CREATE OR REPLACE FUNCTION public.guard_business_verification_flags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.verified IS DISTINCT FROM OLD.verified) THEN
    IF auth.role() <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only administrators can change verification status.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_business_verification_flags ON public.business_profiles;
CREATE TRIGGER guard_business_verification_flags
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_business_verification_flags();

-- 3. Allow business owners to delete their own uploaded documents.
DROP POLICY IF EXISTS "Business docs owner delete" ON storage.objects;
CREATE POLICY "Business docs owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business-docs'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );