-- Allowlist of pre-authorized admin emails
CREATE TABLE public.admin_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'admin',
  note text,
  added_by uuid,
  added_by_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX admin_emails_email_lower_idx ON public.admin_emails (lower(email));

GRANT SELECT ON public.admin_emails TO authenticated;
GRANT ALL ON public.admin_emails TO service_role;

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin emails"
  ON public.admin_emails FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Helper: is this email pre-authorized as an admin?
CREATE OR REPLACE FUNCTION public.admin_email_role(_email text)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.admin_emails
  WHERE _email IS NOT NULL AND lower(email) = lower(_email)
  LIMIT 1
$$;

-- Updated signup handler: allowlisted emails become admins (no worker/business profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_type public.account_type;
  v_admin_role public.app_role;
BEGIN
  IF public.is_identity_banned(NEW.email, NEW.raw_user_meta_data->>'phone') THEN
    RAISE EXCEPTION 'This email or phone number has been banned and cannot be used to register.'
      USING ERRCODE = 'check_violation';
  END IF;

  v_admin_role := public.admin_email_role(NEW.email);

  -- Pre-authorized admin: create an admin profile, no worker/business records.
  IF v_admin_role IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, account_type, full_name, status)
    VALUES (
      NEW.id,
      NEW.email,
      (('admin')::text)::public.account_type,
      NEW.raw_user_meta_data->>'full_name',
      'approved'
    );

    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_admin_role)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
  END IF;

  v_type := COALESCE((NEW.raw_user_meta_data->>'account_type')::public.account_type, 'worker');

  INSERT INTO public.profiles (id, email, account_type, full_name, status)
  VALUES (
    NEW.id,
    NEW.email,
    v_type,
    NEW.raw_user_meta_data->>'full_name',
    'incomplete'
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  IF v_type = 'worker' THEN
    INSERT INTO public.worker_profiles (user_id, name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (user_id) DO NOTHING;
    UPDATE public.registration_counters SET worker_count = worker_count + 1, updated_at = now() WHERE id = 1;
  ELSE
    INSERT INTO public.business_profiles (user_id, business_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (user_id) DO NOTHING;
    UPDATE public.registration_counters SET business_count = business_count + 1, updated_at = now() WHERE id = 1;
  END IF;

  RETURN NEW;
END;
$function$;