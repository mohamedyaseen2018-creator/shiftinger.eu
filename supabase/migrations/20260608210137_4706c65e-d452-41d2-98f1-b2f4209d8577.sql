-- worker_profiles: replace the broad owner ALL policy with explicit per-command
-- policies, all strictly scoped to the row owner. This makes the SELECT access
-- restriction explicit (owner-only; admins covered by the admin ALL policy).
DROP POLICY IF EXISTS "Workers manage own worker profile" ON public.worker_profiles;

CREATE POLICY "Workers view own worker profile"
  ON public.worker_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Workers insert own worker profile"
  ON public.worker_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workers update own worker profile"
  ON public.worker_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workers delete own worker profile"
  ON public.worker_profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- business_profiles: same treatment.
DROP POLICY IF EXISTS "Businesses manage own business profile" ON public.business_profiles;

CREATE POLICY "Businesses view own business profile"
  ON public.business_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Businesses insert own business profile"
  ON public.business_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Businesses update own business profile"
  ON public.business_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Businesses delete own business profile"
  ON public.business_profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);