REVOKE ALL ON FUNCTION public.consume_creator_credits(integer) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.consume_creator_credits(integer) TO authenticated;

REVOKE ALL ON FUNCTION public.refund_creator_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_creator_credits(uuid, integer) TO service_role;