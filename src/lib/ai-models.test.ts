import { builtInAiModels, getAiModelCreditCost, isPremiumAiModel } from "@/lib/ai-models";
import { describe, expect, it } from "vitest";

describe("AI model entitlements", () => {
  it("keeps advertised costs aligned with billing", () => {
    expect(getAiModelCreditCost("lovable:fast")).toBe(2);
    expect(getAiModelCreditCost("lovable:balanced")).toBe(4);
    expect(getAiModelCreditCost("lovable:pro")).toBe(8);
    expect(getAiModelCreditCost("provider/external-model")).toBe(8);
  });

  it("requires paid access for pro and external models", () => {
    expect(isPremiumAiModel("lovable:fast")).toBe(false);
    expect(isPremiumAiModel("lovable:balanced")).toBe(false);
    expect(isPremiumAiModel("lovable:pro")).toBe(true);
    expect(isPremiumAiModel("provider/external-model")).toBe(true);
  });

  it("provides complete guidance for built-in models", () => {
    expect(
      builtInAiModels.every(
        (model) => model.description && model.creditCost && model.speed && model.access,
      ),
    ).toBe(true);
  });
});
