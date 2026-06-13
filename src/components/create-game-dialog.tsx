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
  responsiveTargets: string[];
  accountMode: string;
  saveProgress: boolean;
  leaderboards: boolean;
  achievements: boolean;
  revenueModel: string;
  domainChoice: string;
  publicLandingPage: boolean;
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
  responsiveTargets: ["Mobile", "Tablet", "Desktop"],
  accountMode: "Accounts and guest play",
  saveProgress: true,
  leaderboards: true,
  achievements: true,
  revenueModel: "None",
  domainChoice: "Free project domain",
  publicLandingPage: true,
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
  const toggleResponsiveTarget = (value: string) =>
    setDraft((current) => ({
      ...current,
      responsiveTargets: current.responsiveTargets.includes(value)
        ? current.responsiveTargets.filter((item) => item !== value)
        : [...current.responsiveTargets, value],
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
      <DialogContent className="glass-panel inset-0 top-0 left-0 h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-border p-0 [grid-template-rows:auto_minmax(0,1fr)_auto] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-5xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
        <DialogHeader className="border-b border-border bg-linear-to-r from-primary/10 via-neon-violet/5 to-transparent p-4 pr-12 text-left sm:p-6 sm:pr-14">
          <p className="font-mono text-xs text-neon-cyan">STANDALONE GAME WIZARD / 0{step}</p>
          <DialogTitle className="text-xl leading-tight sm:text-2xl">{titles[step - 1]}</DialogTitle>
          <DialogDescription className="text-xs leading-5 sm:text-sm">
            FableForge will prepare a professional plan first. Nothing is built until you approve
            it.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-3 pb-6 sm:min-h-96 sm:p-6">
          {step === 1 && (
            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:gap-3 lg:grid-cols-3">
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
              <div className="grid grid-cols-2 gap-2 sm:max-w-xl">
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
              <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
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
              {draft.platform === "Web browser game" && (
                <div className="space-y-5 rounded-2xl border border-primary/25 bg-primary/5 p-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-neon-cyan">
                      Website game setup
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Choose the complete player experience before the AI plans frontend, backend,
                      data, multiplayer, and publishing.
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium">SUPPORTED SCREENS</p>
                    <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
                      {["Mobile", "Tablet", "Desktop"].map((target) => (
                        <Button
                          key={target}
                          variant="outline"
                          className={choice(draft.responsiveTargets.includes(target))}
                          onClick={() => toggleResponsiveTarget(target)}
                        >
                          {draft.responsiveTargets.includes(target) && <Check />} {target}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <WizardChoice
                      label="PLAYER ACCESS"
                      value={draft.accountMode}
                      options={["Accounts and guest play", "Accounts required", "Guest play only"]}
                      onChange={(accountMode) => setDraft({ ...draft, accountMode })}
                      choice={choice}
                    />
                    <WizardChoice
                      label="REVENUE"
                      value={draft.revenueModel}
                      options={["None", "Purchases", "Subscriptions", "Ads"]}
                      onChange={(revenueModel) => setDraft({ ...draft, revenueModel })}
                      choice={choice}
                    />
                    <WizardChoice
                      label="DOMAIN"
                      value={draft.domainChoice}
                      options={["Free project domain", "Use my existing domain", "Buy a domain"]}
                      onChange={(domainChoice) => setDraft({ ...draft, domainChoice })}
                      choice={choice}
                    />
                    <div>
                      <p className="mb-2 text-xs font-medium">PLAYER SYSTEMS</p>
                      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                        {(
                          [
                            ["Cloud progress", "saveProgress"],
                            ["Leaderboards", "leaderboards"],
                            ["Achievements", "achievements"],
                            ["Public landing page", "publicLandingPage"],
                          ] as const
                        ).map(([label, field]) => (
                          <Button
                            key={field}
                            variant="outline"
                            className={choice(draft[field])}
                            onClick={() => setDraft({ ...draft, [field]: !draft[field] })}
                          >
                            {draft[field] && <Check />} {label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="mb-3 text-xs font-medium text-muted-foreground">PLAY MODE</p>
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3">
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
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3">
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
            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
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
            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
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
        <div className="grid grid-cols-2 items-center gap-2 border-t border-border bg-background/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:grid-cols-[auto_1fr_auto] sm:p-4">
          <Button className="order-2 sm:order-1" variant="ghost" disabled={step === 1} onClick={() => setStep(step - 1)}>
            <ArrowLeft /> Back
          </Button>
          <span className="order-1 col-span-2 text-center font-mono text-[9px] text-muted-foreground sm:order-2 sm:col-span-1 sm:text-[10px]">
            STEP {step} OF 6
          </span>
          {step < 6 ? (
            <Button className="order-3" disabled={step === 2 && !draft.name.trim()} onClick={() => setStep(step + 1)}>
              Continue <ArrowRight />
            </Button>
          ) : (
            <Button
              disabled={busy}
              onClick={finish}
              className="order-3 h-auto min-h-10 whitespace-normal bg-linear-to-r from-primary via-neon-violet to-neon-pink px-3 text-xs sm:text-sm"
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

function WizardChoice({
  label,
  value,
  options,
  onChange,
  choice,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  choice: (selected: boolean) => string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium">{label}</p>
      <div className="grid gap-2">
        {options.map((option) => (
          <Button
            key={option}
            variant="outline"
            className={choice(value === option)}
            onClick={() => onChange(option)}
          >
            {value === option && <Check />} {option}
          </Button>
        ))}
      </div>
    </div>
  );
}
