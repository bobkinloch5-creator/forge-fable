import { getWorkspace } from "@/lib/studio.functions";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/studio/$gameId")({
  beforeLoad: async ({ params }) => {
    const result = await getWorkspace({ data: { gameId: params.gameId, threadId: "00000000-0000-0000-0000-000000000000" } }).catch(() => null);
    const firstThread = result?.threads[0];
    if (firstThread) throw redirect({ to: "/studio/$gameId/$threadId", params: { gameId: params.gameId, threadId: firstThread.id } });
  },
  component: () => null,
});