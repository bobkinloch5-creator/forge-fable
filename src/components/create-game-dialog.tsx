import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { artStyles, genres } from "@/lib/studio-data";
import { createGame } from "@/lib/studio.functions";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Globe2, Monitor, Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Draft = {
  name: string;
  platform: "web" | "mobile" | "pc";
  genre: string;
  artStyle: string;
  playerMode: "single" | "multiplayer";
  monetization: string;
  description: string;
};
const initial: Draft = {
  name: "",
  platform: "web",
  genre: "RPG",
  artStyle: "Low-poly",
  playerMode: "single",
  monetization: "free",
  description: "",
};

export function CreateGameDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const create = useServerFn(createGame);
  const navigate = useNavigate();
  async function finish() {
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
    `rounded-lg border p-4 text-left transition-all ${selected ? "border-primary bg-primary/10 forge-glow" : "border-border bg-panel hover:border-muted-foreground"}`;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-border bg-card p-0">
        <DialogHeader className="border-b border-border p-6">
          <p className="font-mono text-xs text-primary">NEW PROJECT / 0{step}</p>
          <DialogTitle className="text-2xl">
            {
              ["Choose your target", "Shape the game", "Choose the look", "Build configuration"][
                step - 1
              ]
            }
          </DialogTitle>
          <DialogDescription>
            FableForge will create a versioned starter project and open a dedicated build session.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-72 p-6">
          {step === 1 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  {
                    id: "web",
                    label: "Website game",
                    icon: Globe2,
                    note: "Instant browser preview",
                  },
                  {
                    id: "mobile",
                    label: "Mobile game",
                    icon: Smartphone,
                    note: "Touch-first controls",
                  },
                  { id: "pc", label: "PC game", icon: Monitor, note: "Desktop & controller" },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDraft({ ...draft, platform: p.id })}
                  className={choice(draft.platform === p.id)}
                >
                  <p.icon className="mb-8 size-6 text-primary" />
                  <strong>{p.label}</strong>
                  <span className="mt-1 block text-xs text-muted-foreground">{p.note}</span>
                </button>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-5">
              <label className="block text-xs font-medium text-muted-foreground">
                PROJECT NAME
                <Input
                  autoFocus
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Untitled adventure"
                  className="mt-2 h-11 text-foreground"
                />
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {genres.slice(0, 12).map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setDraft({ ...draft, genre })}
                    className={choice(draft.genre === genre)}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {artStyles.map((style) => (
                <button
                  key={style}
                  onClick={() => setDraft({ ...draft, artStyle: style })}
                  className={`${choice(draft.artStyle === style)} aspect-square`}
                >
                  {style}
                </button>
              ))}
            </div>
          )}
          {step === 4 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {(["single", "multiplayer"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDraft({ ...draft, playerMode: mode })}
                    className={choice(draft.playerMode === mode)}
                  >
                    <strong className="capitalize">
                      {mode === "single" ? "Single-player" : "Multiplayer"}
                    </strong>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {mode === "single" ? "Focused local experience" : "Rooms, lobbies, parties"}
                    </span>
                  </button>
                ))}
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">MONETIZATION</p>
                <div className="flex flex-wrap gap-2">
                  {["free", "ads", "premium", "battle pass", "skins", "shop"].map((item) => (
                    <Button
                      key={item}
                      size="sm"
                      variant={draft.monetization === item ? "default" : "outline"}
                      onClick={() => setDraft({ ...draft, monetization: item })}
                    >
                      {item}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border p-4">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep(step - 1)}>
            <ArrowLeft /> Back
          </Button>
          <span className="font-mono text-[10px] text-muted-foreground">STEP {step} OF 4</span>
          {step < 4 ? (
            <Button disabled={step === 2 && !draft.name.trim()} onClick={() => setStep(step + 1)}>
              Continue <ArrowRight />
            </Button>
          ) : (
            <Button disabled={busy} onClick={finish}>
              {busy ? "Forging…" : "Generate project"}
              <ArrowRight />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
