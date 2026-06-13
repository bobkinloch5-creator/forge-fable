import { supabase } from "@/integrations/supabase/client";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/studio/$gameId")({
  beforeLoad: async ({ params }) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw redirect({ to: "/auth" });
    const { data: firstThread } = await supabase
      .from("chat_threads")
      .select("id")
      .eq("game_id", params.gameId)
      .eq("owner_id", auth.user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (firstThread)
      throw redirect({
        to: "/studio/$gameId/$threadId",
        params: { gameId: params.gameId, threadId: firstThread.id },
      });
    throw redirect({ to: "/studio" });
  },
  component: () => null,
});
