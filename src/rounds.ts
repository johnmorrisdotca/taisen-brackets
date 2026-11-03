import type { BracketLayout, DrawOptions } from "./types.ts";
import { fill, type Voice } from "./locales.ts";

/**
 * The name of a round that has `remaining` teams left in it, counting from the final: Final, Semi-finals, Quarter-finals, Round of 16…
 *
 * @param remaining - How many teams are left in the round: 2 is the final, 4 the semi-finals, 8 the quarter-finals.
 * @returns The round's English name.
 * @example
 * ```ts
 * import { roundName } from "@johnmorrisdotca/taisen-brackets";
 *
 * console.log([2, 4, 8, 16].map((teams) => roundName(teams)));
 * ```
 */
export function roundName(remaining: number): string {
  if (remaining <= 2) return "Final";
  if (remaining === 4) return "Semi-finals";
  if (remaining === 8) return "Quarter-finals";
  return `Round of ${remaining}`;
}

/**
 * The generic names of `count` rounds, first round first: `roundNamesFor(3)` is Quarter-finals, Semi-finals, Final.
 *
 * @param count - How many rounds the bracket has.
 * @returns The names, in order.
 * @example
 * ```ts
 * import { roundNamesFor } from "@johnmorrisdotca/taisen-brackets";
 *
 * console.log(roundNamesFor(3));
 * ```
 */
export function roundNamesFor(count: number): string[] {
  return Array.from({ length: count }, (_, i) => roundName(2 ** (count - i)));
}

/**
 * The name of round `round` (1 is the first) of a layout, from the names given (which may be only the last rounds) or the generic ones.
 *
 * @param layout - The bracket's layout.
 * @param round - The round, counting from 1 at the first round.
 * @param names - The `roundNames` option of the drawing, or `undefined`.
 * @param v - The voice of a language, from `voiceOf`.
 * @returns The label to write.
 * @example
 * ```ts
 * import { layoutBracket, roundLabel, voiceOf } from "@johnmorrisdotca/taisen-brackets";
 *
 * const layout = layoutBracket([{ sides: ["Aurora", "Harbour"], score: [2, 1] }, { sides: ["Cascade", "Delta"], score: [0, 1] }, { sides: ["Aurora", "Delta"], score: [3, 1] }]);
 * console.log(roundLabel(layout, 1, undefined, voiceOf({ locale: "fr" })));
 * ```
 */
export function roundLabel(layout: BracketLayout, round: number, names: DrawOptions["roundNames"], v: Voice): string {
  const list = names ? ("rounds" in names ? names.rounds.map((r) => r.name) : names) : null;
  const from = layout.rounds - round; // 0 for the final
  const named = list?.[list.length - 1 - from];
  if (named) return v.round(named);
  const generic = 2 ** (from + 1);
  const remaining = layout.rounds > 7 ? 0 : generic;
  return remaining ? v.round(roundName(remaining)) : fill(v.words.round, { n: v.number(round) });
}
