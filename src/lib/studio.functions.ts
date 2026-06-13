import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fileSeed } from "@/lib/studio-data";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GameInput = z.object({
  name: z.string().min(1).max(80),
  platform: z.enum(["web", "mobile", "pc"]),
  genre: z.string().min(1).max(40),
  artStyle: z.string().min(1).max(40),
  playerMode: z.enum(["single", "multiplayer"]),
  monetization: z.string().min(1).max(40),
  description: z.string().max(500),
});

export const getStudioOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profile, games] = await Promise.all([
      context.supabase.from("profiles").select("display_name, plan, credits").eq("id", context.userId).maybeSingle(),
      context.supabase.from("games").select("*").eq("owner_id", context.userId).order("updated_at", { ascending: false }),
    ]);
    if (profile.error) throw new Error(profile.error.message);
    if (games.error) throw new Error(games.error.message);
    return { profile: profile.data, games: games.data ?? [] };
  });

export const createGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GameInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: game, error } = await context.supabase.from("games").insert({
      owner_id: context.userId,
      name: data.name,
      platform: data.platform,
      genre: data.genre,
      art_style: data.artStyle,
      player_mode: data.playerMode,
      monetization: data.monetization,
      description: data.description,
      status: "building",
    }).select().single();
    if (error || !game) throw new Error(error?.message ?? "Could not create game");

    const { data: thread, error: threadError } = await context.supabase.from("chat_threads").insert({
      game_id: game.id, owner_id: context.userId, title: "Foundation build",
    }).select().single();
    if (threadError || !thread) throw new Error(threadError?.message ?? "Could not create build session");

    const { error: filesError } = await context.supabase.from("project_files").insert(
      fileSeed.map((file) => ({ ...file, game_id: game.id, owner_id: context.userId })),
    );
    if (filesError) throw new Error(filesError.message);
    return { gameId: game.id, threadId: thread.id };
  });

const ThreadInput = z.object({ gameId: z.string().uuid() });
export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ThreadInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: thread, error } = await context.supabase.from("chat_threads").insert({
      game_id: data.gameId, owner_id: context.userId, title: "New build session",
    }).select("id").single();
    if (error || !thread) throw new Error(error?.message ?? "Could not create build session");
    return thread;
  });

const WorkspaceInput = z.object({ gameId: z.string().uuid(), threadId: z.string().uuid() });
export const getWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => WorkspaceInput.parse(input))
  .handler(async ({ data, context }) => {
    const [game, threads, messages, files] = await Promise.all([
      context.supabase.from("games").select("*").eq("id", data.gameId).eq("owner_id", context.userId).single(),
      context.supabase.from("chat_threads").select("*").eq("game_id", data.gameId).eq("owner_id", context.userId).order("updated_at", { ascending: false }),
      context.supabase.from("chat_messages").select("ai_message_id, role, parts").eq("thread_id", data.threadId).eq("owner_id", context.userId).order("created_at"),
      context.supabase.from("project_files").select("id, path, content, language, version").eq("game_id", data.gameId).eq("owner_id", context.userId).order("path"),
    ]);
    for (const result of [game, threads, messages, files]) if (result.error) throw new Error(result.error.message);
    return { game: game.data, threads: threads.data ?? [], messages: messages.data ?? [], files: files.data ?? [] };
  });