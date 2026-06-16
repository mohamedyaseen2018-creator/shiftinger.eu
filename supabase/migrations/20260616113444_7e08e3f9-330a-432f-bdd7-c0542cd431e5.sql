-- 1. Business social links
ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS google_maps_url text;

GRANT SELECT (facebook_url, instagram_url, tiktok_url, google_maps_url) ON public.business_profiles TO authenticated, anon;
GRANT UPDATE (facebook_url, instagram_url, tiktok_url, google_maps_url) ON public.business_profiles TO authenticated;

-- 2. Worker HACCP badge flag (admin-set only)
ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS haccp_verified boolean NOT NULL DEFAULT false;

GRANT SELECT (haccp_verified) ON public.worker_profiles TO authenticated, anon;

-- 3. Worker documents: id type + HACCP cert
ALTER TABLE public.worker_documents
  ADD COLUMN IF NOT EXISTS id_document_type text,
  ADD COLUMN IF NOT EXISTS haccp_document_url text;

GRANT SELECT (id_document_type, haccp_document_url), INSERT (id_document_type, haccp_document_url), UPDATE (id_document_type, haccp_document_url) ON public.worker_documents TO authenticated;

-- 4. Business verification documents table
CREATE TABLE IF NOT EXISTS public.business_documents (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type text,
  document_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_documents TO authenticated;
GRANT ALL ON public.business_documents TO service_role;

ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own business documents"
  ON public.business_documents FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all business documents"
  ON public.business_documents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER business_documents_set_updated_at
  BEFORE UPDATE ON public.business_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Public worker view includes HACCP badge flag
CREATE OR REPLACE VIEW public.worker_profiles_public
WITH (security_invoker = true) AS
  SELECT id, user_id, name, city, nationality, main_role, main_role_years,
         sub_roles, languages, atividade, bio, min_rate, looking_for,
         available_days, time_slots, verified, rating, rating_count,
         shifts_completed, avatar_url, portfolio_url, haccp_verified
  FROM public.worker_profiles
  WHERE verified = true AND availability_visible = true;

-- 6. Storage policies: avatars bucket (owner-scoped, admin read)
CREATE POLICY "Avatars owner read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars owner insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars admin read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'));

-- 7. Storage policies: business-docs bucket (owner-scoped, admin read)
CREATE POLICY "Business docs owner read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'business-docs' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Business docs owner insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'business-docs' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Business docs owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'business-docs' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Business docs admin read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'business-docs' AND public.has_role(auth.uid(), 'admin'));