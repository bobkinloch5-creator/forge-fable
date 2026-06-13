import { getCometChatModels } from "@/lib/comet-models.server";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/comet-models")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const catalog = await getCometChatModels();
          return Response.json(catalog, {
            headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=900" },
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
