import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function migration(name: string) {
  return readFileSync(resolve(process.cwd(), "supabase", "migrations", name), "utf8");
}

describe("security migrations", () => {
  it("prevents creators from changing profile entitlements directly", () => {
    const sql = migration("20260613125925_lock_profile_entitlements_and_playtest_results.sql");
    expect(sql).toMatch(/REVOKE UPDATE ON TABLE public\.profiles FROM anon, authenticated/i);
    expect(sql).toMatch(/DROP POLICY IF EXISTS "Creators update own safe profile fields"/i);
  });

  it("keeps playtest result writes restricted to trusted services", () => {
    const sql = migration("20260613125925_lock_profile_entitlements_and_playtest_results.sql");
    expect(sql).toMatch(
      /REVOKE ALL PRIVILEGES ON TABLE public\.playtest_results FROM anon, authenticated/i,
    );
    expect(sql).toMatch(/GRANT SELECT ON TABLE public\.playtest_results TO authenticated/i);
  });

  it("uses idempotent server-only credit operations", () => {
    const sql = migration("20260613125957_add_idempotent_credit_transactions.sql");
    expect(sql).toMatch(/consume_creator_credits_once/i);
    expect(sql).toMatch(/refund_creator_credits_once/i);
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.consume_creator_credits_once\(uuid, integer, text\)\s+FROM PUBLIC, anon, authenticated/is,
    );
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.refund_creator_credits_once\(uuid, text\)\s+FROM PUBLIC, anon, authenticated/is,
    );
  });

  it("normalizes legacy player modes before enforcing the canonical values", () => {
    const sql = migration("20260613132200_normalize_game_player_mode.sql");
    expect(sql).toMatch(/DROP CONSTRAINT IF EXISTS games_player_mode_check/i);
    expect(sql).toMatch(/SET player_mode = CASE lower\(trim\(player_mode\)\)/i);
    expect(sql).toMatch(/CHECK \(player_mode IN \('single', 'multiplayer'\)\)/i);
  });
});
