ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS residence text;

ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_position text,
  ADD COLUMN IF NOT EXISTS categories jsonb NOT NULL DEFAULT '[]';