import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit.server";
import { z } from "zod";

const RequestBody = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    prompt: z.string().trim().min(3).max(1200),
    requestId: z.string().uuid(),
  }),
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
        if (!url || !publicKey) {
          return new Response("Server configuration missing", { status: 500 });
        }
        const db = createClient(url, publicKey, {
          global: { headers: { Authorization: auth } },
          auth: { persistSession: false },
        });
        const { data: claims } = await db.auth.getClaims(auth.slice(7));
        const userId = claims?.claims?.sub;
        if (!userId) return new Response("Invalid session", { status: 401 });
        if (!tripoKey) {
          return new Response("3D generation is not configured", { status: 503 });
        }
        let requestBody: unknown;
        try {
          requestBody = await request.json();
        } catch {
          return new Response("Invalid JSON request", { status: 400 });
        }
        const parsed = RequestBody.safeParse(requestBody);
        if (!parsed.success) return new Response("Invalid 3D generation request", { status: 400 });
        const rateLimit = checkRateLimit(
          `tripo:${parsed.data.action}:${userId}`,
          parsed.data.action === "create" ? 5 : 120,
          parsed.data.action === "create" ? 600_000 : 60_000,
        );
        if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds);
        if (parsed.data.action === "create") {
          const [profileResult, rolesResult] = await Promise.all([
            db.from("profiles").select("plan").eq("id", userId).maybeSingle(),
            db.from("user_roles").select("role").eq("user_id", userId),
          ]);
          if (profileResult.error || rolesResult.error) {
            return new Response("Account entitlements could not be verified", { status: 500 });
          }
          const isOwner = (rolesResult.data ?? []).some((role) => role.role === "owner");
          const hasPremiumPlan =
            profileResult.data?.plan === "pro" || profileResult.data?.plan === "pro_max";
          if (!isOwner && !hasPremiumPlan) {
            return new Response("3D generation requires a Pro or Pro Max plan", { status: 403 });
          }
        }
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
          return new Response("3D generation billing is not configured", { status: 503 });
        }

        const generationCost = 12;
        let charged = false;
        let supabaseAdmin:
          | Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"]
          | null = null;
        let creditOperationKey = "";
        if (parsed.data.action === "create") {
          ({ supabaseAdmin } = await import("@/integrations/supabase/client.server"));
          creditOperationKey = `tripo:${parsed.data.requestId}`;
          const { data: creditResult, error: creditError } = await supabaseAdmin.rpc(
            "consume_creator_credits_once",
            {
              _user_id: userId,
              _amount: generationCost,
              _operation_key: creditOperationKey,
            },
          );
          if (creditError) return new Response("Insufficient credits", { status: 402 });
          if (!creditResult?.[0]?.charged) {
            return new Response("This 3D generation request was already processed", {
              status: 409,
            });
          }
          charged = true;
        } else {
          const { data: ownedTask } = await db
            .from("tripo_tasks")
            .select("external_task_id, credit_operation_key")
            .eq("external_task_id", parsed.data.taskId)
            .eq("owner_id", userId)
            .maybeSingle();
          if (!ownedTask) return new Response("3D generation task not found", { status: 404 });
          creditOperationKey = ownedTask.credit_operation_key ?? "";
        }
        const endpoint =
          parsed.data.action === "create"
            ? `${TRIPO_API}/task`
            : `${TRIPO_API}/task/${parsed.data.taskId}`;
        let upstream: Response;
        try {
          upstream = await fetch(endpoint, {
            method: parsed.data.action === "create" ? "POST" : "GET",
            headers: {
              Authorization: `Bearer ${tripoKey}`,
              "Content-Type": "application/json",
            },
            body:
              parsed.data.action === "create"
                ? JSON.stringify({ type: "text_to_model", prompt: parsed.data.prompt })
                : undefined,
            signal: AbortSignal.timeout(30_000),
          });
        } catch (error) {
          if (charged && supabaseAdmin) {
            await supabaseAdmin.rpc("refund_creator_credits_once", {
              _user_id: userId,
              _operation_key: creditOperationKey,
            });
          }
          console.error("Tripo network error", error);
          return new Response("3D generation service is temporarily unavailable", { status: 502 });
        }
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
            await supabaseAdmin.rpc("refund_creator_credits_once", {
              _user_id: userId,
              _operation_key: creditOperationKey,
            });
          }
          console.error("Tripo API error", upstream.status, payload.message);
          return new Response(payload.message || "Tripo request failed", {
            status: upstream.status || 502,
          });
        }
        if (parsed.data.action === "create") {
          if (!payload.data?.task_id) {
            await supabaseAdmin?.rpc("refund_creator_credits_once", {
              _user_id: userId,
              _operation_key: creditOperationKey,
            });
            return new Response("Tripo did not return a task", { status: 502 });
          }
          if (!supabaseAdmin)
            return new Response("Could not register 3D generation task", { status: 500 });
          const { error: taskError } = await supabaseAdmin.from("tripo_tasks").insert({
            owner_id: userId,
            external_task_id: payload.data.task_id,
            prompt: parsed.data.prompt,
            status: payload.data.status ?? "queued",
            credit_operation_key: creditOperationKey,
          });
          if (taskError) {
            await supabaseAdmin.rpc("refund_creator_credits_once", {
              _user_id: userId,
              _operation_key: creditOperationKey,
            });
            return new Response("Could not register 3D generation task", { status: 500 });
          }
          return Response.json({ taskId: payload.data.task_id });
        }
        const status = payload.data?.status ?? "running";
        const { supabaseAdmin: taskAdmin } = await import("@/integrations/supabase/client.server");
        if (status === "failed") {
          const { data: refundedTask } = await taskAdmin
            .from("tripo_tasks")
            .update({ status: "failed_refunded" })
            .eq("external_task_id", parsed.data.taskId)
            .eq("owner_id", userId)
            .neq("status", "failed_refunded")
            .select("id")
            .maybeSingle();
          if (refundedTask) {
            await taskAdmin.rpc("refund_creator_credits_once", {
              _user_id: userId,
              _operation_key: creditOperationKey,
            });
          }
          return Response.json({ status: "failed", progress: 100 });
        }
        await taskAdmin
          .from("tripo_tasks")
          .update({ status })
          .eq("external_task_id", parsed.data.taskId)
          .eq("owner_id", userId);
        const output = payload.data?.output;
        const modelUrl = output?.pbr_model ?? output?.model ?? output?.base_model;
        if (status === "success" && !modelUrl) {
          return new Response("3D generation completed without a downloadable model", {
            status: 502,
          });
        }
        return Response.json({
          status,
          progress: Math.round(payload.data?.progress ?? (status === "success" ? 100 : 0)),
          modelUrl,
        });
      },
    },
  },
});
