import { CreateGameDialog } from "@/components/create-game-dialog";
import { NewProjectButton, StudioShell } from "@/components/studio-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStudioOverview } from "@/lib/studio.functions";
import { templates } from "@/lib/studio-data";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Box,
  Clock3,
  Gamepad2,
  Layers3,
  Plus,
  Smartphone,
  Monitor,
  Globe2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/studio")({
  component: StudioDashboard,
  head: () => ({
    meta: [
      { title: "Studio | FableForge AI" },
      {
        name: "description",
        content: "Create, manage, and export AI-built games for web, mobile, and PC.",
      },
    ],
  }),
});

function StudioDashboard() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{
    profile: { display_name: string; plan: string; credits: number } | null;
    games: Tables<"games">[];
    roles: { role: "owner" | "admin" | "moderator" | "user" }[];
  } | null>(null);
  const getOverview = useServerFn(getStudioOverview);
  useEffect(() => {
    getOverview().then(setData);
  }, [getOverview]);
  const games = data?.games ?? [];
  const isOwner = data?.roles.some((item) => item.role === "owner") ?? false;
  return (
    <StudioShell title="Project hub" subtitle="Build across web, mobile, and PC" accountRole={isOwner ? "owner" : undefined} credits={isOwner ? "unlimited" : data?.profile?.credits}>
      <main className="mx-auto max-w-[1500px] p-3 pb-24 sm:p-6 sm:pb-24 lg:p-8">
        <section className="mb-8 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <div className="glass-panel spectrum-border relative overflow-hidden rounded-3xl p-5 sm:p-9">
            <div className="panel-grid absolute inset-0 opacity-20" />
            <div className="aurora-orb absolute -right-24 -top-32 size-80 rounded-full bg-neon-violet/20 blur-3xl" />
            <div className="relative max-w-2xl">
              <Badge variant="outline" className="mb-5 border-primary/40 text-primary">
                <Zap className="mr-1 size-3" /> AI GAME ENGINE
              </Badge>
              <h2 className="text-balance text-3xl font-semibold tracking-[-.035em] sm:text-5xl sm:tracking-[-.045em]">
                Build the world.
                <br />
                <span className="bg-linear-to-r from-neon-cyan via-primary to-neon-pink bg-clip-text text-transparent">
                  Keep creative control.
                </span>
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
                Start from a concept or template. FableForge plans the systems, writes the files,
                and keeps every major change reviewable.
              </p>
              <div className="mt-7 grid gap-3 sm:flex">
                <NewProjectButton onClick={() => setOpen(true)} />
                <Button variant="outline">Browse templates</Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Active projects", value: games.length, icon: Gamepad2 },
              {
                label: "Forge credits",
                value: isOwner ? "Unlimited" : (data?.profile?.credits ?? 250),
                icon: Zap,
              },
              { label: "Build artifacts", value: games.length * 4, icon: Box },
              {
                label: "Plan",
                value: isOwner ? "Platform owner" : (data?.profile?.plan ?? "free").replace("_", " "),
                icon: Layers3,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass-panel rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50"
              >
                <stat.icon className="mb-6 size-4 text-primary" />
                <div className="text-2xl font-semibold capitalize">{stat.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="text-lg font-semibold">Recent projects</h3>
              <p className="text-sm text-muted-foreground">Continue where you left off.</p>
            </div>
            <NewProjectButton onClick={() => setOpen(true)} />
          </div>
          {games.length === 0 ? (
            <Button
              variant="outline"
              onClick={() => setOpen(true)}
              className="flex h-auto min-h-48 w-full flex-col items-center justify-center rounded-xl border-dashed bg-panel/50 text-center hover:border-primary"
            >
              <span className="mb-4 grid size-12 place-items-center rounded-full bg-secondary">
                <Plus className="text-primary" />
              </span>
              <strong>Forge your first game</strong>
              <span className="mt-1 text-sm text-muted-foreground">
                A playable starter project is four choices away.
              </span>
            </Button>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {games.map((game) => {
                const Icon =
                  game.platform === "mobile"
                    ? Smartphone
                    : game.platform === "pc"
                      ? Monitor
                      : Globe2;
                return (
                  <Link
                    key={game.id}
                    to="/studio/$gameId"
                    params={{ gameId: game.id }}
                    className="glass-panel group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-neon-cyan/50 hover:shadow-[0_18px_50px_color-mix(in_oklab,var(--primary)_16%,transparent)]"
                  >
                    <div className="mb-7 flex items-start justify-between">
                      <span className="grid size-10 place-items-center rounded-lg bg-secondary">
                        <Icon className="size-5 text-accent" />
                      </span>
                      <Badge variant="outline" className="font-mono text-[10px] uppercase">
                        {game.status}
                      </Badge>
                    </div>
                    <h4 className="font-semibold group-hover:text-primary">{game.name}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {game.art_style} {game.genre} · {game.player_mode}
                    </p>
                    <div className="mt-5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock3 className="size-3" /> Updated recently
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
        <section>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Production-ready starters</h3>
            <p className="text-sm text-muted-foreground">
              Curated systems, scenes, and control maps.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {templates.slice(0, 4).map((template) => (
              <article
                key={template.name}
                className="glass-panel group rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-neon-violet/40"
              >
                <div className="panel-grid mb-4 grid aspect-[16/9] place-items-center rounded-lg bg-canvas">
                  <template.icon className="size-10 text-primary" />
                </div>
                <h4 className="font-medium">{template.name}</h4>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>{template.difficulty}</span>
                  <span>{template.credits} credits</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <CreateGameDialog open={open} onOpenChange={setOpen} />
    </StudioShell>
  );
}
