/**
 * The scoreboard of one judo contest as a static SVG for a given state: the two athletes (white and blue) with their flags and codes, the ippon, waza-ari and yuko
 * counters, the shido cards, the contest clock, the golden score badge, the osaekomi timer, the weight class, the round and the mat. Live updating is the caller's job:
 * draw again with the new state. A pure function of its input and options, like every drawing here.
 */
import type { DrawOptions, Locale, Team, ThemeName, Words } from "./types.ts";
import { type JudoMethod, type JudoOutcome, type JudoSide, judoClock, judoOutcome, judoSeconds } from "./judo-model.ts";
import { judoMethodWord, judoSideLong } from "./judo-text.ts";
import { fill, voiceOf, type Voice } from "./locales.ts";
import { type MarkContext, drawMark, markDefs } from "./marks.ts";
import { JUDO_COLORS } from "./theme.ts";
import { capitals, emWidth, esc, fit, fitLines, hash, num } from "./text.ts";

/** One athlete on the scoreboard. Only `name` is needed. */
export interface JudoAthlete {
  name: string;
  /** The country's three letters (`JPN`), written big under the name. Left out, nothing is written. */
  code?: string;
  /** A country code for the `flags` renderer (`jp`, `GB-ENG`: Hata's round flags are one line). With none, the flag is the code (or the initials) on a tile. */
  flag?: string;
  /** A mark of your own (an image address or inline SVG) in place of a flag. */
  mark?: string;
  /** The coach's name, written small under the code when `coaches` is on. */
  coach?: string;
}

/** The state of a contest: who is on the mat, what has been scored, and the clock. */
export interface JudoContest {
  white: JudoAthlete;
  blue: JudoAthlete;
  /** What each side has scored, white first. Left out, nothing yet. */
  sides?: readonly [JudoSide, JudoSide];
  /** The contest clock as it is shown: seconds (`222`) or `"3:42"`. */
  clock?: number | string;
  /** The contest is in golden score. */
  goldenScore?: boolean;
  /** An osaekomi in progress: the side holding (0 white, 1 blue) and the seconds so far (0 to 20; 5 is yuko, 10 waza-ari, 20 ippon). */
  osaekomi?: { side: 0 | 1; seconds: number };
  /** The weight class as a heading (`judoCategoryLabel`), the round ("Final", `roundName`), the mat (`1`, shown as "Mat 1") and the contest number (`"G-24"`). */
  weight?: string;
  round?: string;
  mat?: string | number;
  contest?: string | number;
  /** The contest is over: a lead on the scores then wins by decision. An ippon, waza-ari-awasete-ippon, hansoku-make, fusen-gachi or kiken-gachi ends it by itself. */
  finished?: boolean;
  /** How it ended, for what the scores cannot say (see `JudoResult.method`), and who won a default (`0` white, `1` blue). */
  method?: JudoMethod;
  winner?: 0 | 1;
  /** A direct hansoku-make: the side (0 white, 1 blue) that was given it. */
  hansokuMake?: 0 | 1;
}

export type JudoBoardSizeName = "tv" | "tablet" | "tablet-tall";

/** The sizes: a TV's 1920 by 1080, a tablet on its side, 1280 by 800, and a tablet held upright, 800 by 1280. */
export const JUDO_BOARD_SIZES: Readonly<Record<JudoBoardSizeName, { width: number; height: number }>> = Object.freeze({
  tv: { width: 1920, height: 1080 },
  tablet: { width: 1280, height: 800 },
  "tablet-tall": { width: 800, height: 1280 },
});

export interface JudoBoardOptions {
  /** `tv` (the default), `tablet`, `tablet-tall`, or a size of your own: a wider-than-tall one lays the sides out left and right, a taller one top and bottom. */
  size?: JudoBoardSizeName | { width: number; height: number };
  /** `auto` follows the page's light or dark; the athletes' panels are the colours of the judogi either way. Default `auto`. */
  theme?: Exclude<ThemeName, "poster" | "none">;
  /** `board` (the default): two panels with the counters as tiles, like a screen scoreboard. `flip`: a row of ring-bound flip cards on a stand for each side, one card to a counter (ippon, waza-ari, yuko, shido, hansoku-make) with its label printed on it, like a table-top scoreboard. */
  style?: "board" | "flip";
  /** Draw blue first (on the left, or at the top) in place of white. Default false. */
  swap?: boolean;
  /** Write each athlete's coach under the code. Default true. */
  coaches?: boolean;
  /** Draws a country's flag from its code, as for `drawBracket`: a synchronous function from a code and `{ shape, size, theme }` to an SVG string, such as one made from `@johnmorrisdotca/hata`. */
  flags?: DrawOptions["flags"];
  /** The address of a flag as a picture to load, tried where `flags` gives none. */
  flagHref?: DrawOptions["flagHref"];
  /** The language: `en`, `fr`, `ja`, `es`, `de` or a `Locale`. */
  locale?: string | Locale;
  words?: Partial<Words>;
  /** The `<title>` of the drawing. Default the language's "Judo contest scoreboard". */
  title?: string;
  /** Prefix for the drawing's ids. Default: a hash of the state and the options. */
  id?: string;
  className?: string;
}

export const clampN = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
export const bw = (text: string, size: number): number => emWidth(text) * size;

export interface Palette { bg: string; ink: string; muted: string; band: string; box: string; boxInk: string; gold: string }
export const LIGHT: Palette = { bg: "#ecebe4", ink: "#1b1e1c", muted: "#585d57", band: "#dcdad0", box: "#141716", boxInk: "#f4f1e6", gold: "#e0b43b" };
export const DARK: Palette = { bg: "#0e1011", ink: "#eceae0", muted: "#9aa097", band: "#1b1f21", box: "#050606", boxInk: "#f4f1e6", gold: "#e0b43b" };
export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Hiragino Sans", "Yu Gothic UI", "Noto Sans CJK JP", Meiryo, sans-serif';

/** The panels' own colours: the white and the blue judogi, the ink and the tiles on each. White on #1f4fa8 reads 8 to 1, and the dark ink on the white panel more. */
export const WHITE_PANEL = { panel: "#f7f6f1", ink: "#15181a", sub: "#464b50", tile: "#e0dfd6", edge: "#bdbbae" };
export const BLUE_PANEL = { panel: JUDO_COLORS.blue, ink: "#ffffff", sub: "#dbe5fa", tile: "#173b86", edge: "#0f2a63" };

export function rulesFor(p: Palette, scope: string, side: string): string {
  const s = (sel: string, body: string) => `${side}${scope} ${sel}{${body}}`;
  const v = (name: string, value: string) => `var(--jb-${name}, ${value})`;
  return [
    s(".jb-bg", `fill:${v("bg", p.bg)}`),
    s(".jb-band", `fill:${v("band", p.band)}`),
    s(".jb-ink", `fill:${v("ink", p.ink)}`),
    s(".jb-muted", `fill:${v("muted", p.muted)}`),
    s(".jb-box", `fill:${v("box", p.box)}`),
    s(".jb-boxink", `fill:${v("box-ink", p.boxInk)}`),
    s(".jb-gold", `fill:${v("gold", p.gold)}`),
    s(".jb-goldbox", `fill:${v("gold", p.gold)}`),
    s(".jb-win", `fill:none;stroke:${v("gold", p.gold)};stroke-width:6`),
    s(".jb-clockedge", `fill:none;stroke:${v("gold", p.gold)};stroke-width:3`),
  ].join("\n");
}

/** The panels' rules and the small fixed-colour parts, the same in every theme. */
function fixedRules(scope: string): string {
  return [
    `.${scope} .jb-w .jb-panel{fill:var(--jb-white-panel, ${WHITE_PANEL.panel});stroke:${WHITE_PANEL.edge};stroke-width:2}`,
    `.${scope} .jb-w .jb-pink{fill:${WHITE_PANEL.ink}}`,
    `.${scope} .jb-w .jb-psub{fill:${WHITE_PANEL.sub}}`,
    `.${scope} .jb-w .jb-tile{fill:${WHITE_PANEL.tile}}`,
    `.${scope} .jb-w .jb-tile.jb-on{stroke:#8a6a00;stroke-width:4}`,
    `.${scope} .jb-w .jb-slot{fill:none;stroke:#8d9196;stroke-width:2}`,
    `.${scope} .jb-w .jb-fillside{fill:${WHITE_PANEL.panel}}`,
    `.${scope} .jb-b .jb-panel{fill:var(--jb-blue-panel, ${BLUE_PANEL.panel});stroke:${BLUE_PANEL.edge};stroke-width:2}`,
    `.${scope} .jb-b .jb-pink{fill:${BLUE_PANEL.ink}}`,
    `.${scope} .jb-b .jb-psub{fill:${BLUE_PANEL.sub}}`,
    `.${scope} .jb-b .jb-tile{fill:${BLUE_PANEL.tile}}`,
    `.${scope} .jb-b .jb-tile.jb-on{stroke:#ffd84d;stroke-width:4}`,
    `.${scope} .jb-b .jb-slot{fill:none;stroke:#9db5ea;stroke-width:2}`,
    `.${scope} .jb-b .jb-fillside{fill:#4a86f5}`,
    `.${scope} .jb-sy{fill:var(--jb-shido, ${JUDO_COLORS.shido})}`,
    `.${scope} .jb-sr{fill:var(--jb-hansoku, ${JUDO_COLORS.hansoku})}`,
    `.${scope} .jb-card{fill:#ffffff;stroke:#b4b4ac;stroke-width:2}`,
    `.${scope} .jb-w .jb-lowflap{fill:#ffffff}`,
    `.${scope} .jb-b .jb-lowflap{fill:${BLUE_PANEL.panel}}`,
    `.${scope} .jb-hinge{stroke:#9a9a92;stroke-width:2}`,
    `.${scope} .jb-w .jb-num{fill:#15181a}`,
    `.${scope} .jb-b .jb-num{fill:${BLUE_PANEL.panel}}`,
    `.${scope} .jb-zero{opacity:.38}`,
    `.${scope} .jb-w .jb-lab{fill:#15181a}`,
    `.${scope} .jb-b .jb-lab{fill:#ffffff}`,
    `.${scope} .jb-ringbind{fill:none;stroke:#7d8186;stroke-width:3;stroke-linecap:round}`,
    `.${scope} .jb-stand{fill:#cbcbc3;stroke:#a5a59d;stroke-width:2}`,
    `.${scope} .jb-base{fill:#e4e4de;stroke:#a5a59d;stroke-width:2}`,
    `.${scope} .jb-track{fill:#2c3234}`,
    `.${scope} .jb-tick{stroke:#8f979a;stroke-width:2}`,
    `.${scope} .tb-ring{fill:none;stroke:rgba(0,0,0,.35);stroke-width:2}`,
    `.${scope} .tb-plain{fill:#d9d3c2}`,
    `.${scope} .tb-initials{fill:#1f2320}`,
    `.${scope} text{font-family:var(--jb-font, ${FONT});font-variant-numeric:tabular-nums}`,
  ].join("\n");
}

/** The `<style>` text: the frame's colours by theme, the panels' fixed ones. Every colour is a custom property with a fallback (`--jb-bg`, `--jb-ink`, `--jb-blue-panel` and so on). */
function styleFor(scope: string, theme: "auto" | "light" | "dark"): string {
  const base = (p: Palette, before: string) => rulesFor(p, `.${scope}`, before);
  const fixed = fixedRules(scope);
  if (theme === "light") return `${base(LIGHT, "")}\n${fixed}`;
  if (theme === "dark") return `${base(DARK, "")}\n${fixed}`;
  return `${base(LIGHT, "")}\n@media (prefers-color-scheme: dark){\n${base(DARK, ':root:not([data-theme="light"]) ')}\n}\n${base(DARK, ':root[data-theme="dark"] ')}\n${fixed}`;
}

const mmss = (seconds: number): string => judoClock(seconds);

/** The outcome of the state: who has won and how, from the scores, or `null` while nothing has ended it (a lead wins by decision only once `finished`). */
function resultOf(c: JudoContest): JudoOutcome {
  const sides = c.sides ?? [{}, {}];
  return judoOutcome({ sides, ...(c.method ? { method: c.method } : {}), ...(c.hansokuMake !== undefined ? { hansokuMake: c.hansokuMake } : {}), ...(c.goldenScore ? { goldenScore: true } : {}) }, c.winner ?? null);
}

/** The words of the state in a sentence, for the drawing's description. */
export function describeJudoContest(contest: JudoContest, options: Pick<JudoBoardOptions, "locale" | "words"> = {}): string {
  const v = voiceOf(options);
  const w = v.words;
  const out = resultOf(contest);
  const parts: string[] = [];
  if (contest.weight) parts.push(contest.weight);
  if (contest.round) parts.push(contest.round);
  if (contest.mat !== undefined) parts.push(fill(w.judoMat, { n: String(contest.mat) }));
  if (contest.contest !== undefined) parts.push(fill(w.judoContest, { n: String(contest.contest) }));
  ([0, 1] as const).forEach((k) => {
    const a = k === 0 ? contest.white : contest.blue;
    parts.push(`${k === 0 ? w.judoWhite : w.judoBlue}: ${a.name}${a.code ? ` (${a.code})` : ""}, ${judoSideLong(out.sides[k], v)}${out.sides[k].shido ? `, ${fill(w.judoShidoOf, { name: w.judoShido, n: v.number(out.sides[k].shido) })}` : ""}`);
  });
  if (contest.clock !== undefined) parts.push(mmss(judoSeconds(contest.clock) ?? 0));
  if (contest.goldenScore) parts.push(w.judoGoldenLong);
  if (contest.osaekomi) parts.push(`${w.judoOsaekomi} ${v.number(contest.osaekomi.seconds)} (${contest.osaekomi.side === 0 ? w.judoWhite : w.judoBlue})`);
  const winner = winnerOf(contest, out);
  if (winner !== null) parts.push(fill(w.winnerIs, { name: (winner === 0 ? contest.white : contest.blue).name }) + (out.method ? ` (${judoMethodWord(out.method, v)})` : ""));
  return parts.join(w.sep) + w.end;
}

/** The winner to show: the outcome's, but a lead on the scores only counts once the contest is finished. */
function winnerOf(c: JudoContest, out: JudoOutcome): 0 | 1 | null {
  if (out.winner === null) return null;
  if (out.method === "score" && c.finished !== true) return null;
  return out.winner;
}

/**
 * The scoreboard of a contest as an SVG string. Throws a `RangeError` for a state that cannot be (two ippon, a third waza-ari, a clock that is not seconds or `m:ss`, an osaekomi
 * past 20 seconds is clamped to 20).
 */
export function judoScoreboard(contest: JudoContest, options: JudoBoardOptions = {}): string {
  const v = voiceOf(options);
  const w = v.words;
  const named = typeof options.size === "string" ? JUDO_BOARD_SIZES[options.size] : options.size ?? JUDO_BOARD_SIZES.tv;
  if (!named || !(named.width >= 200) || !(named.height >= 200)) throw new RangeError(`taisen-brackets: a scoreboard size is "tv", "tablet", "tablet-tall" or { width, height } of 200 or more, not ${JSON.stringify(options.size)}`);
  const W = named.width, H = named.height;
  const theme = options.theme ?? "auto";
  if (theme !== "auto" && theme !== "light" && theme !== "dark") throw new RangeError(`taisen-brackets: a scoreboard theme is "auto", "light" or "dark", not ${JSON.stringify(theme)}`);
  if (options.style !== undefined && options.style !== "board" && options.style !== "flip") throw new RangeError(`taisen-brackets: a scoreboard style is "board" or "flip", not ${JSON.stringify(options.style)}`);
  const out = resultOf(contest);
  const winner = winnerOf(contest, out);
  const clockSeconds = judoSeconds(contest.clock);
  const osa = contest.osaekomi;
  if (osa && (!(osa.side === 0 || osa.side === 1) || !Number.isFinite(osa.seconds) || osa.seconds < 0)) throw new RangeError("taisen-brackets: osaekomi is { side: 0 | 1, seconds } with seconds from 0");
  const prefix = options.id ?? `jb-${hash(JSON.stringify([contest, options.size, options.style, theme, options.swap, options.coaches, v.locale.code, options.flags ? 1 : 0, options.flagHref ? 1 : 0, options.title]))}`;
  const ctx: MarkContext = { radii: new Set(), symbols: new Map(), prefix, shape: "round", theme: "inherit", flagCache: new Map(), ...(options.flags ? { flags: options.flags } : {}), ...(options.flagHref ? { flagHref: options.flagHref } : {}) };
  const landscape = W >= H;
  const unit = Math.min(W, H);
  const pad = Math.round(unit * (landscape ? 0.02 : 0.025));
  const headH = Math.round(H * (landscape ? 0.11 : 0.085));
  const footH = Math.round(H * (landscape ? 0.1 : 0.065));
  const body: string[] = [];
  const t = (x: number, y: number, size: number, text: string, cls: string, anchor: "start" | "middle" | "end" = "start", weight = 800, extra = ""): string =>
    `<text class="${cls}" x="${num(x)}" y="${num(y)}" font-size="${num(size)}" font-weight="${weight}" text-anchor="${anchor}"${extra}>${esc(text)}</text>`;

  // ---- The header: weight class, round, mat and contest number on a band.
  body.push(`<rect class="jb-band" x="0" y="0" width="${num(W)}" height="${num(headH)}"/>`);
  const headFont = clampN(headH * 0.46, 14, 64);
  const headMid = headH / 2 + headFont * 0.36;
  const where = [contest.mat !== undefined ? fill(w.judoMat, { n: String(contest.mat) }) : "", contest.contest !== undefined ? fill(w.judoContest, { n: String(contest.contest) }) : ""].filter(Boolean).join(" · ");
  const leftText = contest.weight ?? "";
  const midText = contest.round ?? "";
  const rightText = where;
  const inner = W - pad * 2;
  if (landscape) {
    if (leftText) body.push(t(pad, headMid, fitSize(leftText, headFont, inner * 0.34, 0.5), fit(leftText, fitSize(leftText, headFont, inner * 0.34, 0.5), inner * 0.34, bw), "jb-ink", "start", 800));
    if (midText) body.push(t(W / 2, headMid, fitSize(midText, headFont, inner * 0.2, 0.5), fit(midText, fitSize(midText, headFont, inner * 0.2, 0.5), inner * 0.2, bw), "jb-ink", "middle", 800));
    if (rightText) body.push(t(W - pad, headMid, fitSize(rightText, headFont, inner * 0.4, 0.5), fit(rightText, fitSize(rightText, headFont, inner * 0.4, 0.5), inner * 0.4, bw), "jb-muted", "end", 800));
  } else {
    const first = [leftText, midText].filter(Boolean).join(" · ");
    const f1 = headFont * 0.82, f2 = headFont * 0.62;
    if (first) body.push(t(pad, headH * 0.46, fitSize(first, f1, W - pad * 2), fit(first, f1, W - pad * 2, bw), "jb-ink", "start", 800));
    if (rightText) body.push(t(pad, headH * 0.46 + f2 * 1.25, fitSize(rightText, f2, W - pad * 2), fit(rightText, f2, W - pad * 2, bw), "jb-muted", "start", 800));
  }

  // ---- The areas.
  const top = headH + pad;
  const bottom = H - footH - pad;
  const availH = bottom - top;
  const [firstSide, secondSide] = (options.swap ? [1, 0] : [0, 1]) as readonly [0 | 1, 0 | 1];
  let rectA: R, rectB: R, rectC: R;
  if (landscape) {
    const cw = Math.round((W - pad * 4) * (options.style === "flip" ? 0.2 : 0.24));
    const pw = Math.round((W - pad * 4 - cw) / 2);
    rectA = { x: pad, y: top, w: pw, h: availH };
    rectC = { x: pad * 2 + pw, y: top, w: cw, h: availH };
    rectB = { x: pad * 3 + pw + cw, y: top, w: pw, h: availH };
  } else {
    const ch = Math.round((availH - pad * 2) * 0.24);
    const ph = Math.round((availH - pad * 2 - ch) / 2);
    rectA = { x: pad, y: top, w: W - pad * 2, h: ph };
    rectC = { x: pad, y: top + ph + pad, w: W - pad * 2, h: ch };
    rectB = { x: pad, y: top + ph + pad * 2 + ch, w: W - pad * 2, h: ph };
  }

  /** The name block: the flag, the name, the code and the coach, in a box `inner` wide whose top `nameH` it fills. */
  const nameBlock = (g: string[], inner: R, nameH: number, a: JudoAthlete, k: 0 | 1): void => {
    const flagD = Math.min(nameH * 0.84, inner.w * 0.24);
    const fx = inner.x + flagD / 2, fy = inner.y + nameH / 2;
    const team: Team = { id: k, name: a.name, abbr: (a.code ?? a.name).slice(0, 3).toUpperCase(), ...(a.flag ? { flag: a.flag } : {}), ...(a.mark ? { mark: a.mark } : {}) };
    g.push(drawMark(team, fx, fy, flagD, ctx));
    const tx = inner.x + flagD + inner.w * 0.035;
    const tw = inner.x + inner.w - tx;
    const showCoach = (options.coaches ?? true) && !!a.coach;
    const lines = (a.code ? 1 : 0) + (showCoach ? 1 : 0);
    const nameMaxH = nameH * (lines === 0 ? 1 : lines === 1 ? 0.62 : 0.5);
    const fl = fitLines(a.name, tw, nameMaxH, Math.min(nameH * 0.5, 120));
    const blockH = fl.height + (a.code ? nameH * 0.28 : 0) + (showCoach ? nameH * 0.17 : 0);
    let y = inner.y + (nameH - blockH) / 2;
    fl.lines.forEach((line, i) => {
      g.push(t(tx, y + fl.size * (i + 0.86), fl.size, fit(line, fl.size, tw + 1, bw), "jb-pink", "start", 800));
    });
    y += fl.height;
    if (a.code) {
      const cs = nameH * 0.24;
      g.push(t(tx, y + cs * 1.05, cs, a.code, "jb-psub", "start", 800, ' letter-spacing=".08em"'));
      y += nameH * 0.28;
    }
    if (showCoach) {
      const cs = nameH * 0.13;
      g.push(t(tx, y + cs * 1.05, cs, fit(fill(w.judoCoach, { name: a.coach! }), cs, tw, bw), "jb-psub", "start", 600));
    }
  };

  const sideOf = (k: 0 | 1) => (k === 0 ? contest.white : contest.blue);
  const panel = (rect: R, k: 0 | 1): void => {
    const a = sideOf(k);
    const s = out.sides[k];
    const cls = k === 0 ? "jb-w" : "jb-b";
    const g: string[] = [];
    const rx = Math.round(unit * 0.012);
    g.push(`<rect class="jb-panel" x="${num(rect.x)}" y="${num(rect.y)}" width="${num(rect.w)}" height="${num(rect.h)}" rx="${rx}"/>`);
    const ip = Math.max(pad, rect.w * 0.03);
    const inner: R = { x: rect.x + ip, y: rect.y + ip, w: rect.w - ip * 2, h: rect.h - ip * 2 };
    const wideP = inner.w / inner.h > 1.4;
    const nameH = inner.h * (wideP ? 0.37 : 0.34), cntH = inner.h * (wideP ? 0.4 : 0.43), shidoH = inner.h - nameH - cntH;
    nameBlock(g, inner, nameH, a, k);
    // The counters: ippon, waza-ari, yuko, each a tile with its label and a big number.
    const gap = Math.max(8, inner.w * 0.025);
    const tileW = (inner.w - gap * 2) / 3;
    const tileY = inner.y + nameH;
    const tileH = cntH - gap;
    const counters: [string, number, boolean][] = [[w.judoIpponLong, s.ippon ? 1 : 0, s.ippon], [w.judoWazaAriLong, s.wazaAri, s.wazaAri > 0], [w.judoYukoLong, s.yuko, s.yuko > 0]];
    counters.forEach(([label, n, on], i) => {
      const x0 = inner.x + i * (tileW + gap);
      g.push(`<rect class="jb-tile${on ? " jb-on" : ""}" x="${num(x0)}" y="${num(tileY)}" width="${num(tileW)}" height="${num(tileH)}" rx="${num(rx)}"/>`);
      const ls = clampN(tileH * 0.13, 11, 38);
      const labelText = capitals(label);
      const lsz = fitSize(labelText, ls, tileW - 16, 0.4);
      g.push(t(x0 + tileW / 2, tileY + ls * 1.45, lsz, fit(labelText, lsz, tileW - 12, bw), "jb-psub", "middle", 800, ' letter-spacing=".03em"'));
      const ds = Math.min(tileH * 0.62, tileW * 0.78);
      g.push(t(x0 + tileW / 2, tileY + tileH - (tileH - ls * 1.7 - ds * 0.72) / 2, ds, v.number(n), "jb-pink", "middle", 800));
    });
    // The shido: three slots, a yellow card for each, and the third (hansoku-make) red.
    const sy = inner.y + nameH + cntH;
    const cards: ("y" | "r" | null)[] = [null, null, null];
    const n = s.shido;
    for (let i = 0; i < Math.min(n, 3); i++) cards[i] = i === 2 ? "r" : "y";
    // A direct hansoku-make is a red card on the side given it.
    if (out.method === "hansoku-make" && out.winner !== null && out.winner !== k && n < 3) cards[2] = "r";
    const labelS = clampN(shidoH * 0.34, 11, 34);
    const slotH = Math.min(shidoH * 0.62, 60), slotW = slotH * 0.72;
    const sx0 = inner.x;
    g.push(t(sx0, sy + shidoH / 2 + labelS * 0.35, labelS, capitals(w.judoShido), "jb-psub", "start", 800, ' letter-spacing=".08em"'));
    const startX = inner.x + inner.w - (slotW * 3 + gap * 2);
    cards.forEach((c, i) => {
      const x0 = startX + i * (slotW + gap);
      const y0 = sy + (shidoH - slotH) / 2;
      g.push(c ? `<rect class="${c === "r" ? "jb-sr" : "jb-sy"}" x="${num(x0)}" y="${num(y0)}" width="${num(slotW)}" height="${num(slotH)}" rx="${num(slotW * 0.12)}"/>` : `<rect class="jb-slot" x="${num(x0)}" y="${num(y0)}" width="${num(slotW)}" height="${num(slotH)}" rx="${num(slotW * 0.12)}"/>`);
    });
    if (winner === k) g.push(`<rect class="jb-win" x="${num(rect.x + 3)}" y="${num(rect.y + 3)}" width="${num(rect.w - 6)}" height="${num(rect.h - 6)}" rx="${rx}"/>`);
    body.push(`<g class="${cls}${winner === k ? " jb-winner" : ""}">${g.join("")}</g>`);
  };

  /** A hansoku-make on the side: the third shido, or a direct one (the other side won by it); both sides on a double. */
  const hansokuOf = (k: 0 | 1): boolean => out.sides[k].shido >= 3 || (out.method === "hansoku-make" && out.winner !== null && out.winner !== k);

  /** The flip-card style: a row of ring-bound cards on a stand for each side, one card to a counter, the label printed on the card. */
  const flipGroup = (rect: R, k: 0 | 1): void => {
    const a = sideOf(k);
    const s = out.sides[k];
    const cls = k === 0 ? "jb-w" : "jb-b";
    const g: string[] = [];
    const rx = Math.round(unit * 0.012);
    const plateH = rect.h * (landscape ? 0.26 : 0.3);
    g.push(`<rect class="jb-panel" x="${num(rect.x)}" y="${num(rect.y)}" width="${num(rect.w)}" height="${num(plateH)}" rx="${rx}"/>`);
    const ip = Math.max(pad * 0.8, rect.w * 0.025);
    nameBlock(g, { x: rect.x + ip, y: rect.y + ip * 0.6, w: rect.w - ip * 2, h: plateH - ip * 1.2 }, plateH - ip * 1.2, a, k);
    const cards: [string, number, string][] = [
      [w.judoIpponLong, s.ippon ? 1 : 0, "ippon"], [w.judoWazaAriLong, s.wazaAri, "waza"], [w.judoYukoLong, s.yuko, "yuko"], [w.judoShido, s.shido, "shido"], [w.judoMethodHansoku, hansokuOf(k) ? 1 : 0, "hansoku"],
    ];
    const gap = rect.w * 0.018;
    const side = rect.w * 0.035;
    const cw = (rect.w - side * 2 - gap * (cards.length - 1)) / cards.length;
    const ringH = Math.min(cw * 0.22, 30);
    const areaY = rect.y + plateH + pad, areaH = rect.h - plateH - pad;
    const baseH = Math.max(14, Math.min(areaH * 0.07, 40));
    const ch = Math.min(areaH * 0.78 - baseH - ringH, cw * 2.05);
    const standH = ringH + ch + baseH + ch * 0.1;
    const standY = areaY + (areaH - standH) / 2;
    // The stand: a back plate the cards hang on, and the base in front of it.
    g.push(`<rect class="jb-stand" x="${num(rect.x)}" y="${num(standY)}" width="${num(rect.w)}" height="${num(standH - baseH * 0.5)}" rx="${rx}"/>`);
    g.push(`<rect class="jb-base" x="${num(rect.x - rect.w * 0.012)}" y="${num(standY + standH - baseH)}" width="${num(rect.w * 1.024)}" height="${num(baseH)}" rx="${num(baseH * 0.3)}"/>`);
    const cy = standY + ringH + ch * 0.06;
    cards.forEach(([label, n, id], i) => {
      const x0 = rect.x + side + i * (cw + gap);
      const topH = ch * 0.58, lowH = ch - topH;
      const on = n > 0;
      g.push(`<rect class="jb-card${on ? " jb-oncard" : ""}" x="${num(x0)}" y="${num(cy)}" width="${num(cw)}" height="${num(ch)}" rx="${num(cw * 0.06)}"/>`);
      g.push(`<path class="jb-lowflap" d="M${num(x0)} ${num(cy + topH)}H${num(x0 + cw)}V${num(cy + ch - cw * 0.06)}Q${num(x0 + cw)} ${num(cy + ch)} ${num(x0 + cw - cw * 0.06)} ${num(cy + ch)}H${num(x0 + cw * 0.06)}Q${num(x0)} ${num(cy + ch)} ${num(x0)} ${num(cy + ch - cw * 0.06)}Z"/>`);
      g.push(`<line class="jb-hinge" x1="${num(x0)}" x2="${num(x0 + cw)}" y1="${num(cy + topH)}" y2="${num(cy + topH)}"/>`);
      // Two rings through the top edge.
      for (const fx of [0.28, 0.72]) g.push(`<path class="jb-ringbind" d="M${num(x0 + cw * fx - ringH * 0.32)} ${num(cy + ringH * 0.2)}V${num(cy - ringH * 0.55)}a${num(ringH * 0.32)} ${num(ringH * 0.32)} 0 0 1 ${num(ringH * 0.64)} 0V${num(cy + ringH * 0.2)}"/>`);
      const ds = Math.min(topH * 0.82, cw * 0.95);
      g.push(`<text class="jb-num${on ? "" : " jb-zero"}" x="${num(x0 + cw / 2)}" y="${num(cy + topH / 2 + ds * 0.36)}" font-size="${num(ds)}" font-weight="800" text-anchor="middle">${esc(v.number(n))}</text>`);
      const lt = capitals(label);
      const lines = labelLines(lt, cw - 10, lowH - 10);
      lines.lines.forEach((line, li) => g.push(`<text class="jb-lab" x="${num(x0 + cw / 2)}" y="${num(cy + topH + (lowH - lines.height) / 2 + lines.size * (li + 0.88))}" font-size="${num(lines.size)}" font-weight="800" text-anchor="middle">${esc(line)}</text>`));
      void id;
    });
    // The group is as tall as its plate and its stand, and sits in the middle of the room it has.
    const contentH = standY + standH - rect.y;
    const dy = Math.max(0, (rect.h - contentH) / 2);
    if (winner === k) g.push(`<rect class="jb-win" x="${num(rect.x - 3)}" y="${num(rect.y - 3)}" width="${num(rect.w + 6)}" height="${num(contentH + 6)}" rx="${rx}"/>`);
    body.push(`<g class="${cls}${winner === k ? " jb-winner" : ""}" transform="translate(0 ${num(dy)})">${g.join("")}</g>`);
  };

  const place = options.style === "flip" ? flipGroup : panel;
  place(rectA, firstSide);
  place(rectB, secondSide);

  // ---- The centre: golden score, the clock and the osaekomi timer.
  const c: string[] = [];
  const clockText = clockSeconds === null ? "–:––" : mmss(clockSeconds);
  const goldH = rectC.h * (landscape ? 0.1 : 0.2);
  const rxC = Math.round(unit * 0.012);
  if (landscape) {
    const clockH = rectC.h * 0.38;
    const osaY = rectC.y + goldH + pad + clockH + pad;
    const osaH = rectC.y + rectC.h - osaY;
    c.push(...goldenBadge(rectC.x, rectC.y, rectC.w, goldH, contest.goldenScore === true, w.judoGoldenLong, rxC));
    c.push(...clockBox(rectC.x, rectC.y + goldH + pad, rectC.w, clockH, clockText, contest.goldenScore === true, rxC));
    c.push(...osaekomiBox({ x: rectC.x, y: osaY, w: rectC.w, h: osaH }, osa, [firstSide, secondSide], v, rxC, true));
  } else {
    const stripH = rectC.h;
    const gh = stripH * 0.2;
    const clockW = rectC.w * 0.5;
    c.push(...goldenBadge(rectC.x, rectC.y, clockW, gh, contest.goldenScore === true, w.judoGoldenLong, rxC));
    c.push(...clockBox(rectC.x, rectC.y + gh + pad / 2, clockW, stripH - gh - pad / 2, clockText, contest.goldenScore === true, rxC));
    c.push(...osaekomiBox({ x: rectC.x + clockW + pad, y: rectC.y, w: rectC.w - clockW - pad, h: stripH }, osa, [firstSide, secondSide], v, rxC, false));
  }
  body.push(`<g class="jb-centre">${c.join("")}</g>`);

  // ---- The foot: the result, once there is one.
  body.push(`<rect class="jb-band" x="0" y="${num(H - footH)}" width="${num(W)}" height="${num(footH)}"/>`);
  if (winner !== null) {
    const name = (winner === 0 ? contest.white : contest.blue).name;
    const how = out.method ? judoMethodWord(out.method, v) : "";
    const text = `${fill(w.winnerIs, { name })}${how ? ` · ${how}` : ""}${contest.goldenScore ? ` · ${w.judoGolden}` : ""}`;
    const fs = clampN(footH * 0.46, 14, 64);
    const dot = fs * 0.55;
    const tw = Math.min(bw(text, fs), W - pad * 4 - dot * 2);
    const size = tw < bw(text, fs) ? fs * (tw / bw(text, fs)) : fs;
    const x0 = W / 2 - tw / 2 + dot * 1.5;
    body.push(`<circle cx="${num(x0 - dot)}" cy="${num(H - footH / 2)}" r="${num(dot / 2)}" style="fill:${winner === 0 ? WHITE_PANEL.panel : BLUE_PANEL.panel};stroke:${winner === 0 ? WHITE_PANEL.edge : "#9db5ea"};stroke-width:2"/>`);
    body.push(t(x0, H - footH / 2 + size * 0.36, size, text, "jb-ink", "start", 800));
  }

  const title = options.title ?? w.judoBoardTitle;
  const desc = describeJudoContest(contest, options);
  const defs = markDefs(ctx);
  const scope = prefix;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" lang="${esc(v.locale.code)}" class="taisen taisen-judo ${esc(scope)}${options.className ? ` ${esc(options.className)}` : ""}" viewBox="0 0 ${num(W)} ${num(H)}" width="${num(W)}" height="${num(H)}" style="max-width:100%;height:auto" role="img" aria-labelledby="${esc(prefix)}-t ${esc(prefix)}-d">`,
    `<title id="${esc(prefix)}-t">${esc(title)}</title><desc id="${esc(prefix)}-d">${esc(desc)}</desc>`,
    `<style>${styleFor(scope, theme)}</style>`,
    defs ? `<defs>${defs}</defs>` : "",
    `<rect class="jb-bg" width="${num(W)}" height="${num(H)}"/>`,
    ...body,
    "</svg>",
  ].filter(Boolean).join("\n");
}

export interface R { x: number; y: number; w: number; h: number }

/** The size a text can be set at to fit a width, from the size asked for. */
export function fitSize(text: string, size: number, width: number, floor = 0.62): number {
  const need = bw(text, size);
  return need <= width ? size : Math.max(size * (width / need), size * floor);
}

/** A card's label in the biggest size that fits, on one line or split at a hyphen or a space into two. */
function labelLines(text: string, maxW: number, maxH: number): { lines: string[]; size: number; height: number } {
  const one = Math.min(maxH / 1.15, maxW / emWidth(text), 80);
  let best = { lines: [text], size: one, height: one * 1.15 };
  const at = [...text].map((ch, i) => (ch === "-" || ch === " " ? i : -1)).filter((i) => i >= 0);
  for (const i of at) {
    const a = text.slice(0, i + (text[i] === "-" ? 1 : 0)).trim(), b = text.slice(i + 1).trim();
    const size = Math.min(maxH / 2.3, maxW / Math.max(emWidth(a), emWidth(b)), 80);
    if (size > best.size * 1.15) best = { lines: [a, b], size, height: size * 2.3 };
  }
  return best;
}

function goldenBadge(x: number, y: number, w: number, h: number, on: boolean, label: string, rx: number): string[] {
  if (!on) return [];
  const text = capitals(label);
  const fs = fitSize(text, clampN(h * 0.5, 12, 48), w - 16);
  return [`<rect class="jb-goldbox" x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" rx="${num(rx)}"/>`, t2(x + w / 2, y + h / 2 + fs * 0.36, fs, fit(text, fs, w - 16, bw), "#1b1500", "middle", ' letter-spacing=".1em"')];
}

/** A text in a fixed colour (on a fixed-colour box, so no theme changes it). */
function t2(x: number, y: number, size: number, text: string, color: string, anchor: "start" | "middle" | "end", extra = ""): string {
  return `<text x="${num(x)}" y="${num(y)}" font-size="${num(size)}" font-weight="800" text-anchor="${anchor}" style="fill:${color}"${extra}>${esc(text)}</text>`;
}

function clockBox(x: number, y: number, w: number, h: number, text: string, golden: boolean, rx: number): string[] {
  const fs = Math.min(h * 0.74, (w - 24) / emWidth(text, true) );
  return [
    `<rect class="jb-box" x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" rx="${num(rx)}"/>`,
    ...(golden ? [`<rect class="jb-clockedge" x="${num(x + 2)}" y="${num(y + 2)}" width="${num(w - 4)}" height="${num(h - 4)}" rx="${num(rx)}"/>`] : []),
    `<text class="${golden ? "jb-gold" : "jb-boxink"}" x="${num(x + w / 2)}" y="${num(y + h / 2 + fs * 0.36)}" font-size="${num(fs)}" font-weight="800" text-anchor="middle">${esc(text)}</text>`,
  ];
}

/** The osaekomi timer: the seconds, and a bar to 20 with a tick at 5 (yuko), 10 (waza-ari) and 20 (ippon), filled toward the athlete who holds. */
function osaekomiBox(r: R, osa: JudoContest["osaekomi"], order: readonly [0 | 1, 0 | 1], v: Voice, rx: number, tall: boolean): string[] {
  const w = v.words;
  const out: string[] = [`<rect class="jb-box" x="${num(r.x)}" y="${num(r.y)}" width="${num(r.w)}" height="${num(r.h)}" rx="${num(rx)}"/>`];
  const pad = Math.max(12, r.w * 0.06);
  const labelS = clampN(Math.min(r.h * (tall ? 0.13 : 0.14), r.w * 0.09), 11, 34);
  const label = capitals(w.judoOsaekomi);
  out.push(`<text class="jb-boxink" x="${num(r.x + r.w / 2)}" y="${num(r.y + pad * 0.6 + labelS)}" font-size="${num(fitSize(label, labelS, r.w - pad * 2))}" font-weight="800" text-anchor="middle" letter-spacing=".08em" opacity="${osa ? 1 : 0.55}">${esc(label)}</text>`);
  const seconds = osa ? Math.min(Math.floor(osa.seconds), 20) : null;
  const barH = clampN(r.h * 0.11, 10, 34);
  const barX = r.x + pad, barW = r.w - pad * 2;
  const barY = r.y + r.h - pad - barH - labelS * 1.2;
  const numberH = barY - (r.y + pad * 0.6 + labelS) - pad * 0.5;
  const fs = Math.min(numberH * 0.92, barW * 0.5);
  const shown = seconds === null ? "–" : v.number(seconds);
  out.push(`<text class="jb-boxink" x="${num(r.x + r.w / 2)}" y="${num(barY - pad * 0.5 - (numberH - fs * 0.72) / 2)}" font-size="${num(fs)}" font-weight="800" text-anchor="middle" opacity="${osa ? 1 : 0.4}">${esc(shown)}</text>`);
  out.push(`<rect class="jb-track" x="${num(barX)}" y="${num(barY)}" width="${num(barW)}" height="${num(barH)}" rx="${num(barH / 2)}"/>`);
  if (osa && seconds !== null && seconds > 0) {
    // The bar grows from the side of the holder: toward the left when the holder is on the left.
    const left = order[0] === osa.side;
    const fw = barW * (seconds / 20);
    out.push(`<g class="${osa.side === 0 ? "jb-w" : "jb-b"}"><rect class="jb-fillside" x="${num(left ? barX : barX + barW - fw)}" y="${num(barY)}" width="${num(fw)}" height="${num(barH)}" rx="${num(barH / 2)}"/></g>`);
  }
  // The ticks: 5, 10 and 20 seconds, as the marks of yuko, waza-ari and ippon.
  const marks: [number, string][] = [[5, w.judoYuko], [10, w.judoWazaAri], [20, w.judoIppon]];
  const left = osa ? order[0] === osa.side : true;
  for (const [sec, mark] of marks) {
    const px = left ? barX + barW * (sec / 20) : barX + barW - barW * (sec / 20);
    out.push(`<line class="jb-tick" x1="${num(px)}" x2="${num(px)}" y1="${num(barY - 4)}" y2="${num(barY + barH + 4)}"/>`);
    out.push(`<text class="jb-boxink" x="${num(Math.min(Math.max(px, barX + labelS * 0.7), barX + barW - labelS * 0.7))}" y="${num(barY + barH + 6 + labelS * 0.9)}" font-size="${num(labelS * 0.9)}" font-weight="800" text-anchor="middle" opacity=".8">${esc(mark)}</text>`);
  }
  return out;
}
