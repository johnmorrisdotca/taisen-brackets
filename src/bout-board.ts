/**
 * The bout presentation board: the screen shown as two athletes are about to compete. A title band with the event and the phase, a bar that says "Bout presentation" with the bout's number, the
 * two athletes (a red band and a blue one, each with a code, a 4:3 flag and a name), and a bar that says "Referee and judges" over a row for each official with the country code, flag, name and role.
 * One standalone SVG of a width you choose and a height that follows from the officials (`boutBoardSize`), made to be placed over a picture. Nothing of any games or broadcaster is drawn.
 */
import { BC, box, broadcastFrame, broadcastWrap, bw, fitSize, gloss, panel, t, titleBand, type BroadcastFrame, type BroadcastOptions } from "./broadcast-kit.ts";
import { fill, voiceOf, type Voice } from "./locales.ts";
import { drawMark } from "./marks.ts";
import { nameText, type RankingName, type RankingOptions } from "./ranking.ts";
import { abbreviate, fit } from "./text.ts";

/** One of the two athletes of a bout. Only `name` is needed. */
export interface BoutAthlete {
  /** The name as it is to be written (`MAYER M.`), or its two parts (set by `nameStyle`). */
  name: string | RankingName;
  /** The country's three letters. */
  code?: string;
  /** A code for the `flags` function, drawn 4:3. */
  flag?: string;
  /** A mark of your own in place of a flag. */
  mark?: string;
}

/** A referee or a judge. Only `name` is needed. */
export interface BoutOfficial extends BoutAthlete {
  /** `referee` (the language's word), `judge` (numbered 1, 2, 3 in the order given, in the language's words), or any text you want written (`Chair`, `Mat president`). Default `judge`. */
  role?: "referee" | "judge" | (string & {});
}

export interface BoutBoardSource {
  /** The event, in capitals in the title band ("Women's 57-60 kg"). */
  title: string;
  /** The phase, at the right of the title band ("Preliminaries"). */
  phase?: string;
  /** The bout's number (`142`, `"A-12"`), written "Bout: 142" at the right of the first bar. */
  bout?: string | number;
  /** The athlete in the red band, at the left, and the one in the blue band, at the right. */
  red: BoutAthlete;
  blue: BoutAthlete;
  /** The referee and the judges, in the order they are written. */
  officials?: readonly BoutOfficial[];
}

export interface BoutBoardOptions extends BroadcastOptions, Pick<RankingOptions, "nameStyle"> {
  /** `upper` writes the names in capitals; `as-is` (the default) leaves them as given. */
  nameCase?: "as-is" | "upper";
}

const MAX_OFFICIALS = 12;

/** The width and the height of a bout board with `officialCount` officials: the width given (1280 by default) and a height of 64 + 38 + 10 + 62 + 10 + 38 + 42 an official + 10, in units of the width over 1280. */
export function boutBoardSize(officialCount: number, options: Pick<BroadcastOptions, "width"> = {}): { width: number; height: number } {
  const width = options.width ?? 1280;
  const u = width / 1280;
  return { width, height: Math.round((BC.title + BC.band + BC.pad + BC.athlete + BC.pad + BC.band + (officialCount > 0 ? officialCount * (BC.official + BC.gap) : 0) + BC.pad) * u) };
}

function nameOf(n: BoutAthlete["name"]): string {
  return typeof n === "string" ? n : n.surname;
}

function validate(source: BoutBoardSource, options: BoutBoardOptions): void {
  if (!source || typeof source.title !== "string" || source.title.trim() === "") throw new RangeError("taisen-brackets: a bout board needs a title");
  const who = (a: BoutAthlete | undefined, side: string): void => {
    const n = a?.name;
    const ok = typeof n === "string" ? n.trim() !== "" : !!n && typeof n === "object" && typeof n.surname === "string" && n.surname.trim() !== "";
    if (!ok) throw new RangeError(`taisen-brackets: the ${side} needs a name`);
  };
  who(source.red, "red athlete");
  who(source.blue, "blue athlete");
  const officials = source.officials ?? [];
  if (!Array.isArray(officials)) throw new RangeError("taisen-brackets: officials is a list");
  if (officials.length > MAX_OFFICIALS) throw new RangeError(`taisen-brackets: a bout board has at most ${MAX_OFFICIALS} officials`);
  officials.forEach((o, i) => { who(o, `official ${i + 1}`); if (o.role !== undefined && (typeof o.role !== "string" || o.role.trim() === "")) throw new RangeError(`taisen-brackets: the role of official ${i + 1} is a text`); });
  if (source.bout !== undefined && (typeof source.bout === "number" ? !Number.isFinite(source.bout) : typeof source.bout !== "string")) throw new RangeError("taisen-brackets: the bout number is a number or a text");
  if (options.nameCase !== undefined && !["as-is", "upper"].includes(options.nameCase)) throw new RangeError(`taisen-brackets: nameCase is "as-is" or "upper", not ${JSON.stringify(options.nameCase)}`);
  if (options.nameStyle !== undefined && !["surname-first", "given-first", "as-is"].includes(options.nameStyle)) throw new RangeError(`taisen-brackets: nameStyle is "surname-first", "given-first" or "as-is", not ${JSON.stringify(options.nameStyle)}`);
}

/** The role of each official as it is written: the language's words for a referee and a judge (numbered in order), any other text as it is. */
function roles(officials: readonly BoutOfficial[], v: Voice): string[] {
  let judges = 0;
  return officials.map((o) => {
    const role = o.role ?? "judge";
    if (role === "referee") return v.words.rbReferee;
    if (role === "judge") { judges += 1; return fill(v.words.rbJudge, { n: v.number(judges) }); }
    return role;
  });
}

/** The board as a sentence, the drawing's description. */
export function describeBoutBoard(source: BoutBoardSource, options: Pick<BoutBoardOptions, "locale" | "words" | "nameStyle" | "nameCase"> = {}): string {
  const v = voiceOf(options);
  const w = v.words;
  const style = options.nameStyle ?? "surname-first";
  const name = (a: BoutAthlete): string => { const n = nameText(a.name, style, v); return `${options.nameCase === "upper" ? v.upper(n) : n}${a.code ? ` (${a.code})` : ""}`; };
  const parts = [source.title];
  if (source.phase) parts.push(source.phase);
  parts.push(`${w.rbBoutPresentation}${source.bout !== undefined ? `: ${fill(w.rbBout, { n: String(source.bout) })}` : ""}`);
  parts.push(fill(w.tieVs, { a: name(source.red), b: name(source.blue) }));
  const officials = source.officials ?? [];
  if (officials.length) {
    const rs = roles(officials, v);
    parts.push(`${w.rbOfficials}: ${officials.map((o, i) => `${rs[i]} ${name(o)}`).join(w.noteJoin)}`);
  }
  return parts.join(w.sep) + w.end;
}

/**
 * The bout presentation board as a standalone SVG. Throws a `RangeError` for a board with no title, an athlete or official with no name, more than 12 officials, a role that is not a text, an unknown option
 * value, or a width outside 720 to 4000.
 */
export function boutBoard(source: BoutBoardSource, options: BoutBoardOptions = {}): string {
  validate(source, options);
  if (options.width !== undefined && options.width < 720) throw new RangeError("taisen-brackets: a board's width is from 720 to 4000");
  const officials = source.officials ?? [];
  const size = boutBoardSize(officials.length, options);
  const f = broadcastFrame(options, [source, options.nameStyle, options.nameCase], size.height / (size.width / 1280));
  const { W, u, v } = f;
  const w = v.words;
  const style = options.nameStyle ?? "surname-first";
  const written = (a: BoutAthlete): string => { const n = nameText(a.name, style, v); return options.nameCase === "upper" ? v.upper(n) : n; };
  const body: string[] = [panel(f)];
  const title = titleBand(f, 0, source.title, source.phase);
  body.push(title.svg);
  let y = title.h;
  // The first bar: "Bout presentation" and the number.
  body.push(bar(f, y, v.upper(w.rbBoutPresentation), source.bout !== undefined ? v.upper(fill(w.rbBout, { n: String(source.bout) })) : ""));
  y += BC.band * u + BC.pad * u;
  // The two athletes: a red band and a blue one with a dash between.
  const ah = BC.athlete * u;
  const gapMid = 44 * u;
  const pad = 12 * u;
  const half = (W - pad * 2 - gapMid) / 2;
  const sides: [BoutAthlete, "bc-red" | "bc-blue", number][] = [[source.red, "bc-red", pad], [source.blue, "bc-blue", pad + half + gapMid]];
  const flagH = 34 * u, flagW = flagH * (4 / 3);
  sides.forEach(([a, cls, x0], k) => {
    const g: string[] = [box(x0, y, half, ah, cls, 4 * u), gloss(f, x0, y, half, ah)];
    const cy = y + ah / 2;
    const name = written(a);
    const cs = 28 * u;
    const codeW = a.code ? bw(a.code, cs) + 12 * u : 0;
    const inner = 16 * u;
    const mark = a.flag || a.mark ? drawMark({ id: `a${k}`, name: nameOf(a.name), abbr: (a.code ?? abbreviate(nameOf(a.name))).slice(0, 3), ...(a.flag ? { flag: a.flag } : {}), ...(a.mark ? { mark: a.mark } : {}) }, 0, cy, flagH, f.ctx) : "";
    const markAt = (x: number): string => (mark ? `<g transform="translate(${x + flagW / 2} 0)">${mark}</g>` : "");
    const flagSpace = mark ? flagW + 14 * u : 0;
    if (k === 0) {
      // Red: the code, the flag, then the name.
      let x = x0 + inner;
      if (a.code) { g.push(t(x, cy + cs * 0.36, cs, a.code, "bc-ink", "start", 800)); x += codeW; }
      if (mark) { g.push(markAt(x)); x += flagSpace; }
      const avail = x0 + half - inner - x;
      const ns = fitSize(name, 32 * u, avail, 0.55);
      g.push(t(x, cy + ns * 0.36, ns, fit(name, ns, avail + 1, bw), "bc-ink", "start", 800));
    } else {
      // Blue: the name (to the flag), the flag, then the code; written in that order, so the markup reads as the band does.
      let right = x0 + half - inner;
      const codeSvg = a.code ? t(right, cy + cs * 0.36, cs, a.code, "bc-ink", "end", 800) : "";
      if (a.code) right -= codeW;
      const flagSvg = mark ? markAt(right - flagW) : "";
      if (mark) right -= flagSpace;
      const avail = right - (x0 + inner);
      const ns = fitSize(name, 32 * u, avail, 0.55);
      g.push(t(right, cy + ns * 0.36, ns, fit(name, ns, avail + 1, bw), "bc-ink", "end", 800), flagSvg, codeSvg);
    }
    body.push(`<g class="bc-athlete">${g.join("")}</g>`);
  });
  body.push(t(W / 2, y + ah / 2 + 18 * u * 0.36 * 1.4, 36 * u, "–", "bc-ink", "middle", 800));
  y += ah + BC.pad * u;
  // The second bar and a row for each official.
  body.push(bar(f, y, v.upper(w.rbOfficials), ""));
  y += BC.band * u;
  const rs = roles(officials, v);
  const oh = BC.official * u;
  const cs = 22 * u, ns0 = 24 * u;
  const anyCode = officials.some((o) => o.code);
  const anyFlag = officials.some((o) => o.flag || o.mark);
  const codeW = anyCode ? Math.max(...officials.map((o) => bw(o.code ?? "", cs))) + 12 * u : 0;
  officials.forEach((o, i) => {
    const ry = y + BC.gap * u + i * (oh + BC.gap * u);
    const cy = ry + oh / 2;
    const g: string[] = [box(0, ry, W, oh, i % 2 === 0 ? "bc-rowa" : "bc-rowb"), gloss(f, 0, ry, W, oh)];
    let x = 14 * u;
    if (anyCode) { if (o.code) g.push(t(x, cy + cs * 0.36, cs, o.code, "bc-ink", "start", 700)); x += codeW; }
    if (anyFlag) {
      if (o.flag || o.mark) g.push(drawMark({ id: `o${i}`, name: nameOf(o.name), abbr: (o.code ?? abbreviate(nameOf(o.name))).slice(0, 3), ...(o.flag ? { flag: o.flag } : {}), ...(o.mark ? { mark: o.mark } : {}) }, x + (26 * u * 4) / 3 / 2, cy, 26 * u, f.ctx));
      x += (26 * u * 4) / 3 + 14 * u;
    }
    const role = v.upper(rs[i]);
    const rz = fitSize(role, cs, Math.max(60 * u, W * 0.3), 0.6);
    const roleSvg = t(W - 16 * u, cy + rz * 0.36, rz, role, "bc-ink", "end", 800, ' letter-spacing=".03em"');
    const nameRight = W - 16 * u - bw(role, rz) * 1.07 - 24 * u;
    const name = written(o);
    const avail = Math.max(60 * u, nameRight - x);
    const nz = fitSize(name, ns0, avail, 0.6);
    g.push(t(x, cy + nz * 0.36, nz, fit(name, nz, avail + 1, bw), "bc-ink", "start", 700), roleSvg);
    body.push(`<g class="bc-official">${g.join("")}</g>`);
  });
  return broadcastWrap(f, options.title ?? source.title, describeBoutBoard(source, options), body, "bout-board");
}

/** A bar in the band colour with text at the left and, optionally, at the right. */
function bar(f: BroadcastFrame, y: number, left: string, right: string): string {
  const { u, W } = f;
  const h = BC.band * u;
  const fs = 21 * u;
  const rw = right ? bw(right, fs) * 1.07 : 0;
  const room = (W - 40 * u - (rw ? rw + 24 * u : 0)) / 1.07;
  const lz = fitSize(left, fs, room, 0.6);
  return `${box(0, y, W, h, "bc-band")}${t(20 * u, y + h / 2 + lz * 0.36, lz, fit(left, lz, room, bw), "bc-bandink", "start", 800, ' letter-spacing=".03em"')}${right ? t(W - 20 * u, y + h / 2 + fs * 0.36, fs, right, "bc-bandink", "end", 800, ' letter-spacing=".03em"') : ""}`;
}
