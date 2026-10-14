import type { Words } from "./types.ts";

/** The English words of a drawing and a table. Pass `words` to replace any of them. */
export const WORDS: Readonly<Words> = Object.freeze({
  tbd: "TBD",
  bye: "bye",
  champion: "Champion",
  thirdPlace: "Third place",
  other: "Other ties",
  final: "Final",
  aet: "a.e.t.",
  pens: "pens",
  aggregate: "agg.",
  replay: "replay",
  inGames: "in {n}",
  bestOf: "best of {n}",
  round: "Round {n}",
  winner: "Winner",
  versus: "v",
  columnRound: "Round",
  columnTie: "Tie",
  columnResult: "Result",
  columnNote: "Note",
  summary: "{n} teams, {r} rounds",
  title: "Knockout bracket",
});

/** The words with any replacements applied. */
export function wordsWith(over?: Partial<Words>): Words {
  return { ...WORDS, ...over };
}

/** Fills `{n}`-style holes in a phrase. */
export function fill(phrase: string, values: Record<string, string | number>): string {
  return phrase.replace(/\{(\w+)\}/g, (hole, key: string) => (key in values ? String(values[key]) : hole));
}
