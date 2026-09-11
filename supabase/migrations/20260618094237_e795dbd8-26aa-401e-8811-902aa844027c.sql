-- ============================================================
-- 1. Hide admin_notes from non-admins (business_profiles)
--    Admin console reads/writes via service role (bypasses these grants).
--    Client owner reads use explicit column lists that exclude admin_notes.
-- ============================================================
REVOKE SELECT, UPDATE ON public.business_profiles FROM authenticated;

GRANT SELECT (
  id, user_id, business_name, category, city, area, description, is_early_bird,
  verified, rating, rating_count, avatar_url, created_at, updated_at, categories,
  nif, sub_sector, display_initials, languages_required, preferred_roles,
  facebook_url, instagram_url, tiktok_url, google_maps_url
) ON public.business_profiles TO authenticated;

GRANT UPDATE (
  id, user_id, business_name, category, city, area, description, is_early_bird,
  verified, rating, rating_count, avatar_url, created_at, updated_at, categories,
  nif, sub_sector, display_initials, languages_required, preferred_roles,
  facebook_url, instagram_url, tiktok_url, google_maps_url
) ON public.business_profiles TO authenticated;

-- ============================================================
-- 2. Hide admin_notes from non-admins (worker_profiles) — same latent risk.
-- ============================================================
REVOKE SELECT, UPDATE ON public.worker_profiles FROM authenticated;

GRANT SELECT (
  id, user_id, name, city, nationality, main_role, main_role_years, sub_roles,
  languages, experience, atividade, bio, min_rate, looking_for, available_days,
  time_slots, availability_visible, messages_open, verified, rating, rating_count,
  shifts_completed, avatar_url, created_at, updated_at, residence, portfolio_url,
  atividade_number, haccp_verified
) ON public.worker_profiles TO authenticated;

GRANT UPDATE (
  id, user_id, name, city, nationality, main_role, main_role_years, sub_roles,
  languages, experience, atividade, bio, min_rate, looking_for, available_days,
  time_slots, availability_visible, messages_open, verified, rating, rating_count,
  shifts_completed, avatar_url, created_at, updated_at, residence, portfolio_url,
  atividade_number, haccp_verified
) ON public.worker_profiles TO authenticated;

-- ============================================================
-- 3. contact_reveals: only the service-role server process logs reveals.
--    Remove direct authenticated INSERT path (was: WITH CHECK business_id = auth.uid()).
-- ============================================================
DROP POLICY IF EXISTS "Businesses can insert their own reveal log" ON public.contact_reveals;
REVOKE INSERT ON public.contact_reveals FROM authenticated;