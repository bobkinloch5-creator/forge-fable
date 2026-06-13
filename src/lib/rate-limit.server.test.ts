import { checkRateLimit, resetRateLimitsForTests } from "@/lib/rate-limit.server";
import { beforeEach, describe, expect, it } from "vitest";

describe("rate limiter", () => {
  beforeEach(resetRateLimitsForTests);

  it("blocks requests beyond the configured limit", () => {
    expect(checkRateLimit("user", 2, 60_000, 1_000).allowed).toBe(true);
    expect(checkRateLimit("user", 2, 60_000, 1_001).allowed).toBe(true);
    const blocked = checkRateLimit("user", 2, 60_000, 1_002);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  it("starts a fresh bucket after the window expires", () => {
    checkRateLimit("user", 1, 1_000, 5_000);
    expect(checkRateLimit("user", 1, 1_000, 5_999).allowed).toBe(false);
    expect(checkRateLimit("user", 1, 1_000, 6_000).allowed).toBe(true);
  });

  it("separates users and operations", () => {
    checkRateLimit("chat:user-a", 1, 60_000, 1_000);
    expect(checkRateLimit("chat:user-a", 1, 60_000, 1_001).allowed).toBe(false);
    expect(checkRateLimit("chat:user-b", 1, 60_000, 1_001).allowed).toBe(true);
  });
});
