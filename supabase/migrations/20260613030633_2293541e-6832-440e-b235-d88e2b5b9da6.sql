REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
DROP POLICY IF EXISTS "Creators update own safe profile fields" ON public.profiles;
COMMENT ON TABLE public.profiles IS 'Creator profiles are readable by their owner. Profile mutations, including entitlement changes, are restricted to trusted backend services.';

REVOKE ALL PRIVILEGES ON TABLE public.desktop_build_agents FROM anon, authenticated;
GRANT SELECT (id, owner_id, name, supported_platforms, godot_version, status, last_seen_at, created_at, updated_at) ON TABLE public.desktop_build_agents TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.desktop_build_agents TO service_role;
ALTER TABLE public.desktop_build_agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Creators manage own desktop build agents" ON public.desktop_build_agents;
CREATE POLICY "Creators view own desktop build agent status"
ON public.desktop_build_agents
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);
COMMENT ON COLUMN public.desktop_build_agents.token_hash IS 'Sensitive verifier readable and writable only by trusted backend services; never exposed through creator-facing Data API grants.';

REVOKE ALL PRIVILEGES ON TABLE public.playtest_results FROM anon, authenticated;
GRANT SELECT ON TABLE public.playtest_results TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.playtest_results TO service_role;
ALTER TABLE public.playtest_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Creators create playtest results" ON public.playtest_results;
DROP POLICY IF EXISTS "Creators update playtest results" ON public.playtest_results;
DROP POLICY IF EXISTS "Creators delete playtest results" ON public.playtest_results;
COMMENT ON TABLE public.playtest_results IS 'Immutable from browser clients. Only trusted backend services may create, update, or delete results; creators have owner-scoped read access.';