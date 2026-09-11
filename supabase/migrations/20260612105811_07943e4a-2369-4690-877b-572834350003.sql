-- 1) Reviews: restrict direct table reads to the parties involved.
DROP POLICY IF EXISTS "Anyone authenticated can read reviews" ON public.reviews;

CREATE POLICY "Participants and admins can read reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (
  reviewer_id = auth.uid()
  OR reviewee_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

-- 2) user_roles: make admin-only write intent explicit (writes already default-deny).
DROP POLICY IF EXISTS "Admins manage roles - insert" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles - update" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles - delete" ON public.user_roles;

CREATE POLICY "Admins manage roles - insert"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles - update"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles - delete"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));