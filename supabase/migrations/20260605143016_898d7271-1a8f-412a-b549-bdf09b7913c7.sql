-- =========================================================================
-- 1. PLATFORM CONFIG (singleton)
-- =========================================================================
CREATE TABLE public.platform_config (
  id smallint PRIMARY KEY DEFAULT 1,
  platform_name text NOT NULL DEFAULT 'Shiftinger',
  description text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'EUR',
  timezone text NOT NULL DEFAULT 'Europe/Lisbon',
  cities text[] NOT NULL DEFAULT ARRAY['Lisbon','Porto']::text[],
  sectors text[] NOT NULL DEFAULT ARRAY['Restaurant','Cafe','Bar','Hotel','Events','Catering']::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_config_singleton CHECK (id = 1)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_config TO authenticated;
GRANT ALL ON public.platform_config TO service_role;
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage platform config" ON public.platform_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_platform_config_updated_at BEFORE UPDATE ON public.platform_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- 2. CONFIRMATION WINDOW (singleton)
-- =========================================================================
CREATE TABLE public.confirmation_window (
  id smallint PRIMARY KEY DEFAULT 1,
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '18:00',
  timezone text NOT NULL DEFAULT 'Europe/Lisbon',
  auto_expiry boolean NOT NULL DEFAULT true,
  reminder_30min boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT confirmation_window_singleton CHECK (id = 1)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.confirmation_window TO authenticated;
GRANT ALL ON public.confirmation_window TO service_role;
ALTER TABLE public.confirmation_window ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage confirmation window" ON public.confirmation_window
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_confirmation_window_updated_at BEFORE UPDATE ON public.confirmation_window
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- 3. KPI SETTINGS
-- =========================================================================
CREATE TABLE public.kpi_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  formula text NOT NULL DEFAULT '',
  target numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '',
  frequency text NOT NULL DEFAULT 'Monthly',
  category text NOT NULL DEFAULT 'Supply',
  enabled boolean NOT NULL DEFAULT true,
  is_custom boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kpi_settings TO authenticated;
GRANT ALL ON public.kpi_settings TO service_role;
ALTER TABLE public.kpi_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage kpi settings" ON public.kpi_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_kpi_settings_updated_at BEFORE UPDATE ON public.kpi_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- 4. DISPUTES
-- =========================================================================
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  worker_label text NOT NULL DEFAULT '',
  business_label text NOT NULL DEFAULT '',
  issue_type text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  assigned_admin_id uuid,
  assigned_admin_label text NOT NULL DEFAULT '',
  deadline date,
  internal_notes text NOT NULL DEFAULT '',
  resolution_summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.disputes TO authenticated;
GRANT ALL ON public.disputes TO service_role;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage disputes" ON public.disputes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_disputes_updated_at BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- 5. PLATFORM LISTS (managed dropdown options)
-- =========================================================================
CREATE TABLE public.platform_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_key text NOT NULL,
  value text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (list_key, value)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_lists TO authenticated;
GRANT ALL ON public.platform_lists TO service_role;
ALTER TABLE public.platform_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage platform lists" ON public.platform_lists
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_platform_lists_updated_at BEFORE UPDATE ON public.platform_lists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- SEED DATA
-- =========================================================================
INSERT INTO public.platform_config (id, platform_name, description)
VALUES (1, 'Shiftinger', 'A two-sided shift-work marketplace connecting flexible workers with hospitality and event businesses in Portugal.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.confirmation_window (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.kpi_settings (name, formula, target, unit, frequency, category, sort_order) VALUES
  ('Worker activation rate', 'Approved workers ÷ registered workers', 70, '%', 'Weekly', 'Supply', 1),
  ('Business activation rate', 'Verified businesses ÷ registered businesses', 60, '%', 'Weekly', 'Demand', 2),
  ('Shift fill rate', 'Filled shifts ÷ posted shifts', 80, '%', 'Weekly', 'Liquidity', 3),
  ('Avg time to fill', 'Average hours from post to confirmed match', 24, 'hrs', 'Weekly', 'Liquidity', 4),
  ('Monthly GMV', 'Total value of confirmed shifts', 50000, '€', 'Monthly', 'Revenue', 5),
  ('Dispute rate', 'Disputes ÷ completed shifts', 3, '%', 'Monthly', 'Trust & Safety', 6),
  ('Avg platform rating', 'Average of all reviews', 5, 'count', 'Monthly', 'Trust & Safety', 7);

INSERT INTO public.platform_lists (list_key, value, sort_order) VALUES
  ('nationality','Portuguese',1),('nationality','Brazilian',2),('nationality','Cape Verdean',3),('nationality','Angolan',4),('nationality','Ukrainian',5),('nationality','Indian',6),('nationality','Nepali',7),('nationality','Other',99),
  ('language','Portuguese',1),('language','English',2),('language','Spanish',3),('language','French',4),('language','Arabic',5),('language','Other',99),
  ('skill','Waiter/Server',1),('skill','Barista',2),('skill','Kitchen assistant',3),('skill','Chef',4),('skill','Bar staff/Bartender',5),('skill','Host/Cashier',6),('skill','Dishwasher',7),('skill','Cleaning staff',8),('skill','Event staff',9),('skill','Catering assistant',10),
  ('sector','Restaurant',1),('sector','Cafe',2),('sector','Bar',3),('sector','Hotel',4),('sector','Events',5),('sector','Catering',6),
  ('sub_sector','Fine dining',1),('sub_sector','Fast casual',2),('sub_sector','Specialty coffee',3),('sub_sector','Nightclub',4),('sub_sector','Boutique hotel',5),
  ('city','Lisbon',1),('city','Porto',2),('city','Other',99),
  ('dispute_issue_type','No-show',1),('dispute_issue_type','Late payment',2),('dispute_issue_type','Unsafe conditions',3),('dispute_issue_type','Misconduct',4),('dispute_issue_type','Quality complaint',5),('dispute_issue_type','Other',99),
  ('shift_role','Waiter/Server',1),('shift_role','Barista',2),('shift_role','Kitchen assistant',3),('shift_role','Chef',4),('shift_role','Bar staff/Bartender',5),('shift_role','Host/Cashier',6),('shift_role','Event staff',7),
  ('admin_role','Super admin',1),('admin_role','Moderator',2),('admin_role','Support',3);