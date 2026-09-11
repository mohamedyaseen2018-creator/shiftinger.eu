-- Make the curated public business view readable by everyone.
-- The view only exposes safe columns (no nif, admin_notes, or social URLs)
-- and is filtered to verified businesses. Running it as a definer view lets
-- the public job feed show business name, category, area and city without
-- opening broad row access (and the sensitive nif) on the base table.
ALTER VIEW public.business_profiles_public SET (security_invoker = off);
GRANT SELECT ON public.business_profiles_public TO anon, authenticated;