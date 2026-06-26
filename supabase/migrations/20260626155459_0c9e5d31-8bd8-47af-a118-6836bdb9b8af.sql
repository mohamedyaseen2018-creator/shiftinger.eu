-- Add Alvará (business license) number to business profiles for admin management.
ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS alvara text;

-- Keep parity with other non-sensitive, owner-editable columns: allow the
-- authenticated owner (scoped by existing RLS) to read/update their own value.
GRANT SELECT (alvara), UPDATE (alvara) ON public.business_profiles TO authenticated;