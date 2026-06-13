export type AiModelOption = {
  id: string;
  name: string;
  provider: string;
  description?: string;
  creditCost?: number;
  speed?: string;
  access?: "Free" | "Pro";
};

export const builtInAiModels: AiModelOption[] = [
  {
    id: "lovable:fast",
    name: "Fable 5 Fast",
    provider: "FableForge",
    description: "Fast iteration for small fixes, ideas, and focused code changes.",
    creditCost: 2,
    speed: "Fastest",
    access: "Free",
  },
  {
    id: "lovable:balanced",
    name: "Fable 5",
    provider: "FableForge",
    description: "Balanced reasoning and speed for most project work.",
    creditCost: 4,
    speed: "Balanced",
    access: "Free",
  },
  {
    id: "lovable:pro",
    name: "Fable 5 Pro",
    provider: "FableForge",
    description: "Deep reasoning for architecture, complex systems, and difficult debugging.",
    creditCost: 8,
    speed: "Thorough",
    access: "Pro",
  },
];

export function getAiModelCreditCost(modelId: string) {
  return builtInAiModels.find((model) => model.id === modelId)?.creditCost ?? 8;
}

export function isPremiumAiModel(modelId: string) {
  return modelId === "lovable:pro" || !modelId.startsWith("lovable:");
}
