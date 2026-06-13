import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowUp,
  Blocks,
  Code2,
  Gamepad2,
  Globe2,
  ImageUp,
  Monitor,
  Smartphone,
  Upload,
} from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

const launchModes = [
  { label: "Website Game", icon: Globe2 },
  { label: "Mobile Game", icon: Smartphone },
  { label: "PC Game", icon: Monitor },
  { label: "Cross-Platform", icon: Gamepad2 },
  { label: "Start From Template", icon: Blocks },
  { label: "Import Project", icon: Upload },
];

const exampleIdeas = [
  "Build me a 3D fantasy RPG with quests and bosses",
  "Make a mobile pet simulator",
  "Create a multiplayer browser tycoon",
  "Build a downloadable Windows horror game",
  "Make a colorful farming game for tablets",
  "Create a 2D platformer for web and mobile",
];

export function GameIdeaLauncher({
  onStart,
  compact = false,
}: {
  onStart: (idea: string, mode: string) => void;
  compact?: boolean;
}) {
  const [idea, setIdea] = useState("");
  const [mode, setMode] = useState("Cross-Platform");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!idea.trim()) return;
    onStart(idea.trim(), mode);
  }

  return (
    <section className={`relative mx-auto w-full ${compact ? "max-w-5xl" : "max-w-6xl"}`}>
      <div className="pointer-events-none absolute inset-x-[12%] top-1/2 h-48 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative text-center">
        {!compact && (
          <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl border border-primary/30 bg-panel/80 shadow-[0_0_40px_color-mix(in_oklab,var(--primary)_28%,transparent)]">
            <BrandMark className="size-12" />
          </div>
        )}
        <p className="font-mono text-[10px] uppercase tracking-[.28em] text-neon-cyan sm:text-xs">
          Describe it. Watch it become playable.
        </p>
        <h1
          className={`${compact ? "mt-2 text-3xl sm:text-5xl" : "mt-3 text-4xl sm:text-6xl lg:text-7xl"} text-balance font-semibold tracking-[-.055em]`}
        >
          What game do you want to build?
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          No code required. FableForge plans the systems, creates the project, tests each build, and
          prepares a real web, mobile, or desktop release.
        </p>
      </div>

      <div className="relative mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {launchModes.map((item) => (
          <Button
            key={item.label}
            type="button"
            variant={mode === item.label ? "secondary" : "outline"}
            onClick={() => setMode(item.label)}
            className={`h-auto min-h-16 flex-col rounded-2xl px-2 py-3 text-[11px] sm:text-xs ${mode === item.label ? "spectrum-border bg-primary/15" : "bg-panel/60"}`}
          >
            <item.icon className="size-5 text-neon-cyan" />
            {item.label}
          </Button>
        ))}
      </div>

      <form
        onSubmit={submit}
        className="spectrum-border relative mt-4 overflow-hidden rounded-3xl bg-panel/90 p-2 shadow-[0_24px_80px_color-mix(in_oklab,var(--canvas)_70%,transparent)] sm:p-3"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.zip,.godot,.unitypackage"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setIdea(`Use my uploaded reference “${file.name}” to guide this game project. `);
          }}
        />
        <Textarea
          autoFocus={compact}
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          placeholder="Describe your game idea, world, players, and what should make it fun…"
          className="min-h-32 resize-none border-0 bg-transparent p-4 pr-16 text-base leading-7 shadow-none focus-visible:ring-0 sm:min-h-40 sm:p-5 sm:pr-20 sm:text-lg"
        />
        <div className="flex items-center justify-between gap-2 border-t border-border/60 px-2 py-2 sm:px-3">
          <div className="flex min-w-0 gap-1.5 overflow-x-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageUp /> Reference
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground"
              onClick={() => {
                setMode("Import Project");
                fileInputRef.current?.click();
              }}
            >
              <Code2 /> Code project
            </Button>
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!idea.trim()}
            aria-label="Plan this game"
            className="shrink-0 rounded-xl bg-linear-to-br from-neon-cyan via-primary to-neon-pink shadow-[0_0_24px_color-mix(in_oklab,var(--primary)_40%,transparent)]"
          >
            <ArrowUp />
          </Button>
        </div>
      </form>

      <div className="relative mt-4 flex flex-wrap justify-center gap-2">
        {exampleIdeas.map((example) => (
          <Button
            key={example}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIdea(example)}
            className="h-auto min-h-9 max-w-full whitespace-normal rounded-full border-border/70 bg-canvas/40 px-3 py-2 text-left text-[10px] text-muted-foreground hover:border-primary/50 hover:text-foreground sm:text-xs"
          >
            {example}
          </Button>
        ))}
      </div>
    </section>
  );
}
