import { z } from "zod";

const COMET_MODELS_URL = "https://api.cometapi.com/api/models";
const CACHE_TTL_MS = 15 * 60 * 1000;

const CatalogModel = z.object({
  id: z.string(),
  name: z.string().optional(),
  provider: z.string().optional(),
  model_type: z.string().optional(),
  description: z.string().optional(),
  endpoints: z.string().optional(),
  matched_models: z.array(z.string()).optional(),
  upcoming: z.boolean().optional(),
});

const CatalogResponse = z.object({
  data: z.array(CatalogModel),
  total: z.number().optional(),
});

export type CometChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  familyId: string;
};

let cache: { expiresAt: number; models: CometChatModel[]; total: number } | undefined;

function supportsOpenAiChat(endpoints?: string) {
  if (!endpoints) return false;
  try {
    return "openai-chat" in (JSON.parse(endpoints) as Record<string, unknown>);
  } catch {
    return false;
  }
}

export async function getCometChatModels() {
  if (cache && cache.expiresAt > Date.now()) return cache;
  const response = await fetch(COMET_MODELS_URL, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`CometAPI catalog failed (${response.status})`);
  const catalog = CatalogResponse.parse(await response.json());
  const models = catalog.data
    .filter((model) => !model.upcoming && supportsOpenAiChat(model.endpoints))
    .flatMap((model) => {
      const aliases = model.matched_models?.length ? model.matched_models : [model.id];
      return aliases.map((id) => ({
        id,
        name: aliases.length > 1 ? `${model.name ?? model.id} · ${id}` : (model.name ?? model.id),
        provider: model.provider ?? "CometAPI",
        description: model.description ?? "Available through CometAPI",
        familyId: model.id,
      }));
    })
    .filter((model, index, list) => list.findIndex((item) => item.id === model.id) === index)
    .sort((a, b) => a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name));
  cache = { expiresAt: Date.now() + CACHE_TTL_MS, models, total: catalog.total ?? catalog.data.length };
  return cache;
}