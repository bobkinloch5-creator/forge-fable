import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { developmentStageBlueprint, fileSeed } from "@/lib/studio-data";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GameInput = z.object({
  name: z.string().min(1).max(80),
  platform: z.string().min(1).max(60),
  dimension: z.enum(["2D", "3D"]),
  genre: z.string().min(1).max(40),
  artStyle: z.string().min(1).max(40),
  playerMode: z.string().min(1).max(40),
  controls: z.array(z.string().max(60)).max(12),
  systems: z.array(z.string().max(60)).max(30),
  monetization: z.string().min(1).max(40),
  description: z.string().max(500),
});

export const getStudioOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profile, games] = await Promise.all([
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
    ]);
    if (profile.error) throw new Error(profile.error.message);
    if (games.error) throw new Error(games.error.message);
    return { profile: profile.data, games: games.data ?? [] };
  });

export const createGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GameInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: game, error } = await context.supabase
      .from("games")
      .insert({
        owner_id: context.userId,
        name: data.name,
        platform: data.platform,
        genre: data.genre,
        art_style: data.artStyle,
        player_mode: data.playerMode,
        monetization: data.monetization,
        description: [
          data.description,
          `Dimension: ${data.dimension}`,
          `Controls: ${data.controls.join(", ")}`,
          `Systems: ${data.systems.join(", ")}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
        status: "plan_approved",
      })
      .select()
      .single();
    if (error || !game) throw new Error(error?.message ?? "Could not create game");

    const { data: thread, error: threadError } = await context.supabase
      .from("chat_threads")
      .insert({
        game_id: game.id,
        owner_id: context.userId,
        title: "Foundation build",
      })
      .select()
      .single();
    if (threadError || !thread)
      throw new Error(threadError?.message ?? "Could not create build session");

    const designDocument = {
      path: "docs/game-design-document.md",
      language: "markdown",
      content: `# ${data.name}\n\n## Approved foundation\n- Platform: ${data.platform}\n- Format: ${data.dimension}\n- Genre: ${data.genre}\n- Play mode: ${data.playerMode}\n- Art direction: ${data.artStyle}\n- Controls: ${data.controls.join(", ")}\n- Systems: ${data.systems.join(", ")}\n\n## Game vision\n${data.description || "To be refined with Fable 5 during the foundation build."}\n\n## Export policy\nBuilds are reported as complete only after the required compiler, SDK, signing, packaging, and validation steps succeed.`,
    };
    const exportConfig = {
      path: "config/export-targets.json",
      language: "json",
      content: JSON.stringify(
        {
          targets: [data.platform],
          status: "configuration_ready",
          signing: "required_for_store_or_installer_builds",
        },
        null,
        2,
      ),
    };
    const technicalDocument = {
      path: "docs/technical-design-document.md",
      language: "markdown",
      content: `# ${data.name} — Technical Design\n\n## Architecture principles\n- Modular, reusable systems with explicit interfaces\n- Dependency-aware features with one authoritative implementation per concern\n- Versioned data and save migrations\n- Platform-specific input, performance budgets, and export pipelines\n- Client/server separation and server authority when networking is enabled\n\n## Planned systems\n${data.systems.map((system) => `- ${system}`).join("\n")}\n\n## Quality gates\nEvery stage requires dependency checks, tests, performance review, and a checkpoint before high-risk changes.`,
    };
    const architectureDocument = {
      path: "docs/system-architecture.md",
      language: "markdown",
      content: `# System Architecture\n\n## Layers\n1. Platform and runtime services\n2. Data, saves, content registries, and networking\n3. Reusable gameplay systems\n4. World, encounters, quests, and authored content\n5. UI, audio, VFX, accessibility, and telemetry\n\n## Dependency rule\nHigher layers consume stable interfaces from lower layers. Systems may communicate through typed events and services, never duplicate ownership of the same state.\n\n## Scale targets\nMultiple maps and game modes, streamed worlds, data-driven enemies/items/quests/abilities, pooled entities, asynchronous asset loading, and measurable CPU/GPU/memory/network budgets.`,
    };
    const milestoneDocument = {
      path: "docs/development-roadmap.md",
      language: "markdown",
      content: `# Development Roadmap\n\n${developmentStageBlueprint.map((stage, index) => `## ${index + 1}. ${stage.title}\nDependencies: ${stage.dependencies.join(", ") || "None"}\nDeliverables: ${stage.deliverables.join(", ")}\n`).join("\n")}\n## Change policy\nCreate a checkpoint before major refactors, exports, dependency upgrades, world migrations, or changes spanning multiple systems.`,
    };
    const { error: filesError } = await context.supabase.from("project_files").insert(
      [
        ...fileSeed,
        designDocument,
        technicalDocument,
        architectureDocument,
        milestoneDocument,
        exportConfig,
      ].map((file) => ({
        ...file,
        game_id: game.id,
        owner_id: context.userId,
      })),
    );
    if (filesError) throw new Error(filesError.message);
    const { error: stagesError } = await context.supabase.from("development_stages").insert(
      developmentStageBlueprint.map((stage, index) => ({
        game_id: game.id,
        owner_id: context.userId,
        stage_key: stage.key,
        title: stage.title,
        position: index + 1,
        status: index === 0 ? "ready" : "planned",
        dependencies: [...stage.dependencies],
        deliverables: [...stage.deliverables],
      })),
    );
    if (stagesError) throw new Error(stagesError.message);
    const fileManifest = [
      ...fileSeed,
      designDocument,
      technicalDocument,
      architectureDocument,
      milestoneDocument,
      exportConfig,
    ].map((file) => ({ path: file.path, version: 1 }));
    const { error: checkpointError } = await context.supabase.from("project_checkpoints").insert({
      game_id: game.id,
      owner_id: context.userId,
      label: "Approved foundation",
      summary: "Initial game, technical architecture, roadmap, and export requirements approved.",
      stage_key: "game-planning",
      file_manifest: fileManifest,
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

const WorkspaceInput = z.object({ gameId: z.string().uuid(), threadId: z.string().uuid() });
export const getWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => WorkspaceInput.parse(input))
  .handler(async ({ data, context }) => {
    const [game, threads, messages, files, stages, checkpoints] = await Promise.all([
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
    ]);
    for (const result of [game, threads, messages, files, stages, checkpoints])
      if (result.error) throw new Error(result.error.message);
    return {
      game: game.data,
      threads: threads.data ?? [],
      messages: messages.data ?? [],
      files: files.data ?? [],
      stages: stages.data ?? [],
      checkpoints: checkpoints.data ?? [],
    };
  });
