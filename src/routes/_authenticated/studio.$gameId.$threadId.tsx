import { BrandMark } from "@/components/brand-mark";
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
import { TripoModelLab } from "@/components/tripo-model-lab";
import { StudioShell } from "@/components/studio-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Cuboid,
  Download,
  Eye,
  FileArchive,
  FileCode2,
  Folder,
  Gamepad2,
  History,
  Image,
  Maximize2,
  Monitor,
  PackageOpen,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Smartphone,
  Terminal,
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
type ReadyWorkspace = Omit<Workspace, "game"> & { game: NonNullable<Workspace["game"]> };
type StudioTab = "preview" | "models" | "code" | "console" | "export";
type ModelTier = "fast" | "balanced" | "pro";

const buildStates = [
  "Planning",
  "Creating project structure",
  "Generating gameplay systems",
  "Building maps",
  "Creating menus",
  "Connecting controls",
  "Adding audio",
  "Testing gameplay",
  "Checking performance",
  "Fixing errors",
  "Preparing standalone build",
  "Export complete",
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
  const [modelTier, setModelTier] = useState<ModelTier>("balanced");
  const [selectedFile, setSelectedFile] = useState("");
  const [playing, setPlaying] = useState(false);
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
          modelTier,
          setModelTier,
          selectedFile,
          setSelectedFile,
          playing,
          setPlaying,
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
  modelTier,
  setModelTier,
  selectedFile,
  setSelectedFile,
  playing,
  setPlaying,
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
  modelTier: ModelTier;
  setModelTier: Dispatch<SetStateAction<ModelTier>>;
  selectedFile: string;
  setSelectedFile: Dispatch<SetStateAction<string>>;
  playing: boolean;
  setPlaying: Dispatch<SetStateAction<boolean>>;
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
        body: { gameId, threadId, modelTier },
      }),
    [gameId, threadId, modelTier],
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
  const activeBuildStep = isBuilding ? Math.min(7, Math.max(0, messages.length % 8)) : -1;
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
    navigate({ to: "/studio/$gameId/$threadId", params: { gameId, threadId: thread.id } });
  }
  return (
    <div className="grid h-[calc(100vh-4.5rem)] min-h-[640px] grid-cols-1 grid-rows-[minmax(340px,50vh)_1fr] gap-2 overflow-hidden p-2 xl:grid-cols-[244px_minmax(480px,1fr)_380px] xl:grid-rows-1">
      <section className="glass-panel order-2 flex min-h-0 flex-col overflow-hidden rounded-2xl xl:order-3">
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
              {modelTier === "pro" && (
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
                style={{ width: `${((activeBuildStep + 1) / buildStates.length) * 100}%` }}
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
                {queuedInstructions.length} instruction{queuedInstructions.length > 1 ? "s" : ""}{" "}
                queued
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
              <Select
                value={modelTier}
                onValueChange={(value) => setModelTier(value as typeof modelTier)}
              >
                <SelectTrigger className="h-8 w-32 border-0 bg-transparent px-2 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">Fable 5 Fast</SelectItem>
                  <SelectItem value="balanced">Fable 5</SelectItem>
                  <SelectItem value="pro">Claude Fable 5 Pro</SelectItem>
                </SelectContent>
              </Select>
              <PromptInputSubmit status={status} onStop={stop} />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 text-center font-mono text-[9px] text-muted-foreground">
            MAJOR CHANGES REQUIRE YOUR APPROVAL
          </p>
        </div>
      </section>

      <section className="glass-panel order-1 flex min-h-0 flex-col overflow-hidden rounded-2xl xl:order-2">
        <div className="flex h-12 items-center border-b border-border/60 bg-panel/80 px-2">
          <div className="flex gap-1">
            {(
              [
                { id: "preview", label: "Viewport", icon: Gamepad2 },
                { id: "models", label: "3D Forge", icon: Cuboid },
                { id: "code", label: "Code Editor", icon: Code2 },
                { id: "console", label: "Console", icon: Terminal },
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
          <div className="ml-auto flex gap-1">
            <Button
              variant={playing ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <RefreshCw /> : <Play />}
              <span className="hidden sm:inline">{playing ? "Restart" : "Play"}</span>
            </Button>
            <Button variant="ghost" size="icon-sm">
              <Smartphone />
            </Button>
            <Button variant="ghost" size="icon-sm">
              <Monitor />
            </Button>
            <Button variant="ghost" size="icon-sm">
              <Maximize2 />
            </Button>
          </div>
        </div>
        {tab === "preview" && (
          <div className="panel-grid relative flex flex-1 items-center justify-center overflow-hidden p-3 sm:p-5">
            <div className="aurora-orb pointer-events-none absolute -left-28 top-0 size-80 rounded-full bg-neon-violet/12 blur-3xl" />
            <div className="aurora-orb pointer-events-none absolute -bottom-32 right-0 size-96 rounded-full bg-neon-cyan/10 blur-3xl [animation-delay:-6s]" />
            <div
              className={`spectrum-border relative aspect-video w-full max-w-6xl overflow-hidden rounded-2xl bg-panel shadow-2xl transition-all duration-500 ${playing ? "forge-glow scale-[1.005]" : ""}`}
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
                    className={`mx-auto size-32 ${playing ? "animate-pulse" : "opacity-40 grayscale"}`}
                  />
                  <h3 className="mt-3 font-mono text-2xl font-semibold uppercase tracking-[.14em]">
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
                <span>WASD · MOVE</span>
                <span>BUILD 0.1.0</span>
              </div>
            </div>
          </div>
        )}
        {tab === "models" && <TripoModelLab />}
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
        {tab === "console" && (
          <div className="flex-1 overflow-auto p-5 font-mono text-xs leading-7">
            <p className="text-muted-foreground">[forge] project manifest loaded</p>
            <p className="text-success">[build] 4 files compiled successfully</p>
            <p className="text-muted-foreground">[preview] waiting for play command</p>
          </div>
        )}
        <div className="h-32 shrink-0 border-t border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="flex h-8 items-center gap-1 border-b border-border px-2">
            {["Build Logs", "Errors 1", "Console", "AI Fixes", "Tasks"].map((label, index) => (
              <span
                key={label}
                className={`px-2 font-mono text-[9px] ${index === 1 ? "text-destructive" : index === 0 ? "text-foreground" : "text-muted-foreground"}`}
              >
                {label.toUpperCase()}
              </span>
            ))}
            <Button size="sm" variant="outline" className="ml-auto h-6 font-mono text-[9px]">
              <Wand2 /> Fix with AI
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

      <aside className="glass-panel order-3 hidden min-h-0 flex-col overflow-hidden rounded-2xl xl:order-1 xl:flex">
        <div className="flex h-11 items-center border-b border-border px-3 text-xs font-semibold">
          <span className="font-mono text-[10px] tracking-wider">PROJECT / ASSETS</span>{" "}
          <Button variant="ghost" size="icon-sm" className="ml-auto">
            <Plus />
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-2">
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
              No blocking errors. Starter files are ready for your first build instruction.
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              Run scan
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
