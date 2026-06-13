REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url) ON TABLE public.profiles TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.profiles TO service_role;

DROP POLICY IF EXISTS "Creators update own safe profile fields" ON public.profiles;
CREATE POLICY "Creators update own safe profile fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

COMMENT ON POLICY "Creators update own safe profile fields" ON public.profiles IS
'Authenticated creators may update only their own row. Column grants restrict browser writes to display_name and avatar_url; plan and credits remain backend-only and are additionally protected by protect_profile_entitlements().';

COMMENT ON TABLE public.playtest_results IS
'Backend-generated immutable test output. Browser clients have owner-scoped read-only access; only service_role may insert, update, or delete rows.';