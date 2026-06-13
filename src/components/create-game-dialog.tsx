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
import { ArrowLeft, ArrowRight, Gamepad2, Globe2, Monitor, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Platform = "Website game" | "Windows PC game" | "Mobile game" | "Cross-platform game";
type Draft = { name: string; platform: Platform; dimension: "2D" | "3D"; description: string };

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
] as const;

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
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const create = useServerFn(createGame);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const selectedPlatform = platforms.some((item) => item.label === initialPlatform)
      ? (initialPlatform as Platform)
      : "Cross-platform game";
    setStep(initialIdea ? 2 : 1);
    setDraft({
      ...initial,
      description: initialIdea,
      name: initialIdea ? initialIdea.split(/\s+/).slice(0, 5).join(" ") : "",
      platform: selectedPlatform,
    });
  }, [initialIdea, initialPlatform, open]);

  async function finish() {
    setBusy(true);
    try {
      const result = await create({ data: draft });
      onOpenChange(false);
      navigate({ to: "/studio/$gameId/$threadId", params: result });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Project could not be created");
    } finally {
      setBusy(false);
    }
  }

  const choice = (selected: boolean) =>
    `h-auto min-h-14 justify-start whitespace-normal rounded-xl border px-4 py-3 text-left transition-all ${selected ? "spectrum-border bg-primary/15 text-foreground" : "border-border bg-panel/70 text-muted-foreground hover:border-muted-foreground hover:bg-panel-strong"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel inset-0 top-0 left-0 h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-border p-0 [grid-template-rows:auto_minmax(0,1fr)_auto] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
        <DialogHeader className="border-b border-border bg-linear-to-r from-primary/10 via-neon-violet/5 to-transparent p-5 pr-12 text-left sm:p-6 sm:pr-14">
          <p className="font-mono text-xs text-neon-cyan">NEW PROJECT / 0{step}</p>
          <DialogTitle>{step === 1 ? "Choose where your game will run" : "Name your game project"}</DialogTitle>
          <DialogDescription>
            This creates a clean workspace only. Build every system intentionally with the AI chat.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto p-4 sm:min-h-96 sm:p-6">
          {step === 1 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {platforms.map((platform) => (
                <Button
                  key={platform.label}
                  variant="outline"
                  className={choice(draft.platform === platform.label)}
                  onClick={() => setDraft((current) => ({ ...current, platform: platform.label }))}
                >
                  <platform.icon className="size-5 shrink-0 text-neon-cyan" />
                  <span>{platform.label}</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">GAME FORMAT</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["2D", "3D"] as const).map((dimension) => (
                    <Button
                      key={dimension}
                      variant="outline"
                      className={choice(draft.dimension === dimension)}
                      onClick={() => setDraft((current) => ({ ...current, dimension }))}
                    >
                      {dimension} game
                    </Button>
                  ))}
                </div>
              </div>
              <label className="block text-xs font-medium text-muted-foreground">
                PROJECT NAME
                <Input
                  autoFocus
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Untitled game"
                  className="mt-2 h-11 text-foreground"
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                SHORT DESCRIPTION
                <Textarea
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="A short description of the game you want to make…"
                  className="mt-2 min-h-28 resize-none"
                />
              </label>
              <div className="rounded-xl border border-border bg-canvas/60 p-4 text-xs leading-5 text-muted-foreground">
                <strong className="text-foreground">Starts clean:</strong> only the essential project
                configuration, an empty main scene, and a starter script will be created. No gameplay
                systems, maps, characters, or assets are added until you request and approve them.
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-border bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep(1)}>
            <ArrowLeft /> Back
          </Button>
          {step === 1 ? (
            <Button onClick={() => setStep(2)}>
              Continue <ArrowRight />
            </Button>
          ) : (
            <Button disabled={busy || !draft.name.trim()} onClick={finish}>
              {busy ? "Creating workspace…" : "Create project"} <ArrowRight />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}