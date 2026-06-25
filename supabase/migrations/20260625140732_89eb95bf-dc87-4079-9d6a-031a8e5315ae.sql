-- Security hardening for final brand release

-- 1. Registration counters expose platform growth metrics + capacity limits
--    and are only ever read/written by server functions (service role).
--    Remove all public read access.
DROP POLICY IF EXISTS "Anyone can read counters" ON public.registration_counters;
REVOKE SELECT ON public.registration_counters FROM anon;
REVOKE SELECT ON public.registration_counters FROM authenticated;

-- 2. Roles may only be assigned by admins / service role. Make the absence of
--    write access for regular users explicit (defense-in-depth against any
--    indirect privilege-escalation path).
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;