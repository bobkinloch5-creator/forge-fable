import {
  createCometApiProvider,
  createLovableAiGatewayProvider,
  getGatewayRunId,
  withGatewayRunId,
} from "@/lib/ai-gateway.server";
import { getAiModelCreditCost, isPremiumAiModel } from "@/lib/ai-models";
import { getCometChatModels } from "@/lib/comet-models.server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit.server";
import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";

const TextMessage = z.object({
  id: z.string().min(1).max(200),
  role: z.enum(["user", "assistant"]),
  parts: z
    .array(z.object({ type: z.literal("text"), text: z.string().max(32000) }))
    .min(1)
    .max(20),
});
const Body = z.object({
  messages: z
    .array(TextMessage)
    .min(1)
    .max(30)
    .refine(
      (messages) =>
        messages.reduce(
          (total, message) =>
            total + message.parts.reduce((partTotal, part) => partTotal + part.text.length, 0),
          0,
        ) <= 128_000,
      "Chat payload is too large",
    ),
  gameId: z.string().uuid(),
  threadId: z.string().uuid(),
  modelId: z.string().min(1).max(200).default("lovable:balanced"),
});

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) return new Response("Sign in required", { status: 401 });
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY;
        const aiKey = process.env.LOVABLE_API_KEY;
        const cometKey = process.env.COMET_API_KEY;
        if (!url || !key) return new Response("Server configuration missing", { status: 500 });
        const db = createClient(url, key, {
          global: { headers: { Authorization: auth } },
          auth: { persistSession: false },
        });
        const { data: claims } = await db.auth.getClaims(auth.slice(7));
        const userId = claims?.claims?.sub;
        if (!userId) return new Response("Invalid session", { status: 401 });
        const rateLimit = checkRateLimit(`chat:${userId}`, 20, 60_000);
        if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds);
        let requestBody: unknown;
        try {
          requestBody = await request.json();
        } catch {
          return new Response("Invalid JSON request", { status: 400 });
        }
        const parsed = Body.safeParse(requestBody);
        if (!parsed.success) return new Response("Invalid chat request", { status: 400 });
        const { messages: clientMessages, gameId, threadId, modelId } = parsed.data;
        const { data: thread } = await db
          .from("chat_threads")
          .select("id, game_id")
          .eq("id", threadId)
          .eq("game_id", gameId)
          .eq("owner_id", userId)
          .maybeSingle();
        if (!thread) return new Response("Build session not found", { status: 404 });

        const [
          gameResult,
          stageResult,
          fileResult,
          checkpointResult,
          historyResult,
          memoryResult,
          profileResult,
          rolesResult,
        ] = await Promise.all([
          db
            .from("games")
            .select("name, platform, genre, art_style, player_mode, description, status")
            .eq("id", gameId)
            .eq("owner_id", userId)
            .single(),
          db
            .from("development_stages")
            .select("stage_key, title, position, status, dependencies, deliverables, test_summary")
            .eq("game_id", gameId)
            .eq("owner_id", userId)
            .order("position"),
          db
            .from("project_files")
            .select("path, language, version")
            .eq("game_id", gameId)
            .eq("owner_id", userId)
            .order("path"),
          db
            .from("project_checkpoints")
            .select("label, summary, stage_key, created_at")
            .eq("game_id", gameId)
            .eq("owner_id", userId)
            .order("created_at", { ascending: false })
            .limit(5),
          db
            .from("chat_messages")
            .select("ai_message_id, role, parts")
            .eq("thread_id", threadId)
            .eq("owner_id", userId)
            .order("created_at")
            .limit(199),
          db
            .from("game_memory")
            .select("category, memory_key, content, importance, updated_at")
            .eq("game_id", gameId)
            .eq("owner_id", userId)
            .order("importance", { ascending: false })
            .limit(200),
          db.from("profiles").select("plan").eq("id", userId).maybeSingle(),
          db.from("user_roles").select("role").eq("user_id", userId),
        ]);
        const contextError = [
          gameResult,
          stageResult,
          fileResult,
          checkpointResult,
          historyResult,
          memoryResult,
          profileResult,
          rolesResult,
        ].find((result) => result.error)?.error;
        if (contextError)
          return new Response("Project context could not be loaded", { status: 500 });

        const latestUser = [...clientMessages].reverse().find((message) => message.role === "user");
        if (!latestUser) return new Response("A user message is required", { status: 400 });
        const isCometModel = !modelId.startsWith("lovable:");
        const models = {
          "lovable:fast": "google/gemini-3.1-flash-lite-preview",
          "lovable:balanced": "google/gemini-3-flash-preview",
          "lovable:pro": "openai/gpt-5.4",
        } as const;
        const lovableModel = models[modelId as keyof typeof models];
        if (!isCometModel && !lovableModel) {
          return new Response("Selected FableForge model is unavailable", { status: 400 });
        }
        const isOwner = (rolesResult.data ?? []).some((role) => role.role === "owner");
        const hasPremiumPlan =
          profileResult.data?.plan === "pro" || profileResult.data?.plan === "pro_max";
        if (isPremiumAiModel(modelId) && !isOwner && !hasPremiumPlan) {
          return new Response("This model requires a Pro or Pro Max plan", { status: 403 });
        }
        if (!isCometModel && !aiKey) {
          return new Response("FableForge AI is not configured", { status: 503 });
        }
        if (isCometModel) {
          if (!cometKey) return new Response("CometAPI is not configured", { status: 503 });
          let catalog: Awaited<ReturnType<typeof getCometChatModels>>;
          try {
            catalog = await getCometChatModels();
          } catch (error) {
            console.error("CometAPI catalog failed", error);
            return new Response("CometAPI catalog is temporarily unavailable", { status: 502 });
          }
          if (!catalog.models.some((item) => item.id === modelId)) {
            return new Response("Selected CometAPI model is unavailable", { status: 400 });
          }
        }
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
          return new Response("AI billing is not configured", { status: 503 });
        }

        const storedMessages = (historyResult.data ?? []).flatMap((message, index) => {
          if (message.role !== "user" && message.role !== "assistant") return [];
          if (message.ai_message_id === latestUser.id) return [];
          const parts = TextMessage.shape.parts.safeParse(message.parts);
          if (!parts.success) {
            console.warn("Skipping malformed stored chat message", {
              threadId,
              messageId: message.ai_message_id,
            });
            return [];
          }
          return [
            {
              id: message.ai_message_id ?? `stored-${index}`,
              role: message.role,
              parts: parts.data,
            },
          ];
        });
        const messages = [...storedMessages, latestUser] satisfies UIMessage[];

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const creditCost = getAiModelCreditCost(modelId);
        const creditOperationKey = `chat:${threadId}:${latestUser.id}`;
        const { data: creditResult, error: creditError } = await supabaseAdmin.rpc(
          "consume_creator_credits_once",
          {
            _user_id: userId,
            _amount: creditCost,
            _operation_key: creditOperationKey,
          },
        );
        if (creditError) return new Response("Insufficient credits", { status: 402 });
        if (!creditResult?.[0]?.charged) {
          return new Response("This chat request was already processed", { status: 409 });
        }
        const refundCredits = async () => {
          const { error } = await supabaseAdmin.rpc("refund_creator_credits_once", {
            _user_id: userId,
            _operation_key: creditOperationKey,
          });
          if (error) console.error("AI credit refund failed", error.message);
        };

        const { error: messageError } = await db.from("chat_messages").upsert(
          {
            thread_id: threadId,
            owner_id: userId,
            ai_message_id: latestUser.id,
            role: "user",
            parts: latestUser.parts,
          },
          { onConflict: "thread_id,ai_message_id", ignoreDuplicates: true },
        );
        if (messageError) {
          await refundCredits();
          return new Response("Could not save message", { status: 500 });
        }

        const initialRunId = getGatewayRunId(request);
        const gateway = isCometModel ? null : createLovableAiGatewayProvider(aiKey!, initialRunId);
        const model = isCometModel
          ? createCometApiProvider(cometKey!)(modelId)
          : gateway!(lovableModel);
        try {
          const result = streamText({
            model,
            system: `You are FableForge, a senior game director, systems designer, gameplay engineer, networking engineer, technical artist, performance engineer, release engineer, and QA lead inside a professional AI game engine. You build serious, expandable commercial-scale projects for PC, mobile, and web—not disposable prototypes. You remember and preserve the project's genre, visual language, characters, mechanics, platform, architecture, dependencies, milestones, files, and prior decisions. Turn even short ideas into coherent production plans, but ask a question only when a missing decision would make the result unsafe or fundamentally ambiguous.

CURRENT PROJECT SOURCE OF TRUTH:
${JSON.stringify({ game: gameResult.data, structuredMemory: memoryResult.data ?? [], stages: stageResult.data ?? [], files: fileResult.data ?? [], recentCheckpoints: checkpointResult.data ?? [] })}

Structured project memory is authoritative. Preserve its story, characters, mechanics, maps, controls, economy, multiplayer rules, art direction, decisions, and constraints. If a request conflicts with it, explain the conflict and propose a deliberate change rather than silently drifting.

For complex work, first reconcile the request against this source of truth and the complete conversation. Identify affected systems, dependencies, files, data migrations, platform constraints, multiplayer authority boundaries, performance risks, and regression tests. Work through the project's ordered development stages; do not attempt a large game as one unstructured generation. Finish and test foundations before dependent content. Prefer data-driven content registries and reusable systems so the project can scale to many maps, levels, modes, enemies, items, quests, abilities, vehicles, characters, and world regions.

Architecture rules:
- Keep code modular, typed, reusable, dependency-aware, and owned by one authoritative system.
- Never introduce a duplicate manager, save format, networking authority, inventory, combat, input, or progression system.
- Separate client presentation/input from authoritative server simulation for multiplayer.
- Preserve backward compatibility or provide explicit data/save migrations.
- Use world streaming, pooling, asynchronous asset loading, level-of-detail, culling, and measurable CPU/GPU/memory/network budgets where scale requires them.
- Create or require a checkpoint before destructive refactors, dependency upgrades, schema changes, world migrations, or edits spanning multiple systems.
- Test after every major stage and isolate fixes so unrelated systems remain unchanged.
- Never call an export complete without real compilation, packaging, signing where required, and platform validation.

Write useful, confident, non-robotic responses in Markdown using these headings when relevant:
## What I understood
## Required systems
## Build order
## Files being changed
## Dependencies
## Risks and limitations
## Current progress
## Testing results
## Recommended next steps

Explain decisions in plain language. Recommend genre-appropriate mechanics and adapt UI, controls, performance budgets, and input for web, mobile, or PC. Maintain the game design document, technical design document, system architecture, folder structure, data structures, multiplayer architecture, level plan, asset requirements, milestones, testing checklist, and export requirements as living project documents. Plan organized folders, scenes, scripts, UI, levels, enemies, items, quests, shops, controls, settings, progression, accessibility, and saves as appropriate—never add random features that conflict with the project.

For file reports, use bullets prefixed with Created, Updated, Removed, or Backed up. Never claim a file changed, a test ran, or a build passed unless a tool result confirms it. Before destructive or large changes, explain the impact and request approval. Never overwrite major work without a checkpoint or backup. After major changes, report checks for broken controls, missing files, performance regressions, responsive behavior, and gameplay bugs. When blocked, state the exact problem and propose a clear Fix with AI action. Finish completed work with a concise build report and practical next steps.`,
            messages: await convertToModelMessages(messages),
          });
          const response = result.toUIMessageStreamResponse({
            originalMessages: messages,
            onError: (error) => {
              void refundCredits();
              const message = error instanceof Error ? error.message : String(error);
              if (message.includes("402"))
                return "AI credits are exhausted. Add workspace AI balance to continue.";
              if (message.includes("429")) return "The forge is busy. Try again in a moment.";
              return "The AI build failed. Your prompt is still here—please retry.";
            },
            onFinish: async ({ responseMessage, isAborted }) => {
              if (isAborted) {
                await refundCredits();
                return;
              }
              const { error } = await db.from("chat_messages").upsert(
                {
                  thread_id: threadId,
                  owner_id: userId,
                  ai_message_id: responseMessage.id,
                  role: "assistant",
                  parts: responseMessage.parts,
                },
                { onConflict: "thread_id,ai_message_id", ignoreDuplicates: true },
              );
              if (error) console.error("Assistant persistence failed", error.message);
              await db
                .from("chat_threads")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", threadId)
                .eq("owner_id", userId);
            },
          });
          return isCometModel ? response : withGatewayRunId(response, gateway!);
        } catch (error) {
          await refundCredits();
          console.error("AI stream setup failed", error);
          return new Response("The AI build could not start. Your credits were restored.", {
            status: 502,
          });
        }
      },
    },
  },
});
