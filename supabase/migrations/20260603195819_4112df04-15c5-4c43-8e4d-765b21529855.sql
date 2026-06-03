-- =========================================================
-- 1. Move worker phone into a private contacts table
-- =========================================================
CREATE TABLE public.worker_contacts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.worker_contacts TO authenticated;
GRANT ALL ON public.worker_contacts TO service_role;

ALTER TABLE public.worker_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers manage own contact"
  ON public.worker_contacts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage worker contacts"
  ON public.worker_contacts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_worker_contacts_updated_at
  BEFORE UPDATE ON public.worker_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- migrate existing phone numbers
INSERT INTO public.worker_contacts (user_id, phone)
SELECT user_id, phone
FROM public.worker_profiles
WHERE phone IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- remove broadly-exposed phone column
ALTER TABLE public.worker_profiles DROP COLUMN phone;

-- =========================================================
-- 2. Allow workers to delete their own documents
-- =========================================================
CREATE POLICY "Workers delete own docs"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'worker-docs'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- =========================================================
-- 3. Remove direct execute on trigger-only definer functions
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.record_profile_status_history() FROM anon, authenticated, public;