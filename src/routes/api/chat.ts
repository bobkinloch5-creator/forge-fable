import {
  createCometApiProvider,
  createLovableAiGatewayProvider,
  getGatewayRunId,
  withGatewayRunId,
} from "@/lib/ai-gateway.server";
import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";

const Body = z.object({
  messages: z.array(z.custom<UIMessage>()),
  gameId: z.string().uuid(),
  threadId: z.string().uuid(),
  modelTier: z.enum(["fast", "balanced", "pro", "comet"]).default("balanced"),
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
        if (!url || !key || !aiKey)
          return new Response("Server configuration missing", { status: 500 });
        const db = createClient(url, key, {
          global: { headers: { Authorization: auth } },
          auth: { persistSession: false },
        });
        const { data: claims } = await db.auth.getClaims(auth.slice(7));
        const userId = claims?.claims?.sub;
        if (!userId) return new Response("Invalid session", { status: 401 });
        const parsed = Body.safeParse(await request.json());
        if (!parsed.success) return new Response("Invalid chat request", { status: 400 });
        const { messages, gameId, threadId, modelTier } = parsed.data;
        const { data: thread } = await db
          .from("chat_threads")
          .select("id, game_id")
          .eq("id", threadId)
          .eq("game_id", gameId)
          .eq("owner_id", userId)
          .maybeSingle();
        if (!thread) return new Response("Build session not found", { status: 404 });

        const latestUser = [...messages].reverse().find((message) => message.role === "user");
        if (latestUser) {
          const { error } = await db.from("chat_messages").upsert(
            {
              thread_id: threadId,
              owner_id: userId,
              ai_message_id: latestUser.id,
              role: "user",
              parts: latestUser.parts,
            },
            { onConflict: "thread_id,ai_message_id", ignoreDuplicates: true },
          );
          if (error) return new Response("Could not save message", { status: 500 });
        }

        const initialRunId = getGatewayRunId(request);
        const gateway = createLovableAiGatewayProvider(aiKey, initialRunId);
        const models = {
          fast: "google/gemini-3.1-flash-lite-preview",
          balanced: "google/gemini-3-flash-preview",
          pro: "openai/gpt-5.4",
        } as const;
        const model =
          modelTier === "comet"
            ? cometKey
              ? createCometApiProvider(cometKey)("gpt-5.3-codex")
              : null
            : gateway(models[modelTier]);
        if (!model) return new Response("CometAPI is not configured", { status: 503 });
        const result = streamText({
          model,
          system: `You are FableForge, a senior game director, systems designer, gameplay engineer, technical artist, and QA lead inside a professional AI game engine. You remember and preserve this project's genre, visual language, characters, mechanics, platform, and prior instructions from the full conversation. Turn even short ideas into coherent, production-minded game plans, but ask a question only when a missing decision would make the result unsafe or fundamentally ambiguous.

Write useful, confident, non-robotic responses in Markdown using these headings when relevant:
## What I understood
## What I am building
## Files being changed
## Current progress
## Testing results
## Recommended next steps

Explain decisions in plain language. Recommend genre-appropriate mechanics and adapt UI, controls, performance budgets, and input for web, mobile, or PC. Plan organized folders, scenes, scripts, UI, levels, enemies, items, quests, shops, controls, settings, progression, accessibility, and saves as appropriate—never add random features that conflict with the project.

For file reports, use bullets prefixed with Created, Updated, Removed, or Backed up. Never claim a file changed, a test ran, or a build passed unless a tool result confirms it. Before destructive or large changes, explain the impact and request approval. Never overwrite major work without a checkpoint or backup. After major changes, report checks for broken controls, missing files, performance regressions, responsive behavior, and gameplay bugs. When blocked, state the exact problem and propose a clear Fix with AI action. Finish completed work with a concise build report and practical next steps.`,
          messages: await convertToModelMessages(messages),
        });
        const response = result.toUIMessageStreamResponse({
          originalMessages: messages,
          onError: (error) => {
            const message = error instanceof Error ? error.message : String(error);
            if (message.includes("402"))
              return "AI credits are exhausted. Add workspace AI balance to continue.";
            if (message.includes("429")) return "The forge is busy. Try again in a moment.";
            return "The AI build failed. Your prompt is still here—please retry.";
          },
          onFinish: async ({ responseMessage, isAborted }) => {
            if (isAborted) return;
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
        return modelTier === "comet" ? response : withGatewayRunId(response, gateway);
      },
    },
  },
});
