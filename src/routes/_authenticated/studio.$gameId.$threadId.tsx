import { BrandMark } from "@/components/brand-mark";
import { CometModelPicker } from "@/components/comet-model-picker";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ProjectMemoryPanel } from "@/components/project-memory-panel";
import { VersionControlPanel } from "@/components/version-control-panel";
import { StudioShell } from "@/components/studio-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { createThread, getWorkspace } from "@/lib/studio.functions";
import { useChat } from "@ai-sdk/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  Bot,
  Check,
  ChevronDown,
  Code2,
  Eye,
  FileCode2,
  Folder,
  Gamepad2,
  Brain,
  GitBranch,
  Image,
  Maximize2,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Smartphone,
  Tablet,
  Undo2,
  Wand2,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Dispatch, RefObject, SetStateAction } from "react";

export const Route = createFileRoute("/_authenticated/studio/$gameId/$threadId")({
  component: GameWorkspace,
  head: () => ({
    meta: [
      { title: "Game Workspace | FableForge AI" },
      {
        name: "description",
        content: "AI-assisted game design, code editing, live preview, and export workspace.",
      },
    ],
  }),
});

type Workspace = Awaited<ReturnType<ReturnType<typeof useServerFn<typeof getWorkspace>>>>;
type ReadyWorkspace = Omit<Workspace, "game"> & {
  game: NonNullable<Workspace["game"]>;
};
type StudioTab =
  
  | "memory"
  | "versions"
  
  | "preview"
  
  | "code"
  
  
  ;
type PreviewDevice = "mobile" | "tablet" | "desktop";
type PreviewOrientation = "portrait" | "landscape";

const buildStates = [
  "Understanding request",
  "Planning changes",
  "Creating systems",
  "Generating code",
  "Adding assets",
  "Updating the game world",
  "Testing gameplay",
  "Fixing errors",
  "Optimizing performance",
  "Preparing build",
  "Completed",
];

const quickActions = [
  { label: "Apply Changes", icon: Check },
  { label: "Preview Game", icon: Play },
  { label: "Fix Errors", icon: Wand2 },
  { label: "Improve Graphics", icon: Image },
  { label: "Add Features", icon: Plus },
  { label: "Optimize", icon: Rocket },
  { label: "Undo", icon: Undo2 },
  { label: "View Files", icon: Eye },
  { label: "Export", icon: PackageOpen },
];

function GameWorkspace() {
  const { gameId, threadId } = Route.useParams();
  const fetchWorkspace = useServerFn(getWorkspace);
  const addThread = useServerFn(createThread);
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [tab, setTab] = useState<StudioTab>("preview");
  const [modelId, setModelId] = useState("lovable:balanced");
  const [selectedFile, setSelectedFile] = useState("");
  const [playing, setPlaying] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [previewOrientation, setPreviewOrientation] = useState<PreviewOrientation>("landscape");
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    fetchWorkspace({ data: { gameId, threadId } })
      .then((data) => {
        setWorkspace(data);
        setSelectedFile(data.files[0]?.path ?? "");
      })
      .catch((error) => toast.error(error.message));
  }, [fetchWorkspace, gameId, threadId]);
  const initialMessages = useMemo<UIMessage[]>(
    () =>
      (workspace?.messages ?? []).map((message, index) => ({
        id: message.ai_message_id ?? `saved-${index}`,
        role: message.role as UIMessage["role"],
        parts: message.parts as UIMessage["parts"],
      })),
    [workspace],
  );
  if (!workspace?.game)
    return (
      <StudioShell title="Loading workspace…" compact>
        <div className="grid h-[calc(100vh-4rem)] place-items-center">
          <Shimmer>Warming the forge…</Shimmer>
        </div>
      </StudioShell>
    );
  return (
    <StudioShell
      title={workspace.game.name}
      subtitle={`${workspace.game.platform} / ${workspace.game.genre}`}
      compact
      accountRole={workspace.roles.some((item) => item.role === "owner") ? "owner" : undefined}
      credits={workspace.roles.some((item) => item.role === "owner") ? "unlimited" : undefined}
    >
      <ChatWorkspace
        key={threadId}
        {...{
          workspace: workspace as ReadyWorkspace,
          initialMessages,
          gameId,
          threadId,
          tab,
          setTab,
          modelId,
          setModelId,
          selectedFile,
          setSelectedFile,
          playing,
          setPlaying,
          previewDevice,
          setPreviewDevice,
          previewOrientation,
          setPreviewOrientation,
          previewFullscreen,
          setPreviewFullscreen,
          textareaRef,
          addThread,
          navigate,
        }}
      />
    </StudioShell>
  );
}

function ChatWorkspace({
  workspace,
  initialMessages,
  gameId,
  threadId,
  tab,
  setTab,
  modelId,
  setModelId,
  selectedFile,
  setSelectedFile,
  playing,
  setPlaying,
  previewDevice,
  setPreviewDevice,
  previewOrientation,
  setPreviewOrientation,
  previewFullscreen,
  setPreviewFullscreen,
  textareaRef,
  addThread,
  navigate,
}: {
  workspace: ReadyWorkspace;
  initialMessages: UIMessage[];
  gameId: string;
  threadId: string;
  tab: StudioTab;
  setTab: Dispatch<SetStateAction<StudioTab>>;
  modelId: string;
  setModelId: Dispatch<SetStateAction<string>>;
  selectedFile: string;
  setSelectedFile: Dispatch<SetStateAction<string>>;
  playing: boolean;
  setPlaying: Dispatch<SetStateAction<boolean>>;
  previewDevice: PreviewDevice;
  setPreviewDevice: Dispatch<SetStateAction<PreviewDevice>>;
  previewOrientation: PreviewOrientation;
  setPreviewOrientation: Dispatch<SetStateAction<PreviewOrientation>>;
  previewFullscreen: boolean;
  setPreviewFullscreen: Dispatch<SetStateAction<boolean>>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  addThread: (options: { data: { gameId: string } }) => Promise<{ id: string }>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/chat",
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          const headers = new Headers();
          if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
          return headers;
        },
        body: { gameId, threadId, modelId },
      }),
    [gameId, threadId, modelId],
  );
  const { messages, sendMessage, status, stop, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onFinish: () => textareaRef.current?.focus(),
    onError: (cause) =>
      toast.error(
        cause.message.includes("402")
          ? "AI credits are exhausted. Add workspace AI balance to continue."
          : cause.message.includes("429")
            ? "The forge is busy. Try again in a moment."
            : cause.message,
      ),
  });
  const [queuedInstructions, setQueuedInstructions] = useState<string[]>([]);
  const isBuilding = status === "submitted" || status === "streaming";
  const activeBuildStep = isBuilding
    ? Math.min(buildStates.length - 2, Math.max(0, messages.length % (buildStates.length - 1)))
    : -1;
  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId, textareaRef]);
  const activeFile =
    workspace.files.find((file) => file.path === selectedFile) ?? workspace.files[0];
  async function submit(message: { text: string }) {
    if (!message.text.trim()) return;
    if (isBuilding) {
      setQueuedInstructions((current) => [...current, message.text.trim()]);
      toast.success("Instruction queued for this build");
      textareaRef.current?.focus();
      return;
    }
    await sendMessage({ text: message.text.trim() });
    textareaRef.current?.focus();
  }
  async function newThread() {
    const thread = await addThread({ data: { gameId } });
    navigate({
      to: "/studio/$gameId/$threadId",
      params: { gameId, threadId: thread.id },
    });
  }
  return (
    <div className="grid min-h-[calc(100dvh-4.5rem)] grid-cols-1 gap-2 overflow-x-hidden p-2 pb-24 md:h-[calc(100dvh-4.5rem)] md:grid-rows-[minmax(380px,1.15fr)_minmax(360px,1fr)] md:overflow-hidden md:pb-2 xl:grid-cols-[420px_1fr] xl:grid-rows-1">
      <section className="glass-panel order-2 flex min-h-0 flex-col overflow-hidden rounded-2xl md:order-2 xl:order-1">
        <div className="flex items-center gap-2 border-b border-border/60 bg-linear-to-r from-primary/10 via-neon-violet/5 to-transparent p-3">
          <div className="relative">
            <div
              className={`absolute inset-0 rounded-full bg-neon-cyan/30 blur-md ${isBuilding ? "animate-pulse" : ""}`}
            />
            <BrandMark
              className={`relative size-9 shrink-0 ${isBuilding ? "animate-pulse" : ""}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-mono text-[10px] font-semibold tracking-wider">FABLE 5 BUILDER</p>
              {(modelId === "lovable:pro" || !modelId.startsWith("lovable:")) && (
                <Badge className="border-neon-pink/30 bg-neon-pink/15 text-neon-pink">PRO</Badge>
              )}
            </div>
            <p className="truncate text-[10px] text-success">
              ONLINE · Project memory active · Checkpoints on
            </p>
          </div>
          <Button size="icon-sm" variant="outline" onClick={newThread}>
            <Plus />
          </Button>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b border-border p-2">
          {workspace.threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() =>
                navigate({
                  to: "/studio/$gameId/$threadId",
                  params: { gameId, threadId: thread.id },
                })
              }
              className={`min-w-32 rounded-md px-3 py-1.5 text-left font-mono text-[10px] ${thread.id === threadId ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              <span className="block truncate">{thread.title}</span>
            </button>
          ))}
        </div>
        {isBuilding && (
          <div className="border-b border-border/60 bg-canvas/60 p-3">
            <div className="mb-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider">
              <span className="text-neon-cyan">Live build sequence</span>
              <span className="text-muted-foreground">
                {Math.round(((activeBuildStep + 1) / buildStates.length) * 100)}%
              </span>
            </div>
            <div className="mb-3 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="relative h-full bg-linear-to-r from-neon-cyan via-primary to-neon-pink transition-all duration-700"
                style={{
                  width: `${((activeBuildStep + 1) / buildStates.length) * 100}%`,
                }}
              >
                <span className="build-scan absolute inset-y-0 w-16 bg-linear-to-r from-transparent via-primary-foreground/70 to-transparent" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {buildStates.map((step, index) => (
                <div
                  key={step}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[9px] ${index === activeBuildStep ? "bg-primary/15 text-foreground" : index < activeBuildStep ? "text-success" : "text-muted-foreground"}`}
                >
                  {index < activeBuildStep ? (
                    <Check className="size-3" />
                  ) : (
                    <span
                      className={`size-1.5 rounded-full ${index === activeBuildStep ? "animate-pulse bg-neon-cyan shadow-[0_0_8px_var(--neon-cyan)]" : "bg-muted-foreground/30"}`}
                    />
                  )}
                  <span className="truncate">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <Conversation className="min-h-0">
          <ConversationContent className="gap-5 p-4">
            {messages.length === 0 && (
              <ConversationEmptyState
                icon={<BrandMark className="size-20" />}
                title="What do you want to build today?"
                description="Build a 3D fantasy RPG, add mobile controls, create a boss fight, fix the UI, or prepare an export."
              />
            )}
            {messages.map((message, messageIndex) => (
              <Message key={message.id} from={message.role} className="animate-fade-in">
                <MessageContent>
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      <MessageResponse key={index}>{part.text}</MessageResponse>
                    ) : null,
                  )}
                </MessageContent>
                {message.role === "assistant" &&
                  messageIndex === messages.length - 1 &&
                  status === "ready" && (
                    <div className="mt-2 flex max-w-full flex-wrap gap-1.5">
                      {quickActions.map((action) => (
                        <Button
                          key={action.label}
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-lg border-border/70 bg-panel/60 px-2 text-[9px] hover:border-neon-cyan/40 hover:text-neon-cyan"
                          onClick={() =>
                            action.label === "Preview Game"
                              ? setPlaying(true)
                              : toast.info(`${action.label} is ready for your next instruction`)
                          }
                        >
                          <action.icon className="size-3" /> {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
              </Message>
            ))}
            {status === "submitted" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bot className="size-4 text-accent" />
                <Shimmer>{`${buildStates[activeBuildStep] ?? "Thinking"}…`}</Shimmer>
              </div>
            )}
            {error && <p className="text-xs text-destructive">{error.message}</p>}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <div className="border-t border-border/60 p-3">
          {queuedInstructions.length > 0 && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[10px] text-muted-foreground">
              <History className="size-3 text-primary" />
              <span className="truncate">
                {queuedInstructions.length} instruction
                {queuedInstructions.length > 1 ? "s" : ""} queued
              </span>
            </div>
          )}
          <PromptInput
            onSubmit={submit}
            className="spectrum-border bg-canvas/90 shadow-[0_0_24px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
          >
            <PromptInputTextarea
              ref={textareaRef}
              placeholder={
                isBuilding
                  ? "Queue another instruction while Fable builds…"
                  : "Describe a mechanic, scene, level, or fix…"
              }
              className="min-h-20"
            />
            <PromptInputFooter>
              <CometModelPicker value={modelId} onValueChange={setModelId} />
              <PromptInputSubmit status={status} onStop={stop} />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 text-center font-mono text-[9px] text-muted-foreground">
            MAJOR CHANGES REQUIRE YOUR APPROVAL
          </p>
        </div>
      </section>

      <section className="glass-panel order-1 flex min-h-0 flex-col overflow-hidden rounded-2xl md:order-1 xl:order-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-border/60 bg-panel/80 px-2 py-1">
          <div className="flex min-w-0 gap-1 overflow-x-auto overscroll-x-contain">
            {(
              [
                { id: "memory", label: "Memory", icon: Brain },
                { id: "versions", label: "Versions", icon: GitBranch },
                { id: "preview", label: "Live Game", icon: Gamepad2 },
                { id: "code", label: "Code Editor", icon: Code2 },
              ] as const
            ).map((item) => (
              <Button
                key={item.id}
                variant={tab === item.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTab(item.id)}
              >
                <item.icon />
                {item.label}
              </Button>
            ))}
          </div>
          <div className="ml-1 flex shrink-0 gap-1">
            <Button
              variant={playing ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <RefreshCw /> : <Play />}
              <span className="hidden sm:inline">{playing ? "Restart" : "Play"}</span>
            </Button>
            <Button
              variant={previewDevice === "mobile" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => {
                setTab("preview");
                setPreviewDevice("mobile");
              }}
              aria-label="Mobile phone preview"
            >
              <Smartphone />
            </Button>
            <Button
              variant={previewDevice === "tablet" ? "secondary" : "ghost"}
              size="icon-sm"
              className="hidden sm:inline-flex"
              onClick={() => {
                setTab("preview");
                setPreviewDevice("tablet");
              }}
              aria-label="Tablet preview"
            >
              <Tablet />
            </Button>
            <Button
              variant={previewDevice === "desktop" ? "secondary" : "ghost"}
              size="icon-sm"
              className="hidden sm:inline-flex"
              onClick={() => {
                setTab("preview");
                setPreviewDevice("desktop");
              }}
              aria-label="Desktop preview"
            >
              <Monitor />
            </Button>
            <Button
              variant={previewFullscreen ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => {
                setTab("preview");
                setPreviewFullscreen((value) => !value);
              }}
              aria-label="Fullscreen preview"
            >
              <Maximize2 />
            </Button>
          </div>
        </div>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-semibold">{stage.title}</h3>
                        <Badge variant="outline" className="font-mono text-[8px] uppercase">
                          {stage.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-[10px] text-muted-foreground">
                        Depends on: {stage.dependencies.join(", ") || "No prior stage"}
                      </p>
                      <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                        {stage.deliverables.join(" · ")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="size-4 text-neon-cyan" />
                <h3 className="text-sm font-semibold">Recovery checkpoints</h3>
                <Badge variant="outline" className="ml-auto">
                  {workspace.checkpoints.length} SAVED
                </Badge>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {workspace.checkpoints.map((checkpoint) => (
                  <div
                    key={checkpoint.id}
                    className="rounded-xl border border-border bg-canvas/60 p-3"
                  >
                    <p className="text-xs font-medium">{checkpoint.label}</p>
                    <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                      {checkpoint.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab === "memory" && <ProjectMemoryPanel gameId={gameId} />}
        {tab === "versions" && (
          <VersionControlPanel gameId={gameId} onRestored={() => window.location.reload()} />
        )}
        {tab === "tests" && <PlaytestCenter gameId={gameId} />}
        {tab === "preview" && (
          <div
            className={`panel-grid relative flex flex-1 flex-col items-center justify-center overflow-auto p-3 sm:p-5 ${previewFullscreen ? "fixed inset-0 z-[80] bg-background" : ""}`}
          >
            <div className="aurora-orb pointer-events-none absolute -left-28 top-0 size-80 rounded-full bg-neon-violet/12 blur-3xl" />
            <div className="aurora-orb pointer-events-none absolute -bottom-32 right-0 size-96 rounded-full bg-neon-cyan/10 blur-3xl [animation-delay:-6s]" />
            <div className="relative z-10 mb-3 flex max-w-full flex-wrap items-center justify-center gap-1 rounded-xl border border-border bg-panel/90 p-1.5">
              {(
                [
                  ["mobile", Smartphone],
                  ["tablet", Tablet],
                  ["desktop", Monitor],
                ] as const
              ).map(([device, Icon]) => (
                <Button
                  key={device}
                  size="sm"
                  variant={previewDevice === device ? "secondary" : "ghost"}
                  onClick={() => setPreviewDevice(device)}
                  className="min-h-10 capitalize"
                >
                  <Icon /> {device}
                </Button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setPreviewOrientation((value) =>
                    value === "portrait" ? "landscape" : "portrait",
                  )
                }
                className="min-h-10"
              >
                <RefreshCw /> {previewOrientation}
              </Button>
              {previewFullscreen && (
                <Button size="sm" variant="outline" onClick={() => setPreviewFullscreen(false)}>
                  Exit fullscreen
                </Button>
              )}
            </div>
            <div
              className={`spectrum-border relative shrink-0 overflow-hidden rounded-2xl bg-panel shadow-2xl transition-all duration-500 ${playing ? "forge-glow" : ""} ${previewDevice === "mobile" ? (previewOrientation === "portrait" ? "aspect-[9/16] h-[min(62dvh,680px)]" : "aspect-video w-[min(92vw,760px)]") : previewDevice === "tablet" ? (previewOrientation === "portrait" ? "aspect-[3/4] h-[min(62dvh,760px)]" : "aspect-[4/3] w-[min(92vw,920px)]") : "aspect-video w-full max-w-6xl"}`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_65%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_28%)]" />
              <div className="absolute left-5 top-5 flex gap-2">
                <Badge className="font-mono text-[9px]">{playing ? "RUNNING" : "READY"}</Badge>
                <Badge variant="outline" className="font-mono text-[9px]">
                  60 FPS
                </Badge>
              </div>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <BrandMark
                    className={`mx-auto size-16 sm:size-24 lg:size-32 ${playing ? "animate-pulse" : "opacity-40 grayscale"}`}
                  />
                  <h3 className="mt-3 px-4 font-mono text-base font-semibold uppercase tracking-[.08em] sm:text-2xl sm:tracking-[.14em]">
                    {workspace.game.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {playing ? "Starter scene is running" : "Press play to enter the starter scene"}
                  </p>
                  {!playing && (
                    <Button
                      className="mt-5 bg-linear-to-r from-primary via-neon-violet to-neon-pink shadow-[0_0_26px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
                      onClick={() => setPlaying(true)}
                    >
                      <Play /> Play game
                    </Button>
                  )}
                </div>
              </div>
              <div className="absolute bottom-5 left-5 right-5 flex justify-between font-mono text-[9px] text-muted-foreground">
                <span>{previewDevice === "desktop" ? "WASD · MOVE" : "TOUCH · MOVE"}</span>
                <span>BUILD 0.1.0</span>
              </div>
              {playing && previewDevice !== "desktop" && (
                <div
                  className="absolute inset-x-4 bottom-10 flex items-end justify-between"
                  aria-label="Touch game controls"
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-14 rounded-full bg-background/60 backdrop-blur"
                  >
                    ◎
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-12 rounded-full bg-background/60"
                    >
                      A
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-12 rounded-full bg-background/60"
                    >
                      B
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {tab === "code" && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-10 items-center gap-2 border-b border-border bg-panel px-4 text-xs">
              <FileCode2 className="size-4 text-accent" />
              {activeFile?.path}
              <Badge variant="outline" className="ml-auto font-mono text-[9px]">
                v{activeFile?.version}
              </Badge>
            </div>
            <pre className="min-h-0 flex-1 overflow-auto p-5 font-mono text-xs leading-6 text-muted-foreground">
              <code>{activeFile?.content}</code>
            </pre>
          </div>
        )}
        <div className="h-32 shrink-0 border-t border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="flex h-8 items-center gap-1 border-b border-border px-2">
            {["Build Logs", "Errors 1", "Warnings", "Testing", "Performance", "Multiplayer"].map(
              (label, index) => (
                <span
                  key={label}
                  className={`px-2 font-mono text-[9px] ${index === 1 ? "text-destructive" : index === 0 ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {label.toUpperCase()}
                </span>
              ),
            )}
            <Button
              size="sm"
              variant="outline"
              className="ml-auto h-7 shrink-0 font-mono text-[9px]"
              onClick={() => {
                setTab("tests");
                toast.info("Playtest diagnostics opened. Ask Fable to repair any reported issue.");
              }}
            >
              <Wand2 /> <span className="hidden sm:inline">Fix Responsive Design with AI</span>
              <span className="sm:hidden">AI Fix</span>
            </Button>
          </div>
          <div className="space-y-1 p-3 font-mono text-[10px]">
            <p>
              <span className="text-muted-foreground">14:20:04</span>{" "}
              <span className="text-success">BUILD</span> Starter scene compiled · 18 files · 42
              assets
            </p>
            <p>
              <span className="text-muted-foreground">14:20:12</span>{" "}
              <span className="text-destructive">ERROR</span> Mobile input map needs a touch control
              binding
            </p>
            <p className="text-muted-foreground">
              Fable 5 can repair this without changing your game logic.
            </p>
          </div>
        </div>
      </section>

      <aside className="hidden">
        <div className="flex h-11 items-center border-b border-border px-3 text-xs font-semibold">
          <span className="font-mono text-[10px] tracking-wider">GAME INSPECTOR</span>{" "}
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            onClick={() => setTab("models")}
            aria-label="Open asset generator"
          >
            <Plus />
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <div className="mb-2 rounded-xl border border-border bg-panel/70 p-3">
            <p className="font-mono text-[9px] uppercase tracking-wider text-neon-cyan">
              Selected scene
            </p>
            <p className="mt-2 text-xs font-medium">Main game world</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
              <span className="rounded-lg bg-canvas/70 p-2">Transform</span>
              <span className="rounded-lg bg-canvas/70 p-2">Physics</span>
              <span className="rounded-lg bg-canvas/70 p-2">Visuals</span>
              <span className="rounded-lg bg-canvas/70 p-2">Behavior</span>
            </div>
          </div>
          <p className="px-2 py-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Assets, scripts & components
          </p>
          <div className="mb-1 flex items-center gap-1 px-2 py-1 text-xs">
            <ChevronDown className="size-3" />
            <Folder className="size-4 text-primary" />
            {workspace.game.name}
          </div>
          {workspace.files.map((file) => (
            <button
              key={file.id}
              onClick={() => {
                setSelectedFile(file.path);
                setTab("code");
              }}
              className={`flex w-full items-center gap-2 rounded px-6 py-1.5 text-left text-[11px] ${selectedFile === file.path ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              <FileCode2 className="size-3" />
              <span className="truncate">{file.path}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-border p-3">
          <div className="spectrum-border rounded-xl bg-secondary/70 p-3">
            <div className="flex items-center gap-2 text-xs font-medium">
              <ShieldCheck className="size-4 text-neon-cyan" /> AI project scan
            </div>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
              Architecture scan tracks {workspace.files.length} files, {workspace.stages.length}
              production stages, dependencies, and checkpoint history.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => setTab("tests")}
            >
              Run scan
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
