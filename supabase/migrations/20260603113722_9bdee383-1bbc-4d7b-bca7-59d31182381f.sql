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
    SET status = 'agreed'
    WHERE id = _conversation_id AND worker_agreed AND business_agreed;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_agreement(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_agreement(uuid, boolean) TO authenticated;