import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  connectDesktopBuildAgent,
  createDesktopBuild,
  getDesktopArtifactDownload,
  getDesktopBuildState,
  retryDesktopBuild,
} from "@/lib/desktop-build.functions";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Download,
  HardDrive,
  Monitor,
  PackageOpen,
  RefreshCw,
  Server,
  Terminal,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type BuildState = Awaited<ReturnType<ReturnType<typeof useServerFn<typeof getDesktopBuildState>>>>;
type DesktopPlatform = "windows" | "macos" | "linux";

const stages = [
  "preparing_project",
  "validating_files",
  "installing_dependencies",
  "compiling_game_code",
  "processing_assets",
  "creating_executable",
  "packaging_game",
  "generating_installer",
  "testing_build",
  "preparing_download",
  "build_complete",
];

const platformDetails = {
  windows: "Godot 4 Windows export templates; signing certificate required for trusted installers.",
  macos: "A macOS agent is required for universal exports, signing, and Apple notarization.",
  linux: "Godot 4 Linux export templates plus declared runtime dependency testing.",
};

export function DesktopBuildCenter({ gameId, gameName }: { gameId: string; gameName: string }) {
  const getState = useServerFn(getDesktopBuildState);
  const connectAgent = useServerFn(connectDesktopBuildAgent);
  const startBuild = useServerFn(createDesktopBuild);
  const retryBuild = useServerFn(retryDesktopBuild);
  const getDownload = useServerFn(getDesktopArtifactDownload);
  const [state, setState] = useState<BuildState>({ agents: [], jobs: [], artifacts: [] });
  const [busy, setBusy] = useState(false);
  const [agentName, setAgentName] = useState("My Godot build machine");
  const [platforms, setPlatforms] = useState<DesktopPlatform[]>(["windows"]);
  const [version, setVersion] = useState("0.1.0");
  const [agentToken, setAgentToken] = useState("");

  const refresh = useCallback(async () => {
    try {
      setState(await getState({ data: { gameId } }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Build state could not be loaded");
    }
  }, [gameId, getState]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const togglePlatform = (platform: DesktopPlatform) =>
    setPlatforms((current) =>
      current.includes(platform)
        ? current.length > 1
          ? current.filter((item) => item !== platform)
          : current
        : [...current, platform],
    );

  async function addAgent() {
    setBusy(true);
    try {
      const result = await connectAgent({ data: { name: agentName, platforms } });
      setAgentToken(result.token);
      toast.success("Build agent created. Save the token now—it is shown only once.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Agent could not be created");
    } finally {
      setBusy(false);
    }
  }

  async function build(selected: DesktopPlatform[], packageType: "all" | "installer" | "portable") {
    setBusy(true);
    try {
      const jobs = await startBuild({
        data: { gameId, platforms: selected, packageType, version },
      });
      const missing = jobs.filter((job) => job.status === "additional_tools_required");
      toast[missing.length ? "warning" : "success"](
        missing.length
          ? "Build queued where agents exist; other platforms need a connected native agent."
          : "Real desktop build queued for your connected agent.",
      );
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Build could not be queued");
    } finally {
      setBusy(false);
    }
  }

  async function download(artifactId: string) {
    try {
      const result = await getDownload({ data: { artifactId } });
      window.location.assign(result.signedUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download could not be prepared");
    }
  }

  const latestJob = state.jobs[0];
  return (
    <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.18em] text-neon-cyan">
            Godot 4 native delivery
          </p>
          <h2 className="mt-1 text-xl font-semibold">Desktop Build Center</h2>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">
            Native Windows, macOS, and Linux packages compile only on authenticated desktop agents.
            Source generation, preview, executable, and installer states remain separate.
          </p>
        </div>
        <Badge variant="outline">
          {state.agents.filter((agent) => agent.status === "online").length} AGENTS ONLINE
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {(Object.keys(platformDetails) as DesktopPlatform[]).map((platform) => {
          const connected = state.agents.some((agent) =>
            agent.supported_platforms.includes(platform),
          );
          return (
            <button
              key={platform}
              type="button"
              onClick={() => togglePlatform(platform)}
              className={`rounded-2xl border p-4 text-left transition ${platforms.includes(platform) ? "spectrum-border bg-primary/8" : "border-border bg-panel/60 hover:bg-panel"}`}
            >
              <div className="flex items-center gap-2">
                <Monitor className="size-4 text-neon-cyan" />
                <span className="text-sm font-semibold capitalize">{platform}</span>
                <Badge variant="outline" className="ml-auto text-[8px]">
                  {connected ? "AGENT READY" : "AGENT REQUIRED"}
                </Badge>
              </div>
              <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
                {platformDetails[platform]}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1.25fr]">
        <div className="rounded-2xl border border-border bg-panel/60 p-4">
          <div className="flex items-center gap-2">
            <Server className="size-4 text-neon-cyan" />
            <h3 className="text-sm font-semibold">Connected build agents</h3>
          </div>
          <div className="mt-3 space-y-2">
            {state.agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-3 rounded-xl bg-canvas/60 p-3 text-xs"
              >
                <span
                  className={`size-2 rounded-full ${agent.status === "online" ? "bg-success" : "bg-warning"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{agent.name}</p>
                  <p className="text-[9px] text-muted-foreground">
                    {agent.supported_platforms.join(" · ")} · Godot {agent.godot_version}
                  </p>
                </div>
                <Badge variant="outline" className="text-[8px] uppercase">
                  {agent.status}
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input
              value={agentName}
              onChange={(event) => setAgentName(event.target.value)}
              placeholder="Agent name"
            />
            <Button variant="outline" disabled={busy || !agentName.trim()} onClick={addAgent}>
              <Server /> Create agent token
            </Button>
          </div>
          {agentToken && (
            <div className="mt-3 rounded-xl border border-warning/30 bg-warning/10 p-3">
              <p className="text-[10px] font-medium text-warning">ONE-TIME AGENT TOKEN</p>
              <code className="mt-2 block break-all text-[10px]">{agentToken}</code>
              <p className="mt-2 text-[9px] text-muted-foreground">
                Install the FableForge agent on your native build machine and configure this token.
                It is stored only as a secure hash.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-panel/60 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <PackageOpen className="size-4 text-neon-cyan" />
            <h3 className="text-sm font-semibold">Build {gameName}</h3>
            <Input
              className="ml-auto h-8 w-28"
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              aria-label="Game version"
            />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button disabled={busy} onClick={() => build(platforms, "all")}>
              <HardDrive /> Build selected platforms
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => build(["windows"], "installer")}
            >
              <PackageOpen /> Generate Windows installer
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => build(["windows"], "portable")}
            >
              <Download /> Create portable build
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => build(["windows", "macos", "linux"], "all")}
            >
              <Monitor /> Build all desktop platforms
            </Button>
          </div>
          <p className="mt-3 text-[9px] leading-4 text-muted-foreground">
            macOS signing/notarization requires Apple credentials on the macOS agent. Windows
            trusted installers require a code-signing certificate. Unsigned packages are labeled
            clearly.
          </p>
        </div>
      </div>

      {latestJob && (
        <div className="mt-4 rounded-2xl border border-border bg-canvas/70 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {latestJob.status === "complete" ? (
              <Check className="size-4 text-success" />
            ) : latestJob.status === "failed" ? (
              <TriangleAlert className="size-4 text-destructive" />
            ) : (
              <RefreshCw className="size-4 text-neon-cyan" />
            )}
            <h3 className="text-sm font-semibold capitalize">
              {latestJob.platform} · {latestJob.package_type}
            </h3>
            <Badge variant="outline" className="ml-auto uppercase">
              {latestJob.status.replaceAll("_", " ")}
            </Badge>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${latestJob.progress_percent}%` }}
            />
          </div>
          <p className="mt-2 font-mono text-[9px] text-muted-foreground">
            {latestJob.progress_percent}% · {latestJob.progress_stage.replaceAll("_", " ")}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-1 md:grid-cols-4">
            {stages.map((stage) => (
              <span
                key={stage}
                className={`rounded px-2 py-1 text-[8px] ${stage === latestJob.progress_stage ? "bg-primary/15 text-neon-cyan" : "text-muted-foreground"}`}
              >
                {stage.replaceAll("_", " ")}
              </span>
            ))}
          </div>
          {latestJob.error_message && (
            <p className="mt-3 text-xs text-destructive">{latestJob.error_message}</p>
          )}
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info(latestJob.logs || "No build logs yet")}
            >
              <Terminal /> View build logs
            </Button>
            {(latestJob.status === "failed" ||
              latestJob.status === "additional_tools_required") && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await retryBuild({ data: { jobId: latestJob.id } });
                  await refresh();
                }}
              >
                <RefreshCw /> Retry failed build
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {state.artifacts.map((artifact) => {
          const job = state.jobs.find((item) => item.id === artifact.job_id);
          return (
            <div
              key={artifact.id}
              className="rounded-2xl border border-success/25 bg-success/5 p-4"
            >
              <div className="flex items-center gap-2">
                <Check className="size-4 text-success" />
                <h3 className="text-sm font-semibold">{artifact.file_name}</h3>
                <Badge className="ml-auto">READY</Badge>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                <div>
                  <dt>Version</dt>
                  <dd className="text-foreground">{job?.version ?? "—"}</dd>
                </div>
                <div>
                  <dt>Operating system</dt>
                  <dd className="capitalize text-foreground">{artifact.platform}</dd>
                </div>
                <div>
                  <dt>File size</dt>
                  <dd className="text-foreground">
                    {(artifact.file_size / 1024 / 1024).toFixed(1)} MB
                  </dd>
                </div>
                <div>
                  <dt>Build date</dt>
                  <dd className="text-foreground">
                    {new Date(artifact.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
                {artifact.installation_instructions ||
                  "Installation instructions are included with the package."}
              </p>
              <Button className="mt-3 w-full" onClick={() => download(artifact.id)}>
                <Download /> Download verified build
              </Button>
            </div>
          );
        })}
      </div>
      {!state.artifacts.length && (
        <div className="mt-4 rounded-2xl border border-border bg-canvas/70 p-4 text-xs text-muted-foreground">
          No executable or installer is ready. A download appears only after a native agent uploads
          a checksum-verified package and required release checks pass.
        </div>
      )}
    </div>
  );
}
