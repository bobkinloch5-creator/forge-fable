import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GameIdInput = z.object({ gameId: z.string().uuid() });
const CreateRunInput = z.object({
  gameId: z.string().uuid(),
  targetPlatform: z.enum(["web", "windows", "macos", "linux", "android", "ios"]),
  testSuites: z
    .array(
      z.enum([
        "movement",
        "combat",
        "quests",
        "menus",
        "saving",
        "loading",
        "multiplayer",
        "mobile_controls",
        "performance",
        "level_transitions",
        "accessibility",
      ]),
    )
    .min(1)
    .max(11),
});

export const getPlaytestState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GameIdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: runs, error } = await context.supabase
      .from("playtest_runs")
      .select("id, status, target_platform, test_suites, progress_percent, summary, created_at, completed_at")
      .eq("game_id", data.gameId)
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    const runIds = (runs ?? []).map((run) => run.id);
    if (runIds.length === 0) return { runs: [], results: [] };
    const { data: results, error: resultsError } = await context.supabase
      .from("playtest_results")
      .select("id, run_id, suite, test_name, status, severity, duration_ms, details, reproduction_steps, evidence, safe_fix_available, created_at")
      .in("run_id", runIds)
      .order("created_at", { ascending: false });
    if (resultsError) throw new Error(resultsError.message);
    return { runs: runs ?? [], results: results ?? [] };
  });

export const queuePlaytest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateRunInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: game } = await context.supabase
      .from("games")
      .select("id")
      .eq("id", data.gameId)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!game) throw new Error("Game project not found");
    const { data: run, error } = await context.supabase
      .from("playtest_runs")
      .insert({
        game_id: data.gameId,
        owner_id: context.userId,
        target_platform: data.targetPlatform,
        test_suites: data.testSuites,
      })
      .select("id")
      .single();
    if (error || !run) throw new Error(error?.message ?? "Could not queue playtest");
    return run;
  });