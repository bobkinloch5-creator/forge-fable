CREATE TABLE public.development_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  stage_key text NOT NULL,
  title text NOT NULL,
  position integer NOT NULL CHECK (position > 0),
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'ready', 'in_progress', 'blocked', 'testing', 'complete')),
  dependencies text[] NOT NULL DEFAULT '{}',
  deliverables text[] NOT NULL DEFAULT '{}',
  test_summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, stage_key),
  UNIQUE (game_id, position)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.development_stages TO authenticated;
GRANT ALL ON public.development_stages TO service_role;
ALTER TABLE public.development_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own development stages" ON public.development_stages FOR ALL TO authenticated USING (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid())) WITH CHECK (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid()));
CREATE INDEX development_stages_game_position_idx ON public.development_stages(game_id, position);
CREATE TRIGGER development_stages_updated_at BEFORE UPDATE ON public.development_stages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.project_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  label text NOT NULL,
  summary text NOT NULL DEFAULT '',
  stage_key text NOT NULL DEFAULT 'game-planning',
  file_manifest jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_checkpoints TO authenticated;
GRANT ALL ON public.project_checkpoints TO service_role;
ALTER TABLE public.project_checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own project checkpoints" ON public.project_checkpoints FOR ALL TO authenticated USING (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid())) WITH CHECK (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.owner_id = auth.uid()));
CREATE INDEX project_checkpoints_game_created_idx ON public.project_checkpoints(game_id, created_at DESC);
CREATE TRIGGER project_checkpoints_updated_at BEFORE UPDATE ON public.project_checkpoints FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();