CREATE TABLE public.game_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('vision','genre','story','character','mechanic','map','art_style','control','economy','multiplayer','decision','constraint','summary')),
  memory_key text NOT NULL CHECK (char_length(memory_key) BETWEEN 1 AND 120),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 32000),
  source text NOT NULL DEFAULT 'user',
  importance integer NOT NULL DEFAULT 50 CHECK (importance BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, category, memory_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_memory TO authenticated;
GRANT ALL ON public.game_memory TO service_role;
ALTER TABLE public.game_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own game memory" ON public.game_memory FOR ALL TO authenticated USING (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid())) WITH CHECK (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid()));
CREATE INDEX game_memory_game_category_idx ON public.game_memory(game_id, category, importance DESC);
CREATE TRIGGER game_memory_updated_at BEFORE UPDATE ON public.game_memory FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.file_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  file_id uuid REFERENCES public.project_files(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL,
  path text NOT NULL CHECK (path <> ''),
  content text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'text',
  version integer NOT NULL CHECK (version > 0),
  change_type text NOT NULL CHECK (change_type IN ('created','updated','removed','restored')),
  summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, path, version)
);
GRANT SELECT, INSERT ON public.file_revisions TO authenticated;
GRANT ALL ON public.file_revisions TO service_role;
ALTER TABLE public.file_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators view own file revisions" ON public.file_revisions FOR SELECT TO authenticated USING (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid()));
CREATE POLICY "Creators create own file revisions" ON public.file_revisions FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid()));
CREATE INDEX file_revisions_game_path_idx ON public.file_revisions(game_id, path, version DESC);

CREATE TABLE public.change_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  thread_id uuid REFERENCES public.chat_threads(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  summary text NOT NULL DEFAULT '',
  risk_level text NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','applying','applied','rejected','failed')),
  affected_systems text[] NOT NULL DEFAULT '{}',
  dependencies text[] NOT NULL DEFAULT '{}',
  risks text[] NOT NULL DEFAULT '{}',
  changes jsonb NOT NULL DEFAULT '[]'::jsonb,
  test_plan text[] NOT NULL DEFAULT '{}',
  decided_at timestamptz,
  applied_at timestamptz,
  error_message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.change_proposals TO authenticated;
GRANT ALL ON public.change_proposals TO service_role;
ALTER TABLE public.change_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own change proposals" ON public.change_proposals FOR ALL TO authenticated USING (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid())) WITH CHECK (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid()));
CREATE INDEX change_proposals_game_status_idx ON public.change_proposals(game_id, status, created_at DESC);
CREATE TRIGGER change_proposals_updated_at BEFORE UPDATE ON public.change_proposals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.playtest_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  agent_id uuid REFERENCES public.desktop_build_agents(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','claimed','running','passed','failed','cancelled')),
  target_platform text NOT NULL,
  test_suites text[] NOT NULL DEFAULT '{}',
  progress_percent integer NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  summary text NOT NULL DEFAULT '',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playtest_runs TO authenticated;
GRANT ALL ON public.playtest_runs TO service_role;
ALTER TABLE public.playtest_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own playtest runs" ON public.playtest_runs FOR ALL TO authenticated USING (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid())) WITH CHECK (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid()));
CREATE INDEX playtest_runs_game_created_idx ON public.playtest_runs(game_id, created_at DESC);
CREATE TRIGGER playtest_runs_updated_at BEFORE UPDATE ON public.playtest_runs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.playtest_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.playtest_runs(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  suite text NOT NULL,
  test_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('passed','failed','warning','skipped')),
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','low','medium','high','critical')),
  duration_ms integer NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  details text NOT NULL DEFAULT '',
  reproduction_steps text[] NOT NULL DEFAULT '{}',
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  safe_fix_available boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.playtest_results TO authenticated;
GRANT ALL ON public.playtest_results TO service_role;
ALTER TABLE public.playtest_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators view own playtest results" ON public.playtest_results FOR SELECT TO authenticated USING (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid()));
CREATE INDEX playtest_results_run_status_idx ON public.playtest_results(run_id, status, severity);