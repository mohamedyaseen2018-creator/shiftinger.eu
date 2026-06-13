-- =====================================================================
-- Security hardening migration
-- 1) Convert the three "public projection" views from SECURITY DEFINER
--    to SECURITY INVOKER so they enforce the querying user's RLS, then
--    back them with scoped RLS policies + column-level grants so the
--    intended marketplace browsing keeps working WITHOUT exposing
--    sensitive columns (admin_notes, nif, atividade_number, residence, etc).
-- 2) Lock down internal-only SECURITY DEFINER functions so they are not
--    directly callable by anon / authenticated API roles.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Views -> security invoker
-- ---------------------------------------------------------------------
ALTER VIEW public.worker_profiles_public SET (security_invoker = on);
ALTER VIEW public.business_profiles_public SET (security_invoker = on);
ALTER VIEW public.applicant_worker_profiles SET (security_invoker = on);

-- ---------------------------------------------------------------------
-- 2. Supporting RLS policies on the base tables
--    (only verified/relevant rows become readable cross-user)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view verified worker profiles" ON public.worker_profiles;
CREATE POLICY "Public can view verified worker profiles"
  ON public.worker_profiles FOR SELECT
  TO anon, authenticated
  USING (verified AND availability_visible);

DROP POLICY IF EXISTS "Businesses can view their applicants worker profiles" ON public.worker_profiles;
CREATE POLICY "Businesses can view their applicants worker profiles"
  ON public.worker_profiles FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.worker_id = worker_profiles.user_id
      AND a.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Public can view verified business profiles" ON public.business_profiles;
CREATE POLICY "Public can view verified business profiles"
  ON public.business_profiles FOR SELECT
  TO anon, authenticated
  USING (verified);

-- ---------------------------------------------------------------------
-- 3. Column-level SELECT grants — ONLY safe, non-sensitive columns.
--    Sensitive columns (admin_notes, nif, atividade_number, residence,
--    phone, etc.) are deliberately excluded, so even a direct base-table
--    query cannot read them as anon/authenticated.
-- ---------------------------------------------------------------------
GRANT SELECT (
  id, user_id, name, city, nationality, main_role, main_role_years,
  sub_roles, languages, atividade, bio, min_rate, looking_for,
  available_days, time_slots, verified, availability_visible,
  rating, rating_count, shifts_completed, avatar_url, portfolio_url
) ON public.worker_profiles TO anon, authenticated;

GRANT SELECT (
  id, user_id, business_name, category, sub_sector, city, area,
  description, categories, preferred_roles, languages_required,
  display_initials, rating, rating_count, verified, is_early_bird,
  avatar_url, created_at, updated_at
) ON public.business_profiles TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. Revoke EXECUTE on internal-only SECURITY DEFINER functions.
--    These are invoked by triggers (which run as their owner) and must
--    never be callable directly from the public API.
-- ---------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.admin_email_role(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.block_banned_phone() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_identity_banned(text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.record_profile_status_history() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;