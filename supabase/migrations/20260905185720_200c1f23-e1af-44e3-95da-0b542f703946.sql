-- Short-lived store for form answers captured before an account exists.
CREATE TABLE public.pending_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('worker','business')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE UNIQUE INDEX pending_intake_email_key ON public.pending_intake (lower(email));

-- Service role only: no anon/authenticated grants, no policies.
GRANT ALL ON public.pending_intake TO service_role;
ALTER TABLE public.pending_intake ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER pending_intake_set_updated_at
  BEFORE UPDATE ON public.pending_intake
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Applies a stored intake for the signed-in user, then removes it.
CREATE OR REPLACE FUNCTION public.claim_pending_intake()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  r public.pending_intake%ROWTYPE;
  p jsonb;
  j jsonb;
  v_job uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('claimed', false);
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('claimed', false);
  END IF;

  SELECT * INTO r FROM public.pending_intake
   WHERE lower(email) = lower(v_email) AND expires_at > now()
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('claimed', false);
  END IF;

  p := r.payload;

  IF r.kind = 'worker' THEN
    UPDATE public.profiles
       SET account_type = 'worker',
           full_name = COALESCE(NULLIF(p->>'name',''), full_name),
           status = CASE WHEN status = 'incomplete' THEN 'pending_review'::public.profile_status ELSE status END
     WHERE id = auth.uid();

    INSERT INTO public.worker_profiles (
      user_id, name, city, nationality, main_role, main_role_years,
      min_rate, atividade, residence, languages, available_days, looking_for
    ) VALUES (
      auth.uid(),
      NULLIF(p->>'name',''),
      NULLIF(p->>'city',''),
      NULLIF(p->>'nationality',''),
      NULLIF(p->>'main_role',''),
      NULLIF(p->>'main_role_years','')::int,
      NULLIF(p->>'min_rate','')::numeric,
      COALESCE((p->>'atividade')::boolean, false),
      NULLIF(p->>'residence',''),
      COALESCE(p->'languages', '[]'::jsonb),
      COALESCE(p->'available_days', '[]'::jsonb),
      COALESCE(p->'looking_for', '[]'::jsonb)
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, public.worker_profiles.name),
      city = COALESCE(EXCLUDED.city, public.worker_profiles.city),
      nationality = COALESCE(EXCLUDED.nationality, public.worker_profiles.nationality),
      main_role = COALESCE(EXCLUDED.main_role, public.worker_profiles.main_role),
      main_role_years = COALESCE(EXCLUDED.main_role_years, public.worker_profiles.main_role_years),
      min_rate = COALESCE(EXCLUDED.min_rate, public.worker_profiles.min_rate),
      atividade = EXCLUDED.atividade,
      residence = COALESCE(EXCLUDED.residence, public.worker_profiles.residence),
      languages = EXCLUDED.languages,
      available_days = EXCLUDED.available_days,
      updated_at = now();

    IF NULLIF(p->>'phone','') IS NOT NULL THEN
      INSERT INTO public.worker_contacts (user_id, phone)
      VALUES (auth.uid(), p->>'phone')
      ON CONFLICT (user_id) DO UPDATE SET phone = EXCLUDED.phone, updated_at = now();
    END IF;

    IF NULLIF(p->>'job_id','') IS NOT NULL THEN
      INSERT INTO public.applications (
        job_id, worker_id, owner_id, match_score, matched_criteria, status, message
      )
      SELECT jb.id, auth.uid(), jb.owner_id,
             COALESCE((p->>'match_score')::int, 0),
             COALESCE(p->'matched_criteria', '[]'::jsonb),
             'applied'::public.application_status,
             NULLIF(p->>'note','')
        FROM public.jobs jb
       WHERE jb.id = (p->>'job_id')::uuid
      ON CONFLICT DO NOTHING;
    END IF;

  ELSE
    UPDATE public.profiles
       SET account_type = 'business',
           full_name = COALESCE(NULLIF(p->>'business_name',''), full_name),
           status = CASE WHEN status = 'incomplete' THEN 'pending_review'::public.profile_status ELSE status END
     WHERE id = auth.uid();

    INSERT INTO public.business_profiles (user_id, business_name, category, city, area)
    VALUES (
      auth.uid(),
      NULLIF(p->>'business_name',''),
      NULLIF(p->>'category',''),
      NULLIF(p->>'city',''),
      NULLIF(p->>'area','')
    )
    ON CONFLICT (user_id) DO UPDATE SET
      business_name = COALESCE(EXCLUDED.business_name, public.business_profiles.business_name),
      category = COALESCE(EXCLUDED.category, public.business_profiles.category),
      city = COALESCE(EXCLUDED.city, public.business_profiles.city),
      area = COALESCE(EXCLUDED.area, public.business_profiles.area),
      updated_at = now();

    IF NULLIF(p->>'phone','') IS NOT NULL OR NULLIF(p->>'contact_name','') IS NOT NULL THEN
      INSERT INTO public.business_contacts (user_id, phone, contact_name)
      VALUES (auth.uid(), NULLIF(p->>'phone',''), NULLIF(p->>'contact_name',''))
      ON CONFLICT (user_id) DO UPDATE SET
        phone = COALESCE(EXCLUDED.phone, public.business_contacts.phone),
        contact_name = COALESCE(EXCLUDED.contact_name, public.business_contacts.contact_name),
        updated_at = now();
    END IF;

    j := p->'job';
    IF j IS NOT NULL AND NULLIF(j->>'role','') IS NOT NULL THEN
      INSERT INTO public.jobs (
        owner_id, role, type, date, start_time, end_time, working_days,
        start_date, end_date, rate, spots, spots_remaining, languages,
        atividade, note, status
      ) VALUES (
        auth.uid(),
        j->>'role',
        COALESCE((j->>'type')::public.job_type, 'single'),
        NULLIF(j->>'date','')::date,
        NULLIF(j->>'start_time','')::time,
        NULLIF(j->>'end_time','')::time,
        COALESCE(j->'working_days', '[]'::jsonb),
        NULLIF(j->>'start_date','')::date,
        NULLIF(j->>'end_date','')::date,
        COALESCE((j->>'rate')::numeric, 0),
        COALESCE((j->>'spots')::int, 1),
        COALESCE((j->>'spots')::int, 1),
        COALESCE(j->'languages', '[]'::jsonb),
        COALESCE(NULLIF(j->>'atividade',''), 'not-required'),
        NULLIF(j->>'note',''),
        'draft'::public.job_status
      )
      RETURNING id INTO v_job;
    END IF;
  END IF;

  DELETE FROM public.pending_intake WHERE id = r.id;
  RETURN jsonb_build_object('claimed', true, 'kind', r.kind, 'job_id', v_job);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_pending_intake() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_pending_intake() TO authenticated;