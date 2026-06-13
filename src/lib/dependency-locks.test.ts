import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("deployment dependency locks", () => {
  it("keeps the patched TanStack Start runtime aligned across npm and Bun", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
    ) as {
      dependencies: Record<string, string>;
    };
    const packageLock = readFileSync(resolve(process.cwd(), "package-lock.json"), "utf8");
    const bunLock = readFileSync(resolve(process.cwd(), "bun.lock"), "utf8");
    const version = packageJson.dependencies["@tanstack/react-start"];

    expect(version).toBe("1.168.25");
    expect(packageLock).toContain('"node_modules/@tanstack/react-start": {');
    expect(packageLock).toContain('"version": "1.168.25"');
    expect(bunLock).toContain('"@tanstack/react-start": ["@tanstack/react-start@1.168.25"');
  });
});
