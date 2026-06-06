-- 1. Business profiles: remove the broad browsable policy that exposed every column
DROP POLICY IF EXISTS "Verified businesses are browsable" ON public.business_profiles;

-- Safe public browse view (excludes nif and admin_notes)
CREATE OR REPLACE VIEW public.business_profiles_public AS
SELECT id, user_id, business_name, category, sub_sector, city, area, description,
       categories, preferred_roles, languages_required, display_initials,
       rating, rating_count, verified, is_early_bird, avatar_url, created_at, updated_at
FROM public.business_profiles
WHERE verified = true;

GRANT SELECT ON public.business_profiles_public TO anon, authenticated;

-- 2. Worker profiles: remove broad browsable + applicant policies that exposed every column
DROP POLICY IF EXISTS "Approved visible workers are browsable" ON public.worker_profiles;
DROP POLICY IF EXISTS "Owners view applicant worker profiles" ON public.worker_profiles;

-- Safe public browse view for the talent directory (excludes atividade_number and admin_notes)
CREATE OR REPLACE VIEW public.worker_profiles_public AS
SELECT id, user_id, name, city, nationality, main_role, main_role_years, sub_roles,
       languages, atividade, bio, min_rate, looking_for, available_days, time_slots,
       verified, rating, rating_count, shifts_completed, avatar_url, portfolio_url
FROM public.worker_profiles
WHERE verified = true AND availability_visible = true;

GRANT SELECT ON public.worker_profiles_public TO anon, authenticated;

-- Safe view letting a business owner see only the applicants to their own jobs (no sensitive columns)
CREATE OR REPLACE VIEW public.applicant_worker_profiles AS
SELECT wp.user_id, wp.name, wp.main_role, wp.rating, wp.avatar_url, wp.verified
FROM public.worker_profiles wp
WHERE EXISTS (
  SELECT 1 FROM public.applications a
  WHERE a.worker_id = wp.user_id AND a.owner_id = auth.uid()
);

GRANT SELECT ON public.applicant_worker_profiles TO authenticated;