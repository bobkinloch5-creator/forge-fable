import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createGame } from "@/lib/studio.functions";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  Check,
  Gamepad2,
  Globe2,
  Laptop,
  Monitor,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Draft = {
  name: string;
  platform: string;
  dimension: "2D" | "3D";
  genre: string;
  artStyle: string;
  playerMode: string;
  controls: string[];
  systems: string[];
  monetization: string;
  description: string;
};
const initial: Draft = {
  name: "",
  platform: "Cross-platform game",
  dimension: "3D",
  genre: "RPG",
  artStyle: "Low-poly",
  playerMode: "Single-player",
  controls: ["Keyboard and mouse", "Game controller"],
  systems: ["Main menu", "Settings", "Saving and loading", "Tutorial"],
  monetization: "free",
  description: "",
};

const platforms = [
  { label: "PC Game", icon: Gamepad2 },
  { label: "Windows PC game", icon: Monitor },
  { label: "Windows only", icon: Monitor },
  { label: "macOS game", icon: Apple },
  { label: "Linux game", icon: Laptop },
  { label: "Cross-platform desktop release", icon: Laptop },
  { label: "Android mobile game", icon: Smartphone },
  { label: "iPhone/iPad game", icon: Smartphone },
  { label: "Web browser game", icon: Globe2 },
  { label: "Cross-platform game", icon: Gamepad2 },
];
const gameTypes = [
  "RPG",
  "Simulator",
  "Horror",
  "Survival",
  "Platformer",
  "Racing",
  "Shooter",
  "Farming game",
  "Tycoon",
  "Idle game",
  "Dungeon crawler",
  "Tower defense",
  "Multiplayer arena",
  "Story game",
  "Custom game",
];
const modes = [
  "Single-player",
  "Online multiplayer",
  "Local multiplayer",
  "Co-op",
  "Competitive",
  "Offline mode",
];
const styles = [
  "Realistic",
  "Cartoon",
  "Anime",
  "Pixel art",
  "Low-poly",
  "Fantasy",
  "Sci-fi",
  "Retro",
  "Dark horror",
  "Colorful and family-friendly",
];
const controls = [
  "Keyboard and mouse",
  "Game controller",
  "Mobile touch controls",
  "On-screen joystick",
  "Tap-to-move",
  "Custom keybinds",
];
const systems = [
  "Large streamed world",
  "Multiple maps and game modes",
  "Character creation",
  "Classes and skill trees",
  "Combat",
  "Abilities and combos",
  "Enemies and bosses",
  "Intelligent enemy AI",
  "Levels and experience",
  "Inventory",
  "Equipment and loot",
  "Weapons",
  "Shops",
  "Deep economy",
  "Quests",
  "Dialogue and story choices",
  "Factions and reputation",
  "Dungeons",
  "Procedural generation",
  "Crafting",
  "Pets",
  "Vehicles",
  "Achievements",
  "Saving and loading",
  "Multiplayer lobbies",
  "Authoritative networking",
  "Leaderboards",
  "Settings",
  "Tutorial",
  "Main menu",
  "Pause menu",
];

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
  const toggle = (field: "controls" | "systems", value: string) =>
    setDraft((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));
  const choice = (selected: boolean) =>
    `h-auto min-h-11 justify-start whitespace-normal rounded-xl border px-3 py-3 text-left transition-all ${selected ? "spectrum-border bg-primary/15 text-foreground" : "border-border bg-panel/70 text-muted-foreground hover:border-muted-foreground hover:bg-panel-strong"}`;
  const titles = [
    "Choose target platforms",
    "Define the game",
    "Players and controls",
    "Art direction",
    "Select game systems",
    "Review the game design document",
  ];
  const gdd = {
    loop: `${draft.dimension} ${draft.genre} gameplay built around exploration, mastery, meaningful rewards, and a clear return loop.`,
    world:
      draft.description ||
      `A cohesive ${draft.artStyle.toLowerCase()} world designed around the core ${draft.genre.toLowerCase()} fantasy.`,
    progression: draft.systems.includes("Levels and experience")
      ? "Experience-driven progression with paced unlocks and difficulty growth."
      : "Milestone-based progression matched to the selected systems.",
    engine: draft.platform.includes("Web")
      ? "WebGL game runtime with installable web deployment"
      : draft.platform.includes("Android") || draft.platform.includes("iPhone")
        ? "Mobile-ready game project with native packaging requirements"
        : "Cross-platform desktop game project with platform packaging configuration",
    complexity:
      draft.systems.length > 12 || draft.playerMode.includes("multiplayer")
        ? "Advanced"
        : draft.systems.length > 7
          ? "Intermediate"
          : "Focused",
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel max-h-[92vh] max-w-5xl overflow-hidden border-border p-0">
        <DialogHeader className="border-b border-border bg-linear-to-r from-primary/10 via-neon-violet/5 to-transparent p-6">
          <p className="font-mono text-xs text-neon-cyan">STANDALONE GAME WIZARD / 0{step}</p>
          <DialogTitle className="text-2xl">{titles[step - 1]}</DialogTitle>
          <DialogDescription>
            FableForge will prepare a professional plan first. Nothing is built until you approve
            it.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-96 overflow-y-auto p-6">
          {step === 1 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {platforms.map((platform) => (
                <Button
                  key={platform.label}
                  variant="outline"
                  onClick={() => setDraft({ ...draft, platform: platform.label })}
                  className={choice(draft.platform === platform.label)}
                >
                  <platform.icon className="size-5 shrink-0 text-neon-cyan" />
                  <span>{platform.label}</span>
                </Button>
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {gameTypes.map((genre) => (
                  <Button
                    key={genre}
                    variant="outline"
                    onClick={() => setDraft({ ...draft, genre })}
                    className={choice(draft.genre === genre)}
                  >
                    {genre}
                  </Button>
                ))}
              </div>
              <label className="block text-xs font-medium text-muted-foreground">
                GAME IDEA
                <Input
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  placeholder="Describe the world, player fantasy, and main goal…"
                  className="mt-2"
                />
              </label>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="mb-3 text-xs font-medium text-muted-foreground">PLAY MODE</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {modes.map((mode) => (
                    <Button
                      key={mode}
                      variant="outline"
                      className={choice(draft.playerMode === mode)}
                      onClick={() => setDraft({ ...draft, playerMode: mode })}
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-medium text-muted-foreground">CONTROLS</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {controls.map((control) => (
                    <Button
                      key={control}
                      variant="outline"
                      className={choice(draft.controls.includes(control))}
                      onClick={() => toggle("controls", control)}
                    >
                      {draft.controls.includes(control) && (
                        <Check className="size-4 text-neon-cyan" />
                      )}
                      {control}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {styles.map((style) => (
                <Button
                  key={style}
                  variant="outline"
                  className={choice(draft.artStyle === style)}
                  onClick={() => setDraft({ ...draft, artStyle: style })}
                >
                  {style}
                </Button>
              ))}
            </div>
          )}
          {step === 5 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {systems.map((system) => (
                <Button
                  key={system}
                  variant="outline"
                  className={choice(draft.systems.includes(system))}
                  onClick={() => toggle("systems", system)}
                >
                  {draft.systems.includes(system) && <Check className="size-4 text-neon-cyan" />}
                  {system}
                </Button>
              ))}
            </div>
          )}
          {step === 6 && (
            <div className="space-y-4">
              <div className="spectrum-border rounded-2xl bg-panel/80 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="text-neon-cyan" />
                  <div>
                    <h3 className="font-semibold">{draft.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {draft.dimension} {draft.genre} · {draft.platform}
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{gdd.world}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <GddItem title="Core gameplay loop" value={gdd.loop} />
                <GddItem title="Story and world" value={gdd.world} />
                <GddItem
                  title="Characters"
                  value={
                    draft.systems.includes("Character creation")
                      ? "Player-created hero with progression-ready character data."
                      : "A focused protagonist roster defined during production."
                  }
                />
                <GddItem
                  title="Maps and levels"
                  value={`${draft.genre}-appropriate levels, transitions, checkpoints, and scalable content structure.`}
                />
                <GddItem
                  title="Game mechanics"
                  value={draft.systems.join(", ") || "Core movement and interaction"}
                />
                <GddItem title="Controls" value={draft.controls.join(", ")} />
                <GddItem title="Progression" value={gdd.progression} />
                <GddItem
                  title="Art and audio direction"
                  value={`${draft.artStyle} art with adaptive music, gameplay cues, ambience, and accessible mix controls.`}
                />
                <GddItem title="Multiplayer design" value={draft.playerMode} />
                <GddItem title="Supported platform" value={draft.platform} />
                <GddItem title="Recommended technology" value={gdd.engine} />
                <GddItem title="Estimated complexity" value={gdd.complexity} />
                <GddItem
                  title="Production architecture"
                  value="Dependency-aware modular systems, data-driven content, versioned saves, stage gates, automatic checkpoints, and isolated client/server layers for multiplayer."
                />
                <GddItem
                  title="Development roadmap"
                  value="17 ordered stages from game planning and technical architecture through systems, content, optimization, regression testing, and validated export."
                />
              </div>
              <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-xs leading-5 text-muted-foreground">
                <strong className="text-foreground">Approval checkpoint:</strong> creating the
                project generates source, scenes, menus, control maps, save/settings foundations,
                export configuration, and a versioned design document. Signed Windows, macOS,
                Android, and iOS packages may still require external compilers, certificates,
                platform SDKs, and build services; the Export Center will show those requirements
                honestly.
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border p-4">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep(step - 1)}>
            <ArrowLeft /> Back
          </Button>
          <span className="font-mono text-[10px] text-muted-foreground">STEP {step} OF 6</span>
          {step < 6 ? (
            <Button disabled={step === 2 && !draft.name.trim()} onClick={() => setStep(step + 1)}>
              Continue <ArrowRight />
            </Button>
          ) : (
            <Button
              disabled={busy}
              onClick={finish}
              className="bg-linear-to-r from-primary via-neon-violet to-neon-pink"
            >
              {busy ? "Creating checkpoint…" : "Approve plan & create project"}
              <ArrowRight />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GddItem({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-canvas/60 p-4">
      <p className="font-mono text-[9px] uppercase tracking-wider text-neon-cyan">{title}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{value}</p>
    </div>
  );
}
