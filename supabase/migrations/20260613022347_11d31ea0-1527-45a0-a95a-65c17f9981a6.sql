CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
CREATE TRIGGER user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner'::public.app_role
FROM auth.users
WHERE lower(email) = lower('bobkinloch5@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

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

  IF public.has_role(_user_id, 'owner'::public.app_role) THEN
    SELECT credits INTO _remaining FROM public.profiles WHERE id = _user_id;
    IF _remaining IS NULL THEN
      RAISE EXCEPTION 'Profile not found';
    END IF;
    RETURN _remaining;
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