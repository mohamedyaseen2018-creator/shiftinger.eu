-- Defensive, idempotent hardening: ensure sensitive columns are never readable
-- by anon/authenticated roles. REVOKE is a no-op when no grant exists, but it
-- documents intent and guards against accidental future broad grants.

REVOKE SELECT (nif, admin_notes) ON public.business_profiles FROM anon;
REVOKE SELECT (nif, admin_notes) ON public.business_profiles FROM authenticated;

REVOKE SELECT (admin_notes, atividade_number, residence) ON public.worker_profiles FROM anon;
REVOKE SELECT (admin_notes, atividade_number, residence) ON public.worker_profiles FROM authenticated;

-- Also ensure no broad table-level SELECT exists on the base tables.
REVOKE SELECT ON public.business_profiles FROM anon;
REVOKE SELECT ON public.business_profiles FROM authenticated;
REVOKE SELECT ON public.worker_profiles FROM anon;
REVOKE SELECT ON public.worker_profiles FROM authenticated;
