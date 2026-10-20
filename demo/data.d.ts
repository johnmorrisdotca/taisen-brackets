import type * as Taisen from "../src/index.ts";
interface Example { teams: Taisen.Team[]; matchups: Taisen.Matchup[] }
export function build(T: { matchupsFromGames: typeof Taisen.matchupsFromGames; judoBracket: typeof Taisen.judoBracket; advanceWinners: typeof Taisen.advanceWinners }, flags?: Record<string, string>): { judo66: Example; nhl2024: Example; nba2024: Example; mlb2022: Example; nfl2024: Example; cfl2024: Example; mls2024: Example; nhl1984: Example; wc2022: Example; wc2026: Example; wc1938: Example; twoLegs: Example; nba2024playin: Example; cupGroups: Example; softballGroups: Example };
export const CODE: Record<string, string>;
