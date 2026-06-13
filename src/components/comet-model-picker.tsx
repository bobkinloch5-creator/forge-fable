import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type AiModelOption = {
  id: string;
  name: string;
  provider: string;
  description?: string;
};

const builtInModels: AiModelOption[] = [
  { id: "lovable:fast", name: "Fable 5 Fast", provider: "FableForge" },
  { id: "lovable:balanced", name: "Fable 5", provider: "FableForge" },
  { id: "lovable:pro", name: "Fable 5 Pro", provider: "FableForge" },
];

export function CometModelPicker({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [cometModels, setCometModels] = useState<AiModelOption[]>([]);
  const [catalogTotal, setCatalogTotal] = useState<number>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/comet-models", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        return response.json() as Promise<{ models: AiModelOption[]; total: number }>;
      })
      .then((catalog) => {
        setCometModels(catalog.models);
        setCatalogTotal(catalog.total);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCometModels([]);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const allModels = useMemo(() => [...builtInModels, ...cometModels], [cometModels]);
  const selected = allModels.find((model) => model.id === value) ?? builtInModels[1];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className="h-8 max-w-52 justify-between gap-2 px-2 text-xs"
        >
          {loading ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
          <span className="truncate">{selected.name}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-[min(92vw,430px)] p-0">
        <Command>
          <CommandInput placeholder="Search model or provider…" />
          <CommandList className="max-h-[min(60vh,420px)]">
            <CommandEmpty>No matching model found.</CommandEmpty>
            <CommandGroup heading="FableForge recommended">
              {builtInModels.map((model) => (
                <CommandItem
                  key={model.id}
                  value={`${model.name} ${model.provider}`}
                  onSelect={() => {
                    onValueChange(model.id);
                    setOpen(false);
                  }}
                >
                  <Check className={value === model.id ? "opacity-100" : "opacity-0"} />
                  <span>{model.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup
              heading={`CometAPI · ${cometModels.length} chat routes${catalogTotal ? ` from ${catalogTotal} live model families` : ""}`}
            >
              {cometModels.map((model) => (
                <CommandItem
                  key={model.id}
                  value={`${model.name} ${model.id} ${model.provider}`}
                  onSelect={() => {
                    onValueChange(model.id);
                    setOpen(false);
                  }}
                  className="items-start py-2"
                >
                  <Check
                    className={value === model.id ? "mt-0.5 opacity-100" : "mt-0.5 opacity-0"}
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{model.name}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {model.provider} · {model.id}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
