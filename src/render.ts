import type { BracketInput, BracketLayout, Detail, DrawOptions, LayoutBox, Matchup, Size, SizeName, Team, ThemeName, Tie } from "./types.ts";
import { layoutBracket } from "./layout.ts";
import { abbrOf, describeTie, noteParts } from "./matchup.ts";
import { cleanSvg, clipId, drawMark, safeUrl, type MarkContext } from "./marks.ts";
import { roundLabel } from "./rounds.ts";
import { styleFor } from "./theme.ts";
import { esc, fit, hash, num, textWidth } from "./text.ts";
import { fill, voiceOf, type Voice } from "./locales.ts";

/** The sizes by name. A phone's drawing is 390 wide and as tall as the bracket needs. */
export const SIZES: Readonly<Record<SizeName, Size>> = Object.freeze({
  wide: { width: 1200, height: 675 },
  square: { width: 1080, height: 1080 },
  phone: { width: 390, height: null },
});

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const isLayout = (x: unknown): x is BracketLayout => typeof x === "object" && x !== null && "ties" in x && "sides" in x && "rounds" in x;

interface Rect { x: number; y: number; w: number; h: number }
interface Placed { rect: Rect; tie: Tie; order: readonly [0 | 1, 0 | 1]; bye: 0 | 1 | null; final: boolean; champion: boolean }

/** What a drawing is made of before it is written out: the boxes, the lines, the labels. */
interface Plan {
  width: number;
  height: number;
  boxes: Placed[];
  links: string[];
  texts: string[];
  extras: string[];
  detail: Exclude<Detail, "auto">;
  vertical: boolean;
}

/** The layout with each team's name in the language: what the drawing, the table and the description are written from. */
export function localizedLayout(layout: BracketLayout, v: Voice): BracketLayout {
  const named = new Map(layout.teams.map((t) => [t.id, { ...t, name: v.team(t) }]));
  const swap = <T extends Team | null>(t: T): T => (t ? ((named.get(t.id) ?? t) as T) : t);
  return { ...layout, ties: layout.ties.map((t) => ({ ...t, sides: [swap(t.sides[0]), swap(t.sides[1])] as const })), champion: swap(layout.champion), teams: [...named.values()] };
}

/** The text a screen reader gets for the drawing as a whole, in the language of `locale`. */
export function describeBracket(input: BracketLayout | readonly Matchup[] | BracketInput, options: Pick<DrawOptions, "locale" | "words" | "teamName" | "roundNames"> = {}): string {
  const v = voiceOf(options);
  const layout = localizedLayout(isLayout(input) ? input : layoutBracket(input), v);
  const w = v.words;
  const parts = [fill(layout.rounds === 1 ? w.summaryOne : w.summary, { n: v.number(layout.teams.length), r: v.number(layout.rounds) })];
  const finalTie = layout.finalIndex !== null ? layout.ties[layout.finalIndex] : null;
  if (finalTie) parts.push(fill(w.finalLine, { round: roundLabel(layout, layout.rounds, options.roundNames, v), tie: describeTie(finalTie, v) }));
  if (layout.champion) parts.push(fill(w.championIs, { name: layout.champion.name }));
  return `${parts.join(w.sep)}${w.end}`;
}

/**
 * Draws a bracket as an SVG string. `input` is a list of matchups, `{ matchups, teams }` or a layout from `layoutBracket`.
 * The same input and options always give the same string: no clock, no random number, no counter.
 */
export function drawBracket(input: BracketLayout | readonly Matchup[] | BracketInput, options: DrawOptions = {}): string {
  const v = voiceOf(options);
  const layout = localizedLayout(isLayout(input) ? input : layoutBracket(input, options), v);
  const theme: ThemeName = options.theme ?? "auto";
  const sizeName = typeof options.size === "string" || options.size === undefined ? options.size ?? "wide" : null;
  const size: Size = sizeName ? SIZES[sizeName] : { width: (options.size as { width: number }).width, height: (options.size as { height?: number | null }).height ?? null };
  const orientation = options.orientation && options.orientation !== "auto" ? options.orientation : sizeName === "phone" || (size.height !== null && size.width < size.height * 0.8) ? "vertical" : "horizontal";
  const prefix = options.id ?? `tb-${hash(JSON.stringify([v.locale.code, layout.teams.map((t) => t.name), layout.ties.map((t) => [t.id, t.sides.map((s) => s?.id ?? null), t.winner, t.result.score, t.round]), options.size, orientation, options.detail, theme, options.title, options.subtitle, options.seeds, options.scores, options.champion, options.markShape, options.roundLabels, options.thirdPlace, options.trophy ? 1 : 0]))}`;
  const ctx: MarkContext = { radii: new Set(), symbols: new Map(), prefix, shape: options.markShape ?? "round" };
  const plan = planBracket(layout, options, v, size, orientation === "vertical", ctx);

  const drawn = plan.boxes.map((b) => drawBox(b, plan, options, v, ctx)); // draws the marks, so before the defs are written
  const title = options.title ?? v.words.title;
  const desc = describeBracket(layout, options);
  const defs = [
    ...[...ctx.radii].sort((a, b) => a - b).map((r) => `<clipPath id="${clipId(prefix, r)}"><circle r="${num(r)}"/></clipPath>`),
    ...[...ctx.symbols.values()].map((s) => `<symbol id="${s.id}" viewBox="${esc(s.viewBox)}" preserveAspectRatio="xMidYMid slice">${s.inner}</symbol>`),
  ].join("");
  const style = theme === "none" ? "" : `<style>${styleFor(`.${prefix}`, theme)}</style>`;
  const bg = options.background === false ? "" : `<rect class="tb-bg" width="${num(plan.width)}" height="${num(plan.height)}"${theme === "none" ? ' fill="none"' : ""}/>`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" lang="${esc(v.locale.code)}" class="taisen ${prefix}${options.className ? ` ${esc(options.className)}` : ""}" viewBox="0 0 ${num(plan.width)} ${num(plan.height)}" width="${num(plan.width)}" height="${num(plan.height)}" style="max-width:100%;height:auto" role="img" aria-labelledby="${prefix}-t ${prefix}-d">`,
    `<title id="${prefix}-t">${esc(title)}</title><desc id="${prefix}-d">${esc(desc)}</desc>`,
    style,
    defs ? `<defs>${defs}</defs>` : "",
    bg,
    ...plan.links,
    ...drawn,
    ...plan.texts,
    ...plan.extras,
    "</svg>",
  ].filter(Boolean).join("\n");
}

// ---------------------------------------------------------------------------------------------- the plan

function planBracket(layout: BracketLayout, o: DrawOptions, v: Voice, size: Size, vertical: boolean, ctx: MarkContext): Plan {
  const pad = vertical ? 14 : 22;
  const showLabels = o.roundLabels ?? true;
  const poster = o.theme === "poster";
  const boxes: Placed[] = [];
  const links: string[] = [];
  const texts: string[] = [];
  const extras: string[] = [];
  const W0 = size.width;
  const titleH = (o.title ? (poster ? 46 : 38) : 0) + (o.subtitle ? 24 : 0) + (o.title || o.subtitle ? 10 : 0);
  const hasGroups = layout.sides.some((s) => s.label);
  const champ = (o.champion ?? true) && layout.champion !== null && layout.finalIndex !== null;
  const withThird = layout.third !== null && (o.thirdPlace ?? "below") !== "hide";
  // Beside the final in a horizontal bracket of two halves, under the final; elsewhere the lines into the final would run through it, so it goes at the foot.
  const bottomThird = withThird && !(layout.shape === "halves" && !vertical);
  const thirdBlock = bottomThird ? 18 + (vertical ? 52 : OTHER_H) + 16 : 0;
  const halves = layout.shape === "halves";
  const nc = layout.columns.length;
  const rows = layout.rows;
  const hasTrophy = !!o.trophy && champ;

  // ----- slots along the rounds' axis (t): the columns of the left half, the centre, the columns of the right half.
  // Horizontal: t is x. Vertical: t is y, and the left half is the top.
  const slotCount = halves ? 2 * nc + 1 : nc + (champ || layout.finalIndex !== null ? 1 : 0);
  const slotOfColumn = (side: "l" | "r", c: number) => (side === "l" ? c : slotCount - 1 - c);

  // Dimensions of a box: w across the page, h down the page.
  let D = 0, S = 0; // the box along the rounds' axis, and across it
  let gapT = 0;
  let rowStep = 0;
  let centreT = 0; // the centre slot's size along t
  let boxW = 0, boxH = 0;

  let others: number[] = [];
  let ow = 0;
  let extraH0 = 0;
  if (!vertical) {
    const availW = W0 - 2 * pad;
    const g = 0.2;
    const centreMin = halves ? 168 : 150;
    let d = (availW - centreMin) / ((halves ? 2 : 1) * Math.max(nc, 1) * (1 + g));
    if (1.2 * d > centreMin) d = availW / ((halves ? 2 : 1) * Math.max(nc, 1) * (1 + g) + 1.2);
    D = clamp(d, 40, 220);
    gapT = D * g;
    centreT = Math.max(centreMin, D * 1.2);
    const top = pad + titleH + (hasGroups ? 28 : 0) + (showLabels ? 24 : 6);
    others = othersOf(layout);
    ow = clamp(D * 1.1, 120, 200);
    extraH0 = othersHeight(others.length, W0, pad, ow, OTHER_H) + thirdBlock;
    const bodyH = size.height === null ? rows * 60 : size.height - top - pad - extraH0;
    rowStep = bodyH / rows;
    S = clamp(rowStep - 9, 24, 104);
    rowStep = Math.max(rowStep, S + 6);
    rowStep = Math.min(rowStep, S + 40);
    boxW = D; boxH = S;
  } else {
    const availW = W0 - 2 * pad;
    const slot = availW / Math.max(rows, 1);
    S = clamp(slot - 5, 30, 150);
    rowStep = Math.min(slot, S + 5);
    boxW = S;
  }
  // Full boxes (names) only where the longest name fits beside its mark and a score.
  const longest = Math.max(0, ...layout.teams.map((t) => textWidth(t.name, 13)));
  const pick = (w: number, h: number): Exclude<Detail, "auto"> => {
    const rowH = h / 2;
    const font = clamp(rowH * 0.5, 8.5, 16);
    const md = clamp(rowH * 0.7, 10, 28);
    const needed = 6 + md + 5 + longest * (font / 13) + 8 + textWidth("00", font + 1) + 14;
    const named = o.detail && o.detail !== "auto" ? o.detail : w >= needed && h >= 36 ? "full" : w >= 76 && h >= 28 ? "compact" : "mark";
    return named === "mark" && o.markShape === "none" ? "compact" : named;
  };
  const detail = pick(boxW, vertical ? 48 : boxH);
  if (vertical) boxH = detail === "full" ? 50 : detail === "compact" ? 42 : boxW >= 76 ? 38 : 2 * Math.min(boxW - 8, 24) + 8;
  if (vertical) { D = boxH; gapT = showLabels ? 26 : 16; }

  // The champion's block: a trophy, a large mark, the name and the word; and the third-place match below the final.
  const champMark = vertical ? 54 : clamp(centreT * 0.34, 44, 84);
  const trophyH = hasTrophy ? (vertical ? 56 : clamp(centreT * 0.45, 48, 84)) : 0;
  const nameFont = clamp(champMark * 0.3, 13, 20);
  const champH = champ ? trophyH + (hasTrophy ? 6 : 0) + champMark + 8 + nameFont + 6 + 11 + 2 : 0;
  const finalW = halves ? (vertical ? Math.min(size.width - 2 * pad, Math.max(boxW, 160)) : Math.min(centreT - 12, Math.max(D * 1.1, 120))) : D;
  const finalH = vertical ? (detail === "mark" ? Math.max(boxH, 52) : boxH) : boxH;
  const thirdH = withThird && !bottomThird ? 18 + boxH + 14 : 0;

  // ----- the slot positions along t
  if (!vertical) {
    const sizes: number[] = [];
    for (let k = 0; k < slotCount; k++) sizes.push(halves && k === nc ? centreT : !halves && k === nc ? Math.max(centreMinLtr(D), 150) : D);
    const total = sizes.reduce((a, b) => a + b, 0) + gapT * (slotCount - 1);
    let t = pad + Math.max(0, (W0 - 2 * pad - total) / 2);
    const starts: number[] = [];
    sizes.forEach((sz) => { starts.push(t); t += sz + gapT; });
    const width = Math.max(W0, total + 2 * pad);
    // ----- span positions
    const top = pad + titleH + (hasGroups ? 28 : 0) + (showLabels ? 24 : 6);
    const treeH = rows * rowStep;
    // The final sits at the middle of the rows; the champion above it and the third place below need room.
    const upNeed = (champ ? champH + 8 : 0) + 22 + finalH / 2;
    const downNeed = finalH / 2 + (withThird ? thirdH : 0);
    const half = Math.max(treeH / 2, upNeed, downNeed);
    const bodyH = half * 2;
    const height = Math.max(size.height ?? 0, top + bodyH + pad + extraH0);
    const body0 = top + (height - top - pad - extraH0 - bodyH) / 2;
    const treeY0 = body0 + (bodyH - treeH) / 2;
    const yOf = (row: number) => treeY0 + row * rowStep + (rowStep - S) / 2;
    const place = (side: "l" | "r", b: LayoutBox) => {
      const c = layout.columns.indexOf(b.round);
      const k = halves ? slotOfColumn(side, c) : c;
      return { x: starts[k], y: yOf(b.y), w: D, h: S };
    };
    const rects = new Map<number, Rect>();
    for (const sd of layout.sides) for (const b of sd.boxes) {
      const rect = place(sd.key, b);
      rects.set(b.i, rect);
      boxes.push({ rect, tie: layout.ties[b.i], order: b.order, bye: b.bye, final: false, champion: false });
    }
    const midX = (halves ? starts[nc] : starts[nc] ?? 0) + (halves ? centreT : 0) / 2;
    if (halves && layout.final) {
      const fy = treeY0 + layout.final.y * rowStep + rowStep / 2;
      const rect = { x: midX - finalW / 2, y: fy - finalH / 2, w: finalW, h: finalH };
      rects.set(layout.final.i, rect);
      boxes.push({ rect, tie: layout.ties[layout.final.i], order: layout.final.order, bye: null, final: true, champion: champ });
      if (showLabels) texts.push(label(v, roundLabel(layout, layout.rounds, o.roundNames, v), midX, rect.y - 7, "middle"));
      if (champ) extras.push(...championBlock(layout.champion!, midX, rect.y - 22 - champH, champMark, trophyH, nameFont, o, v, ctx, poster));
      if (withThird) {
        const t3 = layout.ties[layout.third!];
        const r3 = { x: midX - finalW / 2, y: rect.y + rect.h + 14 + 18, w: finalW, h: boxH };
        rects.set(layout.third!, r3);
        texts.push(label(v, v.words.thirdPlace, midX, r3.y - 6, "middle"));
        boxes.push({ rect: r3, tie: t3, order: [0, 1], bye: null, final: false, champion: false });
      }
    } else if (!halves) {
      const k = nc;
      const fi = layout.finalIndex;
      const fb = fi !== null ? layout.sides[0]?.boxes.find((b) => b.i === fi) : undefined;
      if (fb && champ) {
        const cx = starts[k] + sizes[k] / 2;
        const fy = rects.get(fi!)!.y + S / 2;
        extras.push(...championBlock(layout.champion!, cx, fy - champH / 2, champMark, trophyH, nameFont, o, v, ctx, poster));
      }
    }
    if (showLabels) {
      for (const c of layout.columns) {
        const name = roundLabel(layout, c, o.roundNames, v);
        const ci = layout.columns.indexOf(c);
        const ks = halves ? [slotOfColumn("l", ci), slotOfColumn("r", ci)] : [ci];
        const used = layout.sides.length > 1 || !halves ? (halves ? [0, 1] : [0]) : [0];
        ks.forEach((k, n) => { if (used.includes(n) && (!halves || n < layout.sides.length)) texts.push(label(v, name, starts[k] + D / 2, top - 9, "middle", D + gapT * 0.8)); });
      }
    }
    if (hasGroups) {
      layout.sides.forEach((sd) => {
        if (!sd.label) return;
        const ks = layout.columns.map((_, ci) => slotOfColumn(sd.key, ci));
        const x0 = Math.min(...ks.map((k) => starts[k])), x1 = Math.max(...ks.map((k) => starts[k] + D));
        texts.push(`<text class="tb-half" x="${num((x0 + x1) / 2)}" y="${num(top - (showLabels ? 36 : 14))}" font-size="${poster ? 16 : 15}" font-weight="700" letter-spacing=".1em" text-anchor="middle">${esc(poster ? v.upper(sd.label) : sd.label)}</text>`);
      });
    }
    // lines
    for (const t of layout.ties) {
      const p = layout.parent[t.index];
      if (p === -1) continue;
      const a = rects.get(t.index), b = rects.get(p);
      if (!a || !b || layout.place[t.index] === "o") continue;
      const goingRight = b.x > a.x;
      const x0 = goingRight ? a.x + a.w : a.x, x1 = goingRight ? b.x : b.x + b.w;
      const y0 = a.y + a.h / 2, y1 = b.y + b.h / 2;
      const xm = (x0 + x1) / 2;
      links.push(`<path class="tb-line" d="M${num(x0)} ${num(y0)}H${num(xm)}V${num(y1)}H${num(x1)}"${lineAttrs(o)}/>`);
    }
    if (bottomThird) thirdAtFoot(layout, height - pad - extraH0 + 6, width / 2, ow, OTHER_H, v, boxes, texts);
    othersBlock(layout, others, height - pad - extraH0 + thirdBlock + 6, width, pad, ow, OTHER_H, v, boxes, texts);
    texts.push(...headings(v, o, width, pad, poster));
    return { width, height, boxes, links, texts, extras, detail, vertical };
  }

  // ----- vertical: the rounds are rows. The left half is the top; the final is a band in the middle.
  const bandT = D + gapT;
  const groupBand = hasGroups ? 26 : 0;
  // On a tall page the champion sits at the top, as the page's first thing; the lines into the final must not run through it.
  const champTop = halves && champ ? champH + 14 : 0;
  const centreBand = (showLabels ? 32 : 0) + 6 + finalH + 14;
  const topT = pad + titleH + champTop + groupBand + (showLabels ? 14 : 0);
  const bandsPerSide = nc;
  const totalT = halves ? topT + bandsPerSide * bandT + centreBand + bandsPerSide * bandT + groupBand + pad : topT + (nc + (champ ? 1 : 0)) * bandT + (champ ? champH : 0) + pad;
  others = othersOf(layout);
  ow = Math.min(W0 - 2 * pad, 150);
  const extraV = othersHeight(others.length, W0, pad, ow, OTHER_H) + thirdBlock;
  const height = Math.max(size.height ?? 0, totalT + extraV);
  const treeW = rows * rowStep;
  const x0 = pad + (W0 - 2 * pad - treeW) / 2;
  const xOf = (row: number) => x0 + row * rowStep + (rowStep - S) / 2;
  const bandStart = (side: "l" | "r", c: number): number => {
    if (!halves) return topT + c * bandT;
    // Top half: round 1 at the top; bottom half: round 1 at the bottom.
    if (side === "l") return topT + c * bandT;
    return topT + bandsPerSide * bandT + centreBand + (bandsPerSide - 1 - c) * bandT;
  };
  const rects = new Map<number, Rect>();
  for (const sd of layout.sides) for (const b of sd.boxes) {
    const c = layout.columns.indexOf(b.round);
    const rect = { x: xOf(b.y), y: bandStart(sd.key, c), w: S, h: D };
    rects.set(b.i, rect);
    boxes.push({ rect, tie: layout.ties[b.i], order: b.order, bye: b.bye, final: false, champion: false });
  }
  const midX = W0 / 2;
  if (halves && layout.final) {
    const cy0 = topT + bandsPerSide * bandT;
    let y = cy0;
    if (champ) extras.push(...championBlock(layout.champion!, midX, pad + titleH + 4, champMark, trophyH, nameFont, o, v, ctx, poster));
    if (showLabels) { texts.push(label(v, roundLabel(layout, layout.rounds, o.roundNames, v), midX, y + 12, "middle")); y += 16; }
    const rect = { x: midX - finalW / 2, y: y + 6, w: finalW, h: finalH };
    rects.set(layout.final.i, rect);
    boxes.push({ rect, tie: layout.ties[layout.final.i], order: layout.final.order, bye: null, final: true, champion: champ });
  } else if (!halves && champ && layout.finalIndex !== null) {
    const fr = rects.get(layout.finalIndex)!;
    extras.push(...championBlock(layout.champion!, fr.x + fr.w / 2, fr.y + fr.h + 12, champMark, trophyH, nameFont, o, v, ctx, poster));
  }
  if (showLabels) {
    layout.columns.forEach((c, ci) => {
      const name = roundLabel(layout, c, o.roundNames, v);
      const sides: ("l" | "r")[] = halves ? (layout.sides.length > 1 ? ["l", "r"] : ["l"]) : ["l"];
      for (const sd of sides) texts.push(`<text class="tb-round tb-halo" x="${num(pad)}" y="${num(bandStart(sd, ci) - 8)}" font-size="11" font-weight="600" letter-spacing=".08em">${esc(v.upper(name))}</text>`);
    });
  }
  if (hasGroups) {
    layout.sides.forEach((sd) => {
      if (!sd.label) return;
      const y = sd.key === "l" ? pad + titleH + champTop + 16 : totalT - pad - 2;
      texts.push(`<text class="tb-half" x="${num(midX)}" y="${num(y)}" font-size="14" font-weight="700" letter-spacing=".1em" text-anchor="middle">${esc(v.upper(sd.label))}</text>`);
    });
  }
  for (const t of layout.ties) {
    const p = layout.parent[t.index];
    if (p === -1) continue;
    const a = rects.get(t.index), b = rects.get(p);
    if (!a || !b || layout.place[t.index] === "o") continue;
    const down = b.y > a.y;
    const y0 = down ? a.y + a.h : a.y, y1 = down ? b.y : b.y + b.h;
    const x0c = a.x + a.w / 2, x1c = b.x + b.w / 2;
    const ym = down ? y0 + gapT * 0.4 : y0 - gapT * 0.4;
    links.push(`<path class="tb-line" d="M${num(x0c)} ${num(y0)}V${num(ym)}H${num(x1c)}V${num(y1)}"${lineAttrs(o)}/>`);
  }
  if (bottomThird) thirdAtFoot(layout, totalT - pad + 6, W0 / 2, Math.min(W0 - 2 * pad, 200), 52, v, boxes, texts);
  othersBlock(layout, others, totalT - pad + thirdBlock + 6, W0, pad, ow, OTHER_H, v, boxes, texts);
  texts.push(...headings(v, o, W0, pad, poster));
  return { width: W0, height, boxes, links, texts, extras, detail, vertical };
}

const OTHER_H = 50;
const centreMinLtr = (d: number) => d * 1.1;

function lineAttrs(o: DrawOptions): string {
  return o.theme === "none" ? ' fill="none" stroke="currentColor" stroke-opacity=".5"' : "";
}

function label(v: Voice, text: string, x: number, y: number, anchor: "start" | "middle", maxWidth = 1e9): string {
  return `<text class="tb-round" x="${num(x)}" y="${num(y)}" font-size="11" font-weight="600" letter-spacing=".08em" text-anchor="${anchor}">${esc(fit(v.upper(text), 11 * 1.18, maxWidth))}</text>`;
}

function headings(v: Voice, o: DrawOptions, width: number, pad: number, poster: boolean): string[] {
  const out: string[] = [];
  let y = pad + 24;
  if (o.title) {
    const text = poster ? v.upper(o.title) : o.title;
    out.push(`<text class="tb-title" x="${num(width / 2)}" y="${num(y)}" font-size="${poster ? 26 : 24}" font-weight="800" ${poster ? 'letter-spacing=".14em" ' : ""}text-anchor="middle">${esc(text)}</text>`);
    y += poster ? 24 : 22;
  }
  if (o.subtitle) out.push(`<text class="tb-sub" x="${num(width / 2)}" y="${num(y)}" font-size="14" text-anchor="middle">${esc(o.subtitle)}</text>`);
  return out;
}

/** The champion, centred on `cx`, its top at `top`: a trophy if there is one, a large mark, the name and the word. */
function championBlock(team: Team, cx: number, top: number, mark: number, trophyH: number, nameFont: number, o: DrawOptions, v: Voice, ctx: MarkContext, poster: boolean): string[] {
  const out: string[] = [];
  let y = top;
  if (o.trophy && trophyH) {
    const t = o.trophy.trim();
    const svg = t.startsWith("<") ? cleanSvg(t) : null;
    if (svg) out.push(`<svg class="tb-gold" x="${num(cx - trophyH / 2)}" y="${num(y)}" width="${num(trophyH)}" height="${num(trophyH)}" viewBox="${esc(svg.viewBox)}" preserveAspectRatio="xMidYMid meet">${svg.inner}</svg>`);
    else if (safeUrl(t)) out.push(`<image href="${esc(t)}" x="${num(cx - trophyH / 2)}" y="${num(y)}" width="${num(trophyH)}" height="${num(trophyH)}" preserveAspectRatio="xMidYMid meet"/>`);
    y += trophyH + 6;
  }
  const cy = y + mark / 2;
  const name = fit(team.name, nameFont, 200);
  if (ctx.shape !== "none") out.push(`<g class="tb-champ">${drawMark(team, cx, cy, mark, ctx)}</g>`);
  const nameY = cy + mark / 2 + 8 + nameFont * 0.8;
  out.push(`<text class="tb-name" x="${num(cx)}" y="${num(nameY)}" font-size="${num(nameFont)}" font-weight="800" text-anchor="middle">${esc(poster ? v.upper(name) : name)}</text>`);
  out.push(`<text class="tb-champ-label" x="${num(cx)}" y="${num(nameY + 6 + 11)}" font-size="11" font-weight="700" letter-spacing=".16em" text-anchor="middle">${esc(v.upper(v.words.champion))}</text>`);
  return out;
}

/** The ties that are not part of the tree (they lead nowhere near the final, or are round-robin games), drawn in a grid below it. */
function othersOf(layout: BracketLayout): number[] {
  return [...layout.other, ...layout.robin];
}

function othersHeight(count: number, width: number, pad: number, ow: number, oh: number): number {
  if (!count) return 0;
  const cols = Math.max(1, Math.floor((width - 2 * pad + 10) / (ow + 10)));
  return 26 + Math.ceil(count / cols) * (oh + 10) + 6;
}

function othersBlock(layout: BracketLayout, list: number[], y0: number, width: number, pad: number, ow: number, oh: number, v: Voice, boxes: Placed[], texts: string[]): void {
  if (!list.length) return;
  const cols = Math.max(1, Math.floor((width - 2 * pad + 10) / (ow + 10)));
  const x0 = pad + (width - 2 * pad - (Math.min(cols, list.length) * (ow + 10) - 10)) / 2;
  texts.push(label(v, v.words.other, width / 2, y0 + 12, "middle"));
  list.forEach((i, n) => {
    const rect = { x: x0 + (n % cols) * (ow + 10), y: y0 + 24 + Math.floor(n / cols) * (oh + 10), w: ow, h: oh };
    boxes.push({ rect, tie: layout.ties[i], order: [0, 1], bye: null, final: false, champion: false });
  });
}

/** The third-place match with its label, centred on `cx`, its label at `y0`. */
function thirdAtFoot(layout: BracketLayout, y0: number, cx: number, w: number, h: number, v: Voice, boxes: Placed[], texts: string[]): void {
  texts.push(label(v, v.words.thirdPlace, cx, y0 + 12, "middle"));
  boxes.push({ rect: { x: cx - w / 2, y: y0 + 18, w, h }, tie: layout.ties[layout.third!], order: [0, 1], bye: null, final: false, champion: false });
}

// ---------------------------------------------------------------------------------------------- one box

function drawBox(p: Placed, plan: Plan, o: DrawOptions, v: Voice, ctx: MarkContext): string {
  const { rect, tie } = p;
  const { x, y, w, h } = rect;
  const detail = plan.detail;
  const scoresOn = o.scores ?? true;
  const seedsOn = o.seeds ?? false;
  const highlight = o.winnerHighlight ?? true;
  const parts: string[] = [];
  parts.push(`<rect class="tb-box" x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" rx="${num(Math.min(7, h / 4))}"${o.theme === "none" ? ' fill="none" stroke="currentColor" stroke-opacity=".4"' : ""}/>`);
  const r = tie.result;
  const notes = noteParts(tie, v);
  const noteH = detail !== "mark" && h >= 50 && notes.length ? 13 : 0;
  const rowH = (h - noteH) / 2;
  const rowsOrder = p.order;
  const cls = (k: 0 | 1) => (highlight && tie.winner !== null ? (tie.winner === k ? "tb-won" : "tb-lost") : "tb-pending");

  if (detail === "mark") {
    const stack = Math.min((h - 8) / 2, w - 8, 44);
    const side = Math.min(h - 8, (w - 12) / 2, 44);
    const stacked = stack >= side;
    const md2 = Math.max(stacked ? stack : side, 8);
    rowsOrder.forEach((k, n) => {
      const team = tie.sides[k];
      const cx = stacked ? x + w / 2 : x + w / 2 + (n === 0 ? -1 : 1) * (md2 / 2 + 3);
      const cy = stacked ? y + h / 2 + (n === 0 ? -1 : 1) * (md2 / 2 + 1) : y + h / 2;
      parts.push(`<g class="${cls(k)}">${drawMark(team, cx, cy, md2, ctx)}</g>`);
    });
  } else {
    const font = clamp(rowH * 0.5, 8.5, 16);
    const md = clamp(rowH * 0.7, 10, 28);
    rowsOrder.forEach((k, n) => {
      const team = tie.sides[k];
      const ry = y + n * rowH;
      const cy = ry + rowH / 2;
      const rowParts: string[] = [];
      let tx = x + 6;
      if (o.markShape !== "none") { rowParts.push(drawMark(team, x + 6 + md / 2, cy, md, ctx)); tx = x + 6 + md + 5; }
      const score = scoresOn && r.score ? v.number(r.score[k]) : "";
      const pensText = scoresOn && r.pens ? `(${v.number(r.pens[k])})` : "";
      const bye = p.bye === k;
      const right = x + w - 6;
      const scoreW = score ? textWidth(score, font + 1) : 0;
      const pensW = pensText ? textWidth(pensText, font - 2) + 3 : 0;
      const byeText = bye ? v.words.bye : "";
      const byeW = byeText ? textWidth(byeText, Math.max(font - 2, 8)) : 0;
      const avail = right - tx - (scoreW + pensW) - (byeW ? byeW + 6 : 0) - 6;
      const seed = seedsOn && team?.seed !== undefined ? `${v.number(team.seed)} ` : "";
      const nm = team ? (detail === "full" ? team.name : abbrOf(team, v)) : v.words.tbd;
      const text = fit(`${seed}${nm}`, font, Math.max(avail, 8));
      rowParts.push(`<text class="tb-name${team ? "" : " tb-muted"}" x="${num(tx)}" y="${num(cy + font * 0.35)}" font-size="${num(font)}">${esc(text)}</text>`);
      if (score) rowParts.push(`<text class="tb-score" x="${num(right)}" y="${num(cy + (font + 1) * 0.35)}" font-size="${num(font + 1)}" text-anchor="end" font-variant-numeric="tabular-nums">${esc(score)}</text>`);
      if (pensText) rowParts.push(`<text class="tb-muted" x="${num(right - scoreW - 3)}" y="${num(cy + (font - 2) * 0.35)}" font-size="${num(Math.max(font - 2, 8))}" text-anchor="end">${esc(pensText)}</text>`);
      if (byeText) rowParts.push(`<text class="tb-muted" x="${num(right - (scoreW + pensW) - (scoreW || pensW ? 6 : 0))}" y="${num(cy + (font - 2) * 0.35)}" font-size="${num(Math.max(font - 2, 8))}" font-style="italic" text-anchor="end">${esc(byeText)}</text>`);
      parts.push(`<g class="${cls(k)}">${rowParts.join("")}</g>`);
    });
    parts.push(`<line class="tb-line" x1="${num(x + 4)}" x2="${num(x + w - 4)}" y1="${num(y + rowH)}" y2="${num(y + rowH)}" stroke-opacity=".35"${o.theme === "none" ? ' stroke="currentColor"' : ""}/>`);
    if (noteH) {
      const f = 9.5;
      parts.push(`<text class="tb-muted" x="${num(x + w / 2)}" y="${num(y + h - 4)}" font-size="${f}" text-anchor="middle">${esc(fit(notes.join(" · "), f, w - 8))}</text>`);
    }
  }
  const cls2 = `tb-tie${p.final ? " tb-final" : ""}${p.champion ? " tb-has-champ" : ""}`;
  return `<g class="${cls2}"><title>${esc(describeTie(tie, v))}</title>${parts.join("")}</g>`;
}
