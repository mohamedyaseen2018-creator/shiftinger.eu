-- Allow participants to create their conversation (used as fallback; RPC also inserts)
CREATE POLICY "Participants create conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = worker_id OR auth.uid() = business_id);

-- Confirm an application; opens a conversation when both sides confirm.
CREATE OR REPLACE FUNCTION public.confirm_application(_app_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.applications%ROWTYPE;
  conv_id uuid;
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
    UPDATE public.applications SET business_confirmed = true, status = 'matched' WHERE id = _app_id;
    a.business_confirmed := true;
  END IF;

  IF a.worker_confirmed AND a.business_confirmed THEN
    UPDATE public.applications SET status = 'confirmed' WHERE id = _app_id;
    SELECT id INTO conv_id FROM public.conversations WHERE application_id = _app_id;
    IF conv_id IS NULL THEN
      INSERT INTO public.conversations (application_id, job_id, worker_id, business_id)
      VALUES (_app_id, a.job_id, a.worker_id, a.owner_id)
      RETURNING id INTO conv_id;
    END IF;
    RETURN conv_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Agree to work; business can also reveal the location.
CREATE OR REPLACE FUNCTION public.set_agreement(_conversation_id uuid, _send_location boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.conversations%ROWTYPE;
BEGIN
  SELECT * INTO c FROM public.conversations WHERE id = _conversation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conversation not found'; END IF;
  IF auth.uid() <> c.worker_id AND auth.uid() <> c.business_id THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  IF auth.uid() = c.worker_id THEN
    UPDATE public.conversations SET worker_agreed = true WHERE id = _conversation_id;
  ELSE
    UPDATE public.conversations
      SET business_agreed = true,
          location_shared = CASE WHEN _send_location THEN true ELSE location_shared END
      WHERE id = _conversation_id;
  END IF;

  UPDATE public.conversations
    SET status = CASE WHEN worker_agreed AND business_agreed THEN 'agreed' ELSE status END,
        applications_status_dummy = applications_status_dummy
    WHERE id = _conversation_id;
END;
$$;

-- End the job (either side).
CREATE OR REPLACE FUNCTION public.end_job(_conversation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.conversations%ROWTYPE;
BEGIN
  SELECT * INTO c FROM public.conversations WHERE id = _conversation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conversation not found'; END IF;
  IF auth.uid() = c.worker_id THEN
    UPDATE public.conversations SET worker_ended = true WHERE id = _conversation_id;
  ELSIF auth.uid() = c.business_id THEN
    UPDATE public.conversations SET business_ended = true WHERE id = _conversation_id;
  ELSE
    RAISE EXCEPTION 'Not authorised';
  END IF;
END;
$$;

-- Submit a review; aggregates rating and closes the job when both have reviewed.
CREATE OR REPLACE FUNCTION public.submit_review(_conversation_id uuid, _rating int, _comment text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.conversations%ROWTYPE;
  reviewee uuid;
  reviews_count int;
BEGIN
  IF _rating < 1 OR _rating > 5 THEN RAISE EXCEPTION 'Rating must be 1-5'; END IF;
  SELECT * INTO c FROM public.conversations WHERE id = _conversation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conversation not found'; END IF;
  IF auth.uid() <> c.worker_id AND auth.uid() <> c.business_id THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  reviewee := CASE WHEN auth.uid() = c.worker_id THEN c.business_id ELSE c.worker_id END;

  INSERT INTO public.reviews (conversation_id, job_id, reviewer_id, reviewee_id, rating, comment)
  VALUES (_conversation_id, c.job_id, auth.uid(), reviewee, _rating, _comment)
  ON CONFLICT (conversation_id, reviewer_id) DO NOTHING;

  -- update reviewee aggregate rating (worker or business)
  UPDATE public.worker_profiles wp SET
    rating = sub.avg_rating, rating_count = sub.cnt
  FROM (SELECT AVG(rating)::numeric(3,2) avg_rating, COUNT(*) cnt FROM public.reviews WHERE reviewee_id = reviewee) sub
  WHERE wp.user_id = reviewee;

  UPDATE public.business_profiles bp SET
    rating = sub.avg_rating, rating_count = sub.cnt
  FROM (SELECT AVG(rating)::numeric(3,2) avg_rating, COUNT(*) cnt FROM public.reviews WHERE reviewee_id = reviewee) sub
  WHERE bp.user_id = reviewee;

  -- if both parties have reviewed, close everything
  SELECT COUNT(*) INTO reviews_count FROM public.reviews WHERE conversation_id = _conversation_id;
  IF reviews_count >= 2 THEN
    UPDATE public.conversations SET status = 'completed' WHERE id = _conversation_id;
    UPDATE public.applications SET status = 'completed' WHERE id = c.application_id;
    UPDATE public.jobs SET status = 'closed' WHERE id = c.job_id;
    UPDATE public.worker_profiles SET shifts_completed = shifts_completed + 1 WHERE user_id = c.worker_id;
  END IF;
END;
$$;

-- True if the user finished a job but hasn't left their closing review yet.
CREATE OR REPLACE FUNCTION public.has_pending_review(_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE (c.worker_id = _user OR c.business_id = _user)
      AND c.worker_ended AND c.business_ended
      AND c.status <> 'completed'
      AND NOT EXISTS (
        SELECT 1 FROM public.reviews r
        WHERE r.conversation_id = c.id AND r.reviewer_id = _user
      )
  )
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_application(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_agreement(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.end_job(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_review(uuid, int, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_pending_review(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_application(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_agreement(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_job(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_review(uuid, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_pending_review(uuid) TO authenticated;