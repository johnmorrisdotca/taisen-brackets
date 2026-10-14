import type { Matchup, Team } from "../src/index.ts";
export function playOut(T: { advanceWinners(m: readonly Matchup[]): Matchup[] }, matchups: readonly Matchup[], teams: readonly Team[]): Matchup[];
