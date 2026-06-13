import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Report = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("progress"),
    jobId: z.string().uuid(),
    status: z.enum(["building", "testing", "packaging", "failed", "additional_tools_required"]),
    stage: z.string().min(1).max(80),
    progress: z.number().int().min(0).max(99),
    logs: z.string().max(200000).default(""),
    error: z.string().max(4000).default(""),
    verificationResults: z.record(z.boolean()).optional(),
  }),
  z.object({
    action: z.literal("prepare_artifact"),
    jobId: z.string().uuid(),
    fileName: z.string().min(1).max(180),
  }),
  z.object({
    action: z.literal("complete"),
    jobId: z.string().uuid(),
    artifactType: z.enum(["executable", "portable", "installer", "app_bundle", "source"]),
    fileName: z.string().min(1).max(180),
    storagePath: z.string().min(1).max(500),
    fileSize: z.number().int().nonnegative(),
    checksumSha256: z.string().regex(/^[a-f0-9]{64}$/i),
    installationInstructions: z.string().max(10000).default(""),
    releaseNotes: z.string().max(20000).default(""),
    knownIssues: z.string().max(10000).default(""),
    minimumRequirements: z.string().max(10000).default(""),
    recommendedRequirements: z.string().max(10000).default(""),
    verificationResults: z.record(z.boolean()),
    logs: z.string().max(200000).default(""),
  }),
]);

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function authenticate(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ff_agent_")) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("desktop_build_agents")
    .select("id, owner_id, supported_platforms, status")
    .eq("token_hash", await hashToken(authorization.slice(7)))
    .neq("status", "disabled")
    .maybeSingle();
  return data;
}

export const Route = createFileRoute("/api/public/desktop-build-agent")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const agent = await authenticate(request);
        if (!agent) return new Response("Invalid build-agent token", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin
          .from("desktop_build_agents")
          .update({ status: "online", last_seen_at: new Date().toISOString() })
          .eq("id", agent.id);
        const { data: jobs, error } = await supabaseAdmin.rpc("claim_desktop_build_job", {
          _agent_id: agent.id,
        });
        if (error) return new Response("Could not claim build", { status: 500 });
        const job = jobs?.[0];
        if (!job) return new Response(null, { status: 204 });
        const [game, files] = await Promise.all([
          supabaseAdmin
            .from("games")
            .select("name, description, genre, art_style, player_mode")
            .eq("id", job.game_id)
            .single(),
          supabaseAdmin
            .from("project_files")
            .select("path, content, language, version")
            .eq("game_id", job.game_id)
            .order("path"),
        ]);
        return Response.json({
          protocolVersion: 1,
          engine: "Godot 4",
          job,
          game: game.data,
          files: files.data ?? [],
          requiredChecks: [
            "launch",
            "main_menu",
            "save_load",
            "controls",
            "controller",
            "display_modes",
            "audio",
            "level_loading",
            "file_integrity",
            "installer",
            "uninstall",
            "package_checksum",
          ],
        });
      },
      POST: async ({ request }) => {
        const agent = await authenticate(request);
        if (!agent) return new Response("Invalid build-agent token", { status: 401 });
        const parsed = Report.safeParse(await request.json());
        if (!parsed.success) return new Response("Invalid agent report", { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const report = parsed.data;
        const { data: job } = await supabaseAdmin
          .from("desktop_build_jobs")
          .select("id, game_id, owner_id, platform")
          .eq("id", report.jobId)
          .eq("agent_id", agent.id)
          .eq("owner_id", agent.owner_id)
          .maybeSingle();
        if (!job) return new Response("Build job not assigned to this agent", { status: 403 });

        if (report.action === "progress") {
          const { error } = await supabaseAdmin
            .from("desktop_build_jobs")
            .update({
              status: report.status,
              progress_stage: report.stage,
              progress_percent: report.progress,
              logs: report.logs,
              error_message: report.error,
              verification_results: report.verificationResults ?? {},
            })
            .eq("id", job.id);
          if (error) return new Response("Could not save progress", { status: 500 });
          return Response.json({ ok: true });
        }

        if (report.action === "prepare_artifact") {
          const safeName = report.fileName.replace(/[^A-Za-z0-9._-]/g, "-");
          const storagePath = `${agent.owner_id}/${job.game_id}/${job.id}/${safeName}`;
          const { data, error } = await supabaseAdmin.storage
            .from("desktop-build-artifacts")
            .createSignedUploadUrl(storagePath);
          if (error) return new Response("Could not prepare artifact upload", { status: 500 });
          return Response.json({ storagePath, ...data });
        }

        if (!report.storagePath.startsWith(`${agent.owner_id}/${job.game_id}/${job.id}/`)) {
          return new Response("Invalid artifact path", { status: 403 });
        }
        const requiredChecks = [
          "launch",
          "main_menu",
          "save_load",
          "controls",
          "display_modes",
          "audio",
          "level_loading",
          "file_integrity",
          "package_checksum",
        ];
        const checksPass = requiredChecks.every(
          (check) => report.verificationResults[check] === true,
        );
        if (!checksPass)
          return new Response("Required release checks did not pass", { status: 409 });
        const { error: artifactError } = await supabaseAdmin
          .from("desktop_build_artifacts")
          .insert({
            job_id: job.id,
            game_id: job.game_id,
            owner_id: job.owner_id,
            artifact_type: report.artifactType,
            platform: job.platform,
            file_name: report.fileName,
            storage_path: report.storagePath,
            file_size: report.fileSize,
            checksum_sha256: report.checksumSha256.toLowerCase(),
            installation_instructions: report.installationInstructions,
          });
        if (artifactError) return new Response("Could not register artifact", { status: 500 });
        const { error: jobError } = await supabaseAdmin
          .from("desktop_build_jobs")
          .update({
            status: "complete",
            progress_stage: "build_complete",
            progress_percent: 100,
            completed_at: new Date().toISOString(),
            logs: report.logs,
            release_notes: report.releaseNotes,
            known_issues: report.knownIssues,
            minimum_requirements: report.minimumRequirements,
            recommended_requirements: report.recommendedRequirements,
            verification_results: report.verificationResults,
          })
          .eq("id", job.id);
        if (jobError) return new Response("Could not complete build", { status: 500 });
        return Response.json({ ok: true, status: "complete" });
      },
    },
  },
});
