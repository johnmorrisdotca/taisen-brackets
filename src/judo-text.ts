import type { JudoMethod, JudoOutcome, JudoSide } from "./judo-model.ts";
import { judoClock } from "./judo-model.ts";
import type { Tie } from "./types.ts";
import { fill, type Voice } from "./locales.ts";

type Filled = Required<JudoSide>;

/** A side's score as the box writes it: `I` for ippon, `W` a waza-ari (`W2` two), `Y` a yuko (`Y3` three), "0" for none. The marks are the language's (`judoIppon`, `judoWazaAri`, `judoYuko`). */
export function judoMark(side: Filled, v: Voice): string {
  const w = v.words;
  if (side.ippon) return w.judoIppon;
  const parts: string[] = [];
  if (side.wazaAri > 0) parts.push(w.judoWazaAri + (side.wazaAri > 1 ? v.number(side.wazaAri) : ""));
  if (side.yuko > 0) parts.push(w.judoYuko + (side.yuko > 1 ? v.number(side.yuko) : ""));
  return parts.length ? parts.join(" ") : v.number(0);
}

/** A side's score in words, for a sentence: "ippon", "waza-ari yuko", "2 waza-ari 3 yuko", "0". */
export function judoSideLong(side: Filled, v: Voice): string {
  const w = v.words;
  if (side.ippon) return w.judoIpponLong;
  const parts: string[] = [];
  if (side.wazaAri > 0) parts.push(side.wazaAri > 1 ? `${v.number(side.wazaAri)} ${w.judoWazaAriLong}` : w.judoWazaAriLong);
  if (side.yuko > 0) parts.push(side.yuko > 1 ? `${v.number(side.yuko)} ${w.judoYukoLong}` : w.judoYukoLong);
  return parts.length ? parts.join(" ") : v.number(0);
}

/** How a contest was won, in the language. */
export function judoMethodWord(method: JudoMethod, v: Voice): string {
  const w = v.words;
  switch (method) {
    case "ippon": return w.judoMethodIppon;
    case "waza-ari-awasete-ippon": return w.judoMethodAwasete;
    case "score": return w.judoMethodScore;
    case "hansoku-make": return w.judoMethodHansoku;
    case "fusen-gachi": return w.judoMethodFusen;
    case "kiken-gachi": return w.judoMethodKiken;
  }
}

/** The pieces of a judo contest's note, short or in a sentence: how it was won, golden score, the contest time, and (long only) each side's shido. */
export function judoNotes(tie: Tie, v: Voice, long: boolean): string[] {
  const j: JudoOutcome | undefined = tie.judo;
  if (!j) return [];
  const w = v.words;
  const out: string[] = [];
  if (j.method !== null) out.push(judoMethodWord(j.method, v));
  if (j.goldenScore) out.push(long ? w.judoGoldenLong : w.judoGolden);
  if (j.seconds !== null) out.push(fill(w.judoTime, { t: judoClock(j.seconds) }));
  if (long) {
    ([0, 1] as const).forEach((k) => {
      const team = tie.sides[k];
      if (j.sides[k].shido > 0 && team) out.push(fill(w.judoShidoOf, { name: v.team(team), n: v.number(j.sides[k].shido) }));
    });
  }
  return out;
}

/** What a row of a box writes for a side's score: a judo contest's marks, else the number. `""` when nothing was played. */
export function sideScore(tie: Tie, k: 0 | 1, v: Voice): string {
  if (tie.judo) return tie.result.score ? judoMark(tie.judo.sides[k], v) : "";
  return tie.result.score ? v.number(tie.result.score[k]) : "";
}

/** A side's score in words for a sentence (a judo contest's, else the number). */
export function sideScoreLong(tie: Tie, k: 0 | 1, v: Voice): string {
  if (tie.judo) return judoSideLong(tie.judo.sides[k], v);
  return tie.result.score ? v.number(tie.result.score[k]) : "";
}

/** The cards beside a side's score: a yellow one for each shido, and a red one for the third (hansoku-make) or for a direct hansoku-make: `["y", "y", "r"]`. */
export function shidoCards(tie: Tie, k: 0 | 1): ("y" | "r")[] {
  const j = tie.judo;
  if (!j) return [];
  const n = j.sides[k].shido;
  if (n >= 3) return ["y", "y", "r"];
  // A direct hansoku-make is the loser's red card, when it came with no third shido.
  const penalised = j.method === "hansoku-make" && j.winner !== null && j.winner !== k;
  return penalised ? [...Array.from({ length: n }, () => "y" as const), "r"] : Array.from({ length: n }, () => "y" as const);
}
