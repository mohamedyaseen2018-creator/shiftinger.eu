CREATE UNIQUE INDEX IF NOT EXISTS worker_contacts_phone_unique
  ON public.worker_contacts (public.normalize_phone(phone))
  WHERE phone IS NOT NULL AND public.normalize_phone(phone) IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS business_contacts_phone_unique
  ON public.business_contacts (public.normalize_phone(phone))
  WHERE phone IS NOT NULL AND public.normalize_phone(phone) IS NOT NULL;

CREATE OR REPLACE FUNCTION public.check_phone_unique_across_tables()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n text;
BEGIN
  n := public.normalize_phone(NEW.phone);
  IF n IS NULL THEN RETURN NEW; END IF;

  IF TG_TABLE_NAME = 'worker_contacts' THEN
    IF EXISTS (SELECT 1 FROM public.business_contacts b
               WHERE public.normalize_phone(b.phone) = n AND b.user_id <> NEW.user_id) THEN
      RAISE EXCEPTION 'duplicate key value: phone number already in use'
        USING ERRCODE = 'unique_violation';
    END IF;
  ELSE
    IF EXISTS (SELECT 1 FROM public.worker_contacts w
               WHERE public.normalize_phone(w.phone) = n AND w.user_id <> NEW.user_id) THEN
      RAISE EXCEPTION 'duplicate key value: phone number already in use'
        USING ERRCODE = 'unique_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_phone_unique_worker ON public.worker_contacts;
CREATE TRIGGER trg_phone_unique_worker
  BEFORE INSERT OR UPDATE ON public.worker_contacts
  FOR EACH ROW EXECUTE FUNCTION public.check_phone_unique_across_tables();

DROP TRIGGER IF EXISTS trg_phone_unique_business ON public.business_contacts;
CREATE TRIGGER trg_phone_unique_business
  BEFORE INSERT OR UPDATE ON public.business_contacts
  FOR EACH ROW EXECUTE FUNCTION public.check_phone_unique_across_tables();