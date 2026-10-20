/**
 * The head-to-head card: two athletes side by side (flag, name, club, ranking, points), a VS between them, and under them their previous meetings (date, event and round, who won, the
 * result) with the record. It is the card shown next to a bracket for the contest about to be fought. Text first, no photo. Static SVG for a given state, like every drawing here.
 */
import { boardFrame, boardWrap, bw, clampN, fitSize, heading, label, type BoardFrame, type BoardOptions } from "./rank-kit.ts";
import { fill, voiceOf, type Voice } from "./locales.ts";
import { drawMark } from "./marks.ts";
import { abbreviate, fit, fitLines, num } from "./text.ts";
import { nameText, pointsText, teamFor, type R, type RankingEntry, type RankingOptions } from "./ranking.ts";

/** One previous meeting of the two athletes. */
export interface RankingMeeting {
  /** The date, as an ISO date (`2026-05-17`, written the language's way) or any text. */
  date?: string;
  /** The event ("Provincial Championships") and the round ("Final", "Semi-final"). */
  event?: string;
  round?: string;
  /** Who won: `0` for the first athlete, `1` for the second, `null` or left out for a draw or no result. */
  winner?: 0 | 1 | null;
  /** How it ended, as it is to be written ("ippon · 1:12", "7–2"). */
  result?: string;
}

export interface MatchupSource {
  /** The heading. Default: the language's "Head to head". */
  title?: string;
  /** The category as a pill under the heading ("U18 · Men -60 kg"). */
  category?: string;
  /** The event or the date, at the right of the heading. */
  date?: string;
  /** Where the data comes from, small at the foot. */
  source?: string;
  /** The two athletes: an entry's `rank` is its ranking and `points` its points. */
  a: RankingEntry;
  b: RankingEntry;
  /** The previous meetings, in the order they are to be written (the latest first, as a broadcast does). */
  meetings?: readonly RankingMeeting[];
}

export interface MatchupOptions extends BoardOptions, Pick<RankingOptions, "nameStyle" | "precision" | "rankStyle"> {
  /** The most meetings drawn. Default: as many as fit at a readable size. The rest are counted ("+2 more"); the record counts them all. */
  rows?: number;
}

/** The record of the meetings: how many each athlete won. A draw or a meeting with no winner is in neither. */
export function matchupRecord(meetings: readonly RankingMeeting[] = []): [number, number] {
  return [meetings.filter((m) => m.winner === 0).length, meetings.filter((m) => m.winner === 1).length];
}

const nameOf = (e: RankingEntry): string => (typeof e.name === "string" ? e.name : e.name.surname);

function check(e: RankingEntry | undefined, side: string): void {
  const n = e?.name;
  const ok = typeof n === "string" ? n.trim() !== "" : !!n && typeof n === "object" && typeof n.surname === "string" && n.surname.trim() !== "";
  if (!ok) throw new RangeError(`taisen-brackets: athlete ${side} of the head-to-head needs a name`);
  if (e!.rank !== undefined && !(Number.isInteger(e!.rank) && e!.rank >= 1)) throw new RangeError(`taisen-brackets: the ranking of ${nameOf(e!)} is a whole number from 1`);
}

const rankLine = (e: RankingEntry, v: Voice, hash: boolean): string => (e.rank === undefined ? v.words.rankUnranked : `${hash ? "#" : ""}${v.number(e.rank)}`);

const meetingDate = (m: RankingMeeting, v: Voice): string => (m.date === undefined ? "" : v.date(m.date) ?? m.date);

/** The card as a sentence, the drawing's description. */
export function describeMatchup(source: MatchupSource, options: Pick<MatchupOptions, "locale" | "words" | "nameStyle" | "precision" | "rankStyle"> = {}): string {
  const v = voiceOf(options);
  const w = v.words;
  const style = options.nameStyle ?? "surname-first";
  const an = nameText(source.a.name, style, v), bn = nameText(source.b.name, style, v);
  const parts = [`${source.title ?? w.rankMatchTitle}: ${fill(w.tieVs, { a: an, b: bn })}`];
  if (source.category) parts.push(source.category);
  if (source.date) parts.push(source.date);
  for (const e of [source.a, source.b]) {
    const bits = [nameText(e.name, style, v), `${w.rankColRanking} ${rankLine(e, v, false)}`];
    const p = pointsText(e.points, options.precision, v);
    if (p) bits.push(`${p} ${w.rankPoints}`);
    parts.push(bits.join(w.rankJoin));
  }
  const meetings = source.meetings ?? [];
  if (meetings.length === 0) parts.push(w.rankNoMeetings);
  else {
    const [x, y] = matchupRecord(meetings);
    parts.push(`${w.rankMeetings} ${fill(w.scoreText, { a: v.number(x), b: v.number(y) })}`);
    for (const m of meetings) {
      const bits = [meetingDate(m, v), [m.event, m.round].filter(Boolean).join(" "), m.winner === 0 || m.winner === 1 ? nameText((m.winner === 0 ? source.a : source.b).name, style, v) : "", m.result ?? ""].filter(Boolean);
      parts.push(bits.join(w.rankJoin));
    }
  }
  return parts.join(w.sep) + w.end;
}

/**
 * The head-to-head card for two athletes and their meetings. Throws a `RangeError` for an athlete with no name, a ranking that is not a whole number from 1, a meeting whose winner is not
 * 0, 1 or null, `rows` that is not a whole number from 1 to 50, or a bad size or theme.
 */
export function rankingMatchup(source: MatchupSource, options: MatchupOptions = {}): string {
  if (!source) throw new RangeError("taisen-brackets: a head-to-head needs two athletes");
  check(source.a, "a");
  check(source.b, "b");
  const meetings = source.meetings ?? [];
  if (!Array.isArray(meetings)) throw new RangeError("taisen-brackets: meetings is a list");
  meetings.forEach((m, i) => {
    if (m.winner !== undefined && m.winner !== null && m.winner !== 0 && m.winner !== 1) throw new RangeError(`taisen-brackets: the winner of meeting ${i + 1} is 0 (the first athlete), 1 (the second) or null, not ${JSON.stringify(m.winner)}`);
  });
  if (options.rows !== undefined && !(Number.isInteger(options.rows) && options.rows >= 1 && options.rows <= 50)) throw new RangeError("taisen-brackets: rows is a whole number from 1 to 50");
  const f = boardFrame(options, [source, options.nameStyle, options.precision, options.rankStyle, options.rows]);
  const { W, H, v } = f;
  const w = v.words;
  const unit = Math.min(W, H);
  const pad = Math.round(unit * 0.035);
  const style = options.nameStyle ?? "surname-first";
  const title = source.title ?? w.rankMatchTitle;
  const body: string[] = [];
  const head = heading(f, title, source.category, source.date, pad, W - pad * 2, source.source);
  body.push(...head.svg);
  const { bx, boxW } = head;
  const avail = head.bottom - head.top;
  const vsW = clampN(unit * 0.12, 56, 150);
  const panelW = (boxW - vsW) / 2;
  const hasMeetings = meetings.length > 0;
  const panelH = Math.min(hasMeetings ? avail * 0.5 : avail * 0.9, unit * (panelW / unit < 0.6 ? 0.5 : 0.42));
  const names = [nameText(source.a.name, style, v), nameText(source.b.name, style, v)];
  [source.a, source.b].forEach((e, k) => body.push(drawPanel(f, { x: bx + k * (panelW + vsW), y: head.top, w: panelW, h: panelH }, e, names[k], k === 0 ? "rk-sa" : "rk-sb", options, k)));
  // The VS between the panels.
  const vr = Math.min(vsW * 0.42, panelH * 0.3);
  const vcx = bx + panelW + vsW / 2, vcy = head.top + panelH / 2;
  const vsText = v.upper(w.vs);
  const vsSize = fitSize(vsText, vr * 0.95, vr * 1.55, 0.5);
  body.push(`<circle class="rk-pill" cx="${num(vcx)}" cy="${num(vcy)}" r="${num(vr)}"/>`, label(vcx, vcy + vsSize * 0.36, vsSize, vsText, "rk-pillink", "middle", 800));
  // The meetings.
  const mTop = head.top + panelH + pad;
  const hs = clampN(unit * 0.026, 11, 34);
  const lineH = hs * 1.9;
  if (!hasMeetings) {
    body.push(label(bx, mTop + hs * 1.2, hs * 1.15, w.rankNoMeetings, "rk-sub", "start", 700));
  } else {
    const [ra, rb] = matchupRecord(meetings);
    const headText = v.upper(w.rankMeetings);
    body.push(label(bx, mTop + hs * 1.1, hs, fit(headText, hs, boxW * 0.5, bw), "rk-sub", "start", 700, ' letter-spacing=".08em"'));
    // The record at the right: the first athlete's wins in his colour, a dash, the second's.
    const rs = hs * 1.7;
    const dashW = bw("–", rs), bW = bw(v.number(rb), rs);
    const rx = bx + boxW;
    body.push(label(rx - bW - dashW * 1.3, mTop + hs * 1.35, rs, v.number(ra), "rk-sa", "end", 800), label(rx - bW - dashW * 0.65, mTop + hs * 1.35, rs, "–", "rk-sub", "middle", 800), label(rx, mTop + hs * 1.35, rs, v.number(rb), "rk-sb", "end", 800));
    const listTop = mTop + lineH * 1.15;
    const minRow = Math.max(26, unit * 0.04);
    const gapR = 0.12;
    const cap = Math.max(1, Math.floor((head.bottom - listTop) / (minRow * (1 + gapR))));
    const shownN = Math.min(options.rows ?? meetings.length, meetings.length, cap);
    const rowH = Math.min(unit * 0.085, (head.bottom - listTop) / (shownN * (1 + gapR)));
    const he = Math.min(rowH, boxW / 11);
    meetings.slice(0, shownN).forEach((m, i) => {
      const r: R = { x: bx, y: listTop + i * rowH * (1 + gapR), w: boxW, h: rowH };
      body.push(drawMeeting(f, r, m, source, he, style));
    });
    if (shownN < meetings.length) body.push(label(bx + boxW, head.bottom - 2, hs, fill(w.rankMore, { n: v.number(meetings.length - shownN) }), "rk-sub", "end", 700));
  }
  return boardWrap(f, options.title ?? [title, names.join(" – ")].join(": "), describeMatchup(source, options), body, "matchup");
}

function drawPanel(f: BoardFrame, r: R, e: RankingEntry, name: string, sideCls: string, options: MatchupOptions, k: number): string {
  const { v } = f;
  const w = v.words;
  const g: string[] = [];
  const rx = Math.min(r.h * 0.08, 22);
  g.push(`<rect class="rk-row" x="${num(r.x)}" y="${num(r.y)}" width="${num(r.w)}" height="${num(r.h)}" rx="${num(rx)}"/>`);
  const bar = Math.max(6, r.h * 0.035);
  g.push(`<rect class="${sideCls}" x="${num(r.x + rx)}" y="${num(r.y)}" width="${num(r.w - rx * 2)}" height="${num(bar)}"/>`);
  const he = Math.min(r.h, r.w / 1.5);
  const pad = he * 0.09;
  const d = Math.min(he * 0.34, r.w * 0.3);
  const y0 = r.y + bar + pad * 1.4;
  const hasMark = !!(e.flag || e.mark);
  let x = r.x + pad * 1.2;
  if (hasMark) {
    g.push(drawMark(teamFor(e, `m${k}`, name, abbreviate(e.club ?? name)), x + d / 2, y0 + d / 2, d, f.ctx));
    x += d + pad;
  }
  const nameW = r.x + r.w - pad * 1.2 - x;
  const second = e.club ?? e.country ?? "";
  const ss = Math.min(he * 0.075, 26);
  const blockH = Math.max(d, he * 0.26);
  const fl = fitLines(name, nameW, blockH - (second ? ss * 1.4 : 0), he * 0.2);
  const total = fl.height + (second ? ss * 1.35 : 0);
  let ty = y0 + (blockH - total) / 2;
  fl.lines.forEach((line, i) => g.push(label(x, ty + fl.size * (i + 0.86), fl.size, fit(line, fl.size, nameW + 1, bw), "rk-ink", "start", 800)));
  ty += fl.height;
  if (second) {
    const s2 = fitSize(second, ss, nameW, 0.7);
    g.push(label(x, ty + s2 * 1.05, s2, fit(second, s2, nameW + 1, bw), "rk-sub", "start", 600));
  }
  // The ranking and the points along the foot.
  const ranked = rankLine(e, v, options.rankStyle === "hash");
  const pts = pointsText(e.points, options.precision, v);
  const left = r.x + pad * 1.2, right = r.x + r.w - pad * 1.2;
  let rs = he * 0.3;
  const ps = he * 0.18;
  const lab = w.rankColRanking;
  const ls = Math.max(he * 0.07, 10);
  const needed = (size: number) => Math.max(bw(ranked, size), bw(v.upper(lab), ls * 1.1)) + (pts ? Math.min(bw(pts, ps), right - left) * 0.5 + pad * 2 : 0);
  while (rs > 14 && needed(rs) > right - left) rs *= 0.93;
  const baseY = r.y + r.h - pad * 1.2;
  g.push(label(left, baseY - rs * 0.74 - ls * 0.5, ls, fit(v.upper(lab), ls, right - left, bw), "rk-sub", "start", 700, ' letter-spacing=".1em"'));
  g.push(label(left, baseY, rs, ranked, "rk-ink", "start", 800));
  if (pts) {
    const pz = fitSize(pts, ps * 1.5, right - left - Math.max(bw(ranked, rs), bw(v.upper(lab), ls * 1.1)) - pad * 2, 0.5);
    g.push(label(right, baseY - pz * 0.74 - ls * 0.5, ls, fit(v.upper(w.rankPoints), ls, right - left, bw), "rk-sub", "end", 700, ' letter-spacing=".1em"'));
    g.push(label(right, baseY, pz, pts, "rk-ink", "end", 800));
  }
  return `<g class="rk-panel">${g.join("")}</g>`;
}

function drawMeeting(f: BoardFrame, r: R, m: RankingMeeting, source: MatchupSource, he: number, style: NonNullable<RankingOptions["nameStyle"]>): string {
  const { v } = f;
  const g: string[] = [];
  g.push(`<rect class="rk-row" x="${num(r.x)}" y="${num(r.y)}" width="${num(r.w)}" height="${num(r.h)}" rx="${num(Math.min(r.h * 0.18, 16))}"/>`);
  const cy = r.y + r.h / 2;
  const pad = he * 0.25;
  const date = meetingDate(m, v);
  const winnerEntry = m.winner === 0 ? source.a : m.winner === 1 ? source.b : null;
  const winName = winnerEntry ? nameText(winnerEntry.name, style, v) : "";
  // The type steps down until the date, the winner and the result fit side by side; the event and round take what is left, if there is room.
  let fs = he * 0.36;
  const need = (z: number): number => (date ? bw(date, z) + pad * 1.5 : 0) + (m.result ? bw(m.result, z) + pad * 1.5 : 0) + bw(winName, z) + z * 1.4 + pad * 2;
  while (fs > 11 && need(fs) > r.w) fs *= 0.94;
  let x = r.x + pad;
  const right = r.x + r.w - pad;
  const dateW = date ? bw(date, fs) : 0;
  if (date) { g.push(label(x, cy + fs * 0.36, fs, fit(date, fs, dateW + 1, bw), "rk-sub", "start", 700)); x += dateW + pad * 1.5; }
  const resultW = m.result ? Math.min(r.w * 0.4, bw(m.result, fs)) : 0;
  const winW = Math.min(r.w * 0.4, Math.max(bw(winName, fs) + fs * 1.4, fs * 2));
  // The result at the right, then the winner before it, then the event and round in what is left.
  const resultSvg = m.result ? label(right, cy + fs * 0.36, fs, fit(m.result, fs, resultW + 1, bw), "rk-ink", "end", 700) : "";
  const wx = right - resultW - (resultW ? pad * 1.5 : 0) - winW;
  const eventText = [m.event, m.round].filter(Boolean).join(" · ");
  const eventW = wx - x - pad;
  if (eventText && eventW > he * 2.5) g.push(label(x, cy + fs * 0.36, fitSize(eventText, fs, eventW, 0.7), fit(eventText, fs, eventW + 1, bw), "rk-ink", "start", 600));
  if (winnerEntry) {
    g.push(`<circle class="${m.winner === 0 ? "rk-sa" : "rk-sb"}" cx="${num(wx + fs * 0.4)}" cy="${num(cy)}" r="${num(fs * 0.3)}"/>`);
    const nx = wx + fs * 1.1;
    g.push(label(nx, cy + fs * 0.36, fs, fit(winName, fs, winW - fs * 1.1 + 1, bw), m.winner === 0 ? "rk-sa" : "rk-sb", "start", 800));
  } else g.push(label(wx + fs * 0.4, cy + fs * 0.36, fs, "–", "rk-sub", "start", 800));
  g.push(resultSvg);
  return `<g class="rk-meeting">${g.join("")}</g>`;
}
