import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const services = {
          database: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY),
          privilegedDatabase: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
          fableAi: Boolean(process.env.LOVABLE_API_KEY),
          cometAi: Boolean(process.env.COMET_API_KEY),
          tripo: Boolean(process.env.TRIPO_API_KEY),
          payments: Boolean(process.env.STRIPE_SECRET_KEY),
          email: Boolean(process.env.RESEND_API_KEY),
        };
        const coreReady = services.database && services.privilegedDatabase && services.fableAi;
        return Response.json(
          {
            status: coreReady ? "ok" : "degraded",
            timestamp: new Date().toISOString(),
            services,
          },
          {
            status: coreReady ? 200 : 503,
            headers: { "Cache-Control": "no-store" },
          },
        );
      },
    },
  },
});
