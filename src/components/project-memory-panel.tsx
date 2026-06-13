import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getGameMemory, saveGameMemory } from "@/lib/game-memory.functions";
import { useServerFn } from "@tanstack/react-start";
import { Brain, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Memory = Awaited<ReturnType<ReturnType<typeof useServerFn<typeof getGameMemory>>>>[number];
const categories = [
  "vision",
  "genre",
  "story",
  "character",
  "mechanic",
  "map",
  "art_style",
  "control",
  "economy",
  "multiplayer",
  "decision",
  "constraint",
] as const;

export function ProjectMemoryPanel({ gameId }: { gameId: string }) {
  const loadMemory = useServerFn(getGameMemory);
  const saveMemory = useServerFn(saveGameMemory);
  const [memory, setMemory] = useState<Memory[]>([]);
  const [category, setCategory] = useState<(typeof categories)[number]>("decision");
  const [memoryKey, setMemoryKey] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(
    async () => setMemory(await loadMemory({ data: { gameId } })),
    [gameId, loadMemory],
  );
  useEffect(() => {
    void refresh().catch((error) => toast.error(error.message));
  }, [refresh]);
  async function save() {
    if (!memoryKey.trim() || !content.trim()) return;
    setBusy(true);
    try {
      await saveMemory({ data: { gameId, category, memoryKey, content, importance: 70 } });
      setMemoryKey("");
      setContent("");
      await refresh();
      toast.success("Project memory saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Memory could not be saved");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Brain />
        </span>
        <div>
          <h2 className="text-xl font-semibold">Project memory</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Durable source of truth used across every build session.
          </p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid content-start gap-2 sm:grid-cols-2">
          {memory.map((item) => (
            <article key={item.id} className="rounded-xl border border-border bg-panel/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="font-mono text-[9px] uppercase">
                  {item.category.replace("_", " ")}
                </Badge>
                <span className="font-mono text-[9px] text-muted-foreground">
                  P{item.importance}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-medium">{item.memory_key}</h3>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
                {item.content}
              </p>
            </article>
          ))}
          {memory.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No structured memories yet. Add the first durable project decision.
            </div>
          )}
        </div>
        <aside className="h-fit rounded-xl border border-border bg-canvas/60 p-4 lg:sticky lg:top-0">
          <h3 className="text-sm font-semibold">Add project fact</h3>
          <div className="mt-4 space-y-3">
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as typeof category)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={memoryKey}
              onChange={(event) => setMemoryKey(event.target.value)}
              placeholder="Memory title"
              maxLength={120}
            />
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="The fact or decision the AI must preserve…"
              maxLength={32000}
              className="min-h-36"
            />
            <Button
              onClick={save}
              disabled={busy || !memoryKey.trim() || !content.trim()}
              className="w-full"
            >
              <Plus />
              {busy ? "Saving…" : "Save memory"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
