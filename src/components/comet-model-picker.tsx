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
import { supabase } from "@/integrations/supabase/client";
import { builtInAiModels, getAiModelCreditCost, type AiModelOption } from "@/lib/ai-models";
import { Check, ChevronsUpDown, LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!data.session) throw new Error("Sign in required");
        return fetch("/api/comet-models", {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
      })
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

  const allModels = useMemo(() => [...builtInAiModels, ...cometModels], [cometModels]);
  const selected = allModels.find((model) => model.id === value) ?? builtInAiModels[1];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-label={`AI model: ${selected.name}, ${getAiModelCreditCost(selected.id)} credits`}
          className="h-8 max-w-52 justify-between gap-2 px-2 text-xs"
        >
          {loading ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
          <span className="truncate">
            {selected.name} · {getAiModelCreditCost(selected.id)} cr
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-[min(92vw,430px)] p-0">
        <Command>
          <CommandInput placeholder="Search model or provider…" />
          <CommandList className="max-h-[min(60vh,420px)]">
            <CommandEmpty>No matching model found.</CommandEmpty>
            <CommandGroup heading="FableForge recommended">
              {builtInAiModels.map((model) => (
                <CommandItem
                  key={model.id}
                  value={`${model.name} ${model.provider}`}
                  onSelect={() => {
                    onValueChange(model.id);
                    setOpen(false);
                  }}
                >
                  <Check className={value === model.id ? "opacity-100" : "opacity-0"} />
                  <span className="min-w-0">
                    <span className="block">{model.name}</span>
                    <span className="block text-[10px] text-muted-foreground">
                      {model.creditCost} credits · {model.speed} · {model.access}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      {model.description}
                    </span>
                  </span>
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
                      8 credits · Pro · {model.provider} · {model.id}
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
