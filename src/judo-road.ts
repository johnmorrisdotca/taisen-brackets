/**
 * The road to the final of one judoka as a panel for a broadcast or a hall screen: the athlete (flag, name, code, coach) and the contests they have won on the way, most
 * recent first, each with its round, the opponent (flag, code, name) and how it was won. `judoWins` reads the wins from a bracket; `judoRoadPanel` draws them. Static SVG for a
 * given state, like the other judo drawings.
 */
import type { JudoAthlete, JudoBoardOptions } from "./judo-board.ts";
import { bw, clampN, fitSize } from "./judo-board.ts";
import { judoNotes } from "./judo-text.ts";
import { check, frameOf, text, teamOf, wrap } from "./judo-sheets.ts";
import { layoutBracket } from "./layout.ts";
import { fill, voiceOf } from "./locales.ts";
import { drawMark } from "./marks.ts";
import { roundLabel } from "./rounds.ts";
import { fit, fitLines, num } from "./text.ts";
import type { BracketInput, BracketLayout, DrawOptions, Matchup, SideId, Team } from "./types.ts";

/** One win on the road: the round it was in, the opponent (none for a bye), and how it was won in words ("ippon · 1:12", "decision · GS · 5:12", or a score). */
export interface JudoWin {
  round: string;
  opponent?: JudoAthlete;
  how: string;
  bye?: boolean;
}

export interface JudoWinsOptions {
  locale?: DrawOptions["locale"];
  words?: DrawOptions["words"];
  /** The names of the rounds, as for `drawBracket`. */
  roundNames?: DrawOptions["roundNames"];
  /** Turns a bracket's team into the athlete the panel draws. Default: its name, flag, mark and `code`. */
  athlete?: (team: Team) => JudoAthlete;
  /** Write a bye for each round the athlete skipped before their first contest. Default true. */
  byes?: boolean;
}

const asAthlete = (t: Team): JudoAthlete => ({ name: t.name, ...(t.code ? { code: t.code } : {}), ...(t.flag ? { flag: t.flag } : {}), ...(t.mark ? { mark: t.mark } : {}) });

/**
 * The contests an athlete has won in a bracket, oldest first, with a bye for each round skipped at the start: the opponent, the round (a repechage and a bronze medal contest are named as
 * such) and how it was won, from the judo result's notes or the score. Throws a `RangeError` for an athlete that is not in the bracket.
 */
export function judoWins(input: BracketLayout | readonly Matchup[] | BracketInput, athlete: SideId, options: JudoWinsOptions = {}): JudoWin[] {
  const layout: BracketLayout = "ties" in input && "sides" in input ? (input as BracketLayout) : layoutBracket(input as readonly Matchup[] | BracketInput);
  const me = layout.teams.find((t) => t.id === athlete);
  if (!me) throw new RangeError(`taisen-brackets: ${JSON.stringify(athlete)} is not in the bracket`);
  const v = voiceOf(options);
  const w = v.words;
  const map = options.athlete ?? asAthlete;
  const label = (round: number): string => roundLabel(layout, round, options.roundNames, v);
  const order = (t: BracketLayout["ties"][number]): number => (t.stage === "repechage" ? layout.rounds + 1 : t.stage === "bronze" ? layout.rounds + 2 : t.round);
  const won = layout.ties
    .filter((t) => t.winner !== null && t.sides[t.winner]?.id === athlete && (t.stage !== undefined || t.round > 0))
    .sort((a, b) => order(a) - order(b) || a.index - b.index);
  const rows: JudoWin[] = won.map((t) => {
    const other = t.sides[(1 - t.winner!) as 0 | 1];
    const how = t.judo
      ? judoNotes(t, v, false).join(" · ")
      : t.result.score ? fill(w.scoreText, { a: v.number(t.result.score[t.winner!]), b: v.number(t.result.score[(1 - t.winner!) as 0 | 1]) }) : "";
    const round = t.stage === "repechage" ? w.judoRepechage : t.stage === "bronze" ? w.judoBronze : label(t.round);
    return { round, ...(other ? { opponent: map(other) } : {}), how };
  });
  const firstTree = won.find((t) => t.stage === undefined);
  const byes: JudoWin[] = [];
  if ((options.byes ?? true) && firstTree && firstTree.round > 1) for (let r = 1; r < firstTree.round; r++) byes.push({ round: label(r), how: w.bye, bye: true });
  return [...byes, ...rows];
}

export interface JudoRoadSource {
  athlete: JudoAthlete;
  /** Oldest first, as `judoWins` gives them. */
  wins: readonly JudoWin[];
}

export interface JudoRoadOptions extends Omit<JudoBoardOptions, "style" | "swap" | "coaches"> {
  /** The weight class as a heading (`judoCategoryLabel`), written at the right of the header. */
  weight?: string;
  /** The colour of the athlete's block: the white judogi's or the blue's. Default `blue`. */
  side?: "white" | "blue";
  /** `latest` (the default) puts the most recent win first, as a broadcast does; `first` the oldest. */
  order?: "latest" | "first";
  /** The most wins drawn. Default: as many as fit at a readable size, up to 8. */
  rows?: number;
  /** Write the coach under the code. Default true. */
  coach?: boolean;
}

const ROAD_CSS = [
  "$S .jr-row{fill:#f7f6f1;stroke:#bdbbae;stroke-width:1.5}",
  "$S .jr-pill{fill:#dcdbd2}",
  "$S .jr-ink{fill:#15181a}",
  "$S .jr-sub{fill:#4a4f54}",
  "$S .jr-bye{fill:#e9e8e1;stroke:#bdbbae;stroke-width:1.5}",
].join("\n");

/** The road as a sentence, the drawing's description. */
export function describeJudoRoad(source: JudoRoadSource, options: Pick<JudoRoadOptions, "locale" | "words" | "weight" | "order"> = {}): string {
  const v = voiceOf(options);
  const w = v.words;
  const list = options.order === "first" ? [...source.wins] : [...source.wins].reverse();
  const parts = [`${w.roadTitle}: ${source.athlete.name}${source.athlete.code ? ` (${source.athlete.code})` : ""}`];
  if (options.weight) parts.push(options.weight);
  for (const x of list) parts.push(x.bye ? `${x.round}: ${w.bye}` : `${x.round}: ${x.opponent?.name ?? ""}${x.how ? ` (${x.how})` : ""}`);
  return parts.join(w.sep) + w.end;
}

/**
 * The road-to-the-final panel for an athlete: their block (flag, name, code, coach) in the colour of a judogi, and a row for each contest won, most recent first: the round, the
 * opponent's flag, code and name, and how it was won. A bye is a quiet row. Throws a `RangeError` for an athlete with no name, a win with no round, or a bad size, theme or `rows`.
 */
export function judoRoadPanel(source: JudoRoadSource, options: JudoRoadOptions = {}): string {
  check(source.athlete, "road");
  for (const x of source.wins) {
    if (typeof x.round !== "string" || x.round === "") throw new RangeError("taisen-brackets: every win on the road needs a round");
    if (!x.bye && x.opponent) check(x.opponent, `opponent in ${x.round}`);
  }
  if (options.side !== undefined && options.side !== "white" && options.side !== "blue") throw new RangeError(`taisen-brackets: a road panel's side is "white" or "blue", not ${JSON.stringify(options.side)}`);
  if (options.rows !== undefined && !(Number.isInteger(options.rows) && options.rows >= 1 && options.rows <= 20)) throw new RangeError("taisen-brackets: rows is a whole number from 1 to 20");
  const f = frameOf(options, [source, options.side, options.order, options.rows, options.weight]);
  const { W, H, v } = f;
  const w = v.words;
  const unit = Math.min(W, H);
  const pad = Math.round(unit * 0.025);
  const landscape = W >= H;
  const body: string[] = [];
  const headH = Math.round(H * (landscape ? 0.11 : 0.075));
  body.push(`<rect class="jb-band" x="0" y="0" width="${num(W)}" height="${num(headH)}"/>`);
  const hf = clampN(headH * 0.46, 13, 60);
  const title = w.roadTitle;
  { const s = fitSize(title, hf, (W - pad * 2) * 0.55, 0.5); body.push(text(pad, headH / 2 + s * 0.36, s, fit(title, s, (W - pad * 2) * 0.55, bw), "jb-ink", "start")); }
  if (options.weight) { const s = fitSize(options.weight, hf, (W - pad * 2) * 0.4, 0.5); body.push(text(W - pad, headH / 2 + s * 0.36, s, fit(options.weight, s, (W - pad * 2) * 0.4, bw), "jb-muted", "end")); }

  const top = headH + pad, availH = H - top - pad;
  const side = options.side ?? "blue";
  const A = source.athlete;
  // The athlete's block.
  const blockRect = landscape ? { x: pad, y: top, w: Math.round((W - pad * 3) * 0.4), h: availH } : { x: pad, y: top, w: W - pad * 2, h: Math.round(availH * 0.3) };
  {
    const g: string[] = [];
    const rx = Math.round(unit * 0.014);
    g.push(`<rect class="jb-panel" x="${num(blockRect.x)}" y="${num(blockRect.y)}" width="${num(blockRect.w)}" height="${num(blockRect.h)}" rx="${rx}"/>`);
    const ip = Math.max(pad, blockRect.w * 0.05);
    const inner = { x: blockRect.x + ip, y: blockRect.y + ip, w: blockRect.w - ip * 2, h: blockRect.h - ip * 2 };
    const showCoach = (options.coach ?? true) && !!A.coach;
    if (landscape) {
      const flagD = Math.min(inner.w * 0.5, inner.h * 0.36);
      g.push(drawMark(teamOf(A, "road"), inner.x + inner.w / 2, inner.y + flagD / 2, flagD, f.ctx));
      const ty = inner.y + flagD + ip * 0.8;
      const codeH = A.code ? inner.h * 0.07 : 0, coachH = showCoach ? inner.h * 0.045 : 0;
      const fl = fitLines(A.name, inner.w, inner.h - flagD - ip * 0.8 - codeH - coachH - ip, Math.min(inner.h * 0.14, 150));
      fl.lines.forEach((line, i) => g.push(text(inner.x + inner.w / 2, ty + fl.size * (i + 0.86), fl.size, fit(line, fl.size, inner.w + 1, bw), "jb-pink", "middle")));
      let yy = ty + fl.height + ip * 0.3;
      if (A.code) { g.push(text(inner.x + inner.w / 2, yy + codeH * 0.9, codeH, A.code, "jb-psub", "middle", 800, ' letter-spacing=".1em"')); yy += codeH + ip * 0.2; }
      if (showCoach) g.push(text(inner.x + inner.w / 2, yy + coachH * 0.9, coachH, fit(fill(w.judoCoach, { name: A.coach! }), coachH, inner.w, bw), "jb-psub", "middle", 600));
    } else {
      const flagD = Math.min(inner.h * 0.8, inner.w * 0.22);
      g.push(drawMark(teamOf(A, "road"), inner.x + flagD / 2, inner.y + inner.h / 2, flagD, f.ctx));
      const tx = inner.x + flagD + ip, tw = inner.w - flagD - ip;
      const codeH = A.code ? inner.h * 0.2 : 0, coachH = showCoach ? inner.h * 0.14 : 0;
      const fl = fitLines(A.name, tw, inner.h - codeH - coachH - ip * 0.4, Math.min(inner.h * 0.42, 130));
      const blockH = fl.height + codeH + coachH + (A.code ? ip * 0.2 : 0);
      let yy = inner.y + (inner.h - blockH) / 2;
      fl.lines.forEach((line, i) => g.push(text(tx, yy + fl.size * (i + 0.86), fl.size, fit(line, fl.size, tw + 1, bw), "jb-pink", "start")));
      yy += fl.height + ip * 0.2;
      if (A.code) { g.push(text(tx, yy + codeH * 0.9, codeH, A.code, "jb-psub", "start", 800, ' letter-spacing=".1em"')); yy += codeH; }
      if (showCoach) g.push(text(tx, yy + coachH * 0.95, coachH, fit(fill(w.judoCoach, { name: A.coach! }), coachH, tw, bw), "jb-psub", "start", 600));
    }
    body.push(`<g class="${side === "white" ? "jb-w" : "jb-b"}">${g.join("")}</g>`);
  }
  // The list.
  const list = options.order === "first" ? [...source.wins] : [...source.wins].reverse();
  const listRect = landscape ? { x: blockRect.x + blockRect.w + pad, y: top, w: W - blockRect.x - blockRect.w - pad * 2, h: availH } : { x: pad, y: top + blockRect.h + pad, w: W - pad * 2, h: availH - blockRect.h - pad };
  const minRow = Math.max(40, unit * 0.06);
  const capacity = Math.min(options.rows ?? 8, Math.max(1, Math.floor(listRect.h / minRow)));
  const shown = list.slice(0, capacity);
  if (shown.length) {
    const rowH = Math.min(listRect.h / shown.length, unit * 0.15);
    const gap = Math.max(4, rowH * 0.08);
    const h = rowH - gap;
    // Every round pill is as wide as the widest round name needs; where the list is narrow the result goes under the name, not beside it.
    const stacked = listRect.w < h * 8;
    const pillFont = h * 0.24;
    const upper = (t: string) => t.toLocaleUpperCase(v.locale.tag);
    const ip0 = h * 0.2;
    const pillW = Math.min(listRect.w * 0.32, Math.max(...shown.map((x) => bw(upper(x.round), pillFont) * 0.8), listRect.w * 0.16) + ip0 * 1.4);
    shown.forEach((x, i) => {
      const y = listRect.y + i * rowH;
      const g: string[] = [];
      const rx = Math.round(unit * 0.01);
      g.push(`<rect class="${x.bye ? "jr-bye" : "jr-row"}" x="${num(listRect.x)}" y="${num(y)}" width="${num(listRect.w)}" height="${num(h)}" rx="${rx}"/>`);
      const ip = ip0;
      g.push(`<rect class="jr-pill" x="${num(listRect.x + ip * 0.6)}" y="${num(y + h * 0.18)}" width="${num(pillW)}" height="${num(h * 0.64)}" rx="${num(h * 0.32)}"/>`);
      const label = upper(x.round);
      const rs = fitSize(label, pillFont, pillW - ip * 0.8, 0.4);
      g.push(text(listRect.x + ip * 0.6 + pillW / 2, y + h / 2 + rs * 0.36, rs, fit(label, rs, pillW - ip * 0.6, bw), "jr-sub", "middle", 800, ' letter-spacing=".03em"'));
      let cx = listRect.x + ip * 0.6 + pillW + ip;
      const right = listRect.x + listRect.w - ip;
      if (x.bye) {
        const s = fitSize(upper(x.how), h * 0.34, right - cx, 0.4);
        g.push(text(cx, y + h / 2 + s * 0.36, s, upper(x.how), "jr-sub", "start"));
      } else if (x.opponent) {
        const d = h * 0.6;
        g.push(drawMark(teamOf(x.opponent, `win-${i}`), cx + d / 2, y + h / 2, d, f.ctx));
        cx += d + ip * 0.6;
        const cs = h * 0.24;
        if (x.opponent.code) {
          g.push(text(cx, y + h / 2 + cs * 0.36 - (stacked ? h * 0.2 : 0), cs, x.opponent.code, "jr-sub", "start", 800));
          cx += bw(x.opponent.code, cs) + ip * 0.6;
        }
        if (stacked) {
          const avail = right - cx;
          const ns = fitSize(x.opponent.name, Math.min(h * 0.34, 64), avail, 0.35);
          g.push(text(cx, y + h * 0.46, ns, fit(x.opponent.name, ns, avail + 1, bw), "jr-ink", "start"));
          if (x.how) {
            const hs = fitSize(x.how, h * 0.22, avail, 0.4);
            g.push(text(cx, y + h * 0.82, hs, fit(x.how, hs, avail + 1, bw), "jr-sub", "start", 700));
          }
        } else {
          const howW = Math.min(listRect.w * 0.3, bw(x.how, h * 0.28) * 0.85);
          const nameAvail = right - howW - ip * 0.6 - cx;
          const ns = fitSize(x.opponent.name, Math.min(h * 0.38, 64), nameAvail, 0.35);
          g.push(text(cx, y + h / 2 + ns * 0.36, ns, fit(x.opponent.name, ns, nameAvail + 1, bw), "jr-ink", "start"));
          if (x.how) {
            const hs = fitSize(x.how, h * 0.28, howW, 0.4);
            g.push(text(right, y + h / 2 + hs * 0.36, hs, fit(x.how, hs, howW + 1, bw), "jr-sub", "end", 700));
          }
        }
      }
      body.push(`<g class="jr-win">${g.join("")}</g>`);
    });
  }
  return wrap(f, options.title ?? w.roadTitle, describeJudoRoad(source, options), body, "road", ROAD_CSS);
}
