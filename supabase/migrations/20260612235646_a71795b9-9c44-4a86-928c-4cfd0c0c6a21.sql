REVOKE EXECUTE ON FUNCTION public.is_identity_banned(text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.normalize_phone(text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.is_identity_banned(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.normalize_phone(text) TO service_role;