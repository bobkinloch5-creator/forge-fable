import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GameIdInput = z.object({ gameId: z.string().uuid() });
const MemoryInput = z.object({
  gameId: z.string().uuid(),
  category: z.enum([
    "vision",
    "genre",
    "story",
    "character",
    "mechanic",
    "map",
    "art_style",
    "control",
    "economy",
    "multiplayer",
    "decision",
    "constraint",
    "summary",
  ]),
  memoryKey: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(32000),
  importance: z.number().int().min(1).max(100).default(50),
});

export const getGameMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GameIdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: memory, error } = await context.supabase
      .from("game_memory")
      .select("id, category, memory_key, content, source, importance, updated_at")
      .eq("game_id", data.gameId)
      .eq("owner_id", context.userId)
      .order("importance", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return memory ?? [];
  });

export const saveGameMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => MemoryInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: game } = await context.supabase
      .from("games")
      .select("id")
      .eq("id", data.gameId)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!game) throw new Error("Game project not found");
    const { error } = await context.supabase.from("game_memory").upsert(
      {
        game_id: data.gameId,
        owner_id: context.userId,
        category: data.category,
        memory_key: data.memoryKey,
        content: data.content,
        importance: data.importance,
        source: "creator",
      },
      { onConflict: "game_id,category,memory_key" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });