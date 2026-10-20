// The boxes of the layouts that draw a tie their own way (`rows`, `shields`, `update`, `columns`, `series`). The tree's planner (render.ts) places each box, its lines and the names of the rounds;
// these functions fill one box: every mark, text and slot they write lies inside the rectangle they are given, which a test holds for every layout, size and look.
import type { DrawOptions, Place, Tie } from "./types.ts";
import type { Voice } from "./locales.ts";
import { abbrOf } from "./matchup.ts";
import { sideScore } from "./judo-text.ts";
import { drawMark, type MarkContext } from "./marks.ts";
import { emWidth, esc, fit, num } from "./text.ts";

export type VariantKind = "rows" | "shields" | "update" | "columns" | "series";

/** What one box is drawn from. */
export interface PaintEnv {
  kind: VariantKind;
  x: number;
  y: number;
  w: number;
  h: number;
  tie: Tie;
  /** Which side is drawn on top, then which below. */
  order: readonly [0 | 1, 0 | 1];
  /** The half of the tree the box is in: `l`, `r`, `f` the final, `o` elsewhere. */
  side: Place;
  final: boolean;
  road: boolean;
  /** How much a box says: `full` names, `compact` abbreviations, `mark` marks alone. */
  detail: "full" | "compact" | "mark";
  vertical: boolean;
  /** Seed tags are drawn: the seed, the tag or the tie's own. */
  tags: boolean;
  /** A team's three letters under its mark where a box is marks alone. */
  codes: boolean;
  scoresOn: boolean;
  v: Voice;
  ctx: MarkContext;
  o: DrawOptions;
  /** The class of a team's group: won, lost or pending. */
  cls: (k: 0 | 1) => string;
  /** Wraps a team's row in its link, where the drawing has one. */
  link: (k: 0 | 1, inner: string, x: number, y: number, w: number, h: number) => string;
  /** The seed tag of a side (`""` for none). */
  tagOf: (tie: Tie, k: 0 | 1) => string;
  /** The widest name and the widest three-letter name of the whole drawing, in ems, so that every box makes the same choice about what fits. */
  em: { full: number; abbr: number; tag: number };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** The width of a text set in bold at a size: the package's generous estimate, so that a text stays inside its place in any font. */
const bw = (text: string, size: number): number => emWidth(text) * size;

const scoreOf = (e: PaintEnv, k: 0 | 1): string => (e.scoresOn ? sideScore(e.tie, k, e.v) : "");
const pensOf = (e: PaintEnv, k: 0 | 1): string => (e.scoresOn && e.tie.result.pens ? `(${e.v.number(e.tie.result.pens[k])})` : "");

/** A small pill with a seed tag, its left edge at `x`, centred on `cy`. */
function tagPill(text: string, x: number, cy: number, size: number): { svg: string; w: number } {
  const w = bw(text, size) + 8;
  return { w, svg: `<rect class="tb-tagbox" x="${num(x)}" y="${num(cy - (size + 4) / 2)}" width="${num(w)}" height="${num(size + 4)}" rx="${num((size + 4) / 2)}"/><text class="tb-tag" x="${num(x + w / 2)}" y="${num(cy + size * 0.35)}" font-size="${num(size)}" text-anchor="middle">${esc(text)}</text>` };
}

/** The shield's outline as a path, `size` across and as high, its top left at (x, y). */
export function shieldPath(x: number, y: number, size: number): string {
  const p = (u: number, v: number) => `${num(x + u * size)} ${num(y + v * size)}`;
  return `M${p(0, 0)}H${num(x + size)}V${num(y + 0.52 * size)}C${p(1, 0.8)} ${p(0.74, 0.95)} ${p(0.5, 1)}C${p(0.26, 0.95)} ${p(0, 0.8)} ${p(0, 0.52)}Z`;
}

/** The shield every mark of the drawing is clipped to, written once. Its path is in the unit square of whatever it clips. */
function shieldClip(ctx: MarkContext): string {
  const id = `${ctx.prefix}-sh`;
  ctx.defs ??= new Map();
  if (!ctx.defs.has(id)) ctx.defs.set(id, `<clipPath id="${id}" clipPathUnits="objectBoundingBox"><path d="M0 0H1V.52C1 .8 .74 .95 .5 1C.26 .95 0 .8 0 .52Z"/></clipPath>`);
  return id;
}

/** The parts of one box, after its own `<rect class="tb-box">`. */
export function paintVariant(e: PaintEnv): string[] {
  // A box too narrow for a mark and a slot is its two marks stacked with their codes and scores, as the shields are.
  if (e.w < 72 && e.kind !== "shields") return shields(e);
  switch (e.kind) {
    case "rows": return rows(e);
    case "shields": return shields(e);
    case "update": return update(e);
    case "columns": return columns(e);
    case "series": return series(e);
  }
}

// ---------------------------------------------------------------------------------------------- rows

/** Each team a row: its name on the left, its mark on the right, a slot for the result at the end that faces the centre; a seed tag at the outer corner. What does not fit is left out, the tag first, then the name's length, then the name. */
function rows(e: PaintEnv): string[] {
  const { x, y, w, h, tie, v, ctx } = e;
  const out: string[] = [];
  const rowH = h / 2;
  const toRight = !(e.side === "r" && !e.vertical);
  const padX = e.road ? clamp(rowH * 0.16, 5, 10) : 6;
  const gap = 5;
  const font = clamp(rowH * (e.road ? 0.46 : 0.5), 8.5, e.road ? 18 : 15);
  const sf = clamp(rowH * (e.road ? 0.58 : 0.5), 9, e.road ? 20 : 15);
  const tf = clamp(font * 0.62, 7, 9.5);
  const scoreTexts = ([0, 1] as const).map((k) => scoreOf(e, k) + pensOf(e, k));
  const slotW = e.scoresOn ? clamp(Math.max(...scoreTexts.map((t) => bw(t, sf))) + 12, 24, 46) : 0;
  const tagWide = e.tags && e.em.tag > 0 ? e.em.tag * tf + 12 : 0;
  const mdMax = ctx.shape === "none" ? 0 : clamp(rowH - (e.road ? 6 : 9), 10, e.road ? 40 : 28);
  const mdMin = mdMax === 0 ? 0 : Math.min(mdMax, 16);
  const nameOf = (k: 0 | 1, how: "full" | "abbr"): string => (tie.sides[k] ? (how === "full" ? tie.sides[k]!.name : abbrOf(tie.sides[k], v)) : v.words.tbd);
  // The fullest set of parts that fits: the names as they are, then as three letters, then none; each at the size the row gives it, or a smaller one; with the seed tag where there is room for it.
  const fixed = 2 * padX + slotW + (e.scoresOn ? gap : 0);
  const nominal = Math.min(font, 14);
  const tries: { how: "full" | "abbr" | null; size: number; tag: boolean }[] = [];
  const hows: ("full" | "abbr" | null)[] = e.detail === "full" ? ["full", "abbr", null] : e.detail === "compact" ? ["abbr", null] : [null];
  for (const how of hows) for (const size of how === null ? [0] : [nominal, 10]) for (const tag of tagWide > 0 ? [true, false] : [false]) tries.push({ how, size, tag });
  let chosen = { how: null as "full" | "abbr" | null, size: 0, tag: tagWide > 0 && w - fixed - tagWide - mdMin >= 0, md: Math.max(Math.min(mdMax, w - fixed), 0) };
  for (const t of tries) {
    const need = fixed + (t.tag ? tagWide : 0) + mdMin + (t.how ? gap + (t.how === "full" ? e.em.full : e.em.abbr) * t.size : 0);
    if (need <= w) {
      const spare = w - need;
      chosen = { how: t.how, size: t.size, tag: t.tag, md: mdMax === 0 ? 0 : Math.min(mdMax, mdMin + spare) };
      break;
    }
  }
  if (mdMax > 0 && chosen.md < 8) chosen.md = 0;
  const md = chosen.md;
  e.order.forEach((k, n) => {
    const team = tie.sides[k];
    const ry = y + n * rowH;
    const cy = ry + rowH / 2;
    const parts: string[] = [];
    const outer = toRight ? x + padX : x + w - padX;
    const slotX = toRight ? x + w - padX - slotW : x + padX;
    if (e.scoresOn) {
      const slotH = Math.min(rowH - 6, e.road ? 34 : 26);
      parts.push(`<rect class="tb-slot" x="${num(slotX)}" y="${num(cy - slotH / 2)}" width="${num(slotW)}" height="${num(slotH)}" rx="${num(Math.min(5, slotH / 3))}"/>`);
      const s = scoreOf(e, k);
      if (s) {
        const pens = pensOf(e, k);
        const span = pens ? `<tspan class="tb-muted" dx="2" font-size="${num(Math.max(sf * 0.6, 7))}" font-weight="600">${esc(pens)}</tspan>` : "";
        parts.push(`<text class="tb-score" x="${num(slotX + slotW / 2)}" y="${num(cy + sf * 0.35)}" font-size="${num(sf)}" text-anchor="middle" font-variant-numeric="tabular-nums">${esc(s)}${span}</text>`);
      }
    }
    const inner = e.scoresOn ? (toRight ? slotX : slotX + slotW) : toRight ? x + w - padX : x + padX;
    const markCx = toRight ? inner - (e.scoresOn ? gap : 0) - md / 2 : inner + (e.scoresOn ? gap : 0) + md / 2;
    if (md > 0) parts.push(drawMark(team, markCx, cy, md, ctx));
    const markEdge = md > 0 ? (toRight ? markCx - md / 2 : markCx + md / 2) : inner;
    let from = outer;
    const tag = chosen.tag ? e.tagOf(tie, k) : "";
    if (tag) {
      const tw = bw(tag, tf) + 8;
      const pill = tagPill(tag, toRight ? from : from - tw, cy, tf);
      parts.push(pill.svg);
      from = toRight ? from + pill.w + 4 : from - pill.w - 4;
    }
    if (chosen.how !== null) {
      const room = Math.max(toRight ? markEdge - gap - from : from - (markEdge + gap), 8);
      const nm = nameOf(k, chosen.how);
      let nf = chosen.size;
      while (nf > 8 && bw(nm, nf) > room) nf -= 0.5;
      parts.push(`<text class="tb-name${team ? "" : " tb-muted"}" x="${num(from)}" y="${num(cy + nf * 0.35)}" font-size="${num(nf)}"${toRight ? "" : ' text-anchor="end"'}>${esc(fit(nm, nf, room, bw))}</text>`);
    }
    out.push(e.link(k, `<g class="${e.cls(k)}">${parts.join("")}</g>`, x, ry, w, rowH));
  });
  out.push(`<line class="${e.road ? "tb-sep" : "tb-line"}" x1="${num(x + 4)}" x2="${num(x + w - 4)}" y1="${num(y + rowH)}" y2="${num(y + rowH)}" stroke-opacity=".35"${e.o.theme === "none" ? ' stroke="currentColor"' : ""}/>`);
  return out;
}

// ---------------------------------------------------------------------------------------------- shields

/** The two marks in shields with "vs" between, a seed tag over each, its three letters under it, and the score under that; a box too small for all of it leaves the tag, the letters, then the score out. */
function shields(e: PaintEnv): string[] {
  const { x, y, w, h, tie, v, ctx } = e;
  const out: string[] = [];
  const padX = 5, padY = 4;
  const colW = (w - 2 * padX) / 2;
  const tags = ([0, 1] as const).map((k) => (e.tags ? e.tagOf(tie, k) : ""));
  const haveTag = tags.some((t) => t !== "");
  const haveScore = e.scoresOn && tie.result.score !== null;
  const hasPens = haveScore && tie.result.pens !== null;
  const vsText = v.words.vs;
  const vf = (m: number) => clamp(m * 0.28, 7, 12);
  const lay = (m: number, tag: boolean, code: boolean, score: boolean) => {
    const cf = clamp(m * 0.26, 7, 11);
    const sf = clamp(m * 0.42, 9, 22);
    const pf = Math.max(sf * 0.55, 7);
    const tagH = tag ? 12 : 0;
    const height = tagH + m + (code ? 3 + cf * 1.25 : 0) + (score ? 3 + sf * 1.15 + (hasPens ? pf * 1.15 : 0) : 0);
    return { cf, sf, pf, tagH, height, code, score };
  };
  // The fullest set of parts that leaves a mark of at least 10 (at least 8, for the smallest box of all).
  const sets: [boolean, boolean, boolean][] = [[haveTag, true, haveScore], [false, true, haveScore], [false, false, haveScore], [false, false, false]];
  let m = 8;
  let L = lay(m, false, false, false);
  for (const [tag, code, score] of sets) {
    // The marks leave room between them for the "vs".
    const room = Math.min(colW - 2 - (colW >= 26 ? bw(vsText, 10) + 6 : 0), 56, h - 2 * padY);
    let cand = room;
    let got = lay(cand, tag, code, score);
    while (cand > 10 && got.height > h - 2 * padY) { cand -= 0.5; got = lay(cand, tag, code, score); }
    if (cand >= 10 && got.height <= h - 2 * padY) { m = cand; L = got; break; }
  }
  if (L.height > h - 2 * padY || m > colW - 2) { m = Math.max(6, Math.min(colW - 2, h - 2 * padY)); L = lay(m, false, false, false); }
  const top = y + (h - L.height) / 2;
  const clip = shieldClip(ctx);
  const square: MarkContext = { ...ctx, shape: ctx.shape === "none" ? "none" : "square" };
  e.order.forEach((k, n) => {
    const team = tie.sides[k];
    const cx = x + padX + colW / 2 + n * colW;
    const parts: string[] = [];
    let yy = top;
    if (L.tagH && tags[k]) {
      const tw = bw(tags[k], 8) + 8;
      parts.push(`<rect class="tb-tagbox" x="${num(cx - tw / 2)}" y="${num(yy)}" width="${num(tw)}" height="11" rx="5.5"/><text class="tb-tag" x="${num(cx)}" y="${num(yy + 8.2)}" font-size="8" text-anchor="middle">${esc(tags[k])}</text>`);
    }
    yy += L.tagH;
    const sx = cx - m / 2;
    if (team && ctx.shape !== "none") parts.push(`<g clip-path="url(#${clip})">${drawMark(team, cx, yy + m / 2, m, square)}</g>`);
    parts.push(`<path class="tb-shield${team ? "" : " tb-empty"}" d="${shieldPath(sx, yy, m)}"/>`);
    yy += m;
    if (L.code) {
      yy += 3;
      const code = team ? abbrOf(team, v) : v.words.tbd;
      const room = colW - 2;
      if (bw(code, L.cf) <= room) parts.push(`<text class="tb-code" x="${num(cx)}" y="${num(yy + L.cf * 0.75)}" font-size="${num(L.cf)}" text-anchor="middle">${esc(code)}</text>`);
      yy += L.cf * 1.25;
    }
    if (L.score) {
      yy += 3;
      parts.push(`<text class="tb-score" x="${num(cx)}" y="${num(yy + L.sf * 0.8)}" font-size="${num(L.sf)}" text-anchor="middle" font-variant-numeric="tabular-nums">${esc(scoreOf(e, k))}</text>`);
      yy += L.sf * 1.15;
      const pens = pensOf(e, k);
      if (pens) parts.push(`<text class="tb-muted" x="${num(cx)}" y="${num(yy + L.pf * 0.8)}" font-size="${num(L.pf)}" font-weight="600" text-anchor="middle">${esc(pens)}</text>`);
    }
    out.push(e.link(k, `<g class="${e.cls(k)}">${parts.join("")}</g>`, cx - colW / 2, y, colW, h));
  });
  const f = vf(m);
  if (colW - m >= bw(vsText, f) + 4) out.push(`<text class="tb-vs" x="${num(x + w / 2)}" y="${num(top + L.tagH + m / 2 + f * 0.35)}" font-size="${num(f)}" text-anchor="middle">${esc(vsText)}</text>`);
  return out;
}

// ---------------------------------------------------------------------------------------------- update

/** A compact card: each team's abbreviation and seed on the left, its score in a cell on the right; a team not known yet is an empty bar. */
function update(e: PaintEnv): string[] {
  const { x, y, w, h, tie, v } = e;
  const out: string[] = [];
  const rowH = h / 2;
  const padX = e.road ? clamp(rowH * 0.18, 5, 10) : 6;
  const font = clamp(rowH * (e.road ? 0.5 : 0.52), 8.5, e.road ? 19 : 15);
  const sf = clamp(rowH * (e.road ? 0.6 : 0.52), 9, e.road ? 20 : 15);
  const cellH = Math.min(rowH - 6, e.road ? 30 : 24);
  const texts = ([0, 1] as const).map((k) => scoreOf(e, k));
  const cellW = e.scoresOn ? clamp(Math.max(...texts.map((t) => bw(t, sf))) + 10, cellH, 44) : 0;
  const sm = Math.max(font * 0.72, 7.5);
  e.order.forEach((k, n) => {
    const team = tie.sides[k];
    const ry = y + n * rowH;
    const cy = ry + rowH / 2;
    const parts: string[] = [];
    const cellX = x + w - padX - cellW;
    if (e.scoresOn) {
      parts.push(`<rect class="tb-slot" x="${num(cellX)}" y="${num(cy - cellH / 2)}" width="${num(cellW)}" height="${num(cellH)}" rx="${num(Math.min(5, cellH / 3))}"/>`);
      const s = scoreOf(e, k);
      if (s) parts.push(`<text class="tb-score" x="${num(cellX + cellW / 2)}" y="${num(cy + sf * 0.35)}" font-size="${num(sf)}" text-anchor="middle" font-variant-numeric="tabular-nums">${esc(s)}</text>`);
    }
    const right = (e.scoresOn ? cellX - 5 : x + w - padX);
    if (team) {
      const code = abbrOf(team, v);
      const tag = e.tags ? e.tagOf(tie, k) : "";
      let nf = font;
      const need = (size: number) => bw(code, size) + (tag ? bw(tag, Math.max(size * 0.72, 7.5)) + 5 : 0);
      while (nf > 9 && need(nf) > right - (x + padX)) nf -= 0.5;
      const shown = fit(code, nf, right - (x + padX), bw);
      parts.push(`<text class="tb-name" x="${num(x + padX)}" y="${num(cy + nf * 0.35)}" font-size="${num(nf)}" font-weight="700">${esc(shown)}</text>`);
      const at = x + padX + bw(shown, nf) + 5;
      const sz = Math.max(nf * 0.72, 7.5);
      if (tag && at + bw(tag, sz) <= right) parts.push(`<text class="tb-muted tb-seed" x="${num(at)}" y="${num(cy + sz * 0.35)}" font-size="${num(sz)}" font-weight="600">${esc(tag)}</text>`);
    } else {
      parts.push(`<rect class="tb-emptybar" x="${num(x + padX)}" y="${num(cy - 2.5)}" width="${num(Math.max(Math.min(right - (x + padX), 34), 8))}" height="5" rx="2.5"/>`);
    }
    out.push(e.link(k, `<g class="${e.cls(k)}">${parts.join("")}</g>`, x, ry, w, rowH));
  });
  void sm;
  out.push(`<line class="${e.road ? "tb-sep" : "tb-line"}" x1="${num(x + 4)}" x2="${num(x + w - 4)}" y1="${num(y + rowH)}" y2="${num(y + rowH)}" stroke-opacity=".35"${e.o.theme === "none" ? ' stroke="currentColor"' : ""}/>`);
  return out;
}

// ---------------------------------------------------------------------------------------------- series

/** The width a one-line series needs: "1 BOS 4–0 MIA 8" set at `size`. */
export function seriesLineWidth(tie: Tie, v: Voice, size: number, scoresOn: boolean): number {
  const code = (k: 0 | 1) => (tie.sides[k] ? abbrOf(tie.sides[k], v) : v.words.tbd);
  const score = scoresOn && tie.result.score ? fillScore(tie, v) : v.words.vs;
  return bw(code(0), size) + bw(code(1), size) + bw(score, size) + 4 * size * 0.6 + 8 * 2 + 2 * bw("00", size * 0.72);
}

const fillScore = (tie: Tie, v: Voice, swap = false): string => (tie.result.score ? v.words.scoreText.replace("{a}", sideScore(tie, swap ? 1 : 0, v)).replace("{b}", sideScore(tie, swap ? 0 : 1, v)) : "");

/** One line a series: "(1) BOS 4–0 MIA (8)", the winner in bold and the loser quiet. Where the box is too narrow for a line, two compact rows. */
function series(e: PaintEnv): string[] {
  const { x, y, w, h, tie, v } = e;
  const font = clamp(h * 0.38, 8.5, e.road ? 16 : 14);
  const need = (size: number) => seriesLineWidth(tie, v, size, e.scoresOn);
  let size = font;
  while (size > 8.5 && need(size) > w - 8) size -= 0.5;
  if (need(size) > w - 8) return update(e);
  const [a, b] = e.order;
  const cy = y + h / 2;
  const score = e.scoresOn && tie.result.score ? fillScore(tie, v) : v.words.vs;
  const scoreOrdered = e.scoresOn && tie.result.score && a === 1 ? fillScore(tie, v, true) : score;
  const sw = bw(scoreOrdered, size);
  const cx = x + w / 2;
  const ss = Math.max(size * 0.72, 7.5);
  const part = (k: 0 | 1, left: boolean): string => {
    const team = tie.sides[k];
    const code = team ? abbrOf(team, v) : v.words.tbd;
    const tag = e.tags ? e.tagOf(tie, k) : "";
    const edge = left ? cx - sw / 2 - 6 : cx + sw / 2 + 6;
    const seed = tag ? `<tspan class="tb-muted tb-seed" font-size="${num(ss)}" font-weight="600">${esc(tag)}</tspan>` : "";
    // The left team's seed comes before its code, the right team's after: the two seeds are the line's ends.
    const body = left ? `${seed}${tag ? " " : ""}${esc(code)}` : `${esc(code)}${tag ? " " : ""}${seed}`;
    return `<g class="${e.cls(k)}"><text class="tb-name${team ? "" : " tb-muted"}" x="${num(edge)}" y="${num(cy + size * 0.35)}" font-size="${num(size)}"${left ? ' text-anchor="end"' : ""}>${body}</text></g>`;
  };
  return [
    e.link(a, part(a, true), x, y, w / 2, h),
    `<text class="tb-score tb-series" x="${num(cx)}" y="${num(cy + size * 0.35)}" font-size="${num(size)}" text-anchor="middle" font-variant-numeric="tabular-nums">${esc(scoreOrdered)}</text>`,
    e.link(b, part(b, false), x + w / 2, y, w / 2, h),
  ];
}

// ---------------------------------------------------------------------------------------------- columns

/** Tall slots, the two sides of a tie one over the other (the final's side by side) with a "VS" or "AT" tag between them, and each team's seed as a big number in its slot. */
function columns(e: PaintEnv): string[] {
  const { x, y, w, h, tie, v, ctx } = e;
  const out: string[] = [];
  const pad = 4;
  const tagText = v.upper(e.o.at === true ? v.words.at : v.words.vs);
  const tf = 8;
  const tagW = bw(tagText, tf) + 10;
  const tagH = 13;
  const sideBySide = e.final;
  // `at`: the visiting side is drawn first and the side at home second.
  let order = e.order;
  if (e.o.at === true && tie.home !== undefined && order[1] !== tie.home) order = [order[1], order[0]];
  const slots = sideBySide
    ? ([0, 1] as const).map((n) => ({ x: x + pad + n * ((w - 2 * pad + (tagW + 6)) / 2), y: y + pad, w: (w - 2 * pad - (tagW + 6)) / 2, h: h - 2 * pad }))
    : ([0, 1] as const).map((n) => ({ x: x + pad, y: y + pad + n * ((h - 2 * pad + tagH + 4) / 2), w: w - 2 * pad, h: (h - 2 * pad - tagH - 4) / 2 }));
  order.forEach((k, n) => {
    const team = tie.sides[k];
    const s = slots[n];
    const parts: string[] = [];
    parts.push(`<rect class="tb-slot tb-cslot" x="${num(s.x)}" y="${num(s.y)}" width="${num(s.w)}" height="${num(s.h)}" rx="${num(Math.min(6, s.h / 4))}"/>`);
    const rawSeed = tie.sides[k]?.seed ?? e.tagOf(tie, k);
    const seed = rawSeed === undefined || rawSeed === null || rawSeed === "" ? "" : String(rawSeed).slice(0, 3);
    const seedF = seed ? clamp(Math.min(s.h * 0.4, s.w * 0.3), 11, 26) : 0;
    const seedW = seed ? bw(seed, seedF) + 6 : 0;
    // The seed is a big number at the slot's outer edge; the rest is laid out in what is left.
    let cx0 = s.x + 4 + seedW, cw = s.w - 8 - seedW;
    if (seed && cw < 36) { cx0 = s.x + 4; cw = s.w - 8; }
    const showSeed = seed !== "" && cx0 > s.x + 4;
    if (showSeed) parts.push(`<text class="tb-seedn" x="${num(s.x + 6)}" y="${num(s.y + s.h / 2 + seedF * 0.35)}" font-size="${num(seedF)}" font-weight="800">${esc(seed)}</text>`);
    const score = scoreOf(e, k);
    const pens = pensOf(e, k);
    const code = team ? abbrOf(team, v) : v.words.tbd;
    const tall = s.h >= 64 && cw >= 34;
    if (tall) {
      const cf = clamp(s.h * 0.15, 8, 12);
      let sf = score ? clamp(s.h * 0.3, 10, 22) : 0;
      const wantMark = ctx.shape === "none" ? 0 : 1;
      const stackH = (m: number) => m * wantMark + (wantMark ? 3 : 0) + cf * 1.25 + (score ? 3 + sf * 1.15 : 0);
      let m = Math.max(10, Math.min(cw - 4, 46, s.h - 8));
      while (m > 10 && stackH(m) > s.h - 8) m -= 0.5;
      while (sf > 10 && stackH(m) > s.h - 8) sf -= 0.5;
      let yy = s.y + (s.h - stackH(m)) / 2;
      const cx = cx0 + cw / 2;
      if (wantMark) { parts.push(drawMark(team, cx, yy + m / 2, m, ctx)); yy += m + 3; }
      parts.push(`<text class="tb-name${team ? "" : " tb-muted"}" x="${num(cx)}" y="${num(yy + cf * 0.75)}" font-size="${num(cf)}" font-weight="700" text-anchor="middle">${esc(e.detail === "full" && team && bw(team.name, cf) <= cw ? team.name : fit(code, cf, cw, bw))}</text>`);
      yy += cf * 1.25;
      if (score) {
        yy += 3;
        const span = pens ? `<tspan class="tb-muted" dx="2" font-size="${num(Math.max(sf * 0.55, 7))}" font-weight="600">${esc(pens)}</tspan>` : "";
        parts.push(`<text class="tb-score" x="${num(cx)}" y="${num(yy + sf * 0.8)}" font-size="${num(sf)}" text-anchor="middle" font-variant-numeric="tabular-nums">${esc(score)}${span}</text>`);
      }
    } else {
      // A low slot: the mark, the three letters and the score in a row.
      const cy = s.y + s.h / 2;
      const m = ctx.shape === "none" ? 0 : clamp(s.h - 8, 10, 30);
      const sf = clamp(s.h * 0.5, 9, 16);
      const cf = clamp(s.h * 0.4, 8, 13);
      let from = cx0;
      if (m) { parts.push(drawMark(team, from + m / 2, cy, m, ctx)); from += m + 4; }
      const scoreW = score ? bw(score + pens, sf) + 4 : 0;
      const room = cx0 + cw - from - scoreW;
      if (room >= 12) parts.push(`<text class="tb-name${team ? "" : " tb-muted"}" x="${num(from)}" y="${num(cy + cf * 0.35)}" font-size="${num(cf)}" font-weight="700">${esc(fit(code, cf, room, bw))}</text>`);
      if (score) {
        const span = pens ? `<tspan class="tb-muted" dx="2" font-size="${num(Math.max(sf * 0.55, 7))}" font-weight="600">${esc(pens)}</tspan>` : "";
        parts.push(`<text class="tb-score" x="${num(cx0 + cw)}" y="${num(cy + sf * 0.35)}" font-size="${num(sf)}" text-anchor="end" font-variant-numeric="tabular-nums">${esc(score)}${span}</text>`);
      }
    }
    out.push(e.link(k, `<g class="${e.cls(k)}">${parts.join("")}</g>`, s.x, s.y, s.w, s.h));
  });
  // The tag between the two slots.
  const tcx = sideBySide ? slots[0].x + slots[0].w + (slots[1].x - slots[0].x - slots[0].w) / 2 : x + w / 2;
  const tcy = sideBySide ? y + h / 2 : slots[0].y + slots[0].h + (slots[1].y - slots[0].y - slots[0].h) / 2;
  out.push(`<rect class="tb-atag" x="${num(tcx - tagW / 2)}" y="${num(tcy - tagH / 2)}" width="${num(tagW)}" height="${num(tagH)}" rx="${num(tagH / 2)}"/><text class="tb-atag-t" x="${num(tcx)}" y="${num(tcy + tf * 0.35)}" font-size="${tf}" font-weight="800" letter-spacing=".08em" text-anchor="middle">${esc(tagText)}</text>`);
  return out;
}
