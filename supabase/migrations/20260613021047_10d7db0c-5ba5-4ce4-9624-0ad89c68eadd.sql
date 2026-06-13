REVOKE SELECT ON public.desktop_build_agents FROM authenticated;
GRANT SELECT (id, owner_id, name, supported_platforms, godot_version, status, last_seen_at, created_at, updated_at) ON public.desktop_build_agents TO authenticated;
GRANT ALL ON public.desktop_build_agents TO service_role;

CREATE OR REPLACE FUNCTION public.consume_creator_credits(_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _remaining integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF _amount < 1 OR _amount > 1000 THEN
    RAISE EXCEPTION 'Invalid credit amount';
  END IF;

  UPDATE public.profiles
  SET credits = credits - _amount
  WHERE id = auth.uid() AND credits >= _amount
  RETURNING credits INTO _remaining;

  IF _remaining IS NULL THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  RETURN _remaining;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_creator_credits(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_creator_credits(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.refund_creator_credits(_user_id uuid, _amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Trusted backend access required';
  END IF;
  IF _amount < 1 OR _amount > 1000 THEN
    RAISE EXCEPTION 'Invalid credit amount';
  END IF;
  UPDATE public.profiles SET credits = credits + _amount WHERE id = _user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.refund_creator_credits(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refund_creator_credits(uuid, integer) TO service_role;