-- ── Finding: admin_notes exposed to the profile owner ──
-- admin_notes holds internal moderation commentary. Replace the table-level
-- SELECT grant with column-level SELECT on every column EXCEPT admin_notes.
-- Admin code uses the service role (bypasses these grants) and keeps full access.

REVOKE SELECT ON public.worker_profiles FROM anon, authenticated;
GRANT SELECT (
  id, user_id, name, city, nationality, main_role, main_role_years, sub_roles,
  languages, experience, atividade, bio, min_rate, looking_for, available_days,
  time_slots, availability_visible, messages_open, verified, rating, rating_count,
  shifts_completed, avatar_url, created_at, updated_at, residence, portfolio_url,
  atividade_number
) ON public.worker_profiles TO authenticated;

REVOKE SELECT ON public.business_profiles FROM anon, authenticated;
GRANT SELECT (
  id, user_id, business_name, category, city, area, description, is_early_bird,
  verified, rating, rating_count, avatar_url, created_at, updated_at, categories,
  nif, sub_sector, display_initials, languages_required, preferred_roles
) ON public.business_profiles TO authenticated;

-- ── Finding: anon can execute SECURITY DEFINER function is_approved ──
-- It is only used inside RLS policies for signed-in users; anon never needs it.
REVOKE EXECUTE ON FUNCTION public.is_approved(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_approved(uuid) TO authenticated;