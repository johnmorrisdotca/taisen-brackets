import type { BracketInput, BracketLayout, Matchup, Team } from "./types.ts";
import { layoutBracket } from "./layout.ts";
import { singleElimination } from "./seeding.ts";
import { fill, voiceOf } from "./locales.ts";

export { JUDO_WEIGHT_CLASSES, judoOutcome, judoSeconds, judoClock } from "./judo-model.ts";
export type { JudoMethod, JudoOutcome, JudoResult, JudoSide } from "./judo-model.ts";

/** How a judo tournament is drawn: `repechage` (the IJF's quarter-final repechage, with its two bronze medal contests), or `direct` (a direct knockout in which both semi-final losers are bronze medallists). */
export type JudoSystem = "repechage" | "direct";

export interface JudoBracketOptions {
  /** Default `repechage` for eight athletes or more, else `direct`. */
  system?: JudoSystem;
  /** The ids of the contests are `${prefix}1-1`, `${prefix}1-2`… (round, then place in the round), `${prefix}rep-1`, `${prefix}bronze-1`. Default "J". */
  prefix?: string;
}

/**
 * The contests of one judo weight category for any number of athletes, seeded in the standard way (the top seeds have the byes when the number is
 * not a power of two). The athlete drawn first is white and the second blue (`Matchup.sides`: first white).
 *
 * With `repechage` (IJF Sport and Organisation Rules, 2.5.2 "Quarter-final Repechage", the system of the Olympic Games): the athletes are in two tables
 * and an elimination produces two finalists. "The athletes defeated in the quarter-final will compete in two (2) repechage contests. The winners of each of
 * these two (2) repechage contests will compete in bronze medal contests against the loser of the semi-final contest of the respective opposite table.
 * The winners (2) of those contests are placed third." The repechage and bronze contests are `stage: "repechage"` and `stage: "bronze"` matchups, fed by
 * the losers of the tree's, and are drawn under it. Needs eight athletes or more. With `direct`, there are no such contests: the two losing semi-finalists are
 * the bronze medallists (`judoPodium`).
 *
 * Double repechage and full repechage (2.5.3 and 2.5.4) are not drawn: their pools are laid out in the rules' Appendix G charts.
 */
export function judoBracket(athletes: readonly Team[], options: JudoBracketOptions = {}): { teams: Team[]; matchups: Matchup[] } {
  const system: JudoSystem = options.system ?? (athletes.length >= 8 ? "repechage" : "direct");
  if (system !== "repechage" && system !== "direct") throw new RangeError(`taisen-brackets: a judo system is "repechage" or "direct", not ${JSON.stringify(system)}`);
  if (athletes.length < 4) throw new RangeError("taisen-brackets: a judo bracket needs four athletes or more (the two losing semi-finalists are bronze medallists)");
  if (system === "repechage" && athletes.length < 8) throw new RangeError("taisen-brackets: a quarter-final repechage needs eight athletes or more; use system: \"direct\" for fewer");
  const prefix = options.prefix ?? "J";
  const made = singleElimination(athletes, { prefix });
  if (system === "direct") return made;
  const rounds = Math.max(...made.matchups.map((m) => m.round ?? 0));
  const semis = made.matchups.filter((m) => m.round === rounds - 1);
  const quarters = (semi: Matchup): [string, string] => {
    const [a, b] = semi.feeds ?? [];
    if (typeof a !== "string" || typeof b !== "string") throw new Error("taisen-brackets: a semi-final of a repechage bracket needs two quarter-finals feeding it");
    return [a, b];
  };
  const loser = (tie: string) => ({ tie, result: "loser" as const });
  const extra: Matchup[] = [];
  semis.forEach((semi, k) => {
    const [q1, q2] = quarters(semi);
    extra.push({ id: `${prefix}rep-${k + 1}`, sides: [null, null], feeds: [loser(q1), loser(q2)], stage: "repechage" });
  });
  semis.forEach((semi, k) => {
    // The repechage winner of one table meets the semi-final loser of the other.
    const other = semis[1 - k];
    extra.push({ id: `${prefix}bronze-${k + 1}`, sides: [null, null], feeds: [`${prefix}rep-${k + 1}`, loser(other.id!)], stage: "bronze" });
  });
  return { teams: made.teams, matchups: [...made.matchups, ...extra] };
}

/** The medallists of a judo tournament, as far as it has been fought. */
export interface JudoPodium {
  gold: Team | null;
  silver: Team | null;
  /** The two bronze medallists: the winners of the bronze medal contests, or the losing semi-finalists of a direct knockout. Only those decided. */
  bronze: Team[];
}

/** The gold, silver and two bronze medals of a bracket (matchups, input or layout), from the final, the bronze medal contests or the semi-finals. */
export function judoPodium(input: BracketLayout | readonly Matchup[] | BracketInput): JudoPodium {
  const layout: BracketLayout = "ties" in input && "sides" in input ? (input as BracketLayout) : layoutBracket(input as readonly Matchup[] | BracketInput);
  const fin = layout.finalIndex === null ? null : layout.ties[layout.finalIndex];
  const gold = fin && fin.winner !== null ? fin.sides[fin.winner] : null;
  const silver = fin && fin.winner !== null ? fin.sides[(1 - fin.winner) as 0 | 1] : null;
  const bronzeTies = layout.ties.filter((t) => t.stage === "bronze");
  let bronze: Team[];
  if (bronzeTies.length) bronze = bronzeTies.flatMap((t) => (t.winner === null || !t.sides[t.winner] ? [] : [t.sides[t.winner]!]));
  else {
    const semis = layout.finalIndex === null ? [] : layout.ties.filter((t) => t.round === layout.rounds - 1 && t.stage === undefined && !t.third && layout.place[t.index] !== "o");
    bronze = semis.flatMap((t) => (t.winner === null || !t.sides[(1 - t.winner) as 0 | 1] ? [] : [t.sides[(1 - t.winner) as 0 | 1]!]));
  }
  return { gold, silver, bronze };
}

export interface JudoCategory {
  sex: "men" | "women";
  /** `"-66"` (up to and including 66 kg), `"+100"` (over 100 kg): see `JUDO_WEIGHT_CLASSES`. */
  weight: string;
}

/** A weight category as a heading in a language: "Men -66 kg", "Women +78 kg". */
export function judoCategoryLabel(category: JudoCategory, locale?: string): string {
  if (category.sex !== "men" && category.sex !== "women") throw new RangeError(`taisen-brackets: a judo category's sex is "men" or "women", not ${JSON.stringify(category.sex)}`);
  if (!/^[-+]\d{2,3}$/.test(category.weight)) throw new RangeError(`taisen-brackets: a judo weight is "-66" or "+100", not ${JSON.stringify(category.weight)}`);
  const w = voiceOf({ locale }).words;
  return fill(category.weight.startsWith("+") ? w.judoWeightOver : w.judoWeightClass, { sex: category.sex === "men" ? w.judoMen : w.judoWomen, w: category.weight.slice(1) });
}
