-- ── site_content: editable website copy ─────────────────────────────────────
CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site content"
  ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admins manage site content"
  ON public.site_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── job_catalog: job roles + their skills ────────────────────────────────────
CREATE TABLE public.job_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '',
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.job_catalog TO anon, authenticated;
GRANT ALL ON public.job_catalog TO service_role;
ALTER TABLE public.job_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read job catalog"
  ON public.job_catalog FOR SELECT USING (true);
CREATE POLICY "Admins manage job catalog"
  ON public.job_catalog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_job_catalog_updated_at
  BEFORE UPDATE ON public.job_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();