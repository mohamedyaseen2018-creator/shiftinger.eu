CREATE OR REPLACE FUNCTION public.has_pending_review(_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE WHEN auth.uid() = _user THEN EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE (c.worker_id = _user OR c.business_id = _user)
      AND c.worker_ended AND c.business_ended
      AND c.status <> 'completed'
      AND NOT EXISTS (
        SELECT 1 FROM public.reviews r
        WHERE r.conversation_id = c.id AND r.reviewer_id = _user
      )
  ) ELSE false END
$function$;