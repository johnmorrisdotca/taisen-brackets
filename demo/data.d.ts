import type * as Taisen from "../src/index.ts";
interface Example { teams: Taisen.Team[]; matchups: Taisen.Matchup[] }
export function build(T: { matchupsFromGames: typeof Taisen.matchupsFromGames }, flags?: Record<string, string>): { nhl2024: Example; wc2022: Example; wc2026: Example; mlb2022: Example; wc1938: Example; twoLegs: Example };
