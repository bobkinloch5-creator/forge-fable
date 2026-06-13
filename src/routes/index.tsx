import { BrandMark } from "@/components/brand-mark";
import { GameIdeaLauncher } from "@/components/game-idea-launcher";
import { Button } from "@/components/ui/button";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Cloud, Gamepad2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FableForge AI | Build Any Game with AI" },
      {
        name: "description",
        content:
          "Design, code, preview, and export games for web, mobile, and PC in one AI-powered game studio.",
      },
      { property: "og:title", content: "FableForge AI | Build Any Game with AI" },
      {
        property: "og:description",
        content: "Design, code, preview, and export games for web, mobile, and PC.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas">
      <div className="panel-grid pointer-events-none absolute inset-0 opacity-15" />
      <div className="aurora-orb pointer-events-none absolute -left-40 top-24 size-[32rem] rounded-full bg-neon-violet/15 blur-[120px]" />
      <div className="aurora-orb pointer-events-none absolute -right-40 top-12 size-[34rem] rounded-full bg-neon-cyan/12 blur-[130px] [animation-delay:-4s]" />
      <nav className="relative z-20 mx-auto grid min-h-18 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <BrandMark className="size-10" />
          <span className="truncate font-bold tracking-tight">
            FableForge <span className="text-primary">AI</span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button variant="ghost" className="px-2 sm:px-4" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button className="hidden sm:inline-flex" asChild>
            <Link to="/auth">
              Enter studio <ArrowRight />
            </Link>
          </Button>
        </div>
      </nav>
      <section className="relative z-10 mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-7xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
        <GameIdeaLauncher
          onStart={(idea, mode) => {
            sessionStorage.setItem("fableforge:draft-idea", idea);
            sessionStorage.setItem("fableforge:draft-mode", mode);
            navigate({ to: "/auth" });
          }}
        />
        <div className="mx-auto mt-10 grid w-full max-w-5xl gap-2 sm:grid-cols-3">
          {[
            {
              icon: Gamepad2,
              title: "Real game projects",
              text: "Scenes, systems, files, assets, and playable builds.",
            },
            {
              icon: ShieldCheck,
              title: "Safe AI changes",
              text: "Plans, checkpoints, tests, restore, retry, and branching.",
            },
            {
              icon: Cloud,
              title: "Publish anywhere",
              text: "Web hosting plus mobile and desktop build pipelines.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex gap-3 rounded-2xl border border-border/60 bg-panel/45 p-4"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-neon-cyan">
                <item.icon className="size-4" />
              </span>
              <div>
                <p className="text-xs font-semibold">{item.title}</p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{item.text}</p>
              </div>
              <Check className="ml-auto size-3 shrink-0 text-success" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
