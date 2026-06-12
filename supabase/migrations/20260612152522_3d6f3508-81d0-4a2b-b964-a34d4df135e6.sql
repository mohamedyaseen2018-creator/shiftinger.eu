-- Enforce that only APPROVED accounts can create applications / post or edit jobs.
-- Blocked or rejected accounts keep a valid JWT, so these checks must live in RLS,
-- not just in the React UI.

-- Helper: is the current user an approved account?
CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND status = 'approved'
  )
$$;

-- ===== applications =====
-- Replace the broad ALL policy with granular policies so blocked workers can
-- still view/update/withdraw existing applications, but cannot INSERT new ones.
DROP POLICY IF EXISTS "Workers manage own applications" ON public.applications;

CREATE POLICY "Workers view own applications"
  ON public.applications FOR SELECT TO authenticated
  USING (auth.uid() = worker_id);

CREATE POLICY "Approved workers create applications"
  ON public.applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = worker_id AND public.is_approved(auth.uid()));

CREATE POLICY "Workers update own applications"
  ON public.applications FOR UPDATE TO authenticated
  USING (auth.uid() = worker_id)
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers delete own applications"
  ON public.applications FOR DELETE TO authenticated
  USING (auth.uid() = worker_id);

-- ===== jobs =====
-- Replace the broad ALL policy. Approval is required to post (INSERT) and edit
-- (UPDATE) jobs; viewing and deleting own jobs remain available.
DROP POLICY IF EXISTS "Businesses manage own jobs" ON public.jobs;

CREATE POLICY "Businesses view own jobs"
  ON public.jobs FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Approved businesses create jobs"
  ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND public.is_approved(auth.uid()));

CREATE POLICY "Approved businesses update jobs"
  ON public.jobs FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id AND public.is_approved(auth.uid()))
  WITH CHECK (auth.uid() = owner_id AND public.is_approved(auth.uid()));

CREATE POLICY "Businesses delete own jobs"
  ON public.jobs FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);