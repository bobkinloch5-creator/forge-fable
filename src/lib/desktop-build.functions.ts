import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Platform = z.enum(["windows", "macos", "linux"]);
const PackageType = z.enum(["executable", "portable", "installer", "app_bundle", "all"]);

async function hashToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const connectDesktopBuildAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(1).max(80),
        platforms: z.array(Platform).min(1).max(3),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const token = `ff_agent_${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: agent, error } = await supabaseAdmin
      .from("desktop_build_agents")
      .insert({
        owner_id: context.userId,
        name: data.name,
        supported_platforms: data.platforms,
        token_hash: await hashToken(token),
      })
      .select("id, name, supported_platforms")
      .single();
    if (error || !agent) throw new Error(error?.message ?? "Could not connect build agent");
    return { agent, token };
  });

const StateInput = z.object({ gameId: z.string().uuid() });
export const getDesktopBuildState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => StateInput.parse(input))
  .handler(async ({ data, context }) => {
    const [agents, jobs, artifacts] = await Promise.all([
      context.supabase
        .from("desktop_build_agents")
        .select("id, name, supported_platforms, godot_version, status, last_seen_at")
        .eq("owner_id", context.userId)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("desktop_build_jobs")
        .select("*")
        .eq("game_id", data.gameId)
        .eq("owner_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(20),
      context.supabase
        .from("desktop_build_artifacts")
        .select("*")
        .eq("game_id", data.gameId)
        .eq("owner_id", context.userId)
        .order("created_at", { ascending: false }),
    ]);
    for (const result of [agents, jobs, artifacts]) {
      if (result.error) throw new Error(result.error.message);
    }
    return { agents: agents.data ?? [], jobs: jobs.data ?? [], artifacts: artifacts.data ?? [] };
  });

export const createDesktopBuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        gameId: z.string().uuid(),
        platforms: z.array(Platform).min(1).max(3),
        packageType: PackageType,
        version: z.string().regex(/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: game, error: gameError } = await context.supabase
      .from("games")
      .select("id")
      .eq("id", data.gameId)
      .eq("owner_id", context.userId)
      .single();
    if (gameError || !game) throw new Error("Game project not found");
    const { data: agents, error: agentError } = await context.supabase
      .from("desktop_build_agents")
      .select("supported_platforms, status")
      .eq("owner_id", context.userId)
      .neq("status", "disabled");
    if (agentError) throw new Error(agentError.message);
    const rows = data.platforms.map((platform) => ({
      game_id: data.gameId,
      owner_id: context.userId,
      platform,
      package_type: data.packageType,
      version: data.version,
      status: agents?.some((agent) => agent.supported_platforms.includes(platform))
        ? "queued"
        : "additional_tools_required",
      error_message: agents?.some((agent) => agent.supported_platforms.includes(platform))
        ? ""
        : `Connect a ${platform} build agent with Godot 4 export templates.`,
    }));
    const { data: jobs, error } = await context.supabase
      .from("desktop_build_jobs")
      .insert(rows)
      .select("id, platform, status");
    if (error) throw new Error(error.message);
    return jobs ?? [];
  });

export const retryDesktopBuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ jobId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("desktop_build_jobs")
      .update({
        status: "queued",
        progress_stage: "preparing_project",
        progress_percent: 0,
        error_message: "",
      })
      .eq("id", data.jobId)
      .eq("owner_id", context.userId)
      .in("status", ["failed", "additional_tools_required"]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDesktopArtifactDownload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ artifactId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: artifact, error } = await context.supabase
      .from("desktop_build_artifacts")
      .select("file_name, storage_path")
      .eq("id", data.artifactId)
      .eq("owner_id", context.userId)
      .single();
    if (error || !artifact) throw new Error("Build artifact not found");
    const { data: signed, error: signedError } = await context.supabase.storage
      .from("desktop-build-artifacts")
      .createSignedUrl(artifact.storage_path, 300, { download: artifact.file_name });
    if (signedError) throw new Error(signedError.message);
    return signed;
  });
