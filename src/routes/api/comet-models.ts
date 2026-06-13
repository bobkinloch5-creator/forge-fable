import { getCometChatModels } from "@/lib/comet-models.server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit.server";
import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/comet-models")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authorization = request.headers.get("authorization");
        if (!authorization?.startsWith("Bearer "))
          return Response.json({ error: "Sign in required" }, { status: 401 });
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!url || !key)
          return Response.json({ error: "Server configuration missing" }, { status: 500 });
        const auth = createClient(url, key, { auth: { persistSession: false } });
        const { data } = await auth.auth.getClaims(authorization.slice(7));
        const userId = data?.claims?.sub;
        if (!userId) return Response.json({ error: "Invalid session" }, { status: 401 });
        const rateLimit = checkRateLimit(`comet-models:${userId}`, 30, 300_000);
        if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds);
        try {
          const catalog = await getCometChatModels();
          return Response.json(catalog, {
            headers: { "Cache-Control": "private, max-age=300" },
          });
        } catch {
          return Response.json(
            { error: "CometAPI catalog is temporarily unavailable" },
            { status: 502 },
          );
        }
      },
    },
  },
});
