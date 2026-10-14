import type { BracketLayout, DrawOptions } from "./types.ts";
import { fill, type Voice } from "./locales.ts";

/** The name of a round that has `remaining` teams left in it, counting from the final: Final, Semi-finals, Quarter-finals, Round of 16… */
export function roundName(remaining: number): string {
  if (remaining <= 2) return "Final";
  if (remaining === 4) return "Semi-finals";
  if (remaining === 8) return "Quarter-finals";
  return `Round of ${remaining}`;
}

/** The generic names of `count` rounds, first round first: `roundNamesFor(3)` is Quarter-finals, Semi-finals, Final. */
export function roundNamesFor(count: number): string[] {
  return Array.from({ length: count }, (_, i) => roundName(2 ** (count - i)));
}

/** The name of round `round` (1 is the first) of a layout, from the names given (which may be only the last rounds) or the generic ones. */
export function roundLabel(layout: BracketLayout, round: number, names: DrawOptions["roundNames"], v: Voice): string {
  const list = names ? ("rounds" in names ? names.rounds.map((r) => r.name) : names) : null;
  const from = layout.rounds - round; // 0 for the final
  const named = list?.[list.length - 1 - from];
  if (named) return v.round(named);
  const generic = 2 ** (from + 1);
  const remaining = layout.rounds > 7 ? 0 : generic;
  return remaining ? v.round(roundName(remaining)) : fill(v.words.round, { n: v.number(round) });
}
