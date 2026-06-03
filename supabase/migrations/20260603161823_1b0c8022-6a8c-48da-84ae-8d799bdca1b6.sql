-- 1. Admin audit log
CREATE TABLE public.admin_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid,
  admin_email text,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  target_label text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log (created_at DESC);

-- 2. Profile status history
CREATE TABLE public.profile_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.profile_status_history TO authenticated;
GRANT ALL ON public.profile_status_history TO service_role;
ALTER TABLE public.profile_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view all status history" ON public.profile_status_history
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own status history" ON public.profile_status_history
  FOR SELECT TO authenticated USING (auth.uid() = profile_id);

CREATE INDEX idx_profile_status_history_profile ON public.profile_status_history (profile_id, created_at);

-- 3. Trigger: record status history automatically on insert / status change
CREATE OR REPLACE FUNCTION public.record_profile_status_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.profile_status_history (profile_id, status, changed_by)
    VALUES (NEW.id, NEW.status::text, auth.uid());
  ELSIF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.profile_status_history (profile_id, status, changed_by)
    VALUES (NEW.id, NEW.status::text, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_record_profile_status_history
AFTER INSERT OR UPDATE OF status ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.record_profile_status_history();