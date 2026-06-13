import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fileSeed } from "@/lib/studio-data";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const platformValues = [
  "Website game",
  "Windows PC game",
  "Mobile game",
  "Cross-platform game",
] as const;

function normalizePlatform(platform: (typeof platformValues)[number]): "web" | "mobile" | "pc" {
  if (platform === "Website game") return "web";
  if (platform === "Mobile game") return "mobile";
  return "pc";
}

const GameInput = z.object({
  name: z.string().min(1).max(80),
  platform: z.enum(platformValues),
  dimension: z.enum(["2D", "3D"]),
  description: z.string().max(500),
  // Defaulted fields to satisfy DB schema
  genre: z.string().default("General"),
  artStyle: z.string().default("Default"),
  playerMode: z.string().default("Single-player"),
  monetization: z.string().default("Free"),
  controls: z.array(z.string()).default([]),
  systems: z.array(z.string()).default([]),
  responsiveTargets: z.array(z.string()).default([]),
  accountMode: z.string().default("Guest"),
  saveProgress: z.boolean().default(false),
  leaderboards: z.boolean().default(false),
  achievements: z.boolean().default(false),
  revenueModel: z.string().default("None"),
  domainChoice: z.string().default("Free"),
  publicLandingPage: z.boolean().default(false),
});

export const getStudioOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profile, games, roles] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("display_name, plan, credits")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("games")
        .select("*")
        .eq("owner_id", context.userId)
        .order("updated_at", { ascending: false }),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
    ]);
    if (profile.error) throw new Error(profile.error.message);
    if (games.error) throw new Error(games.error.message);
    if (roles.error) throw new Error(roles.error.message);
    return { profile: profile.data, games: games.data ?? [], roles: roles.data ?? [] };
  });

export const createGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GameInput.parse(input))
  .handler(async ({ data, context }) => {
    const storedPlatform = normalizePlatform(data.platform);
    const { data: game, error } = await context.supabase
      .from("games")
      .insert({
        owner_id: context.userId,
        name: data.name,
        platform: storedPlatform,
        genre: data.genre,
        art_style: data.artStyle,
        player_mode: data.playerMode,
        monetization: data.monetization,
        status: "draft",
        description: `${data.description}\n\nDimension: ${data.dimension}`,
      })
      .select()
      .single();
    if (error || !game) throw new Error(error?.message ?? "Could not create game");

    const { data: thread, error: threadError } = await context.supabase
      .from("chat_threads")
      .insert({
        game_id: game.id,
        owner_id: context.userId,
        title: "First build session",
      })
      .select()
      .single();
    if (threadError || !thread)
      throw new Error(threadError?.message ?? "Could not create build session");

    const { error: filesError } = await context.supabase.from("project_files").insert(
      fileSeed.map((file) => ({
        ...file,
        game_id: game.id,
        owner_id: context.userId,
      })),
    );
    if (filesError) throw new Error(filesError.message);

    const { error: memoryError } = await context.supabase.from("game_memory").insert({
      category: "vision",
      memory_key: "game-vision",
      content: data.description || `${data.name} is a ${data.dimension} game.`,
      game_id: game.id,
      owner_id: context.userId,
      source: "creation",
      importance: 90,
    });
    if (memoryError) throw new Error(memoryError.message);

    const { data: insertedFiles, error: insertedFilesError } = await context.supabase
      .from("project_files")
      .select("id, path, content, language, version")
      .eq("game_id", game.id)
      .eq("owner_id", context.userId);
    if (insertedFilesError) throw new Error(insertedFilesError.message);

    const { error: revisionError } = await context.supabase.from("file_revisions").insert(
      (insertedFiles ?? []).map((file) => ({
        game_id: game.id,
        file_id: file.id,
        owner_id: context.userId,
        path: file.path,
        content: file.content,
        language: file.language,
        version: file.version,
        change_type: "created",
        summary: "Initial files",
      })),
    );
    if (revisionError) throw new Error(revisionError.message);

    const { error: checkpointError } = await context.supabase.from("project_checkpoints").insert({
      game_id: game.id,
      owner_id: context.userId,
      label: "Project created",
      summary: "Minimal project foundation started.",
      file_manifest: (insertedFiles ?? []).map((file) => ({ path: file.path, version: 1 })),
    });
    if (checkpointError) throw new Error(checkpointError.message);

    return { gameId: game.id, threadId: thread.id };
  });

const ThreadInput = z.object({ gameId: z.string().uuid() });
export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ThreadInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: game, error: gameError } = await context.supabase
      .from("games")
      .select("id")
      .eq("id", data.gameId)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (gameError || !game) throw new Error("Game project not found");
    const { data: thread, error } = await context.supabase
      .from("chat_threads")
      .insert({
        game_id: data.gameId,
        owner_id: context.userId,
        title: "New build session",
      })
      .select("id")
      .single();
    if (error || !thread) throw new Error(error?.message ?? "Could not create build session");
    return thread;
  });

const WorkspaceInput = z.object({
  gameId: z.string().uuid(),
  threadId: z.string().uuid(),
});
export const getWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => WorkspaceInput.parse(input))
  .handler(async ({ data, context }) => {
    const [game, threads, messages, files, stages, checkpoints, roles] = await Promise.all([
      context.supabase
        .from("games")
        .select("*")
        .eq("id", data.gameId)
        .eq("owner_id", context.userId)
        .single(),
      context.supabase
        .from("chat_threads")
        .select("*")
        .eq("game_id", data.gameId)
        .eq("owner_id", context.userId)
        .order("updated_at", { ascending: false }),
      context.supabase
        .from("chat_messages")
        .select("ai_message_id, role, parts")
        .eq("thread_id", data.threadId)
        .eq("owner_id", context.userId)
        .order("created_at"),
      context.supabase
        .from("project_files")
        .select("id, path, content, language, version")
        .eq("game_id", data.gameId)
        .eq("owner_id", context.userId)
        .order("path"),
      context.supabase
        .from("development_stages")
        .select("id, stage_key, title, position, status, dependencies, deliverables, test_summary")
        .eq("game_id", data.gameId)
        .eq("owner_id", context.userId)
        .order("position"),
      context.supabase
        .from("project_checkpoints")
        .select("id, label, summary, stage_key, created_at")
        .eq("game_id", data.gameId)
        .eq("owner_id", context.userId)
        .order("created_at", { ascending: false }),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
    ]);
    for (const result of [game, threads, messages, files, stages, checkpoints, roles])
      if (result.error) throw new Error(result.error.message);
    return {
      game: game.data,
      threads: threads.data ?? [],
      messages: messages.data ?? [],
      files: files.data ?? [],
      stages: stages.data ?? [],
      checkpoints: checkpoints.data ?? [],
      roles: roles.data ?? [],
    };
  });
