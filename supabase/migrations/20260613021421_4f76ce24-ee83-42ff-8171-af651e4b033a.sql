CREATE TABLE public.tripo_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  external_task_id text NOT NULL UNIQUE,
  prompt text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'queued',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tripo_tasks TO authenticated;
GRANT ALL ON public.tripo_tasks TO service_role;
ALTER TABLE public.tripo_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators view own 3D generation tasks"
ON public.tripo_tasks FOR SELECT TO authenticated
USING (auth.uid() = owner_id);
CREATE TRIGGER tripo_tasks_updated_at
BEFORE UPDATE ON public.tripo_tasks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX tripo_tasks_owner_created_idx ON public.tripo_tasks(owner_id, created_at DESC);