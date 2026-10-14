// A tiny snapshot: the value is kept as JSON in test/__snapshots__/<file>.json under its name. The first run writes it, a later run compares, and
// `UPDATE_SNAPSHOTS=1 pnpm test` rewrites it after a change that is meant.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";

export function matchSnapshot(file: string, name: string, value: unknown): void {
  const path = fileURLToPath(new URL(`./__snapshots__/${file}.json`, import.meta.url));
  const all: Record<string, unknown> = existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>) : {};
  if (process.env.UPDATE_SNAPSHOTS === "1" || !(name in all)) {
    all[name] = value;
    mkdirSync(fileURLToPath(new URL("./__snapshots__/", import.meta.url)), { recursive: true });
    writeFileSync(path, `${JSON.stringify(Object.fromEntries(Object.entries(all).sort(([a], [b]) => (a < b ? -1 : 1))), null, 2)}\n`);
    return;
  }
  assert.deepEqual(value, all[name], `snapshot "${name}" changed: run UPDATE_SNAPSHOTS=1 pnpm test if that is meant`);
}
