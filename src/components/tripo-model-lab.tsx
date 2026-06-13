import { ModelViewer } from "@/components/model-viewer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Box, Download, LoaderCircle, Map, Rotate3D, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type GenerationStatus = "idle" | "queued" | "running" | "success" | "failed";

const presets = [
  { label: "Character", prompt: "A game-ready fantasy hero character, full body, neutral pose" },
  { label: "Environment", prompt: "A modular low-poly fantasy village map tile with paths and buildings" },
  { label: "Building", prompt: "A game-ready medieval blacksmith building with clean topology" },
  { label: "Prop", prompt: "A stylized enchanted treasure chest game prop" },
];

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Sign in required");
  return {
    Authorization: `Bearer ${data.session.access_token}`,
    "Content-Type": "application/json",
  };
}

export function TripoModelLab() {
  const [prompt, setPrompt] = useState(presets[0].prompt);
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [modelUrl, setModelUrl] = useState<string | null>(null);

  async function generate() {
    if (!prompt.trim() || status === "queued" || status === "running") return;
    setStatus("queued");
    setProgress(0);
    setModelUrl(null);
    try {
      const headers = await authHeaders();
      const created = await fetch("/api/tripo", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "create", prompt: prompt.trim() }),
      });
      if (!created.ok) throw new Error(await created.text());
      const { taskId } = (await created.json()) as { taskId: string };
      for (let attempt = 0; attempt < 120; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 3000));
        const response = await fetch("/api/tripo", {
          method: "POST",
          headers,
          body: JSON.stringify({ action: "status", taskId }),
        });
        if (!response.ok) throw new Error(await response.text());
        const result = (await response.json()) as {
          status: GenerationStatus;
          progress: number;
          modelUrl?: string;
        };
        setStatus(result.status);
        setProgress(result.progress);
        if (result.status === "success" && result.modelUrl) {
          setModelUrl(result.modelUrl);
          toast.success("3D model ready");
          return;
        }
        if (result.status === "failed") throw new Error("Tripo could not generate this model");
      }
      throw new Error("Generation timed out. Please try again.");
    } catch (error) {
      setStatus("failed");
      toast.error(error instanceof Error ? error.message : "3D generation failed");
    }
  }

  const busy = status === "queued" || status === "running";
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 bg-canvas lg:grid-cols-[320px_1fr]">
      <aside className="flex flex-col border-b border-border bg-panel p-4 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 font-mono text-xs font-semibold">
          <Box className="text-accent" /> TRIPO MODEL FORGE
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Generate textured 3D assets and modular environment pieces, then inspect them live.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant={prompt === preset.prompt ? "secondary" : "outline"}
              size="sm"
              onClick={() => setPrompt(preset.prompt)}
            >
              {preset.label === "Environment" ? <Map /> : <Box />}
              {preset.label}
            </Button>
          ))}
        </div>
        <label className="mt-5 font-mono text-[9px] tracking-wider text-muted-foreground">
          MODEL BRIEF
        </label>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="mt-2 min-h-32 resize-none rounded-md border border-input bg-background p-3 text-xs leading-5 outline-none focus:border-primary"
          placeholder="Describe the model or map piece…"
        />
        <Button className="mt-3" onClick={generate} disabled={busy || !prompt.trim()}>
          {busy ? <LoaderCircle className="animate-spin" /> : <Wand2 />}
          {busy ? `Generating ${progress}%` : "Generate 3D model"}
        </Button>
        <p className="mt-3 font-mono text-[9px] text-muted-foreground">
          GLB OUTPUT · TEXTURED · WEBGL READY
        </p>
      </aside>
      <section className="relative min-h-80 overflow-hidden">
        {modelUrl ? (
          <>
            <ModelViewer url={modelUrl} />
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md border border-border bg-background/80 px-3 py-2 font-mono text-[9px] backdrop-blur-xl">
              <Rotate3D className="size-3 text-accent" /> DRAG TO ORBIT · SCROLL TO ZOOM
            </div>
            <Button asChild variant="outline" size="sm" className="absolute right-3 top-3">
              <a href={modelUrl} download target="_blank" rel="noreferrer">
                <Download /> Download GLB
              </a>
            </Button>
          </>
        ) : (
          <div className="panel-grid grid h-full min-h-80 place-items-center p-8 text-center">
            <div>
              <Box className="mx-auto size-16 text-primary/50" />
              <h3 className="mt-4 font-mono text-sm font-semibold">3D PREVIEW STAGE</h3>
              <p className="mt-2 max-w-sm text-xs text-muted-foreground">
                Your generated model will appear here with orbit, zoom, lighting, and a scale grid.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}