/**
 * What the ranking lists, the medal table and the results boards share: the sizes, the frame (size, theme, language, flags), the stylesheet with its light and dark palettes, the
 * wrapper that makes the SVG, and the small shapes (a movement arrow, a pill, a rank badge). Every board is a static SVG for a given state, a pure function of its input.
 */
import type { DrawOptions, Locale, Words } from "./types.ts";
import { bw, clampN, fitSize, FONT } from "./judo-board.ts";
import { voiceOf, type Voice } from "./locales.ts";
import { markDefs, type MarkContext } from "./marks.ts";
import { esc, fit, hash, num } from "./text.ts";

export { bw, clampN, fitSize };

export type BoardSizeName = "tv" | "tablet" | "tablet-tall" | "phone" | "square" | "portrait";

/** The sizes of a board: a TV's 1920 by 1080, a tablet on its side (1280 by 800) and upright (800 by 1280), a phone's 600 by 1300, and the social-card shapes, square (1080) and 4:5 (1080 by 1350). */
export const BOARD_SIZES: Readonly<Record<BoardSizeName, { width: number; height: number }>> = Object.freeze({
  tv: { width: 1920, height: 1080 },
  tablet: { width: 1280, height: 800 },
  "tablet-tall": { width: 800, height: 1280 },
  phone: { width: 600, height: 1300 },
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
});

/** What every board takes. */
export interface BoardOptions {
  /** One of `BOARD_SIZES` (`tv` by default), or a size of your own, `{ width, height }`, at least 200 each way. */
  size?: BoardSizeName | { width: number; height: number };
  /** `auto` (the default) follows the page's light or dark, `light` and `dark` fix it. */
  theme?: "auto" | "light" | "dark";
  /** Draws a flag from its code, as for `drawBracket`: a synchronous function from a code (`CA-BC`, `JP`) and `{ shape, size, theme }` to an SVG string, such as one made from `@johnmorrisdotca/hata`. */
  flags?: DrawOptions["flags"];
  /** The address of a flag as a picture to load, tried where `flags` gives none. */
  flagHref?: DrawOptions["flagHref"];
  /** `round` (the default) or `square`: the shape a flag is asked for and drawn in. */
  flagShape?: "round" | "square";
  /** The language: `en`, `fr`, `ja`, `es`, `de` or a `Locale`. */
  locale?: string | Locale;
  words?: Partial<Words>;
  /** The `<title>` of the drawing. Default: the board's own heading. */
  title?: string;
  /** Prefix for the drawing's ids. Default: a hash of the state and the options. */
  id?: string;
  className?: string;
}

export interface BoardFrame { W: number; H: number; v: Voice; scope: string; theme: "auto" | "light" | "dark"; ctx: MarkContext; options: BoardOptions }

export const rect = (x: number, y: number, w: number, h: number, cls: string, rx = 0, extra = ""): string =>
  `<rect class="${cls}" x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}"${rx ? ` rx="${num(rx)}"` : ""}${extra}/>`;

export const label = (x: number, y: number, size: number, content: string, cls: string, anchor: "start" | "middle" | "end" = "start", weight = 800, extra = ""): string =>
  `<text class="${cls}" x="${num(x)}" y="${num(y)}" font-size="${num(size)}" font-weight="${weight}" text-anchor="${anchor}"${extra}>${esc(content)}</text>`;

/** An id for the drawing's classes and ids, made safe: letters, digits, `_` and `-` only (anything else becomes `-`), and a letter first. `undefined` stays `undefined`. */
const safeId = (id: string | undefined): string | undefined => (id === undefined ? undefined : /^[A-Za-z]/.test(id) ? id.replace(/[^\w-]/g, "-") : `rk-${id.replace(/[^\w-]/g, "-")}`);

/** The size, theme and language a board is drawn with, checked; `seed` is whatever the drawing depends on, for the hash of the ids. */
export function boardFrame(options: BoardOptions, seed: unknown): BoardFrame {
  const v = voiceOf(options);
  const size = typeof options.size === "string" ? BOARD_SIZES[options.size] : options.size ?? BOARD_SIZES.tv;
  if (!size || !(size.width >= 200) || !(size.height >= 200)) throw new RangeError(`taisen-brackets: a size is ${Object.keys(BOARD_SIZES).map((k) => `"${k}"`).join(", ")} or { width, height } of 200 or more, not ${JSON.stringify(options.size)}`);
  const theme = options.theme ?? "auto";
  if (theme !== "auto" && theme !== "light" && theme !== "dark") throw new RangeError(`taisen-brackets: a theme is "auto", "light" or "dark", not ${JSON.stringify(theme)}`);
  const shape = options.flagShape ?? "round";
  if (shape !== "round" && shape !== "square") throw new RangeError(`taisen-brackets: a flag shape is "round" or "square", not ${JSON.stringify(options.flagShape)}`);
  const scope = safeId(options.id) ?? `rk-${hash(JSON.stringify([seed, options.size, theme, shape, v.locale.code, options.flags ? 1 : 0, options.flagHref ? 1 : 0, options.title]))}`;
  const ctx: MarkContext = { radii: new Set(), symbols: new Map(), prefix: scope, shape, theme: "inherit", flagCache: new Map(), ...(options.flags ? { flags: options.flags } : {}), ...(options.flagHref ? { flagHref: options.flagHref } : {}) };
  return { W: size.width, H: size.height, v, scope, theme, ctx, options };
}

// ------------------------------------------------------------------------------------------------ the palettes

export interface BoardPalette {
  bg: string; ink: string; sub: string; accent: string; accentInk: string;
  row: string; rowAlt: string; edge: string; head: string; headInk: string;
  up: string; down: string; upRow: string; downRow: string;
  pill: string; pillInk: string;
  /** Gold, silver, bronze: the two ends of the row's gradient, the edge and the numeral. */
  gold: readonly [string, string, string, string]; silver: readonly [string, string, string, string]; bronze: readonly [string, string, string, string];
}

export const BOARD_LIGHT: BoardPalette = {
  bg: "#eceff4", ink: "#131822", sub: "#566071", accent: "#2457c5", accentInk: "#ffffff",
  row: "#ffffff", rowAlt: "#f6f8fb", edge: "#d3d9e3", head: "#16233f", headInk: "#ffffff",
  up: "#0f8a46", down: "#c3302a", upRow: "#e0f4e8", downRow: "#fbe3e1",
  pill: "#e3e8f1", pillInk: "#2a3345",
  gold: ["#f8e9b5", "#fdf6dc", "#d4a929", "#7d5d00"], silver: ["#e4e8ee", "#f3f5f8", "#a9b2c0", "#4f586a"], bronze: ["#f2d5ba", "#faeadb", "#c98650", "#82451a"],
};

export const BOARD_DARK: BoardPalette = {
  bg: "#0b0f17", ink: "#f0f3f9", sub: "#98a3b8", accent: "#6ea2ff", accentInk: "#0b0f17",
  row: "#161d2b", rowAlt: "#121826", edge: "#27324a", head: "#1b2742", headInk: "#f0f3f9",
  up: "#4fdc8b", down: "#ff7b72", upRow: "#123724", downRow: "#451d1d",
  pill: "#25304a", pillInk: "#dfe6f5",
  gold: ["#5a4813", "#2c2512", "#d0aa3a", "#f5d263"], silver: ["#434c60", "#232a38", "#9ba6bb", "#e3e8f2"], bronze: ["#58341b", "#2b1d14", "#c4854f", "#f3a96f"],
};

const MEDALS = ["gold", "silver", "bronze"] as const;

/** The rules for one palette, scoped, with `before` ahead of every selector (empty, or the dark-mode root selector). */
export function boardRules(p: BoardPalette, scope: string, before: string, extra?: (sel: (s: string, body: string) => string, v: (name: string, value: string) => string) => string[]): string {
  const sel = (s: string, body: string) => `${before}.${scope} ${s}{${body}}`;
  const v = (name: string, value: string) => `var(--rk-${name}, ${value})`;
  const out = [
    sel(".rk-bg", `fill:${v("bg", p.bg)}`),
    sel(".rk-ink", `fill:${v("ink", p.ink)}`),
    sel(".rk-sub", `fill:${v("sub", p.sub)}`),
    sel(".rk-accent", `fill:${v("accent", p.accent)}`),
    sel(".rk-accentink", `fill:${v("accent-ink", p.accentInk)}`),
    sel(".rk-head", `fill:${v("head", p.head)}`),
    sel(".rk-headink", `fill:${v("head-ink", p.headInk)}`),
    sel(".rk-row", `fill:${v("row", p.row)};stroke:${v("edge", p.edge)};stroke-width:1.5`),
    sel(".rk-row.rk-alt", `fill:${v("row-alt", p.rowAlt)}`),
    sel(".rk-sep", `stroke:${v("edge", p.edge)};stroke-width:1.5`),
    sel(".rk-up", `fill:${v("up", p.up)}`),
    sel(".rk-down", `fill:${v("down", p.down)}`),
    sel(".rk-row.rk-mup", `fill:${v("up-row", p.upRow)}`),
    sel(".rk-row.rk-mdown", `fill:${v("down-row", p.downRow)}`),
    sel(".rk-pill", `fill:${v("pill", p.pill)}`),
    sel(".rk-pillink", `fill:${v("pill-ink", p.pillInk)}`),
    sel(".rk-nr", `fill:${v("accent", p.accent)}`),
    sel(".rk-nrink", `fill:${v("accent-ink", p.accentInk)}`),
    sel(".tb-ring", `fill:none;stroke:rgba(0,0,0,.28);stroke-width:1.5`),
    sel(".tb-plain", `fill:${v("pill", p.pill)}`),
    sel(".tb-initials", `fill:${v("pill-ink", p.pillInk)}`),
  ];
  MEDALS.forEach((m, i) => {
    const c = p[m];
    out.push(sel(`.rk-ga${i + 1}`, `stop-color:${c[0]}`), sel(`.rk-gb${i + 1}`, `stop-color:${c[1]}`), sel(`.rk-medal${i + 1}`, `stroke:${c[2]};stroke-width:2`), sel(`.rk-num${i + 1}`, `fill:${c[3]}`), sel(`.rk-bar${i + 1}`, `fill:${c[2]}`));
  });
  if (extra) out.push(...extra(sel, v));
  return out.join("\n");
}

/** The whole stylesheet: the light palette, the dark one under the page's dark mode (for `auto`) or on its own, and the fixed rules. */
export function boardStyle(scope: string, theme: "auto" | "light" | "dark", extra?: Parameters<typeof boardRules>[3], fixed = ""): string {
  const tail = [`.${scope} text{font-family:var(--rk-font, ${FONT});font-variant-numeric:tabular-nums}`, fixed.replaceAll("$S", `.${scope}`)].filter(Boolean).join("\n");
  if (theme === "light") return `${boardRules(BOARD_LIGHT, scope, "", extra)}\n${tail}`;
  if (theme === "dark") return `${boardRules(BOARD_DARK, scope, "", extra)}\n${tail}`;
  return `${boardRules(BOARD_LIGHT, scope, "", extra)}\n@media (prefers-color-scheme: dark){\n${boardRules(BOARD_DARK, scope, ':root:not([data-theme="light"]) ', extra)}\n}\n${boardRules(BOARD_DARK, scope, ':root[data-theme="dark"] ', extra)}\n${tail}`;
}

/** The medal gradients a board's rows use: one for gold, silver and bronze, by id. */
export function medalDefs(scope: string): string {
  return MEDALS.map((_, i) => `<linearGradient id="${esc(scope)}-g${i + 1}" x1="0" x2="1" y1="0" y2="0"><stop class="rk-ga${i + 1}" offset="0"/><stop class="rk-gb${i + 1}" offset="1"/></linearGradient>`).join("");
}

export function boardWrap(f: BoardFrame, title: string, desc: string, body: string[], kind: string, extra?: Parameters<typeof boardRules>[3], fixed = "", defs = ""): string {
  const marks = markDefs(f.ctx);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" lang="${esc(f.v.locale.code)}" class="taisen taisen-board ${esc(f.scope)}${f.options.className ? ` ${esc(f.options.className)}` : ""}" viewBox="0 0 ${num(f.W)} ${num(f.H)}" width="${num(f.W)}" height="${num(f.H)}" style="max-width:100%;height:auto" role="img" aria-labelledby="${esc(f.scope)}-t ${esc(f.scope)}-d" data-board="${kind}">`,
    `<title id="${esc(f.scope)}-t">${esc(title)}</title><desc id="${esc(f.scope)}-d">${esc(desc)}</desc>`,
    `<style>${boardStyle(f.scope, f.theme, extra, fixed)}</style>`,
    `<defs>${medalDefs(f.scope)}${defs}${marks}</defs>`,
    `<rect class="rk-bg" width="${num(f.W)}" height="${num(f.H)}"/>`,
    ...body,
    "</svg>",
  ].join("\n");
}

// ------------------------------------------------------------------------------------------------ small shapes

/** A movement arrow, a triangle `s` high centred at (cx, cy), up or down. */
export function arrow(cx: number, cy: number, s: number, up: boolean): string {
  const w = s * 1.1, h = s * 0.9;
  const pts = up ? [[cx, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]] : [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx, cy + h / 2]];
  return `<polygon class="${up ? "rk-up" : "rk-down"}" points="${pts.map(([x, y]) => `${num(x)},${num(y)}`).join(" ")}"/>`;
}

/** A pill with centred text in it, as wide as the text needs (never wider than `maxW`). Returns the pieces and the width. */
export function pill(x: number, cy: number, h: number, content: string, maxW: number, cls = "rk-pill", inkCls = "rk-pillink", anchor: "start" | "end" = "start"): { svg: string; w: number } {
  const size = h * 0.56;
  const fs = fitSize(content, size, maxW - h * 0.7, 0.6);
  const w = Math.min(maxW, bw(content, fs) + h * 0.7);
  const x0 = anchor === "start" ? x : x - w;
  return { svg: `${rect(x0, cy - h / 2, w, h, cls, h / 2)}${label(x0 + w / 2, cy + fs * 0.36, fs, fit(content, fs, w, bw), inkCls, "middle", 800, ' letter-spacing=".03em"')}`, w };
}
