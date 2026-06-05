ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS admin_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS atividade_number text NOT NULL DEFAULT '';

ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS admin_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS nif text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sub_sector text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS display_initials text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS languages_required jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS preferred_roles jsonb NOT NULL DEFAULT '[]'::jsonb;