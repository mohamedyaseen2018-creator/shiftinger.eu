-- 1. Private-offer support on the job status enum (safe in PG15; only used at runtime)
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'private_offer';

-- 2. Offer + confirmation fields on applications
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS offer_type text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS confirmation_message text;

-- 3. Notifications collection
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  related_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_idx
  ON public.notifications (user_id, read, created_at DESC);

-- realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Trigger: new application -> notify business owner (skips business-initiated offers)
CREATE OR REPLACE FUNCTION public.notify_new_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_role text;
BEGIN
  IF NOT NEW.business_confirmed THEN
    SELECT role INTO v_role FROM public.jobs WHERE id = NEW.job_id;
    INSERT INTO public.notifications (user_id, type, title, body, link, related_id)
    VALUES (NEW.owner_id, 'application',
            'New application for ' || COALESCE(v_role, 'a shift'),
            NULL, '/my-jobs', NEW.id);
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_notify_new_application ON public.applications;
CREATE TRIGGER trg_notify_new_application
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_application();

-- 5. Trigger: new message -> notify the other participant
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.conversations%ROWTYPE; recipient uuid; sender_name text;
BEGIN
  SELECT * INTO c FROM public.conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  recipient := CASE WHEN NEW.sender_id = c.worker_id THEN c.business_id ELSE c.worker_id END;
  SELECT COALESCE(bp.business_name, wp.name, 'Someone')
    INTO sender_name
    FROM public.profiles p
    LEFT JOIN public.business_profiles bp ON bp.user_id = p.id
    LEFT JOIN public.worker_profiles wp ON wp.user_id = p.id
    WHERE p.id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, type, title, body, link, related_id)
  VALUES (recipient, 'message',
          'New message from ' || COALESCE(sender_name, 'Someone'),
          left(NEW.body, 80), '/messages', c.id);
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- 6. confirm_application: optional confirmation message + worker notification + seed first chat message
DROP FUNCTION IF EXISTS public.confirm_application(uuid);

CREATE OR REPLACE FUNCTION public.confirm_application(_app_id uuid, _message text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.applications%ROWTYPE; conv_id uuid; v_role text;
BEGIN
  SELECT * INTO a FROM public.applications WHERE id = _app_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF auth.uid() <> a.worker_id AND auth.uid() <> a.owner_id THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  IF auth.uid() = a.worker_id THEN
    UPDATE public.applications SET worker_confirmed = true WHERE id = _app_id;
    a.worker_confirmed := true;
  ELSE
    UPDATE public.applications
      SET business_confirmed = true, status = 'matched',
          confirmation_message = COALESCE(_message, confirmation_message)
      WHERE id = _app_id;
    a.business_confirmed := true;
    a.confirmation_message := COALESCE(_message, a.confirmation_message);
    SELECT role INTO v_role FROM public.jobs WHERE id = a.job_id;
    INSERT INTO public.notifications (user_id, type, title, body, link, related_id)
    VALUES (a.worker_id, 'confirmed', 'Your application was confirmed',
            COALESCE(v_role, 'A shift') || ' — open to confirm', '/applications', _app_id);
  END IF;

  IF a.worker_confirmed AND a.business_confirmed THEN
    UPDATE public.applications SET status = 'confirmed' WHERE id = _app_id;
    SELECT id INTO conv_id FROM public.conversations WHERE application_id = _app_id;
    IF conv_id IS NULL THEN
      INSERT INTO public.conversations (application_id, job_id, worker_id, business_id)
      VALUES (_app_id, a.job_id, a.worker_id, a.owner_id)
      RETURNING id INTO conv_id;
      IF a.confirmation_message IS NOT NULL AND length(trim(a.confirmation_message)) > 0 THEN
        INSERT INTO public.messages (conversation_id, sender_id, body)
        VALUES (conv_id, a.owner_id, a.confirmation_message);
      END IF;
    END IF;
    RETURN conv_id;
  END IF;
  RETURN NULL;
END;$$;

GRANT EXECUTE ON FUNCTION public.confirm_application(uuid, text) TO authenticated;

-- 7. Shift offer from an existing posted shift
CREATE OR REPLACE FUNCTION public.create_shift_offer(_worker_id uuid, _job_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid; v_role text; app_id uuid;
BEGIN
  SELECT owner_id, role INTO v_owner, v_role FROM public.jobs WHERE id = _job_id;
  IF v_owner IS NULL OR v_owner <> auth.uid() THEN RAISE EXCEPTION 'Not authorised'; END IF;
  SELECT id INTO app_id FROM public.applications WHERE job_id = _job_id AND worker_id = _worker_id;
  IF app_id IS NULL THEN
    INSERT INTO public.applications (job_id, worker_id, owner_id, offer_type, business_confirmed, status)
    VALUES (_job_id, _worker_id, auth.uid(), 'public', true, 'matched')
    RETURNING id INTO app_id;
  ELSE
    UPDATE public.applications SET business_confirmed = true, status = 'matched' WHERE id = app_id;
  END IF;
  INSERT INTO public.notifications (user_id, type, title, body, link, related_id)
  VALUES (_worker_id, 'offer', 'Shift offer received',
          'You were offered: ' || COALESCE(v_role, 'a shift'), '/applications', app_id);
  RETURN app_id;
END;$$;

GRANT EXECUTE ON FUNCTION public.create_shift_offer(uuid, uuid) TO authenticated;

-- 8. Private shift offer (not publicly listed)
CREATE OR REPLACE FUNCTION public.create_private_offer(
  _worker_id uuid, _role text, _date date, _start time, _end time, _rate numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_job_id uuid; app_id uuid;
BEGIN
  IF NOT public.is_approved(auth.uid()) THEN RAISE EXCEPTION 'Not authorised'; END IF;
  INSERT INTO public.jobs (owner_id, role, type, date, start_time, end_time, rate, spots, spots_remaining, status)
  VALUES (auth.uid(), _role, 'single', _date, _start, _end, COALESCE(_rate, 0), 1, 1, 'private_offer')
  RETURNING id INTO new_job_id;
  INSERT INTO public.applications (job_id, worker_id, owner_id, offer_type, business_confirmed, status)
  VALUES (new_job_id, _worker_id, auth.uid(), 'private_offer', true, 'matched')
  RETURNING id INTO app_id;
  INSERT INTO public.notifications (user_id, type, title, body, link, related_id)
  VALUES (_worker_id, 'offer', 'Shift offer received',
          'Private offer: ' || _role, '/applications', app_id);
  RETURN app_id;
END;$$;

GRANT EXECUTE ON FUNCTION public.create_private_offer(uuid, text, date, time, time, numeric) TO authenticated;

-- 9. Public reviews for profiles (rating + comment + reviewer name)
CREATE OR REPLACE FUNCTION public.get_public_reviews(_reviewee_id uuid)
RETURNS TABLE(id uuid, rating integer, comment text, created_at timestamptz,
              reviewer_name text, reviewer_type text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.rating, r.comment, r.created_at,
         COALESCE(bp.business_name, wp.name, 'Shiftinger user') AS reviewer_name,
         p.account_type::text AS reviewer_type
  FROM public.reviews r
  LEFT JOIN public.profiles p ON p.id = r.reviewer_id
  LEFT JOIN public.business_profiles bp ON bp.user_id = r.reviewer_id
  LEFT JOIN public.worker_profiles wp ON wp.user_id = r.reviewer_id
  WHERE r.reviewee_id = _reviewee_id
  ORDER BY r.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_reviews(uuid) TO authenticated, anon;