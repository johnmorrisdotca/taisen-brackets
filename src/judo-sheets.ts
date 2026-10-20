/**
 * Two more drawings for a judo event's screens: the contest card (who fights, in which category and round: the white athlete over the blue one, big, for the
 * moment the athletes enter) and the mat queue board (per mat, a big mat number and colour and the contests to come, in order, with their numbers, the white
 * and the blue athlete with flags and codes). Static SVG for a given state, like the scoreboard; showing the next state is the caller's job.
 */
import type { JudoAthlete, JudoBoardOptions, JudoContest } from "./judo-board.ts";
import { BLUE_PANEL, DARK, FONT, JUDO_BOARD_SIZES, LIGHT, WHITE_PANEL, bw, clampN, fitSize, rulesFor } from "./judo-board.ts";
import { fill, voiceOf, type Voice } from "./locales.ts";
import { drawMark, markDefs, type MarkContext } from "./marks.ts";
import { emWidth, esc, fit, fitLines, hash, num } from "./text.ts";
import type { Team } from "./types.ts";

/** What the contest card shows: the two athletes and the header. The scores and the clock of a `JudoContest` are not drawn. */
export type JudoCardContest = Pick<JudoContest, "white" | "blue" | "weight" | "round" | "mat" | "contest">;

/** One contest of a mat's queue: its number (`"G-24"`, `24`) and the two athletes, and optionally the weight class and the round (for a caption). */
export interface JudoQueueContest {
  number: string | number;
  white: JudoAthlete;
  blue: JudoAthlete;
}

/** One mat: its number or name, its colour (any CSS colour that a hex code gives, default by position) and its contests in the order they will be fought. */
export interface JudoMat {
  mat: string | number;
  color?: string;
  contests: readonly JudoQueueContest[];
}

export interface JudoQueueOptions extends Omit<JudoBoardOptions, "style" | "coaches"> {
  /** The most contests drawn for a mat. Default: as many as fit at a readable size, up to 12. */
  rows?: number;
  /** Show the first contest of each mat as the one on now (a green number). Default true. */
  current?: boolean;
  /** The colours the mats take in turn where a mat names none. Hex codes. */
  colors?: readonly string[];
}

/** The IJF-style mat colours, in turn: red, green, yellow, purple, orange, teal. Each reads with the ink the board picks for it. */
export const JUDO_MAT_COLORS: readonly string[] = Object.freeze(["#d2232a", "#1e9c4c", "#e7b800", "#7a3fb4", "#e8741a", "#12877f"]);

/** White or near-black, whichever reads better on a hex colour. */
export function inkOn(color: string): string {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())?.[1];
  if (!hex) return "#ffffff";
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.4 ? "#ffffff" : "#15181a";
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function sheetStyle(scope: string, theme: "auto" | "light" | "dark", extra = ""): string {
  const base = (p: typeof LIGHT, before: string) => rulesFor(p, `.${scope}`, before);
  const fixed = [
    `.${scope} .jb-w .jb-panel{fill:var(--jb-white-panel, ${WHITE_PANEL.panel});stroke:${WHITE_PANEL.edge};stroke-width:2}`,
    `.${scope} .jb-w .jb-pink{fill:${WHITE_PANEL.ink}}`,
    `.${scope} .jb-w .jb-psub{fill:${WHITE_PANEL.sub}}`,
    `.${scope} .jb-b .jb-panel{fill:var(--jb-blue-panel, ${BLUE_PANEL.panel});stroke:${BLUE_PANEL.edge};stroke-width:2}`,
    `.${scope} .jb-b .jb-pink{fill:${BLUE_PANEL.ink}}`,
    `.${scope} .jb-b .jb-psub{fill:${BLUE_PANEL.sub}}`,
    `.${scope} .jq-num{fill:#d9d8cf}`,
    `.${scope} .jq-numt{fill:#15181a}`,
    `.${scope} .jq-now{fill:var(--jb-now, #1d9a4a)}`,
    `.${scope} .jq-nowt{fill:#ffffff}`,
    `.${scope} .tb-ring{fill:none;stroke:rgba(0,0,0,.35);stroke-width:2}`,
    `.${scope} .tb-plain{fill:#d9d3c2}`,
    `.${scope} .tb-initials{fill:#1f2320}`,
    `.${scope} text{font-family:var(--jb-font, ${FONT});font-variant-numeric:tabular-nums}`,
  ].join("\n");
  const tail = extra ? `${fixed}\n${extra.replaceAll("$S", `.${scope}`)}` : fixed;
  if (theme === "light") return `${base(LIGHT, "")}\n${tail}`;
  if (theme === "dark") return `${base(DARK, "")}\n${tail}`;
  return `${base(LIGHT, "")}\n@media (prefers-color-scheme: dark){\n${base(DARK, ':root:not([data-theme="light"]) ')}\n}\n${base(DARK, ':root[data-theme="dark"] ')}\n${tail}`;
}

export interface Frame { W: number; H: number; v: Voice; scope: string; theme: "auto" | "light" | "dark"; ctx: MarkContext; options: JudoBoardOptions }

export function frameOf(options: JudoBoardOptions, seed: unknown): Frame {
  const v = voiceOf(options);
  const size = typeof options.size === "string" ? JUDO_BOARD_SIZES[options.size] : options.size ?? JUDO_BOARD_SIZES.tv;
  if (!size || !(size.width >= 200) || !(size.height >= 200)) throw new RangeError(`taisen-brackets: a size is "tv", "tablet", "tablet-tall" or { width, height } of 200 or more, not ${JSON.stringify(options.size)}`);
  const theme = options.theme ?? "auto";
  if (theme !== "auto" && theme !== "light" && theme !== "dark") throw new RangeError(`taisen-brackets: a theme is "auto", "light" or "dark", not ${JSON.stringify(theme)}`);
  const scope = options.id ?? `jb-${hash(JSON.stringify([seed, options.size, theme, options.swap, v.locale.code, options.flags ? 1 : 0, options.flagHref ? 1 : 0, options.title]))}`;
  const ctx: MarkContext = { radii: new Set(), symbols: new Map(), prefix: scope, shape: "round", theme: "inherit", flagCache: new Map(), ...(options.flags ? { flags: options.flags } : {}), ...(options.flagHref ? { flagHref: options.flagHref } : {}) };
  return { W: size.width, H: size.height, v, scope, theme, ctx, options };
}

export function wrap(f: Frame, title: string, desc: string, body: string[], label: string, extraCss = ""): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" lang="${esc(f.v.locale.code)}" class="taisen taisen-judo ${esc(f.scope)}${f.options.className ? ` ${esc(f.options.className)}` : ""}" viewBox="0 0 ${num(f.W)} ${num(f.H)}" width="${num(f.W)}" height="${num(f.H)}" style="max-width:100%;height:auto" role="img" aria-labelledby="${esc(f.scope)}-t ${esc(f.scope)}-d" data-board="${label}">`,
    `<title id="${esc(f.scope)}-t">${esc(title)}</title><desc id="${esc(f.scope)}-d">${esc(desc)}</desc>`,
    `<style>${sheetStyle(f.scope, f.theme, extraCss)}</style>`,
    markDefs(f.ctx) ? `<defs>${markDefs(f.ctx)}</defs>` : "",
    `<rect class="jb-bg" width="${num(f.W)}" height="${num(f.H)}"/>`,
    ...body,
    "</svg>",
  ].filter(Boolean).join("\n");
}

export const text = (x: number, y: number, size: number, content: string, cls: string, anchor: "start" | "middle" | "end" = "start", weight = 800, extra = ""): string =>
  `<text class="${cls}" x="${num(x)}" y="${num(y)}" font-size="${num(size)}" font-weight="${weight}" text-anchor="${anchor}"${extra}>${esc(content)}</text>`;

export const teamOf = (a: JudoAthlete, id: string): Team => ({ id, name: a.name, abbr: (a.code ?? a.name).slice(0, 3).toUpperCase(), ...(a.flag ? { flag: a.flag } : {}), ...(a.mark ? { mark: a.mark } : {}) });

export function check(a: JudoAthlete | undefined, side: string): void {
  if (!a || typeof a.name !== "string" || a.name.trim() === "") throw new RangeError(`taisen-brackets: the ${side} athlete needs a name`);
}

// ------------------------------------------------------------------------------------------------ the contest card

/** The contest card as a sentence, the drawing's description. */
export function describeJudoCard(contest: JudoCardContest, options: Pick<JudoBoardOptions, "locale" | "words"> = {}): string {
  const v = voiceOf(options);
  const w = v.words;
  const parts: string[] = [];
  if (contest.weight) parts.push(contest.weight);
  if (contest.round) parts.push(contest.round);
  if (contest.mat !== undefined) parts.push(fill(w.judoMat, { n: String(contest.mat) }));
  if (contest.contest !== undefined) parts.push(fill(w.judoContest, { n: String(contest.contest) }));
  parts.push(`${w.judoWhite}: ${contest.white.name}${contest.white.code ? ` (${contest.white.code})` : ""}`);
  parts.push(`${w.judoBlue}: ${contest.blue.name}${contest.blue.code ? ` (${contest.blue.code})` : ""}`);
  return parts.join(w.sep) + w.end;
}

/**
 * The contest card: the weight class and the round on top, then the white athlete over the blue one, each as a wide band with the flag, the name as big as the band lets it be,
 * and the country code. Throws a `RangeError` for an athlete with no name or a bad size or theme. `swap` draws blue first.
 */
export function judoContestCard(contest: JudoCardContest, options: JudoBoardOptions = {}): string {
  check(contest.white, "white");
  check(contest.blue, "blue");
  const f = frameOf(options, contest);
  const { W, H, v } = f;
  const w = v.words;
  const unit = Math.min(W, H);
  const pad = Math.round(unit * 0.025);
  const landscape = W >= H;
  const headH = Math.round(H * (landscape ? 0.15 : 0.1));
  const body: string[] = [];
  body.push(`<rect class="jb-band" x="0" y="0" width="${num(W)}" height="${num(headH)}"/>`);
  const hf = clampN(headH * 0.5, 14, 90);
  const where = [contest.mat !== undefined ? fill(w.judoMat, { n: String(contest.mat) }) : "", contest.contest !== undefined ? fill(w.judoContest, { n: String(contest.contest) }) : ""].filter(Boolean).join(" · ");
  const inner = W - pad * 2;
  const leftT = contest.weight ?? "";
  const rightT = contest.round ?? "";
  const midT = where;
  if (leftT) { const s = fitSize(leftT, hf, inner * 0.4, 0.5); body.push(text(pad, headH / 2 + s * 0.36, s, fit(leftT, s, inner * 0.4, bw), "jb-ink", "start")); }
  if (rightT) { const s = fitSize(rightT, hf, inner * 0.4, 0.5); body.push(text(W - pad, headH / 2 + s * 0.36, s, fit(rightT, s, inner * 0.4, bw), "jb-ink", "end")); }
  if (midT && landscape) { const s = fitSize(midT, hf * 0.7, inner * 0.28, 0.5); body.push(text(W / 2, headH / 2 + s * 0.36, s, fit(midT, s, inner * 0.28, bw), "jb-muted", "middle")); }
  const top = headH + pad;
  const avail = H - top - pad;
  const bandH = (avail - pad) / 2;
  const order = (options.swap ? [1, 0] : [0, 1]) as readonly (0 | 1)[];
  order.forEach((k, i) => {
    const a = k === 0 ? contest.white : contest.blue;
    const y = top + i * (bandH + pad);
    const g: string[] = [];
    g.push(`<rect class="jb-panel" x="${num(pad)}" y="${num(y)}" width="${num(W - pad * 2)}" height="${num(bandH)}" rx="${Math.round(unit * 0.014)}"/>`);
    const ip = Math.max(pad, bandH * 0.1);
    const flagD = Math.min(bandH - ip * 2, (W - pad * 2) * 0.22);
    g.push(drawMark(teamOf(a, k === 0 ? "white" : "blue"), pad + ip + flagD / 2, y + bandH / 2, flagD, f.ctx));
    const tx = pad + ip * 2 + flagD;
    const tw = W - pad - ip - tx;
    const codeH = a.code ? bandH * 0.2 : 0;
    const fl = fitLines(a.name, tw, bandH - ip * 2 - codeH - (a.code ? ip * 0.4 : 0), Math.min(bandH * 0.5, 220));
    const blockH = fl.height + (a.code ? ip * 0.4 + codeH : 0);
    let yy = y + (bandH - blockH) / 2;
    fl.lines.forEach((line, li) => g.push(text(tx, yy + fl.size * (li + 0.86), fl.size, fit(line, fl.size, tw + 1, bw), "jb-pink", "start")));
    yy += fl.height + ip * 0.4;
    if (a.code) g.push(text(tx, yy + codeH * 0.86, codeH, a.code, "jb-psub", "start", 800, ' letter-spacing=".1em"'));
    body.push(`<g class="${k === 0 ? "jb-w" : "jb-b"}">${g.join("")}</g>`);
  });
  const title = options.title ?? w.judoCardTitle;
  return wrap(f, title, describeJudoCard(contest, options), body, "card");
}

// ------------------------------------------------------------------------------------------------ the mat queue board

/** The mat queue as a sentence: for each mat, its contests in order. */
export function describeJudoQueue(mats: JudoMat | readonly JudoMat[], options: Pick<JudoBoardOptions, "locale" | "words"> = {}): string {
  const v = voiceOf(options);
  const w = v.words;
  const list = Array.isArray(mats) ? (mats as readonly JudoMat[]) : [mats as JudoMat];
  return list.map((m) => `${fill(w.judoMat, { n: String(m.mat) })}: ${m.contests.map((c) => `${c.number} ${fill(w.tieVs, { a: `${c.white.name} (${w.judoWhite})`, b: `${c.blue.name} (${w.judoBlue})` })}`).join("; ") || "-"}`).join(w.sep) + w.end;
}

/**
 * The mat queue board: for each mat a big number in the mat's colour and the contests to come, in order, each a row with the contest number, the white athlete and the blue
 * one (name, code, flag). The mats are in columns on a wide board and stacked on an upright one. A mat with more contests than fit is cut at `rows`. Throws a `RangeError`
 * for no mat, a mat with no number, a contest with no number or no athlete name, a colour that is not a hex code, or a bad size or theme.
 */
export function judoMatQueue(input: JudoMat | readonly JudoMat[], options: JudoQueueOptions = {}): string {
  const mats: readonly JudoMat[] = Array.isArray(input) ? (input as readonly JudoMat[]) : [input as JudoMat];
  if (mats.length === 0) throw new RangeError("taisen-brackets: a mat queue board needs at least one mat");
  if (mats.length > 8) throw new RangeError("taisen-brackets: a mat queue board draws eight mats at most");
  for (const m of mats) {
    if (m.mat === undefined || String(m.mat).trim() === "") throw new RangeError("taisen-brackets: every mat needs a number or a name");
    if (m.color !== undefined && !HEX.test(m.color)) throw new RangeError(`taisen-brackets: a mat's colour is a hex code ("#d2232a"), not ${JSON.stringify(m.color)}`);
    m.contests.forEach((c, i) => {
      if (c.number === undefined || String(c.number).trim() === "") throw new RangeError(`taisen-brackets: contest ${i + 1} of mat ${m.mat} needs a number`);
      check(c.white, `white of contest ${c.number}`);
      check(c.blue, `blue of contest ${c.number}`);
    });
  }
  if (options.rows !== undefined && !(Number.isInteger(options.rows) && options.rows >= 1 && options.rows <= 40)) throw new RangeError("taisen-brackets: rows is a whole number from 1 to 40");
  const palette = options.colors ?? JUDO_MAT_COLORS;
  for (const c of palette) if (!HEX.test(c)) throw new RangeError(`taisen-brackets: a mat colour is a hex code, not ${JSON.stringify(c)}`);
  const f = frameOf(options, mats);
  const { W, H, v } = f;
  const w = v.words;
  const unit = Math.min(W, H);
  const pad = Math.round(unit * 0.02);
  const n = mats.length;
  // As many columns as leave each mat room for its names: about six tenths of the short side.
  const cols = Math.max(1, Math.min(n, Math.floor((W - pad) / (unit * 0.62 + pad))));
  const rowsN = Math.ceil(n / cols);
  const title = options.title ?? w.judoQueueTitle;
  const body: string[] = [];
  const cellW = (W - pad * (cols + 1)) / cols;
  const cellH = (H - pad * (rowsN + 1)) / rowsN;
  const longest = Math.max(...mats.map((m) => m.contests.length), 1);
  const minRow = Math.max(36, unit * 0.045);
  const fits = Math.max(1, Math.floor(cellH / minRow));
  const capacity = Math.min(options.rows ?? 12, fits);
  const shown = Math.min(longest, capacity);
  const rowH = Math.min(cellH / Math.max(shown, 1), unit * 0.11);
  // The widest contest number in ems, so that every mat's number column is the same width.
  const widest = Math.max(...mats.flatMap((m) => m.contests.slice(0, shown).map((q) => emWidth(String(q.number)))), 1);
  mats.forEach((m, mi) => {
    const col = mi % cols, row = Math.floor(mi / cols);
    const x = pad + col * (cellW + pad), y = pad + row * (cellH + pad);
    const color = m.color ?? palette[mi % palette.length];
    const g: string[] = [];
    const stripW = Math.min(cellW * 0.12, cellH * 0.22 + 30);
    const rx = Math.round(unit * 0.012);
    g.push(`<rect x="${num(x)}" y="${num(y)}" width="${num(stripW)}" height="${num(cellH)}" rx="${rx}" style="fill:${color}"/>`);
    const label = String(m.mat);
    const ns = Math.min(stripW * 0.8, cellH * 0.5, (stripW - 12) / (label.length * 0.66));
    g.push(`<g><title>${esc(fill(w.judoMat, { n: label }))}</title><text x="${num(x + stripW / 2)}" y="${num(y + Math.min(cellH * 0.5, rowH * 2.2) / 2 + ns * 0.4)}" font-size="${num(ns)}" font-weight="800" text-anchor="middle" style="fill:${inkOn(color)}">${esc(label)}</text></g>`);
    const rx0 = x + stripW + pad * 0.5;
    const rowW = cellW - stripW - pad * 0.5;
    m.contests.slice(0, shown).forEach((c, ci) => {
      const ry = y + ci * rowH;
      const h = rowH - Math.max(2, rowH * 0.05);
      const current = (options.current ?? true) && ci === 0;
      const numFont = h * 0.4;
      const numW = Math.min(rowW * 0.26, Math.max(h * 1.2, widest * numFont * 1.04 + h * 0.35));
      g.push(`<rect class="${current ? "jq-now" : "jq-num"}" x="${num(rx0)}" y="${num(ry)}" width="${num(numW)}" height="${num(h)}"/>`);
      const nl = String(c.number);
      const ns2 = Math.min(numFont, (numW - 8) / (nl.length * 0.68));
      g.push(text(rx0 + numW / 2, ry + h / 2 + ns2 * 0.36, ns2, nl, current ? "jq-nowt" : "jq-numt", "middle"));
      const sideW = (rowW - numW) / 2;
      const sides: [0 | 1, number][] = [[options.swap ? 1 : 0, rx0 + numW], [options.swap ? 0 : 1, rx0 + numW + sideW]];
      sides.forEach(([k, sx], si) => {
        const a = k === 0 ? c.white : c.blue;
        const cls = k === 0 ? "jb-w" : "jb-b";
        const gg: string[] = [];
        gg.push(`<rect class="jb-panel" x="${num(sx)}" y="${num(ry)}" width="${num(sideW)}" height="${num(h)}" style="stroke-width:0"/>`);
        const u = Math.min(h, sideW * 0.27);
        const d = u * 0.56, ip = u * 0.16;
        const code = a.code ?? "";
        const cs = u * 0.26;
        const codeW = code ? bw(code, cs) + ip * 0.5 : 0;
        const flagX = si === 0 ? sx + sideW - ip - d / 2 : sx + ip + d / 2;
        gg.push(drawMark(teamOf(a, `${m.mat}-${c.number}-${k}`), flagX, ry + h / 2, d, f.ctx));
        // The first column (left): name, then code, then flag at the right edge; the second: flag at the left edge, then code, then name.
        const nameFont = Math.min(u * 0.36, 64);
        if (si === 0) {
          const avail = sideW - ip * 3 - d - codeW;
          const sz = fitSize(a.name, nameFont, avail, 0.3);
          gg.push(text(sx + ip, ry + h / 2 + sz * 0.36, sz, fit(a.name, sz, avail + 1, bw), "jb-pink", "start"));
          if (code) gg.push(text(sx + sideW - ip * 1.5 - d, ry + h / 2 + cs * 0.36, cs, code, "jb-psub", "end"));
        } else {
          const nx = sx + ip * 1.5 + d + codeW + ip * 0.5;
          const avail = sx + sideW - ip - nx;
          const sz = fitSize(a.name, nameFont, avail, 0.3);
          if (code) gg.push(text(sx + ip * 1.5 + d, ry + h / 2 + cs * 0.36, cs, code, "jb-psub", "start"));
          gg.push(text(nx, ry + h / 2 + sz * 0.36, sz, fit(a.name, sz, avail + 1, bw), "jb-pink", "start"));
        }
        g.push(`<g class="${cls}">${gg.join("")}</g>`);
      });
    });
    body.push(`<g class="jq-mat">${g.join("")}</g>`);
  });
  return wrap(f, title, describeJudoQueue(mats, options), body, "queue");
}
