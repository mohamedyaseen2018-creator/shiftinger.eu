CREATE TABLE public.contact_reveals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.contact_reveals TO authenticated;
GRANT ALL ON public.contact_reveals TO service_role;

ALTER TABLE public.contact_reveals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can view their own reveal log"
ON public.contact_reveals
FOR SELECT
TO authenticated
USING (auth.uid() = business_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Businesses can insert their own reveal log"
ON public.contact_reveals
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = business_id);

CREATE INDEX idx_contact_reveals_business_created
ON public.contact_reveals (business_id, created_at DESC);