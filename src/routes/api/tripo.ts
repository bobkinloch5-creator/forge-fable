import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const RequestBody = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), prompt: z.string().trim().min(3).max(1200) }),
  z.object({ action: z.literal("status"), taskId: z.string().trim().min(1).max(200) }),
]);

const TRIPO_API = "https://api.tripo3d.ai/v2/openapi";

export const Route = createFileRoute("/api/tripo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) return new Response("Sign in required", { status: 401 });
        const url = process.env.SUPABASE_URL;
        const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        const tripoKey = process.env.TRIPO_API_KEY;
        if (!url || !publicKey || !tripoKey) {
          return new Response("3D generation is not configured", { status: 500 });
        }
        const db = createClient(url, publicKey, {
          global: { headers: { Authorization: auth } },
          auth: { persistSession: false },
        });
        const { data: claims } = await db.auth.getClaims(auth.slice(7));
        const userId = claims?.claims?.sub;
        if (!userId) return new Response("Invalid session", { status: 401 });
        const parsed = RequestBody.safeParse(await request.json());
        if (!parsed.success) return new Response("Invalid 3D generation request", { status: 400 });

        const generationCost = 12;
        let charged = false;
        let supabaseAdmin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"] | null = null;
        if (parsed.data.action === "create") {
          ({ supabaseAdmin } = await import("@/integrations/supabase/client.server"));
          const { error: creditError } = await supabaseAdmin.rpc("consume_creator_credits", {
            _user_id: userId,
            _amount: generationCost,
          });
          if (creditError) return new Response("Insufficient credits", { status: 402 });
          charged = true;
        }
        const endpoint =
          parsed.data.action === "create"
            ? `${TRIPO_API}/task`
            : `${TRIPO_API}/task/${parsed.data.taskId}`;
        const upstream = await fetch(endpoint, {
          method: parsed.data.action === "create" ? "POST" : "GET",
          headers: {
            Authorization: `Bearer ${tripoKey}`,
            "Content-Type": "application/json",
          },
          body:
            parsed.data.action === "create"
              ? JSON.stringify({ type: "text_to_model", prompt: parsed.data.prompt })
              : undefined,
        });
        const payload = (await upstream.json()) as {
          code?: number;
          message?: string;
          data?: {
            task_id?: string;
            status?: string;
            progress?: number;
            output?: { model?: string; pbr_model?: string; base_model?: string };
          };
        };
        if (!upstream.ok || payload.code !== 0) {
          if (charged && supabaseAdmin) {
            await supabaseAdmin.rpc("refund_creator_credits", {
              _user_id: userId,
              _amount: generationCost,
            });
          }
          console.error("Tripo API error", upstream.status, payload.message);
          return new Response(payload.message || "Tripo request failed", {
            status: upstream.status || 502,
          });
        }
        if (parsed.data.action === "create") {
          if (!payload.data?.task_id)
            return new Response("Tripo did not return a task", { status: 502 });
          return Response.json({ taskId: payload.data.task_id });
        }
        const status = payload.data?.status ?? "running";
        const output = payload.data?.output;
        return Response.json({
          status,
          progress: Math.round(payload.data?.progress ?? (status === "success" ? 100 : 0)),
          modelUrl: output?.pbr_model ?? output?.model ?? output?.base_model,
        });
      },
    },
  },
});
