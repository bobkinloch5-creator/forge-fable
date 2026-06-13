import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Box, Code2, Gamepad2, Globe2, Monitor, Smartphone } from "lucide-react";

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
  return (
    <main className="min-h-screen overflow-hidden bg-canvas">
      <nav className="mx-auto flex h-18 max-w-7xl items-center px-5">
        <div className="flex items-center gap-3">
          <BrandMark className="size-10" />
          <span className="font-bold tracking-tight">
            FableForge <span className="text-primary">AI</span>
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">
              Enter studio <ArrowRight />
            </Link>
          </Button>
        </div>
      </nav>
      <section className="relative mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[.9fr_1.1fr]">
        <div className="panel-grid absolute inset-x-5 inset-y-8 -z-0 rounded-3xl opacity-20" />
        <div className="relative z-10">
          <p className="mb-5 font-mono text-xs uppercase tracking-[.3em] text-accent">
            The universal AI game studio
          </p>
          <h1 className="text-balance text-6xl font-semibold leading-[.94] tracking-[-.06em] sm:text-7xl">
            Build any game.
            <br />
            <span className="text-muted-foreground">Ship every world.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
            Plan systems, generate files, direct assets, test live, and prepare exports for browser,
            mobile, and desktop—all from one professional workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/auth">
                Start building <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline">
              Explore templates
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-5 font-mono text-[10px] text-muted-foreground">
            {[
              [Globe2, "WEB"],
              [Smartphone, "MOBILE"],
              [Monitor, "PC"],
            ].map(([Icon, label]) => {
              const I = Icon as typeof Globe2;
              return (
                <span key={label as string} className="flex items-center gap-2">
                  <I className="size-4 text-primary" />
                  {label as string}
                </span>
              );
            })}
          </div>
        </div>
        <div className="relative z-10">
          <div className="forge-glow overflow-hidden rounded-xl border border-border bg-panel shadow-2xl">
            <div className="flex h-11 items-center border-b border-border px-3">
              <span className="size-2 rounded-full bg-destructive" />
              <span className="ml-2 size-2 rounded-full bg-warning" />
              <span className="ml-2 size-2 rounded-full bg-success" />
              <span className="ml-4 font-mono text-[10px] text-muted-foreground">
                FABLEFORGE / CRYSTAL KEEP
              </span>
            </div>
            <div className="grid aspect-[5/3] grid-cols-[180px_1fr]">
              <div className="border-r border-border p-3">
                <div className="mb-5 flex items-center gap-2 text-xs">
                  <Gamepad2 className="size-4 text-primary" /> AI Builder
                </div>
                {["World foundation", "Combat system", "Mobile controls"].map((item, i) => (
                  <div
                    key={item}
                    className={`mb-2 rounded p-2 text-[10px] ${i === 0 ? "bg-secondary" : "text-muted-foreground"}`}
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="panel-grid relative grid place-items-center bg-canvas">
                <div className="text-center">
                  <BrandMark className="mx-auto size-28" />
                  <p className="mt-3 text-sm font-semibold">CRYSTAL KEEP</p>
                  <Button size="sm" className="mt-4">
                    <Gamepad2 /> Play build
                  </Button>
                </div>
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className="rounded bg-panel px-2 py-1 font-mono text-[9px] text-success">
                    BUILD OK
                  </span>
                  <span className="rounded bg-panel px-2 py-1 font-mono text-[9px]">60 FPS</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 border-t border-border">
              {[
                [Code2, "18 files"],
                [Box, "42 assets"],
                [Gamepad2, "Playable"],
              ].map(([Icon, label]) => {
                const I = Icon as typeof Code2;
                return (
                  <div
                    key={label as string}
                    className="flex items-center justify-center gap-2 border-r border-border p-3 text-[10px] text-muted-foreground last:border-0"
                  >
                    <I className="size-3 text-accent" />
                    {label as string}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
