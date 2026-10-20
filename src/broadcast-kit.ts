/**
 * What the broadcast-style boards share: the looks (blue, night, paper), the frame (a width, a voice, flags drawn 4:3), the stylesheet, the panel with its title bar, its icon and its
 * sub bar, and the small shapes (a rank box, a record badge, a medal disc). A broadcast board is a standalone SVG of a given width and a height that follows from its rows
 * (`resultsBoardSize`, `boutBoardSize`, `broadcastMedalSize`), with nothing outside the panel, so that it can be placed over a picture. It is made in the manner of a results graphic on a
 * television broadcast (a title band, rows with a rank, a flag and a code, columns of scores, a badge for a record) and carries no mark of any games, federation or broadcaster.
 */
import type { DrawOptions, Locale, Words } from "./types.ts";
import { bw, clampN, fitSize } from "./rank-kit.ts";
import { voiceOf, type Voice } from "./locales.ts";
import { cleanSvg, markDefs, safeUrl, type MarkContext } from "./marks.ts";
import { esc, fit, hash, num } from "./text.ts";

export type BroadcastLook = "blue" | "night" | "paper";

/** The looks: `blue` (a broadcast's deep blue with a bright title band), `night` (near black with a cyan band) and `paper` (white, with the same blue band). */
export const BROADCAST_LOOKS: readonly BroadcastLook[] = Object.freeze(["blue", "night", "paper"] as const);

/** The icons of the title band's square, drawn by the package: a medal and a stopwatch. `none` leaves the band whole. */
export type BroadcastIcon = "medal" | "stopwatch" | "none";

export interface BroadcastOptions {
  /** The width of the board; the height follows from the rows. Default 1280, from 320 to 4000. */
  width?: number;
  /** `blue` (the default), `night` or `paper`. */
  look?: BroadcastLook;
  /** The icon in the square at the left of the title: `medal` (the default), `stopwatch`, `none`, or an `iconMark` of your own. */
  icon?: BroadcastIcon;
  /** A mark of your own for that square (inline SVG or an image address), in place of `icon`. */
  iconMark?: string;
  /** Draws a flag from its code, as for `drawBracket`; it is asked for the shape `rect` (Hata's `"4:3"`). */
  flags?: DrawOptions["flags"];
  /** The address of a flag as a picture to load, tried where `flags` gives none. */
  flagHref?: DrawOptions["flagHref"];
  locale?: string | Locale;
  words?: Partial<Words>;
  /** The `<title>` of the drawing. Default: the board's own heading. */
  title?: string;
  id?: string;
  className?: string;
}

/** The sizes in a drawing, in units of its width over 1280. */
export const BC = Object.freeze({ title: 64, sub: 36, row: 52, gap: 2, pad: 10, band: 38, official: 40, athlete: 62 });

export interface BroadcastFrame { W: number; H: number; u: number; v: Voice; scope: string; ctx: MarkContext; options: BroadcastOptions; look: BroadcastLook }

const safeId = (id: string | undefined): string | undefined => (id === undefined ? undefined : /^[A-Za-z]/.test(id) ? id.replace(/[^\w-]/g, "-") : `bc-${id.replace(/[^\w-]/g, "-")}`);

/** The width and look checked, the voice, and the flag context (flags drawn 4:3). `height` is the board's, from its rows, in the unit of 1280 wide. */
export function broadcastFrame(options: BroadcastOptions, seed: unknown, heightUnits: number): BroadcastFrame {
  const width = options.width ?? 1280;
  if (!(typeof width === "number" && width >= 320 && width <= 4000)) throw new RangeError(`taisen-brackets: a board's width is from 320 to 4000, not ${JSON.stringify(options.width)}`);
  const look = options.look ?? "blue";
  if (!BROADCAST_LOOKS.includes(look)) throw new RangeError(`taisen-brackets: a look is ${BROADCAST_LOOKS.map((l) => `"${l}"`).join(", ")}, not ${JSON.stringify(options.look)}`);
  if (options.icon !== undefined && !["medal", "stopwatch", "none"].includes(options.icon)) throw new RangeError(`taisen-brackets: an icon is "medal", "stopwatch" or "none", not ${JSON.stringify(options.icon)}`);
  const v = voiceOf(options);
  const u = width / 1280;
  const scope = safeId(options.id) ?? `bc-${hash(JSON.stringify([seed, width, look, options.icon, options.iconMark, v.locale.code, options.flags ? 1 : 0, options.flagHref ? 1 : 0, options.title]))}`;
  const ctx: MarkContext = { radii: new Set(), symbols: new Map(), prefix: scope, shape: "rect", theme: "inherit", flagCache: new Map(), ...(options.flags ? { flags: options.flags } : {}), ...(options.flagHref ? { flagHref: options.flagHref } : {}) };
  return { W: width, H: Math.round(heightUnits * u), u, v, scope, ctx, options, look };
}

// ------------------------------------------------------------------------------------------------ the looks

interface Look {
  panelTop: string; panelBottom: string; edge: string;
  titleA: string; titleB: string; titleInk: string;
  subA: string; subB: string; subInk: string;
  rowA: string; rowB: string; ink: string; sub: string;
  rank: string; rankEdge: string; rankInk: string;
  gold: string; silver: string; bronze: string; medalInk: string;
  badge: string; badgeInk: string;
  red: string; blue: string;
  band: string; bandInk: string;
  iconA: string; iconB: string; iconInk: string;
}

const LOOKS: Record<BroadcastLook, Look> = {
  blue: {
    panelTop: "#14449a", panelBottom: "#061a4d", edge: "#8fb4ee",
    titleA: "#2a86e0", titleB: "#0c3b92", titleInk: "#ffffff",
    subA: "#eef2f9", subB: "#c1ccdf", subInk: "#0c2252",
    rowA: "#0b2a6c", rowB: "#123a88", ink: "#ffffff", sub: "#bcd0f3",
    rank: "#b3161f", rankEdge: "#f2a6a6", rankInk: "#ffffff",
    gold: "#e4b232", silver: "#c3cbd7", bronze: "#c9864a", medalInk: "#2a1c00",
    badge: "#f28a1b", badgeInk: "#ffffff",
    red: "#c9202b", blue: "#2c6bd2",
    band: "#1fa6d4", bandInk: "#04243a",
    iconA: "#f6bd3c", iconB: "#d9860f", iconInk: "#ffffff",
  },
  night: {
    panelTop: "#161c29", panelBottom: "#080b11", edge: "#3b475c",
    titleA: "#2c3648", titleB: "#141a26", titleInk: "#ffffff",
    subA: "#2a3446", subB: "#1d2535", subInk: "#d3dcec",
    rowA: "#10151f", rowB: "#181f2d", ink: "#f2f5fb", sub: "#9fadc4",
    rank: "#14a9cc", rankEdge: "#9fe7f7", rankInk: "#031821",
    gold: "#e4b232", silver: "#c3cbd7", bronze: "#c9864a", medalInk: "#2a1c00",
    badge: "#ffb020", badgeInk: "#1b1200",
    red: "#d3303d", blue: "#2d73e0",
    band: "#14a9cc", bandInk: "#031821",
    iconA: "#27c0e6", iconB: "#0f86a6", iconInk: "#ffffff",
  },
  paper: {
    panelTop: "#ffffff", panelBottom: "#e8edf5", edge: "#b7c3d8",
    titleA: "#2a6fc6", titleB: "#14346b", titleInk: "#ffffff",
    subA: "#e9eef7", subB: "#d3dbea", subInk: "#14346b",
    rowA: "#ffffff", rowB: "#eef2f9", ink: "#0f1b33", sub: "#566680",
    rank: "#b3161f", rankEdge: "#7a0e15", rankInk: "#ffffff",
    gold: "#e4b232", silver: "#c3cbd7", bronze: "#c9864a", medalInk: "#2a1c00",
    badge: "#e56d0c", badgeInk: "#ffffff",
    red: "#c9202b", blue: "#2c6bd2",
    band: "#2a6fc6", bandInk: "#ffffff",
    iconA: "#f6bd3c", iconB: "#d9860f", iconInk: "#ffffff",
  },
};

export const BROADCAST_FONT = '"Roboto Condensed", "Liberation Sans Narrow", "Archivo Narrow", "Helvetica Neue", Arial, "Hiragino Sans", "Yu Gothic UI", "Noto Sans CJK JP", Meiryo, sans-serif';

/** The stylesheet of a board in a look. Every colour is a custom property with the look's value as its fallback (`--bc-title-a`, `--bc-row-a`, `--bc-rank` and the rest). */
export function broadcastStyle(scope: string, look: BroadcastLook, fixed = ""): string {
  const p = LOOKS[look];
  const s = (sel: string, body: string) => `.${scope} ${sel}{${body}}`;
  const v = (name: string, value: string) => `var(--bc-${name}, ${value})`;
  return [
    s(".bc-gp-a", `stop-color:${v("panel-top", p.panelTop)}`), s(".bc-gp-b", `stop-color:${v("panel-bottom", p.panelBottom)}`),
    s(".bc-gt-a", `stop-color:${v("title-a", p.titleA)}`), s(".bc-gt-b", `stop-color:${v("title-b", p.titleB)}`),
    s(".bc-gs-a", `stop-color:${v("sub-a", p.subA)}`), s(".bc-gs-b", `stop-color:${v("sub-b", p.subB)}`),
    s(".bc-gi-a", `stop-color:${v("icon-a", p.iconA)}`), s(".bc-gi-b", `stop-color:${v("icon-b", p.iconB)}`),
    s(".bc-edge", `fill:none;stroke:${v("edge", p.edge)};stroke-width:2`),
    s(".bc-titleink", `fill:${v("title-ink", p.titleInk)}`),
    s(".bc-subink", `fill:${v("sub-ink", p.subInk)}`),
    s(".bc-rowa", `fill:${v("row-a", p.rowA)}`), s(".bc-rowb", `fill:${v("row-b", p.rowB)}`),
    s(".bc-ink", `fill:${v("ink", p.ink)}`), s(".bc-sub", `fill:${v("sub", p.sub)}`),
    s(".bc-rank", `fill:${v("rank", p.rank)};stroke:${v("rank-edge", p.rankEdge)};stroke-width:1.5`), s(".bc-rankink", `fill:${v("rank-ink", p.rankInk)}`),
    s(".bc-g1", `fill:${v("gold", p.gold)};stroke:none`), s(".bc-g2", `fill:${v("silver", p.silver)};stroke:none`), s(".bc-g3", `fill:${v("bronze", p.bronze)};stroke:none`), s(".bc-medalink", `fill:${v("medal-ink", p.medalInk)}`),
    s(".bc-discrim", "fill:none;stroke:rgba(255,255,255,.55);stroke-width:1.5"),
    s(".bc-badge", `fill:${v("badge", p.badge)}`), s(".bc-badgeink", `fill:${v("badge-ink", p.badgeInk)}`),
    s(".bc-red", `fill:${v("red", p.red)}`), s(".bc-blue", `fill:${v("blue", p.blue)}`),
    s(".bc-band", `fill:${v("band", p.band)}`), s(".bc-bandink", `fill:${v("band-ink", p.bandInk)}`),
    s(".bc-iconink", `fill:none;stroke:${v("icon-ink", p.iconInk)};stroke-linecap:round;stroke-linejoin:round`), s(".bc-iconfill", `fill:${v("icon-ink", p.iconInk)}`),
    s(".bc-gloss-a", "stop-color:#ffffff;stop-opacity:.16"), s(".bc-gloss-b", "stop-color:#ffffff;stop-opacity:0"),
    s(".tb-ring", "fill:none;stroke:rgba(255,255,255,.55);stroke-width:1"), s(".tb-plain", "fill:#2c3e6a"), s(".tb-initials", "fill:#ffffff"),
    s("text", `font-family:var(--bc-font, ${BROADCAST_FONT});font-variant-numeric:tabular-nums`),
    fixed.replaceAll("$S", `.${scope}`),
  ].filter(Boolean).join("\n");
}

/** The gradients every board uses, by id: the panel's, the title band's, the sub bar's, the icon's and the gloss over a row. */
export function broadcastDefs(scope: string): string {
  const g = (id: string, a: string, b: string, horizontal: boolean) => `<linearGradient id="${esc(scope)}-${id}" x1="0" y1="0" x2="${horizontal ? 1 : 0}" y2="${horizontal ? 0 : 1}"><stop class="${a}" offset="0"/><stop class="${b}" offset="1"/></linearGradient>`;
  return [g("gp", "bc-gp-a", "bc-gp-b", false), g("gt", "bc-gt-a", "bc-gt-b", true), g("gs", "bc-gs-a", "bc-gs-b", false), g("gi", "bc-gi-a", "bc-gi-b", false), g("gl", "bc-gloss-a", "bc-gloss-b", false)].join("");
}

export function broadcastWrap(f: BroadcastFrame, title: string, desc: string, body: string[], kind: string, fixed = ""): string {
  const marks = markDefs(f.ctx);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" lang="${esc(f.v.locale.code)}" class="taisen taisen-broadcast ${esc(f.scope)}${f.options.className ? ` ${esc(f.options.className)}` : ""}" viewBox="0 0 ${num(f.W)} ${num(f.H)}" width="${num(f.W)}" height="${num(f.H)}" style="max-width:100%;height:auto" role="img" aria-labelledby="${esc(f.scope)}-t ${esc(f.scope)}-d" data-board="${kind}">`,
    `<title id="${esc(f.scope)}-t">${esc(title)}</title><desc id="${esc(f.scope)}-d">${esc(desc)}</desc>`,
    `<style>${broadcastStyle(f.scope, f.look, fixed)}</style>`,
    `<defs>${broadcastDefs(f.scope)}${marks}</defs>`,
    ...body,
    "</svg>",
  ].join("\n");
}

// ------------------------------------------------------------------------------------------------ shapes

export const t = (x: number, y: number, size: number, content: string, cls: string, anchor: "start" | "middle" | "end" = "start", weight = 700, extra = ""): string =>
  `<text class="${cls}" x="${num(x)}" y="${num(y)}" font-size="${num(size)}" font-weight="${weight}" text-anchor="${anchor}"${extra}>${esc(content)}</text>`;

export const box = (x: number, y: number, w: number, h: number, cls: string, rx = 0, extra = ""): string =>
  `<rect class="${cls}" x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}"${rx ? ` rx="${num(rx)}"` : ""}${extra}/>`;

/** The panel's background and edge, from (0, 0) to the board's size, with the corners cut a little. */
export function panel(f: BroadcastFrame): string {
  const r = 8 * f.u;
  return `<rect fill="url(#${esc(f.scope)}-gp)" x="0" y="0" width="${num(f.W)}" height="${num(f.H)}" rx="${num(r)}"/><rect class="bc-edge" x="1" y="1" width="${num(f.W - 2)}" height="${num(f.H - 2)}" rx="${num(r)}"/>`;
}

/** The title band: the icon square at the left, the title in capitals, from y to y + the band's height. Returns the shapes and the x where the title text starts. */
export function titleBand(f: BroadcastFrame, y: number, title: string, right?: string): { svg: string; h: number } {
  const { u, v } = f;
  const h = BC.title * u;
  const out: string[] = [];
  const r = 8 * u;
  // The band is square at the bottom and rounded at the top, like the panel.
  out.push(`<path fill="url(#${esc(f.scope)}-gt)" d="M0 ${num(y + h)} V${num(y + r)} Q0 ${num(y)} ${num(r)} ${num(y)} H${num(f.W - r)} Q${num(f.W)} ${num(y)} ${num(f.W)} ${num(y + r)} V${num(y + h)} Z"/>`);
  let x = 22 * u;
  const icon = f.options.iconMark ? "custom" : f.options.icon ?? "medal";
  if (icon !== "none") {
    const s = h;
    out.push(`<path fill="url(#${esc(f.scope)}-gi)" d="M0 ${num(y + s)} V${num(y + r)} Q0 ${num(y)} ${num(r)} ${num(y)} H${num(s)} V${num(y + s)} Z"/>`);
    out.push(iconShape(f, icon, s / 2, y + s / 2, s * 0.62));
    x = s + 20 * u;
  }
  const rightText = right ? v.upper(right) : "";
  const rs = 20 * u;
  const rw = rightText ? bw(rightText, rs) : 0;
  const avail = f.W - x - 22 * u - (rw ? rw + 20 * u : 0);
  const text = v.upper(title);
  const ts = fitSize(text, 34 * u, avail, 0.55);
  out.push(t(x, y + h / 2 + ts * 0.36, ts, fit(text, ts, avail + 1, bw), "bc-titleink", "start", 800));
  if (rightText) out.push(t(f.W - 22 * u, y + h / 2 + rs * 0.36, rs, rightText, "bc-titleink", "end", 700, ' letter-spacing=".04em"'));
  return { svg: out.join(""), h };
}

/** An icon in the square, drawn in strokes: a medal on its ribbon, a stopwatch, or the caller's own mark. */
function iconShape(f: BroadcastFrame, icon: string, cx: number, cy: number, size: number): string {
  const u = size / 100;
  const sw = num(Math.max(2.2 * u * 1.6, 1.5));
  if (icon === "stopwatch") {
    return [
      `<circle class="bc-iconink" cx="${num(cx)}" cy="${num(cy + 6 * u)}" r="${num(38 * u)}" stroke-width="${sw}"/>`,
      `<path class="bc-iconink" d="M${num(cx - 10 * u)} ${num(cy - 40 * u)} H${num(cx + 10 * u)} M${num(cx)} ${num(cy - 40 * u)} V${num(cy - 32 * u)} M${num(cx + 30 * u)} ${num(cy - 22 * u)} l${num(8 * u)} ${num(-8 * u)}" stroke-width="${sw}"/>`,
      `<path class="bc-iconink" d="M${num(cx)} ${num(cy + 6 * u)} L${num(cx + 18 * u)} ${num(cy - 10 * u)}" stroke-width="${sw}"/>`,
      `<circle class="bc-iconfill" cx="${num(cx)}" cy="${num(cy + 6 * u)}" r="${num(4 * u)}"/>`,
    ].join("");
  }
  if (icon === "custom") {
    const mark = (f.options.iconMark ?? "").trim();
    const side = size * 1.1;
    if (mark.startsWith("<")) {
      const svg = cleanSvg(mark);
      if (svg) return `<svg x="${num(cx - side / 2)}" y="${num(cy - side / 2)}" width="${num(side)}" height="${num(side)}" viewBox="${esc(svg.viewBox)}">${svg.inner}</svg>`;
    } else if (safeUrl(mark)) return `<image href="${esc(mark)}" x="${num(cx - side / 2)}" y="${num(cy - side / 2)}" width="${num(side)}" height="${num(side)}" preserveAspectRatio="xMidYMid meet"/>`;
    return "";
  }
  // The medal: a disc with a star-less rim and a V of ribbon above it.
  return [
    `<path class="bc-iconink" d="M${num(cx - 26 * u)} ${num(cy - 44 * u)} L${num(cx - 6 * u)} ${num(cy - 8 * u)} M${num(cx + 26 * u)} ${num(cy - 44 * u)} L${num(cx + 6 * u)} ${num(cy - 8 * u)}" stroke-width="${sw}"/>`,
    `<circle class="bc-iconink" cx="${num(cx)}" cy="${num(cy + 18 * u)}" r="${num(28 * u)}" stroke-width="${sw}"/>`,
    `<circle class="bc-iconink" cx="${num(cx)}" cy="${num(cy + 18 * u)}" r="${num(17 * u)}" stroke-width="${num(Math.max(1.2 * u * 1.6, 1))}"/>`,
    `<path class="bc-iconfill" d="M${num(cx)} ${num(cy + 7 * u)} l${num(3.4 * u)} ${num(7 * u)} l${num(7.6 * u)} ${num(1.1 * u)} l${num(-5.5 * u)} ${num(5.3 * u)} l${num(1.3 * u)} ${num(7.6 * u)} l${num(-6.8 * u)} ${num(-3.6 * u)} l${num(-6.8 * u)} ${num(3.6 * u)} l${num(1.3 * u)} ${num(-7.6 * u)} l${num(-5.5 * u)} ${num(-5.3 * u)} l${num(7.6 * u)} ${num(-1.1 * u)} Z"/>`,
  ].join("");
}

/** The light sub bar under the title: `text` at the left in capitals, and labels over columns at the right (each `{ x, label }`, centred on x). */
export function subBar(f: BroadcastFrame, y: number, text: string, labels: readonly { x: number; w: number; label: string }[] = [], bold = true): { svg: string; h: number } {
  const { u, v } = f;
  const h = BC.sub * u;
  const out = [box(0, y, f.W, h, "", 0, ` fill="url(#${esc(f.scope)}-gs)"`)];
  const fs = 20 * u;
  const leftEnd = labels.length ? Math.min(...labels.map((l) => l.x - l.w / 2)) - 12 * u : f.W - 18 * u;
  const txt = v.upper(text);
  if (txt) {
    // The letters are spaced, which the width estimate does not know of: leave 7% for it.
    const room = (leftEnd - 20 * u) / 1.07;
    const z = fitSize(txt, fs, room, 0.6);
    out.push(t(20 * u, y + h / 2 + z * 0.36, z, fit(txt, z, room, bw), "bc-subink", "start", bold ? 800 : 700, ' letter-spacing=".02em"'));
  }
  for (const l of labels) {
    const lab = v.upper(l.label);
    const z = fitSize(lab, fs * 0.85, l.w / 1.07, 0.55);
    out.push(t(l.x, y + h / 2 + z * 0.36, z, fit(lab, z, l.w / 1.07, bw), "bc-subink", "middle", 800, ' letter-spacing=".02em"'));
  }
  return { svg: out.join(""), h };
}

/** A rank in a box: `box` (the broadcast's red square), `medal` (gold, silver and bronze for the first three, else the box) or `plain` (a white numeral). */
export function rankBox(x: number, cy: number, w: number, h: number, text: string, rank: number | null, style: "box" | "medal" | "plain", u: number): string {
  const size = fitSize(text, h * 0.62, w * 0.86, 0.5);
  if (style === "plain") { const ps = fitSize(text, 27 * u, w * 0.96, 0.5); return t(x + w / 2, cy + ps * 0.36, ps, text, "bc-ink", "middle", 800); }
  const medal = style === "medal" && rank !== null && rank >= 1 && rank <= 3;
  const cls = medal ? `bc-g${rank}` : "bc-rank";
  const ink = medal ? "bc-medalink" : "bc-rankink";
  return `${box(x, cy - h / 2, w, h, cls, 3 * u)}${t(x + w / 2, cy + size * 0.36, size, text, ink, "middle", 800)}`;
}

/** A record badge ("OR", "WR", "NR"): an orange rounded plate with the letters, right-aligned at `right`. Returns the shapes and the width. */
export function recordBadge(right: number, cy: number, h: number, text: string, u: number): { svg: string; w: number } {
  const size = h * 0.62;
  const w = bw(text, size) + h * 0.8;
  return { svg: `${box(right - w, cy - h / 2, w, h, "bc-badge", h * 0.28)}${t(right - w / 2, cy + size * 0.36, size, text, "bc-badgeink", "middle", 800, ' letter-spacing=".04em"')}`, w: w + 6 * u };
}

/** The gloss over a row: a faint white gradient from the top edge. */
export const gloss = (f: BroadcastFrame, x: number, y: number, w: number, h: number): string => box(x, y, w, h * 0.55, "", 0, ` fill="url(#${esc(f.scope)}-gl)"`);

export { bw, clampN, fitSize };
