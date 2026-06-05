-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1. business_contacts: private contact details for businesses
CREATE TABLE public.business_contacts (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  contact_name text,
  contact_position text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_contacts TO authenticated;
GRANT ALL ON public.business_contacts TO service_role;

ALTER TABLE public.business_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses manage own contact"
  ON public.business_contacts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage business contacts"
  ON public.business_contacts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_business_contacts_updated_at
  BEFORE UPDATE ON public.business_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.business_contacts (user_id, phone, contact_name, contact_position)
SELECT user_id, phone, contact_name, contact_position
FROM public.business_profiles
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.business_profiles
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS contact_name,
  DROP COLUMN IF EXISTS contact_position;

-- 2. worker_documents: private identity documents for workers
CREATE TABLE public.worker_documents (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  id_document_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.worker_documents TO authenticated;
GRANT ALL ON public.worker_documents TO service_role;

ALTER TABLE public.worker_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers manage own document"
  ON public.worker_documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage worker documents"
  ON public.worker_documents FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_worker_documents_updated_at
  BEFORE UPDATE ON public.worker_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.worker_documents (user_id, id_document_url)
SELECT user_id, id_document_url
FROM public.worker_profiles
WHERE id_document_url IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.worker_profiles
  DROP COLUMN IF EXISTS id_document_url;