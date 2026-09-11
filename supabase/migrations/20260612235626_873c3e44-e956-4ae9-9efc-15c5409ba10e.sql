-- Normalize phone numbers to digits-only for reliable comparison
CREATE OR REPLACE FUNCTION public.normalize_phone(_phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT NULLIF(regexp_replace(COALESCE(_phone, ''), '\D', '', 'g'), '')
$$;

-- Permanent ban list (email + phone)
CREATE TABLE public.banned_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  phone text,
  reason text,
  banned_user_id uuid,
  banned_by uuid,
  banned_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.banned_identities TO service_role;

ALTER TABLE public.banned_identities ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (admin server functions) and SECURITY DEFINER
-- helpers may read/write this table. anon/authenticated have no access.

CREATE INDEX idx_banned_identities_email ON public.banned_identities (lower(email));
CREATE INDEX idx_banned_identities_phone ON public.banned_identities (phone);

-- Returns true if the email OR phone is on the ban list
CREATE OR REPLACE FUNCTION public.is_identity_banned(_email text, _phone text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.banned_identities b
    WHERE (_email IS NOT NULL AND b.email IS NOT NULL AND lower(b.email) = lower(_email))
       OR (public.normalize_phone(_phone) IS NOT NULL
           AND b.phone IS NOT NULL
           AND b.phone = public.normalize_phone(_phone))
  )
$$;

-- Block sign-up when the email (or signup phone) is banned
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_type public.account_type;
BEGIN
  IF public.is_identity_banned(NEW.email, NEW.raw_user_meta_data->>'phone') THEN
    RAISE EXCEPTION 'This email or phone number has been banned and cannot be used to register.'
      USING ERRCODE = 'check_violation';
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

-- Block saving a banned phone number on contact rows
CREATE OR REPLACE FUNCTION public.block_banned_phone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_identity_banned(NULL, NEW.phone) THEN
    RAISE EXCEPTION 'This phone number has been banned and cannot be used.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_block_banned_phone_worker
  BEFORE INSERT OR UPDATE OF phone ON public.worker_contacts
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_phone();

CREATE TRIGGER trg_block_banned_phone_business
  BEFORE INSERT OR UPDATE OF phone ON public.business_contacts
  FOR EACH ROW EXECUTE FUNCTION public.block_banned_phone();