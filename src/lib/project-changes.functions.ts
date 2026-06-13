import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GameIdInput = z.object({ gameId: z.string().uuid() });
const DecideInput = z.object({
  gameId: z.string().uuid(),
  proposalId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
});
const RestoreInput = z.object({
  gameId: z.string().uuid(),
  revisionId: z.string().uuid(),
});

export const getProjectHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => GameIdInput.parse(input))
  .handler(async ({ data, context }) => {
    const [proposals, revisions] = await Promise.all([
      context.supabase
        .from("change_proposals")
        .select(
          "id, title, summary, risk_level, status, affected_systems, dependencies, risks, changes, test_plan, created_at",
        )
        .eq("game_id", data.gameId)
        .eq("owner_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(30),
      context.supabase
        .from("file_revisions")
        .select("id, path, version, change_type, summary, created_at")
        .eq("game_id", data.gameId)
        .eq("owner_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(60),
    ]);
    if (proposals.error) throw new Error(proposals.error.message);
    if (revisions.error) throw new Error(revisions.error.message);
    return { proposals: proposals.data ?? [], revisions: revisions.data ?? [] };
  });

export const decideChangeProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => DecideInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: updated, error } = await context.supabase
      .from("change_proposals")
      .update({ status: data.decision, decided_at: new Date().toISOString() })
      .eq("id", data.proposalId)
      .eq("game_id", data.gameId)
      .eq("owner_id", context.userId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) throw new Error("This proposal was already decided or is unavailable");
    return { ok: true };
  });

export const restoreFileRevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => RestoreInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: revision, error } = await context.supabase
      .from("file_revisions")
      .select("path, content, language")
      .eq("id", data.revisionId)
      .eq("game_id", data.gameId)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (error || !revision) throw new Error("Revision not found");
    const { data: current } = await context.supabase
      .from("project_files")
      .select("id, content, language, version")
      .eq("game_id", data.gameId)
      .eq("owner_id", context.userId)
      .eq("path", revision.path)
      .maybeSingle();
    const nextVersion = (current?.version ?? 0) + 1;
    if (current) {
      const { error: snapshotError } = await context.supabase.from("file_revisions").insert({
        game_id: data.gameId,
        file_id: current.id,
        owner_id: context.userId,
        path: revision.path,
        content: current.content,
        language: current.language,
        version: current.version,
        change_type: "updated",
        summary: "Automatic backup before restore",
      });
      if (snapshotError && snapshotError.code !== "23505") throw new Error(snapshotError.message);
    }
    const { error: upsertError } = await context.supabase.from("project_files").upsert(
      {
        game_id: data.gameId,
        owner_id: context.userId,
        path: revision.path,
        content: revision.content,
        language: revision.language,
        version: nextVersion,
      },
      { onConflict: "game_id,path" },
    );
    if (upsertError) throw new Error(upsertError.message);
    return { ok: true };
  });
