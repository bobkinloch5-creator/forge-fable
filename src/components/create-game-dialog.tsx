import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createGame } from "@/lib/studio.functions";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Gamepad2, Globe2, Monitor, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Draft = {
  name: string;
  platform: string;
  dimension: "2D" | "3D";
  description: string;
};

const initial: Draft = {
  name: "",
  platform: "Cross-platform game",
  dimension: "3D",
  description: "",
};

const platforms = [
  { label: "Website game", icon: Globe2 },
  { label: "Windows PC game", icon: Monitor },
  { label: "Mobile game", icon: Smartphone },
  { label: "Cross-platform game", icon: Gamepad2 },
];

export function CreateGameDialog({
  open,
  onOpenChange,
  initialIdea = "",
  initialPlatform = "Cross-platform game",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIdea?: string;
  initialPlatform?: string;
}) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const create = useServerFn(createGame);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const platform = platforms.some((item) => item.label === initialPlatform)
      ? initialPlatform
      : "Cross-platform game";
    setDraft({
      ...initial,
      description: initialIdea,
      name: initialIdea ? initialIdea.split(/\s+/).slice(0, 5).join(" ") : "",
      platform,
    });
  }, [initialIdea, initialPlatform, open]);

  async function finish() {
    if (!draft.name || !draft.description) {
      toast.error("Please provide a name and description");
      return;
    }
    setBusy(true);
    try {
      const result = await create({ data: draft });
      onOpenChange(false);
      navigate({ to: "/studio/$gameId/$threadId", params: result });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Build could not start");
    } finally {
      setBusy(false);
    }
  }

  const choice = (selected: boolean) =>
    `h-auto min-h-11 justify-start whitespace-normal rounded-xl border px-3 py-3 text-left transition-all ${selected ? "spectrum-border bg-primary/15 text-foreground" : "border-border bg-panel/70 text-muted-foreground hover:border-muted-foreground hover:bg-panel-strong"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel inset-0 top-0 left-0 h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-border p-0 [grid-template-rows:auto_minmax(0,1fr)_auto] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
        <DialogHeader className="border-b border-border bg-linear-to-r from-primary/10 via-neon-violet/5 to-transparent p-4 pr-12 text-left sm:p-6 sm:pr-14">
          <p className="font-mono text-xs text-neon-cyan">NEW GAME PROJECT</p>
          <DialogTitle className="text-xl leading-tight sm:text-2xl">
            Configure your project
          </DialogTitle>
          <DialogDescription className="text-xs leading-5 sm:text-sm">
            This creates a clean workspace. Build every system intentionally through the AI chat.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-6 overflow-y-auto overscroll-contain p-4 sm:p-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Target Platform
            </p>
            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:gap-3 lg:grid-cols-4">
              {platforms.map((platform) => (
                <Button
                  key={platform.label}
                  variant="outline"
                  onClick={() => setDraft({ ...draft, platform: platform.label })}
                  className={choice(draft.platform === platform.label)}
                >
                  <platform.icon className="size-5 shrink-0 text-neon-cyan" />
                  <span className="truncate">{platform.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Format
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["2D", "3D"] as const).map((dimension) => (
                  <Button
                    key={dimension}
                    variant="outline"
                    className={choice(draft.dimension === dimension)}
                    onClick={() => setDraft({ ...draft, dimension })}
                  >
                    {dimension} game
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Project Name
              </p>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="My Awesome Game"
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Game Description
            </p>
            <Textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Describe your game idea, world, and what makes it fun..."
              className="min-h-32 leading-relaxed"
            />
          </div>
          <div className="rounded-xl border border-border bg-canvas/60 p-4 text-xs leading-5 text-muted-foreground">
            <strong className="text-foreground">Starts clean:</strong> only essential project
            configuration, an empty scene, and a starter script are prepared. No gameplay systems,
            maps, characters, or assets are added until you request and approve them.
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border bg-panel/40 p-4 sm:px-8">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={finish}
            disabled={busy || !draft.name || !draft.description}
            className="bg-linear-to-r from-primary via-neon-violet to-neon-pink shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_30%,transparent)]"
          >
            {busy ? "Creating workspace…" : "Create project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
