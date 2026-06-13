REVOKE ALL PRIVILEGES ON TABLE public.profiles FROM authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.profiles TO authenticated;
GRANT UPDATE (display_name, avatar_url) ON TABLE public.profiles TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.profiles TO service_role;

CREATE OR REPLACE FUNCTION public.protect_profile_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' AND (
    NEW.plan IS DISTINCT FROM OLD.plan
    OR NEW.credits IS DISTINCT FROM OLD.credits
  ) THEN
    RAISE EXCEPTION 'Plan and credits can only be changed by trusted backend services';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_entitlements_on_update ON public.profiles;
CREATE TRIGGER protect_profile_entitlements_on_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_entitlements();

DROP POLICY IF EXISTS "Creators update own safe profile fields" ON public.profiles;
CREATE POLICY "Creators update own safe profile fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

REVOKE ALL PRIVILEGES ON TABLE public.playtest_results FROM anon, authenticated;
GRANT SELECT ON TABLE public.playtest_results TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.playtest_results TO service_role;
ALTER TABLE public.playtest_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators create playtest results" ON public.playtest_results;
DROP POLICY IF EXISTS "Creators update playtest results" ON public.playtest_results;
DROP POLICY IF EXISTS "Creators delete playtest results" ON public.playtest_results;