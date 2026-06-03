CREATE POLICY "Owners view applicant worker profiles" ON public.worker_profiles
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.worker_id = worker_profiles.user_id AND a.owner_id = auth.uid()
    )
  );