import type { DrawOptions, EmblemRequest, FlagRenderer, FlagRequest, Team } from "./types.ts";
import { abbreviate, esc, num } from "./text.ts";

/**
 * Takes inline SVG markup from a caller and makes it safe to put inside a drawing: the outer `<svg>`'s viewBox is kept,
 * and scripts, event handlers, `<style>`, `<foreignObject>`, comments and `javascript:` addresses are removed. Returns the
 * viewBox and the inner markup, or `null` when it is not an `<svg>`.
 */
export function cleanSvg(markup: string): { viewBox: string; inner: string } | null {
  const text = markup.trim().replace(/^<\?xml[^>]*>/i, "").replace(/<!DOCTYPE[^>]*>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
  const open = /^<svg\b([^>]*)>/i.exec(text);
  if (!open || !/<\/svg>\s*$/i.test(text)) return null;
  const attrs = open[1];
  const viewBox = /\bviewBox\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1];
  const w = /\bwidth\s*=\s*["']?([\d.]+)/i.exec(attrs)?.[1];
  const h = /\bheight\s*=\s*["']?([\d.]+)/i.exec(attrs)?.[1];
  const box = viewBox ?? (w && h ? `0 0 ${w} ${h}` : "0 0 100 100");
  let inner = text.slice(open[0].length).replace(/<\/svg>\s*$/i, "");
  inner = inner
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<script\b[^>]*\/>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, "")
    .replace(/<foreignObject\b[\s\S]*?<\/foreignObject\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(\s(?:xlink:)?href\s*=\s*)(["'])\s*javascript:[^"']*\2/gi, "$1$2#$2");
  return { viewBox: box, inner };
}

const EMBLEM_ID = /^[a-z][a-z0-9-]*:[a-z0-9][a-z0-9-]*(?:\/(?:metal|line|color))?$/;

/** Whether a `trophy` value names an emblem (`"trophy:hockey-cup"`, `"medal:gold/line"`) rather than being inline SVG or an image address. */
export function isEmblemId(value: string): boolean {
  return EMBLEM_ID.test(value.trim());
}

/** Whether `drawBracket` has something to draw for this `trophy` and `emblems`: an emblem id needs a renderer; SVG and addresses do not. */
export function hasTrophy(o: Pick<DrawOptions, "trophy" | "emblems">): boolean {
  const t = o.trophy?.trim();
  if (!t) return false;
  return isEmblemId(t) ? typeof o.emblems === "function" : true;
}

/**
 * The emblem a renderer makes for an id, cleaned like any inline SVG and with its `<title>` removed (the drawing says what it shows in its own
 * words), or `null` when the renderer throws or returns something that is not an `<svg>`. The look decides the ink: `light` and `dark` are
 * forced, `poster` is dark, and `auto` and `none` are `inherit`, which the drawing's stylesheet colours from `--tb-ink`.
 */
export function drawEmblem(id: string, size: number, o: Pick<DrawOptions, "emblems" | "emblemStyle" | "emblemTint" | "theme">): { viewBox: string; inner: string } | null {
  if (typeof o.emblems !== "function") return null;
  const look = o.theme ?? "auto";
  const request: EmblemRequest = { style: o.emblemStyle ?? "metal", size, theme: look === "light" ? "light" : look === "dark" || look === "poster" ? "dark" : "inherit" };
  if (o.emblemTint) request.tint = o.emblemTint;
  let markup: unknown;
  try { markup = o.emblems(id.trim(), request); } catch { return null; }
  if (typeof markup !== "string") return null;
  const svg = cleanSvg(markup);
  return svg ? { viewBox: svg.viewBox, inner: svg.inner.replace(/<title\b[\s\S]*?<\/title\s*>/gi, "") } : null;
}

/** Readable text on a team colour: white on a dark one, near-black on a light one; `null` when the colour is not a hex one this can read. */
function inkOn(color: string): string | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())?.[1];
  if (!hex) return null;
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.35 ? "#ffffff" : "#1f2320";
}

/** Whether an image address is one a drawing will load: http(s), a relative path, or a `data:image/`. */
export function safeUrl(url: string): boolean {
  const u = url.trim();
  if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml|avif);/i.test(u)) return true;
  if (/^https?:\/\//i.test(u)) return true;
  return !/^[a-z][a-z0-9+.-]*:/i.test(u) && !u.startsWith("//") ? u.length > 0 : false;
}

export interface MarkContext {
  /** Collects the radii that need a round clip; the drawing writes `<clipPath>` for each. */
  radii: Set<number>;
  /** Inline SVG marks, each written once as a `<symbol>` and used wherever the team appears. Keyed by the markup. */
  symbols: Map<string, { id: string; viewBox: string; inner: string }>;
  prefix: string;
  shape: "round" | "square" | "none";
  /** The look: `road` draws a team's mark with a wide ring and a hairline outside it. */
  look?: "classic" | "road";
  /** Draws a team's `flag` code; with none a team's `mark` or initials are drawn. */
  flags?: FlagRenderer;
  /** The theme a flag renderer is told about. */
  theme?: FlagRequest["theme"];
  /** The flags already asked for, by code, shape and size, so that a renderer is called once for each. */
  flagCache?: Map<string, { viewBox: string; inner: string } | null>;
}

/** Whether an address may be a link in a drawing: http(s), a relative path or a `#` fragment. `javascript:`, `data:` and every other scheme are refused. */
export function safeHref(url: string): boolean {
  const u = url.trim();
  // eslint-disable-next-line no-control-regex
  if (u.length === 0 || /[\u0000-\u001f\u007f]/.test(u)) return false;
  if (/^https?:\/\//i.test(u)) return true;
  return !/^[a-z][a-z0-9+.-]*:/i.test(u) && !u.startsWith("//");
}

/** The flag a renderer makes for a code, cleaned like any inline SVG, or `null` when there is no renderer, it has no flag for the code, it throws, or what it returns is not an `<svg>`. */
function flagOf(code: string | undefined, size: number, ctx: MarkContext): { viewBox: string; inner: string } | null {
  if (typeof ctx.flags !== "function" || typeof code !== "string" || code.trim() === "") return null;
  const shape = ctx.shape === "square" ? "square" : "round";
  const key = `${code.trim()}|${shape}|${Math.round(size)}`;
  const cache = ctx.flagCache;
  if (cache?.has(key)) return cache.get(key) ?? null;
  let made: { viewBox: string; inner: string } | null = null;
  try {
    const markup: unknown = ctx.flags(code.trim(), { shape, size: Math.round(size), theme: ctx.theme ?? "inherit" });
    if (typeof markup === "string") made = cleanSvg(markup);
  } catch {
    made = null;
  }
  cache?.set(key, made);
  return made;
}

/** The `<defs>` content the marks drawn with a context need: a circular clip for each radius, and each inline mark or flag once as a `<symbol>`. Written after the marks are drawn. */
export function markDefs(ctx: MarkContext): string {
  return [
    ...[...ctx.radii].sort((a, b) => a - b).map((r) => `<clipPath id="${clipId(ctx.prefix, r)}"><circle r="${num(r)}"/></clipPath>`),
    ...[...ctx.symbols.values()].map((s) => `<symbol id="${s.id}" viewBox="${esc(s.viewBox)}" preserveAspectRatio="xMidYMid slice">${s.inner}</symbol>`),
  ].join("");
}

/** The id of the circular clip for a radius. */
export const clipId = (prefix: string, r: number) => `${prefix}-c${String(num(r)).replace(".", "_")}`;

/**
 * A team's mark centred at (cx, cy), `size` across. A logo or flag is clipped to a circle (or left square); a team
 * with no mark, or one that cannot be used, is its initials on a plain disc. Returns SVG text.
 */
export function drawMark(team: Team | null, cx: number, cy: number, size: number, ctx: MarkContext, abbrText?: string): string {
  const r = size / 2;
  if (!team) return `<circle class="tb-plain tb-mark" cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" opacity=".5"/>`;
  const x = cx - r, y = cy - r;
  const clip = ctx.shape === "round";
  if (clip) ctx.radii.add(r);
  const wrapOpen = clip ? `<g class="tb-mark" transform="translate(${num(cx)} ${num(cy)})" clip-path="url(#${clipId(ctx.prefix, r)})">` : `<g class="tb-mark">`;
  const ox = clip ? -r : x, oy = clip ? -r : y;
  const road = ctx.look === "road";
  const rw = Math.max(r * 0.09, 0.5);
  const hair = num(Math.max(rw * 0.3, 0.3));
  const ring = road
    ? clip
      ? `<circle class="tb-ring tb-ring-r" cx="${num(cx)}" cy="${num(cy)}" r="${num(r - rw / 2)}" stroke-width="${num(rw)}"/><circle class="tb-edge" cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" stroke-width="${hair}"/>`
      : `<rect class="tb-ring tb-ring-r" x="${num(x + rw / 2)}" y="${num(y + rw / 2)}" width="${num(size - rw)}" height="${num(size - rw)}" rx="2" stroke-width="${num(rw)}"/><rect class="tb-edge" x="${num(x)}" y="${num(y)}" width="${num(size)}" height="${num(size)}" rx="2" stroke-width="${hair}"/>`
    : clip
      ? `<circle class="tb-ring" cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}"/>`
      : `<rect class="tb-ring" x="${num(x)}" y="${num(y)}" width="${num(size)}" height="${num(size)}" rx="2"/>`;
  const flag = flagOf(team.flag, size, ctx);
  if (flag) {
    const key = `flag:${flag.viewBox}:${flag.inner}`;
    let symbol = ctx.symbols.get(key);
    if (!symbol) { symbol = { id: `${ctx.prefix}-m${ctx.symbols.size + 1}`, ...flag }; ctx.symbols.set(key, symbol); }
    return `${wrapOpen}<use href="#${symbol.id}" x="${num(ox)}" y="${num(oy)}" width="${num(size)}" height="${num(size)}"/></g>${ring}`;
  }
  const mark = team.mark?.trim();
  if (mark) {
    if (mark.startsWith("<")) {
      const svg = cleanSvg(mark);
      if (svg) {
        let symbol = ctx.symbols.get(mark);
        if (!symbol) { symbol = { id: `${ctx.prefix}-m${ctx.symbols.size + 1}`, ...svg }; ctx.symbols.set(mark, symbol); }
        return `${wrapOpen}<use href="#${symbol.id}" x="${num(ox)}" y="${num(oy)}" width="${num(size)}" height="${num(size)}"/></g>${ring}`;
      }
    } else if (safeUrl(mark)) {
      return `${wrapOpen}<image href="${esc(mark)}" x="${num(ox)}" y="${num(oy)}" width="${num(size)}" height="${num(size)}" preserveAspectRatio="xMidYMid slice"/></g>${ring}`;
    }
  }
  const text = (abbrText ?? team.abbr ?? abbreviate(team.name)).slice(0, 3);
  const fill = team.color ? ` style="fill:${esc(team.color)}"` : "";
  const shape = clip ? `<circle class="tb-plain" cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}"${fill}/>` : `<rect class="tb-plain" x="${num(x)}" y="${num(y)}" width="${num(size)}" height="${num(size)}" rx="2"${fill}/>`;
  const ink = team.color ? inkOn(team.color) : null;
  return `<g class="tb-mark">${shape}<text class="tb-initials" x="${num(cx)}" y="${num(cy + size * 0.12)}" font-size="${num(size * 0.36)}" font-weight="700" text-anchor="middle"${ink ? ` style="fill:${ink}"` : ""}>${esc(text)}</text></g>${ring}`;
}
