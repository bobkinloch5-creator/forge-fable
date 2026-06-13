DROP FUNCTION IF EXISTS public.consume_creator_credits(integer);

CREATE OR REPLACE FUNCTION public.consume_creator_credits(_user_id uuid, _amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _remaining integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Trusted backend access required';
  END IF;
  IF _amount < 1 OR _amount > 1000 THEN
    RAISE EXCEPTION 'Invalid credit amount';
  END IF;

  UPDATE public.profiles
  SET credits = credits - _amount
  WHERE id = _user_id AND credits >= _amount
  RETURNING credits INTO _remaining;

  IF _remaining IS NULL THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  RETURN _remaining;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_creator_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_creator_credits(uuid, integer) TO service_role;