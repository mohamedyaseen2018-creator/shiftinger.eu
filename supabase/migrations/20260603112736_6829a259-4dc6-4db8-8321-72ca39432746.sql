-- ========== ENUMS ==========
CREATE TYPE public.account_type AS ENUM ('worker', 'business');
CREATE TYPE public.profile_status AS ENUM ('incomplete', 'pending_review', 'approved', 'rejected', 'blocked');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.job_type AS ENUM ('single', 'parttime');
CREATE TYPE public.job_status AS ENUM ('open', 'closed', 'filled');
CREATE TYPE public.application_status AS ENUM ('applied', 'matched', 'rejected', 'confirmed', 'working', 'completed', 'cancelled');
CREATE TYPE public.conversation_status AS ENUM ('open', 'agreed', 'completed', 'closed');

-- ========== UPDATED_AT HELPER ==========
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ========== USER ROLES ==========
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  account_type public.account_type NOT NULL,
  full_name text,
  status public.profile_status NOT NULL DEFAULT 'incomplete',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins update all profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== WORKER PROFILES ==========
CREATE TABLE public.worker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text,
  city text,
  nationality text,
  phone text,
  main_role text,
  main_role_years int DEFAULT 0,
  sub_roles jsonb NOT NULL DEFAULT '[]',
  languages jsonb NOT NULL DEFAULT '[]',
  experience jsonb NOT NULL DEFAULT '[]',
  atividade boolean NOT NULL DEFAULT false,
  bio text,
  min_rate numeric DEFAULT 0,
  looking_for jsonb NOT NULL DEFAULT '[]',
  available_days jsonb NOT NULL DEFAULT '[]',
  time_slots jsonb NOT NULL DEFAULT '[]',
  availability_visible boolean NOT NULL DEFAULT true,
  messages_open boolean NOT NULL DEFAULT true,
  verified boolean NOT NULL DEFAULT false,
  rating numeric NOT NULL DEFAULT 0,
  rating_count int NOT NULL DEFAULT 0,
  shifts_completed int NOT NULL DEFAULT 0,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.worker_profiles TO authenticated;
GRANT ALL ON public.worker_profiles TO service_role;
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers manage own worker profile" ON public.worker_profiles
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Approved visible workers are browsable" ON public.worker_profiles
  FOR SELECT TO authenticated USING (verified = true AND availability_visible = true);
CREATE POLICY "Admins manage worker profiles" ON public.worker_profiles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER worker_profiles_updated_at BEFORE UPDATE ON public.worker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== BUSINESS PROFILES ==========
CREATE TABLE public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name text,
  category text,
  city text,
  area text,
  phone text,
  description text,
  is_early_bird boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  rating numeric NOT NULL DEFAULT 0,
  rating_count int NOT NULL DEFAULT 0,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.business_profiles TO authenticated;
GRANT ALL ON public.business_profiles TO service_role;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses manage own business profile" ON public.business_profiles
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Verified businesses are browsable" ON public.business_profiles
  FOR SELECT TO authenticated USING (verified = true);
CREATE POLICY "Admins manage business profiles" ON public.business_profiles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER business_profiles_updated_at BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== JOBS ==========
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  type public.job_type NOT NULL DEFAULT 'single',
  date date,
  start_time time,
  end_time time,
  working_days jsonb NOT NULL DEFAULT '[]',
  start_date date,
  end_date date,
  rate numeric NOT NULL DEFAULT 0,
  spots int NOT NULL DEFAULT 1,
  spots_remaining int NOT NULL DEFAULT 1,
  languages jsonb NOT NULL DEFAULT '[]',
  atividade text NOT NULL DEFAULT 'not-required',
  note text,
  skills jsonb NOT NULL DEFAULT '[]',
  status public.job_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view open jobs" ON public.jobs
  FOR SELECT TO authenticated USING (status = 'open' OR auth.uid() = owner_id);
CREATE POLICY "Businesses manage own jobs" ON public.jobs
  FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins manage jobs" ON public.jobs
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== BUSINESS LOCATIONS (private addresses) ==========
CREATE TABLE public.business_locations (
  business_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.business_locations TO authenticated;
GRANT ALL ON public.business_locations TO service_role;
ALTER TABLE public.business_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business manages own location" ON public.business_locations
  FOR ALL TO authenticated USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

CREATE TRIGGER business_locations_updated_at BEFORE UPDATE ON public.business_locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== APPLICATIONS ==========
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  worker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_score int NOT NULL DEFAULT 0,
  matched_criteria jsonb NOT NULL DEFAULT '[]',
  status public.application_status NOT NULL DEFAULT 'applied',
  worker_confirmed boolean NOT NULL DEFAULT false,
  business_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, worker_id)
);
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers manage own applications" ON public.applications
  FOR ALL TO authenticated USING (auth.uid() = worker_id) WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "Owners view and update applications to their jobs" ON public.applications
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners update applications to their jobs" ON public.applications
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins manage applications" ON public.applications
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== CONVERSATIONS ==========
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL UNIQUE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  worker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  worker_agreed boolean NOT NULL DEFAULT false,
  business_agreed boolean NOT NULL DEFAULT false,
  location_shared boolean NOT NULL DEFAULT false,
  worker_ended boolean NOT NULL DEFAULT false,
  business_ended boolean NOT NULL DEFAULT false,
  status public.conversation_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view conversations" ON public.conversations
  FOR SELECT TO authenticated USING (auth.uid() = worker_id OR auth.uid() = business_id);
CREATE POLICY "Participants update conversations" ON public.conversations
  FOR UPDATE TO authenticated USING (auth.uid() = worker_id OR auth.uid() = business_id)
  WITH CHECK (auth.uid() = worker_id OR auth.uid() = business_id);
CREATE POLICY "Admins manage conversations" ON public.conversations
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- location visibility for workers after agreement
CREATE POLICY "Worker sees location after agreement" ON public.business_locations
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.business_id = public.business_locations.business_id
        AND c.worker_id = auth.uid()
        AND c.location_shared = true
    )
  );

-- ========== MESSAGES ==========
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view messages" ON public.messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id AND (c.worker_id = auth.uid() OR c.business_id = auth.uid()))
  );
CREATE POLICY "Participants send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id AND (c.worker_id = auth.uid() OR c.business_id = auth.uid()))
  );

-- ========== REVIEWS ==========
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating int NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, reviewer_id)
);
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read reviews" ON public.reviews
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Reviewer creates own review" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.conversations c
      WHERE c.id = reviews.conversation_id AND (c.worker_id = auth.uid() OR c.business_id = auth.uid()))
  );

-- ========== REGISTRATION COUNTERS ==========
CREATE TABLE public.registration_counters (
  id int PRIMARY KEY DEFAULT 1,
  worker_count int NOT NULL DEFAULT 0,
  business_count int NOT NULL DEFAULT 0,
  worker_limit int NOT NULL DEFAULT 500,
  business_limit int NOT NULL DEFAULT 100,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO public.registration_counters (id) VALUES (1);
GRANT SELECT ON public.registration_counters TO anon, authenticated;
GRANT ALL ON public.registration_counters TO service_role;
ALTER TABLE public.registration_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read counters" ON public.registration_counters
  FOR SELECT TO anon, authenticated USING (true);

-- ========== NEW USER TRIGGER ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_type public.account_type;
BEGIN
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
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== REALTIME ==========
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;