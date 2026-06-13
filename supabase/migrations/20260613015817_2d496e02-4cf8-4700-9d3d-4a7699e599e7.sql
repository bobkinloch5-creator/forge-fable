DROP POLICY IF EXISTS "Creators manage own profile" ON public.profiles;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url) ON public.profiles TO authenticated;
CREATE POLICY "Creators view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Creators create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id AND plan = 'free' AND credits = 250);
CREATE POLICY "Creators update own safe profile fields" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Creators delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

REVOKE INSERT, UPDATE ON public.desktop_build_artifacts FROM authenticated;
REVOKE INSERT, UPDATE ON storage.objects FROM authenticated;