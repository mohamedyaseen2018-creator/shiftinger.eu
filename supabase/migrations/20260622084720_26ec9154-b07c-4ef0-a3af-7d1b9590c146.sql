-- Replace the SECURITY DEFINER view `business_profiles_public` with a
-- SECURITY DEFINER function returning only the safe, public columns.
-- This resolves the "Security Definer View" linter finding while keeping
-- sensitive columns (nif, admin_notes) protected and the base table locked.

DROP VIEW IF EXISTS public.business_profiles_public;

CREATE OR REPLACE FUNCTION public.get_public_business_profiles(_user_ids uuid[] DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  business_name text,
  category text,
  sub_sector text,
  city text,
  area text,
  description text,
  categories jsonb,
  preferred_roles jsonb,
  languages_required jsonb,
  display_initials text,
  rating numeric,
  rating_count integer,
  verified boolean,
  is_early_bird boolean,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    bp.id,
    bp.user_id,
    bp.business_name,
    bp.category,
    bp.sub_sector,
    bp.city,
    bp.area,
    bp.description,
    bp.categories,
    bp.preferred_roles,
    bp.languages_required,
    bp.display_initials,
    bp.rating,
    bp.rating_count,
    bp.verified,
    bp.is_early_bird,
    bp.avatar_url,
    bp.created_at,
    bp.updated_at
  FROM public.business_profiles bp
  WHERE bp.verified = true
    AND (_user_ids IS NULL OR bp.user_id = ANY(_user_ids));
$$;

REVOKE ALL ON FUNCTION public.get_public_business_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_business_profiles(uuid[]) TO anon, authenticated;