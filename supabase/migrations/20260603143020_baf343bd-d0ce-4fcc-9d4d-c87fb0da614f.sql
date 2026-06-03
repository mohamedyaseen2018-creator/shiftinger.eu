ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS id_document_url text;

-- Storage policies for the private "worker-docs" bucket
CREATE POLICY "Workers upload own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'worker-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Workers view own documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'worker-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Workers update own documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'worker-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins view all documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'worker-docs' AND public.has_role(auth.uid(), 'admin'));