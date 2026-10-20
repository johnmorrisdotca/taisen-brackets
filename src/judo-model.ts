/**
 * Judo results: the scores of one contest and what they come to under the IJF Sport and Organisation Rules (Refereeing Rules, version
 * 21 January 2026, for the Olympic cycle to Los Angeles 2028). Pure and sport-specific; nothing here draws. The rules this follows, by
 * article, are in docs/judo.md.
 *
 * - Article 7 and 15: osaekomi of 20 seconds is ippon, 10 to 19 seconds waza-ari, 5 to 9 seconds yuko.
 * - Article 15: "Yuko scores are counted (1, 2, 3, etc.) but they do not add up to waza-ari."
 * - Article 16: a second waza-ari is waza-ari-awasete-ippon, ippon.
 * - Article 18: "Two shido can be awarded and the third will be hansoku-make"; "A contest cannot be decided by single or accumulated shido, until hansoku-make is reached."
 * - Article 13: a level contest at the end of regular time (4 minutes) goes to golden score, which has no time limit and ends at the first score or hansoku-make.
 */

/** How a contest was won. `"score"` is a decision on the technical scores (the waza-ari, then the yuko, counted). */
export type JudoMethod = "ippon" | "waza-ari-awasete-ippon" | "score" | "hansoku-make" | "fusen-gachi" | "kiken-gachi";

/** What one side scored in a contest. Anything left out is none. */
export interface JudoSide {
  /** Ippon: the contest ends. */
  ippon?: boolean;
  /** Waza-ari, 0 to 2; a second one is waza-ari-awasete-ippon. */
  wazaAri?: number;
  /** Yuko: counted, never added up to a waza-ari. */
  yuko?: number;
  /** Shido (the penalties), 0 to 3; the third is hansoku-make (indirect). */
  shido?: number;
}

/** The result of one judo contest, the sides in the order of the matchup's `sides`: the first is white, the second blue. */
export interface JudoResult {
  sides: readonly [JudoSide, JudoSide];
  /** How it was won. Left out, it is worked out from the scores; fusen-gachi and kiken-gachi (no score can say so) need the matchup's `winner`. */
  method?: JudoMethod;
  /** The side (0 or 1) that was given a direct hansoku-make (a grave infringement): the other side wins by ippon. */
  hansokuMake?: 0 | 1;
  /** The contest went on to golden score, and the scores are the ones at its end. */
  goldenScore?: boolean;
  /** The contest time: seconds (`222`) or `"3:42"`. Regular time is 4 minutes; golden score runs past it. */
  time?: number | string;
}

/** A result checked and worked out. */
export interface JudoOutcome {
  /** 0 or 1, the side that won; `null` while nothing has decided it (level scores: golden score is next). */
  winner: 0 | 1 | null;
  /** How it was won, or `null` while undecided. */
  method: JudoMethod | null;
  goldenScore: boolean;
  /** The contest time in seconds, or `null`. */
  seconds: number | null;
  /** The two sides with every count filled in. */
  sides: readonly [Required<JudoSide>, Required<JudoSide>];
  /** The value on the scoreboard (Articles 4 and 15: ippon 100, waza-ari 10, yuko 1; two waza-ari are ippon). */
  points: readonly [number, number];
  /** Both sides were given the third shido: the contest is recorded 0-0 and nobody wins (Article 18.3.1). */
  doubleHansokuMake: boolean;
}

/** The IJF's senior weight classes in kilograms, the lightest first: a number is "up to and including", a text starting `+` is "over". */
export const JUDO_WEIGHT_CLASSES: Readonly<Record<"men" | "women", readonly string[]>> = Object.freeze({
  men: Object.freeze(["-60", "-66", "-73", "-81", "-90", "-100", "+100"]),
  women: Object.freeze(["-48", "-52", "-57", "-63", "-70", "-78", "+78"]),
});

const whole = (what: string, n: unknown, max: number): number => {
  const v = n === undefined ? 0 : n;
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > max) throw new RangeError(`taisen-brackets: ${what} is a whole number from 0 to ${max}, not ${JSON.stringify(v)}`);
  return v;
};

function filled(side: JudoSide, k: 0 | 1): Required<JudoSide> {
  const who = k === 0 ? "the white side's" : "the blue side's";
  return {
    ippon: side.ippon === true,
    wazaAri: whole(`${who} waza-ari`, side.wazaAri, 2),
    yuko: whole(`${who} yuko`, side.yuko, 99),
    shido: whole(`${who} shido`, side.shido, 3),
  };
}

/** A time as seconds: a number, or `"m:ss"`. */
export function judoSeconds(time: number | string | undefined): number | null {
  if (time === undefined) return null;
  if (typeof time === "number") {
    if (!Number.isFinite(time) || time < 0) throw new RangeError(`taisen-brackets: a judo contest time is seconds from 0, not ${time}`);
    return Math.round(time);
  }
  const m = /^(\d{1,3}):([0-5]\d)$/.exec(time.trim());
  if (!m) throw new RangeError(`taisen-brackets: a judo contest time is seconds or "m:ss" ("3:42"), not ${JSON.stringify(time)}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Seconds as `m:ss`. */
export const judoClock = (seconds: number): string => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

const scoreboard = (s: Required<JudoSide>): number => (s.ippon || s.wazaAri >= 2 ? 100 : s.wazaAri * 10 + s.yuko);

/**
 * Checks a result against the rules and works out who won and how. `winner` is the winner the matchup names (needed for fusen-gachi and
 * kiken-gachi, which no score can show). Throws a `RangeError` for a count out of range, two ippon, a method the scores contradict, or a
 * default with no winner.
 */
export function judoOutcome(result: JudoResult, winner: 0 | 1 | null = null): JudoOutcome {
  const sides = [filled(result.sides[0], 0), filled(result.sides[1], 1)] as const;
  const seconds = judoSeconds(result.time);
  const points = [scoreboard(sides[0]), scoreboard(sides[1])] as const;
  const golden = result.goldenScore === true;
  const out = (w: 0 | 1 | null, method: JudoMethod | null, double = false): JudoOutcome => ({ winner: w, method, goldenScore: golden, seconds, sides, points, doubleHansokuMake: double });
  const other = (k: 0 | 1): 0 | 1 => (k === 0 ? 1 : 0);
  if (sides[0].ippon && sides[1].ippon) throw new RangeError("taisen-brackets: both sides of a judo contest cannot score ippon");
  if (sides[0].wazaAri === 2 && sides[1].wazaAri === 2) throw new RangeError("taisen-brackets: both sides of a judo contest cannot score waza-ari-awasete-ippon");
  const given = result.method;
  const agree = (derived: JudoOutcome): JudoOutcome => {
    if (given !== undefined && derived.method !== given) throw new RangeError(`taisen-brackets: the judo method ${JSON.stringify(given)} does not fit the scores, which make ${JSON.stringify(derived.method)}`);
    return derived;
  };

  if (given === "fusen-gachi" || given === "kiken-gachi") {
    if (winner === null) throw new RangeError(`taisen-brackets: a judo contest won by ${given} needs the matchup's winner`);
    return out(winner, given);
  }
  if (result.hansokuMake !== undefined) {
    if (result.hansokuMake !== 0 && result.hansokuMake !== 1) throw new RangeError("taisen-brackets: hansokuMake is 0 or 1, the side that was penalised");
    return agree(out(other(result.hansokuMake), "hansoku-make"));
  }
  if (sides[0].shido >= 3 && sides[1].shido >= 3) return agree(out(null, "hansoku-make", true));
  for (const k of [0, 1] as const) if (sides[k].shido >= 3) return agree(out(other(k), "hansoku-make"));
  for (const k of [0, 1] as const) {
    if (sides[k].ippon) return agree(out(k, "ippon"));
    if (sides[k].wazaAri >= 2) return agree(out(k, "waza-ari-awasete-ippon"));
  }
  const by = (a: number, b: number): 0 | 1 | null => (a > b ? 0 : b > a ? 1 : null);
  const decided = by(sides[0].wazaAri, sides[1].wazaAri) ?? by(sides[0].yuko, sides[1].yuko);
  if (decided !== null) return agree(out(decided, "score"));
  if (given !== undefined) throw new RangeError(`taisen-brackets: the judo method ${JSON.stringify(given)} does not fit scores that are level`);
  // Level: nothing has decided it, though the matchup may name a winner (a contest recorded with no scores).
  return out(null, null);
}

/** Whether a result has any score or penalty at all (a contest still to be fought has none). */
export const judoHasScore = (o: JudoOutcome): boolean => o.sides.some((s) => s.ippon || s.wazaAri > 0 || s.yuko > 0 || s.shido > 0);
