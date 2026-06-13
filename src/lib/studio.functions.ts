import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { developmentStageBlueprint, fileSeed } from "@/lib/studio-data";
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
  playerMode: z.enum(["single", "multiplayer"]).default("single"),
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
  .validator((input: unknown) => GameInput.parse(input))
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
    if (error || !game) {
      console.error("Project row creation failed", {
        code: error?.code,
        constraint: error?.message.match(/constraint "([^"]+)"/)?.[1],
      });
      throw new Error(
        error?.message.includes("games_player_mode_check")
          ? "This project's player mode is not supported yet. Refresh and try again."
          : "Could not create the project. Please try again.",
      );
    }

    try {
      const { data: thread, error: threadError } = await context.supabase
        .from("chat_threads")
        .insert({
          game_id: game.id,
          owner_id: context.userId,
          title: "First build session",
        })
        .select()
        .single();
      if (threadError || !thread) {
        throw new Error(threadError?.message ?? "Could not create build session");
      }

      const { error: stagesError } = await context.supabase.from("development_stages").insert(
        developmentStageBlueprint.map((stage, index) => ({
          game_id: game.id,
          owner_id: context.userId,
          stage_key: stage.key,
          title: stage.title,
          position: index + 1,
          status: index === 0 ? ("ready" as const) : ("planned" as const),
          dependencies: [...stage.dependencies],
          deliverables: [...stage.deliverables],
        })),
      );
      if (stagesError) throw new Error(stagesError.message);

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
        file_manifest: (insertedFiles ?? []).map((file) => ({
          path: file.path,
          version: file.version,
        })),
      });
      if (checkpointError) throw new Error(checkpointError.message);

      return { gameId: game.id, threadId: thread.id };
    } catch (creationError) {
      const { error: cleanupError } = await context.supabase
        .from("games")
        .delete()
        .eq("id", game.id)
        .eq("owner_id", context.userId);
      if (cleanupError) console.error("Incomplete project cleanup failed", cleanupError.message);
      throw creationError;
    }
  });

const ThreadInput = z.object({ gameId: z.string().uuid() });
export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => ThreadInput.parse(input))
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

const RenameGameInput = z.object({
  gameId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
});

export const renameGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => RenameGameInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: game, error } = await context.supabase
      .from("games")
      .update({ name: data.name })
      .eq("id", data.gameId)
      .eq("owner_id", context.userId)
      .select("id, name")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!game) throw new Error("Project not found");
    return game;
  });

const GameIdInput = z.object({ gameId: z.string().uuid() });

export const deleteGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => GameIdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: artifacts, error: artifactError } = await context.supabase
      .from("desktop_build_artifacts")
      .select("storage_path")
      .eq("game_id", data.gameId)
      .eq("owner_id", context.userId);
    if (artifactError) throw new Error(artifactError.message);
    const storagePaths = (artifacts ?? []).map((artifact) => artifact.storage_path);
    if (storagePaths.length > 0) {
      const { error: storageError } = await context.supabase.storage
        .from("desktop-build-artifacts")
        .remove(storagePaths);
      if (storageError) throw new Error("Project files could not be removed safely");
    }
    const { data: deleted, error } = await context.supabase
      .from("games")
      .delete()
      .eq("id", data.gameId)
      .eq("owner_id", context.userId)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!deleted) throw new Error("Project not found");
    return { ok: true };
  });

export const duplicateGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => GameIdInput.parse(input))
  .handler(async ({ data, context }) => {
    const [gameResult, filesResult, stagesResult, memoryResult] = await Promise.all([
      context.supabase
        .from("games")
        .select(
          "name, platform, genre, art_style, player_mode, monetization, description, thumbnail_url",
        )
        .eq("id", data.gameId)
        .eq("owner_id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("project_files")
        .select("path, content, language, version")
        .eq("game_id", data.gameId)
        .eq("owner_id", context.userId),
      context.supabase
        .from("development_stages")
        .select("stage_key, title, position, status, dependencies, deliverables, test_summary")
        .eq("game_id", data.gameId)
        .eq("owner_id", context.userId),
      context.supabase
        .from("game_memory")
        .select("category, memory_key, content, source, importance")
        .eq("game_id", data.gameId)
        .eq("owner_id", context.userId),
    ]);
    for (const result of [gameResult, filesResult, stagesResult, memoryResult]) {
      if (result.error) throw new Error(result.error.message);
    }
    if (!gameResult.data) throw new Error("Project not found");
    const original = gameResult.data;
    const copyName = `${original.name} Copy`.slice(0, 80);
    const { data: copy, error: copyError } = await context.supabase
      .from("games")
      .insert({
        ...original,
        name: copyName,
        owner_id: context.userId,
        status: "draft",
      })
      .select("id")
      .single();
    if (copyError || !copy) throw new Error(copyError?.message ?? "Project could not be copied");
    try {
      const { data: thread, error: threadError } = await context.supabase
        .from("chat_threads")
        .insert({
          game_id: copy.id,
          owner_id: context.userId,
          title: "Duplicated project session",
        })
        .select("id")
        .single();
      if (threadError || !thread) throw new Error("Copied build session could not be created");

      if ((filesResult.data ?? []).length > 0) {
        const { error } = await context.supabase.from("project_files").insert(
          filesResult.data!.map((file) => ({
            ...file,
            game_id: copy.id,
            owner_id: context.userId,
          })),
        );
        if (error) throw new Error(error.message);
      }
      if ((stagesResult.data ?? []).length > 0) {
        const { error } = await context.supabase.from("development_stages").insert(
          stagesResult.data!.map((stage) => ({
            ...stage,
            game_id: copy.id,
            owner_id: context.userId,
          })),
        );
        if (error) throw new Error(error.message);
      }
      if ((memoryResult.data ?? []).length > 0) {
        const { error } = await context.supabase.from("game_memory").insert(
          memoryResult.data!.map((memory) => ({
            ...memory,
            game_id: copy.id,
            owner_id: context.userId,
          })),
        );
        if (error) throw new Error(error.message);
      }
      const { data: copiedFiles, error: copiedFilesError } = await context.supabase
        .from("project_files")
        .select("id, path, content, language, version")
        .eq("game_id", copy.id)
        .eq("owner_id", context.userId);
      if (copiedFilesError) throw new Error(copiedFilesError.message);
      if ((copiedFiles ?? []).length > 0) {
        const { error } = await context.supabase.from("file_revisions").insert(
          copiedFiles!.map((file) => ({
            game_id: copy.id,
            file_id: file.id,
            owner_id: context.userId,
            path: file.path,
            content: file.content,
            language: file.language,
            version: file.version,
            change_type: "created",
            summary: "Duplicated project baseline",
          })),
        );
        if (error) throw new Error(error.message);
      }
      const { error: checkpointError } = await context.supabase.from("project_checkpoints").insert({
        game_id: copy.id,
        owner_id: context.userId,
        label: "Project duplicated",
        summary: `Copied from ${original.name}. Chat history and build artifacts were not copied.`,
        file_manifest: (copiedFiles ?? []).map((file) => ({
          path: file.path,
          version: file.version,
        })),
      });
      if (checkpointError) throw new Error(checkpointError.message);
      return { gameId: copy.id, threadId: thread.id };
    } catch (error) {
      await context.supabase
        .from("games")
        .delete()
        .eq("id", copy.id)
        .eq("owner_id", context.userId);
      throw error;
    }
  });

const WorkspaceInput = z.object({
  gameId: z.string().uuid(),
  threadId: z.string().uuid(),
});
export const getWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => WorkspaceInput.parse(input))
  .handler(async ({ data, context }) => {
    const [game, selectedThread, threads, messages, files, stages, checkpoints, profile, roles] =
      await Promise.all([
        context.supabase
          .from("games")
          .select("*")
          .eq("id", data.gameId)
          .eq("owner_id", context.userId)
          .single(),
        context.supabase
          .from("chat_threads")
          .select("id")
          .eq("id", data.threadId)
          .eq("game_id", data.gameId)
          .eq("owner_id", context.userId)
          .maybeSingle(),
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
          .select(
            "id, stage_key, title, position, status, dependencies, deliverables, test_summary",
          )
          .eq("game_id", data.gameId)
          .eq("owner_id", context.userId)
          .order("position"),
        context.supabase
          .from("project_checkpoints")
          .select("id, label, summary, stage_key, created_at")
          .eq("game_id", data.gameId)
          .eq("owner_id", context.userId)
          .order("created_at", { ascending: false }),
        context.supabase.from("profiles").select("credits").eq("id", context.userId).maybeSingle(),
        context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
      ]);
    for (const result of [
      game,
      selectedThread,
      threads,
      messages,
      files,
      stages,
      checkpoints,
      profile,
      roles,
    ])
      if (result.error) throw new Error(result.error.message);
    if (!selectedThread.data) throw new Error("Build session not found for this project");
    return {
      game: game.data,
      threads: threads.data ?? [],
      messages: messages.data ?? [],
      files: files.data ?? [],
      stages: stages.data ?? [],
      checkpoints: checkpoints.data ?? [],
      credits: profile.data?.credits ?? 0,
      roles: roles.data ?? [],
    };
  });
