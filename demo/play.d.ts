import type { Matchup, Team } from "../src/index.ts";
export function playOut(T: { advanceWinners(m: readonly Matchup[]): Matchup[] }, matchups: readonly Matchup[], teams: readonly Team[]): Matchup[];
export function fillBracket<D extends { matchups: readonly Matchup[]; teams: readonly Team[] }>(T: { layoutBracket(d: D): { ties: readonly { id: string; winner: number | null; sides: readonly unknown[] }[] }; advanceWinners(m: readonly Matchup[]): Matchup[] }, data: D, played: number): { total: number; data: D };
