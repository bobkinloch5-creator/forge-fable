import {
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
  modelTier: z.enum(["fast", "balanced", "pro"]).default("balanced"),
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
          const { error } = await db
            .from("chat_messages")
            .upsert(
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
        const result = streamText({
          model: gateway(models[modelTier]),
          system:
            "You are FableForge, an expert game design and engineering agent inside a professional game studio. Give concise, executable build plans. Explain file-level changes, flag risky major changes for approval, and prioritize playable increments. Never claim a file was changed unless a tool result confirms it.",
          messages: await convertToModelMessages(messages),
        });
        const response = result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ responseMessage, isAborted }) => {
            if (isAborted) return;
            const { error } = await db
              .from("chat_messages")
              .upsert(
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
        return withGatewayRunId(response, gateway);
      },
    },
  },
});
