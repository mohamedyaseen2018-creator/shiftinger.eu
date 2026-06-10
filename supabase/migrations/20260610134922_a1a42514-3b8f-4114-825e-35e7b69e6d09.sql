CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage email templates" ON public.email_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_email_templates_updated
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text,
  recipient_id uuid,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  error text,
  triggered_by text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_outbox TO authenticated;
GRANT ALL ON public.email_outbox TO service_role;
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view email outbox" ON public.email_outbox
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.email_templates (template_key, name, subject, body) VALUES
(
  'worker_approved',
  'Worker approved',
  'You''re approved — start finding shifts on Shiftinger 🎉',
  E'Hi {{name}},\n\nGreat news — your worker profile has been reviewed and approved!\n\nYou can now:\n• Browse open shifts and apply in one tap\n• Appear in business searches as a verified worker\n• Chat with businesses once you''re matched\n\nLog in and find your first shift: {{app_url}}/jobs\n\nWelcome aboard,\nThe Shiftinger team'
),
(
  'business_approved',
  'Business approved',
  'Your business is approved — post your first shift on Shiftinger 🎉',
  E'Hi {{name}},\n\nGreat news — your business profile has been reviewed and approved!\n\nYou can now:\n• Post single shifts or part-time roles in minutes\n• Browse verified workers and contact them directly\n• Manage applicants, confirmations and reviews in one place\n\nLog in and post your first shift: {{app_url}}/post-job\n\nWelcome aboard,\nThe Shiftinger team'
),
(
  'announcement',
  'Announcement (blank)',
  'News from Shiftinger',
  E'Hi {{name}},\n\nWrite your announcement here.\n\nThe Shiftinger team'
);