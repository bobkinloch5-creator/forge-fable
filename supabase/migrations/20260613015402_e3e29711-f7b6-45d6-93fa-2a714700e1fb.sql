CREATE OR REPLACE FUNCTION public.claim_desktop_build_job(_agent_id uuid)
RETURNS SETOF public.desktop_build_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _platforms text[];
  _job_id uuid;
BEGIN
  SELECT supported_platforms INTO _platforms
  FROM public.desktop_build_agents
  WHERE id = _agent_id AND status <> 'disabled';
  IF _platforms IS NULL THEN RETURN; END IF;

  SELECT id INTO _job_id
  FROM public.desktop_build_jobs
  WHERE status = 'queued' AND platform = ANY(_platforms)
    AND owner_id = (SELECT owner_id FROM public.desktop_build_agents WHERE id = _agent_id)
  ORDER BY created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF _job_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  UPDATE public.desktop_build_jobs
  SET status = 'claimed', agent_id = _agent_id, claimed_at = now(), progress_stage = 'preparing_project', progress_percent = 2
  WHERE id = _job_id
  RETURNING *;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_desktop_build_job(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_desktop_build_job(uuid) TO service_role;