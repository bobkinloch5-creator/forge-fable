CREATE TABLE public.desktop_build_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  token_hash text NOT NULL UNIQUE,
  supported_platforms text[] NOT NULL DEFAULT '{}',
  godot_version text NOT NULL DEFAULT '4.x',
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('offline','online','busy','disabled')),
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.desktop_build_agents TO authenticated;
GRANT ALL ON public.desktop_build_agents TO service_role;
ALTER TABLE public.desktop_build_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own desktop build agents" ON public.desktop_build_agents FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX desktop_build_agents_owner_seen_idx ON public.desktop_build_agents(owner_id, last_seen_at DESC);
CREATE TRIGGER desktop_build_agents_updated_at BEFORE UPDATE ON public.desktop_build_agents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.desktop_build_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  agent_id uuid REFERENCES public.desktop_build_agents(id) ON DELETE SET NULL,
  platform text NOT NULL CHECK (platform IN ('windows','macos','linux')),
  package_type text NOT NULL CHECK (package_type IN ('executable','portable','installer','app_bundle','all')),
  version text NOT NULL DEFAULT '0.1.0',
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','claimed','building','testing','packaging','complete','failed','cancelled','additional_tools_required')),
  progress_stage text NOT NULL DEFAULT 'preparing_project',
  progress_percent integer NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  logs text NOT NULL DEFAULT '',
  error_message text NOT NULL DEFAULT '',
  release_notes text NOT NULL DEFAULT '',
  known_issues text NOT NULL DEFAULT '',
  minimum_requirements text NOT NULL DEFAULT '',
  recommended_requirements text NOT NULL DEFAULT '',
  verification_results jsonb NOT NULL DEFAULT '{}'::jsonb,
  claimed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.desktop_build_jobs TO authenticated;
GRANT ALL ON public.desktop_build_jobs TO service_role;
ALTER TABLE public.desktop_build_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own desktop build jobs" ON public.desktop_build_jobs FOR ALL TO authenticated USING (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid())) WITH CHECK (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid()));
CREATE INDEX desktop_build_jobs_owner_created_idx ON public.desktop_build_jobs(owner_id, created_at DESC);
CREATE INDEX desktop_build_jobs_queue_idx ON public.desktop_build_jobs(status, platform, created_at);
CREATE TRIGGER desktop_build_jobs_updated_at BEFORE UPDATE ON public.desktop_build_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.desktop_build_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.desktop_build_jobs(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  artifact_type text NOT NULL CHECK (artifact_type IN ('executable','portable','installer','app_bundle','source')),
  platform text NOT NULL CHECK (platform IN ('windows','macos','linux','source')),
  file_name text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  file_size bigint NOT NULL CHECK (file_size >= 0),
  checksum_sha256 text NOT NULL,
  installation_instructions text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.desktop_build_artifacts TO authenticated;
GRANT ALL ON public.desktop_build_artifacts TO service_role;
ALTER TABLE public.desktop_build_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators view own desktop artifacts" ON public.desktop_build_artifacts FOR SELECT TO authenticated USING (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid()));
CREATE POLICY "Creators delete own desktop artifacts" ON public.desktop_build_artifacts FOR DELETE TO authenticated USING (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid()));
CREATE INDEX desktop_build_artifacts_game_created_idx ON public.desktop_build_artifacts(game_id, created_at DESC);
CREATE TRIGGER desktop_build_artifacts_updated_at BEFORE UPDATE ON public.desktop_build_artifacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Creators read own desktop artifact files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'desktop-build-artifacts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Creators delete own desktop artifact files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'desktop-build-artifacts' AND (storage.foldername(name))[1] = auth.uid()::text);