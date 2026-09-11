-- Restore SELECT grant for authenticated on profile tables.
-- RLS policies already restrict rows to the owner (auth.uid() = user_id) and admins,
-- so this does NOT expose other users' data. anon is intentionally left without SELECT;
-- public listings are served via service-role server functions with safe-column projections.
GRANT SELECT ON public.business_profiles TO authenticated;
GRANT SELECT ON public.worker_profiles TO authenticated;