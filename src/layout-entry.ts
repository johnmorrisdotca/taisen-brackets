export * from "./types.ts";
export { layoutBracket } from "./layout.ts";
export { collectTeams, resolveMatchup, describeTie, noteParts, noteLong } from "./matchup.ts";
export { roundName, roundNamesFor, roundLabel } from "./rounds.ts";
export { standardSeeds, singleElimination, advanceWinners, matchupsFromGames } from "./seeding.ts";
export type { SingleEliminationOptions, PlayedGame, GamesOptions } from "./seeding.ts";
export { WORDS, LOCALES, LOCALE_CODES, defineLocale, localeOf, voiceOf, countryName } from "./locales.ts";
export type { Voice } from "./locales.ts";
