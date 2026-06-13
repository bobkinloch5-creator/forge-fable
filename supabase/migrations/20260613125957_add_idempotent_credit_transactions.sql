CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operation_key text NOT NULL CHECK (char_length(operation_key) BETWEEN 8 AND 240),
  requested_amount integer NOT NULL CHECK (requested_amount BETWEEN 1 AND 1000),
  debited_amount integer NOT NULL CHECK (debited_amount BETWEEN 0 AND 1000),
  status text NOT NULL DEFAULT 'charged' CHECK (status IN ('charged', 'refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  refunded_at timestamptz,
  UNIQUE (user_id, operation_key)
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.credit_transactions FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.credit_transactions TO service_role;
CREATE INDEX credit_transactions_user_created_idx
ON public.credit_transactions(user_id, created_at DESC);

COMMENT ON TABLE public.credit_transactions IS
'Private idempotency ledger for trusted backend credit charges and refunds. It is not exposed to browser roles.';

ALTER TABLE public.tripo_tasks
ADD COLUMN credit_operation_key text;

CREATE UNIQUE INDEX tripo_tasks_owner_credit_operation_idx
ON public.tripo_tasks(owner_id, credit_operation_key)
WHERE credit_operation_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.consume_creator_credits_once(
  _user_id uuid,
  _amount integer,
  _operation_key text
)
RETURNS TABLE (remaining integer, charged boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _remaining integer;
  _debited integer;
  _inserted_id uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Trusted backend access required';
  END IF;
  IF _amount < 1 OR _amount > 1000 THEN
    RAISE EXCEPTION 'Invalid credit amount';
  END IF;
  IF char_length(_operation_key) < 8 OR char_length(_operation_key) > 240 THEN
    RAISE EXCEPTION 'Invalid operation key';
  END IF;

  _debited := CASE
    WHEN public.has_role(_user_id, 'owner'::public.app_role) THEN 0
    ELSE _amount
  END;

  INSERT INTO public.credit_transactions (
    user_id,
    operation_key,
    requested_amount,
    debited_amount
  )
  VALUES (_user_id, _operation_key, _amount, _debited)
  ON CONFLICT (user_id, operation_key) DO NOTHING
  RETURNING id INTO _inserted_id;

  IF _inserted_id IS NULL THEN
    SELECT p.credits INTO _remaining
    FROM public.profiles p
    WHERE p.id = _user_id;
    IF _remaining IS NULL THEN
      RAISE EXCEPTION 'Profile not found';
    END IF;
    RETURN QUERY SELECT _remaining, false;
    RETURN;
  END IF;

  IF _debited = 0 THEN
    SELECT p.credits INTO _remaining
    FROM public.profiles p
    WHERE p.id = _user_id;
  ELSE
    UPDATE public.profiles
    SET credits = credits - _debited
    WHERE id = _user_id AND credits >= _debited
    RETURNING credits INTO _remaining;
  END IF;

  IF _remaining IS NULL THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  RETURN QUERY SELECT _remaining, true;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_creator_credits_once(uuid, integer, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_creator_credits_once(uuid, integer, text)
TO service_role;

CREATE OR REPLACE FUNCTION public.refund_creator_credits_once(
  _user_id uuid,
  _operation_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _amount integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Trusted backend access required';
  END IF;

  UPDATE public.credit_transactions
  SET status = 'refunded', refunded_at = now()
  WHERE user_id = _user_id
    AND operation_key = _operation_key
    AND status = 'charged'
  RETURNING debited_amount INTO _amount;

  IF _amount IS NULL THEN
    RETURN false;
  END IF;

  IF _amount > 0 THEN
    UPDATE public.profiles
    SET credits = credits + _amount
    WHERE id = _user_id;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.refund_creator_credits_once(uuid, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_creator_credits_once(uuid, text)
TO service_role;
