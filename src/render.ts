import type { BracketInput, BracketLayout, Detail, DrawOptions, LayoutBox, Matchup, Size, SizeName, Team, ThemeName, Tie } from "./types.ts";
import { layoutBracket } from "./layout.ts";
import { abbrOf, describeTie, noteParts } from "./matchup.ts";
import { cleanSvg, drawEmblem, drawMark, hasTrophy as hasTrophyOf, isEmblemId, markDefs, safeHref, safeUrl, type MarkContext } from "./marks.ts";
import { roundLabel } from "./rounds.ts";
import { styleFor } from "./theme.ts";
import { esc, fit, hash, num, textWidth } from "./text.ts";
import { fill, voiceOf, type Voice } from "./locales.ts";

/** The sizes by name. A phone's drawing is 390 wide and as tall as the bracket needs; a card is 1080 by 1350, a tall post. */
export const SIZES: Readonly<Record<SizeName, Size>> = Object.freeze({
  wide: { width: 1200, height: 675 },
  square: { width: 1080, height: 1080 },
  card: { width: 1080, height: 1350 },
  phone: { width: 390, height: null },
});

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const isLayout = (x: unknown): x is BracketLayout => typeof x === "object" && x !== null && "ties" in x && "sides" in x && "rounds" in x;

interface Rect { x: number; y: number; w: number; h: number }
interface Placed { rect: Rect; tie: Tie; order: readonly [0 | 1, 0 | 1]; bye: 0 | 1 | null; byes: readonly (0 | 1)[]; final: boolean; champion: boolean }

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
  /** The road look. */
  road: boolean;
  /** The ties on the highlighted team's path, by index. */
  path: ReadonlySet<number>;
  /** How far the road look's marks and scores were scaled down to fit their box: 1 for none. */
  fit: number;
  /** Some tie has a note ("a.e.t.", "in 7"), so a box of the road look keeps a strip for one. */
  notes: boolean;
  /** A box of marks alone carries each score under its mark. */
  markScores: boolean;
}

/** The sizes of one row of a box: the name, the mark and the score. The road look has larger marks and a big, heavy score. */
function metrics(rowH: number, road: boolean): { font: number; md: number; score: number } {
  if (road) return { font: clamp(rowH * 0.46, 9, 20), md: clamp(rowH * 0.8, 12, 56), score: clamp(rowH * 0.68, 11, 38) };
  const font = clamp(rowH * 0.5, 8.5, 16);
  return { font, md: clamp(rowH * 0.7, 10, 28), score: font + 1 };
}

/** The ties a team played on its way to the final: the tree's ties it is a side of, never the third-place match or a round-robin game. */
function pathOf(layout: BracketLayout, team: unknown): Set<number> {
  const out = new Set<number>();
  if (team === undefined || team === null) return out;
  const id = String(team);
  for (const t of layout.ties) if (!t.third && t.round > 0 && t.sides.some((s) => s !== null && String(s.id) === id)) out.add(t.index);
  return out;
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
  const orientation = options.orientation && options.orientation !== "auto" ? options.orientation : sizeName === "phone" || sizeName === "card" || (size.height !== null && size.width < size.height * 0.8) ? "vertical" : "horizontal";
  const road = options.look === "road";
  const prefix = options.id ?? `tb-${hash(JSON.stringify([v.locale.code, layout.teams.map((t) => t.name), layout.ties.map((t) => [t.id, t.sides.map((s) => s?.id ?? null), t.winner, t.result.score, t.round]), options.size, orientation, options.detail, theme, options.title, options.subtitle, options.seeds, options.scores, options.champion, options.markShape, options.roundLabels, options.thirdPlace, options.trophy ? 1 : 0, road ? 1 : 0, options.highlightPath ?? null, options.flags ? 1 : 0]))}`;
  const ctx: MarkContext = { radii: new Set(), symbols: new Map(), prefix, shape: options.markShape ?? "round", look: road ? "road" : "classic", flags: options.flags, theme: theme === "light" ? "light" : theme === "dark" || theme === "poster" ? "dark" : "inherit", flagCache: new Map() };
  const path = pathOf(layout, options.highlightPath);
  const plan = planBracket(layout, options, v, size, orientation === "vertical", ctx, road, path);

  const linked = { count: 0 };
  const drawn = plan.boxes.map((b) => drawBox(b, plan, options, v, ctx, linked)); // draws the marks, so before the defs are written
  const title = options.title ?? v.words.title;
  const desc = describeBracket(layout, options);
  const defs = markDefs(ctx);
  const style = theme === "none" ? "" : `<style>${styleFor(`.${prefix}`, theme, { road, links: linked.count > 0, follow: path.size > 0 })}</style>`;
  const bg = options.background === false ? "" : `<rect class="tb-bg" width="${num(plan.width)}" height="${num(plan.height)}"${theme === "none" ? ' fill="none"' : ""}/>`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" lang="${esc(v.locale.code)}" class="taisen ${prefix}${road ? " tb-look-road" : ""}${path.size > 0 ? " tb-follow" : ""}${options.className ? ` ${esc(options.className)}` : ""}" viewBox="0 0 ${num(plan.width)} ${num(plan.height)}" width="${num(plan.width)}" height="${num(plan.height)}" style="max-width:100%;height:auto" role="img" aria-labelledby="${prefix}-t ${prefix}-d">`,
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

function planBracket(layout: BracketLayout, o: DrawOptions, v: Voice, size: Size, vertical: boolean, ctx: MarkContext, road: boolean, path: ReadonlySet<number>): Plan {
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
  const hasTrophy = hasTrophyOf(o) && champ;

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
    S = clamp(rowStep - (road ? 7 : 9), 24, road ? 132 : 104);
    rowStep = Math.max(rowStep, S + 6);
    rowStep = Math.min(rowStep, S + 40);
    boxW = D; boxH = S;
  } else {
    const availW = W0 - 2 * pad;
    const slot = availW / Math.max(rows, 1);
    S = clamp(slot - 5, 30, road ? 340 : 150);
    rowStep = Math.min(slot, S + 5);
    boxW = S;
  }
  // Full boxes (names) only where the longest name fits beside its mark and a score.
  const longest = Math.max(0, ...layout.teams.map((t) => textWidth(t.name, 13)));
  const longestAbbr = Math.max(0, ...layout.teams.map((t) => textWidth(abbrOf(t, v), 13)));
  // The road look's marks and scores are large: they are scaled down together until a row fits its box, before a name is dropped for its abbreviation.
  const anyNotes = layout.ties.some((t) => noteParts(t, v).length > 0);
  // The road look's boxes of marks alone carry each score under its mark, unless marks alone were asked for.
  const markScores = road && o.detail !== "mark" && (o.scores ?? true) && layout.ties.some((t) => t.result.score !== null);
  const fitOf = (w: number, h: number, named: "full" | "compact"): number => {
    const rowH = (h - (anyNotes && h >= 62 ? 15 : 0)) / 2;
    const { font, md, score } = metrics(rowH, road);
    const anyBye = layout.sides.some((sd) => sd.boxes.some((b) => b.byes.length > 0));
    const anyPens = layout.ties.some((t) => t.result.pens !== null);
    const extra = (anyBye ? textWidth(v.words.bye, Math.max(font - 2, 8)) + 8 : 0) + (anyPens ? textWidth("(00)", Math.max(score * 0.55, 8)) + 3 : 0);
    const fixed = clamp(rowH * 0.16, 5, 12) + clamp(rowH * 0.18, 5, 10) + 8 + 10;
    const varying = md + (named === "full" ? longest : longestAbbr) * (font / 13) + textWidth("00", score) + extra;
    return Math.min(1, (w - fixed) / varying);
  };
  let fitNow = 1;
  const pick = (w: number, h: number): Exclude<Detail, "auto"> => {
    const rowH = h / 2;
    const { font, md, score } = metrics(rowH, false);
    // Room for the score, and for the words some boxes carry beside it: a bye, a shoot-out's score.
    const anyBye = layout.sides.some((sd) => sd.boxes.some((b) => b.byes.length > 0));
    const anyPens = layout.ties.some((t) => t.result.pens !== null);
    const extra = (anyBye ? textWidth(v.words.bye, Math.max(font - 2, 8)) + 8 : 0) + (anyPens ? textWidth("(00)", Math.max(font - 2, 8)) + 3 : 0);
    const needed = 6 + md + 5 + longest * (font / 13) + 8 + textWidth("00", score) + extra + 14;
    const named = o.detail && o.detail !== "auto" ? o.detail : w >= needed && h >= 36 ? "full" : w >= 76 && h >= 28 ? "compact" : "mark";
    return named === "mark" && o.markShape === "none" ? "compact" : named;
  };
  // The road look: a box is as high as its width lets the large marks and scores be. A name is kept (full) only where that leaves rows of 28 or more;
  // else the abbreviation (compact) where rows of 18 or more fit; else only the marks.
  const roadPick = (w: number, hMax: number): { detail: Exclude<Detail, "auto">; h: number } => {
    const search = (named: "full" | "compact", hMin: number) => {
      let h = hMax;
      while (h > hMin && fitOf(w, h, named) < 0.94) h -= 2;
      h = Math.max(h, Math.min(hMin, hMax));
      return { detail: named, h, ok: fitOf(w, h, named) >= 0.94 };
    };
    const forced = o.detail && o.detail !== "auto" ? o.detail : null;
    let chosen: { detail: Exclude<Detail, "auto">; h: number } | null = null;
    if (forced === "full" || forced === "compact") chosen = search(forced, forced === "full" ? 56 : 36);
    else if (forced === null) {
      const full = search("full", 56);
      const compact = search("compact", 36);
      chosen = full.ok ? full : compact.ok ? compact : o.markShape === "none" ? compact : null;
    }
    const m = Math.min((w - 12) / 2 - 2, 56);
    chosen ??= { detail: o.markShape === "none" ? "compact" : "mark", h: Math.min(hMax, markScores ? m + clamp(m * 0.5, 10, 24) * 1.3 + 14 : 2 * Math.min(w - 8, 60) + 8) };
    if (chosen.detail !== "mark") fitNow = Math.min(1, fitOf(w, chosen.h, chosen.detail));
    return chosen;
  };
  let detail: Exclude<Detail, "auto">;
  if (road) {
    const picked = roadPick(boxW, vertical ? clamp(boxW * 0.42, 48, 124) : boxH);
    detail = picked.detail;
    if (vertical) boxH = picked.h; else { S = picked.h; boxH = S; }
  } else {
    detail = pick(boxW, vertical ? 48 : boxH);
    if (vertical) boxH = detail === "full" ? 50 : detail === "compact" ? 42 : boxW >= 76 ? 38 : 2 * Math.min(boxW - 8, 24) + 8;
  }
  if (vertical) { D = boxH; gapT = showLabels ? 26 : 16; }

  // The champion's block: a trophy, a large mark, the name and the word; and the third-place match below the final.
  const champMark = vertical ? (road ? clamp(size.width * 0.14, 54, 96) : 54) : clamp(centreT * (road ? 0.4 : 0.34), 44, road ? 96 : 84);
  const trophyH = hasTrophy ? (vertical ? 56 : clamp(centreT * 0.45, 48, 84)) : 0;
  const nameFont = clamp(champMark * 0.3, 13, 20);
  const champH = champ ? trophyH + (hasTrophy ? 6 : 0) + champMark + 8 + nameFont + 6 + 11 + 2 : 0;
  const finalW = halves ? (vertical ? Math.min(size.width - 2 * pad, Math.max(boxW, 160)) : Math.min(centreT - 12, Math.max(D * 1.1, 120))) : D;
  let finalH = vertical ? (detail === "mark" ? Math.max(boxH, 52) : boxH) : boxH;
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
      boxes.push({ rect, tie: layout.ties[b.i], order: b.order, bye: b.bye, byes: b.byes, final: false, champion: false });
    }
    const midX = (halves ? starts[nc] : starts[nc] ?? 0) + (halves ? centreT : 0) / 2;
    if (halves && layout.final) {
      const fy = treeY0 + layout.final.y * rowStep + rowStep / 2;
      const rect = { x: midX - finalW / 2, y: fy - finalH / 2, w: finalW, h: finalH };
      rects.set(layout.final.i, rect);
      boxes.push({ rect, tie: layout.ties[layout.final.i], order: layout.final.order, bye: null, byes: [], final: true, champion: champ });
      if (showLabels) texts.push(label(v, road, roundLabel(layout, layout.rounds, o.roundNames, v), midX, rect.y - 7, "middle"));
      if (champ) extras.push(...championBlock(layout.champion!, midX, rect.y - 22 - champH, champMark, trophyH, nameFont, o, v, ctx, poster));
      if (withThird) {
        const t3 = layout.ties[layout.third!];
        const r3 = { x: midX - finalW / 2, y: rect.y + rect.h + 14 + 18, w: finalW, h: boxH };
        rects.set(layout.third!, r3);
        texts.push(label(v, road, v.words.thirdPlace, midX, r3.y - 6, "middle"));
        boxes.push({ rect: r3, tie: t3, order: [0, 1], bye: null, byes: [], final: false, champion: false });
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
        ks.forEach((k, n) => { if (used.includes(n) && (!halves || n < layout.sides.length)) texts.push(label(v, road, name, starts[k] + D / 2, top - 9, "middle", D + gapT * 0.8)); });
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
      links.push(`<path class="${lineClass(path, t.index, p)}" d="M${num(x0)} ${num(y0)}H${num(xm)}V${num(y1)}H${num(x1)}"${lineAttrs(o)}/>`);
    }
    if (bottomThird) thirdAtFoot(layout, height - pad - extraH0 + 6, width / 2, ow, OTHER_H, v, road, boxes, texts);
    othersBlock(layout, others, height - pad - extraH0 + thirdBlock + 6, width, pad, ow, OTHER_H, v, road, boxes, texts);
    texts.push(...headings(v, o, width, pad, poster));
    return { width, height, boxes, links: orderLinks(links), texts, extras, detail, vertical, road, path, fit: fitNow, notes: anyNotes, markScores };
  }

  // ----- vertical: the rounds are rows. The left half is the top; the final is a band in the middle.
  const groupBand = hasGroups ? 26 : 0;
  // On a tall page the champion sits at the top, as the page's first thing; the lines into the final must not run through it.
  const champTop = halves && champ ? champH + 14 : 0;
  const topT = pad + titleH + champTop + groupBand + (showLabels ? 14 : 0);
  const bandsPerSide = nc;
  const bandCount = halves ? 2 * bandsPerSide : nc + (champ ? 1 : 0);
  others = othersOf(layout);
  ow = Math.min(W0 - 2 * pad, 150);
  const othersV = othersHeight(others.length, W0, pad, ow, OTHER_H);
  // The height the page needs for boxes `h` high with `gap` between the rounds, and what it keeps for the final's band and the third-place match.
  const needOf = (h: number, gap: number) => {
    const finalHere = detail === "mark" ? Math.max(h, 52) : h;
    const centre = (showLabels ? 32 : 0) + 6 + finalHere + 14;
    const thirdV = bottomThird ? 18 + (road ? h : 52) + 16 : 0;
    const band = h + gap;
    return (halves ? topT + bandsPerSide * band + centre + bandsPerSide * band + groupBand + pad : topT + (nc + (champ ? 1 : 0)) * band + (champ ? champH : 0) + pad) + othersV + thirdV;
  };
  // The road look fits a tall page: the boxes are made lower until the rounds fit, or, with room to spare, the room left over is shared between the rounds.
  if (road && size.height !== null) {
    while (boxH > 40 && needOf(boxH, gapT) > size.height) boxH -= 2;
    const slack = size.height - needOf(boxH, gapT);
    if (slack > 0 && bandCount > 0) gapT += Math.min(slack / bandCount, boxH * 0.5);
    D = boxH;
    finalH = detail === "mark" ? Math.max(boxH, 52) : boxH;
  }
  const centreBand = (showLabels ? 32 : 0) + 6 + finalH + 14;
  const thirdH2 = road ? boxH : 52;
  const thirdBlockV = bottomThird ? 18 + thirdH2 + 16 : 0;
  const bandT = D + gapT;
  const totalT = needOf(boxH, gapT) - othersV - thirdBlockV;
  const extraV = othersV + thirdBlockV;
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
    boxes.push({ rect, tie: layout.ties[b.i], order: b.order, bye: b.bye, byes: b.byes, final: false, champion: false });
  }
  const midX = W0 / 2;
  if (halves && layout.final) {
    const cy0 = topT + bandsPerSide * bandT;
    let y = cy0;
    if (champ) extras.push(...championBlock(layout.champion!, midX, pad + titleH + 4, champMark, trophyH, nameFont, o, v, ctx, poster));
    if (showLabels) { texts.push(label(v, road, roundLabel(layout, layout.rounds, o.roundNames, v), midX, y + 12, "middle")); y += 16; }
    const rect = { x: midX - finalW / 2, y: y + 6, w: finalW, h: finalH };
    rects.set(layout.final.i, rect);
    boxes.push({ rect, tie: layout.ties[layout.final.i], order: layout.final.order, bye: null, byes: [], final: true, champion: champ });
  } else if (!halves && champ && layout.finalIndex !== null) {
    const fr = rects.get(layout.finalIndex)!;
    extras.push(...championBlock(layout.champion!, fr.x + fr.w / 2, fr.y + fr.h + 12, champMark, trophyH, nameFont, o, v, ctx, poster));
  }
  if (showLabels) {
    layout.columns.forEach((c, ci) => {
      const name = roundLabel(layout, c, o.roundNames, v);
      const sides: ("l" | "r")[] = halves ? (layout.sides.length > 1 ? ["l", "r"] : ["l"]) : ["l"];
      for (const sd of sides) texts.push(road ? label(v, road, name, pad, bandStart(sd, ci) - 8, "start") : `<text class="tb-round tb-halo" x="${num(pad)}" y="${num(bandStart(sd, ci) - 8)}" font-size="11" font-weight="600" letter-spacing=".08em">${esc(v.upper(name))}</text>`);
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
    links.push(`<path class="${lineClass(path, t.index, p)}" d="M${num(x0c)} ${num(y0)}V${num(ym)}H${num(x1c)}V${num(y1)}"${lineAttrs(o)}/>`);
  }
  if (bottomThird) thirdAtFoot(layout, totalT - pad + 6, W0 / 2, Math.min(W0 - 2 * pad, road ? Math.max(boxW, 200) : 200), thirdH2, v, road, boxes, texts);
  othersBlock(layout, others, totalT - pad + thirdBlockV + 6, W0, pad, ow, OTHER_H, v, road, boxes, texts);
  texts.push(...headings(v, o, W0, pad, poster));
  return { width: W0, height, boxes, links: orderLinks(links), texts, extras, detail, vertical, road, path, fit: fitNow, notes: anyNotes, markScores };
}

/** A line's class: `tb-path` when both ties it joins are on the highlighted team's path. */
function lineClass(path: ReadonlySet<number>, from: number, to: number): string {
  return path.has(from) && path.has(to) ? "tb-line tb-path" : "tb-line";
}

/** The lines of the highlighted path are drawn last, over the others. */
function orderLinks(links: string[]): string[] {
  return [...links.filter((l) => !l.includes("tb-path")), ...links.filter((l) => l.includes("tb-path"))];
}

const OTHER_H = 50;
const centreMinLtr = (d: number) => d * 1.1;

function lineAttrs(o: DrawOptions): string {
  return o.theme === "none" ? ' fill="none" stroke="currentColor" stroke-opacity=".5"' : "";
}

function label(v: Voice, road: boolean, text: string, x: number, y: number, anchor: "start" | "middle", maxWidth = 1e9): string {
  if (!road) return `<text class="tb-round" x="${num(x)}" y="${num(y)}" font-size="11" font-weight="600" letter-spacing=".08em" text-anchor="${anchor}">${esc(fit(v.upper(text), 11 * 1.18, maxWidth))}</text>`;
  // The road look names a round on a pill, set a little smaller (to 9) before the name is cut.
  const upper = v.upper(text);
  let s = 11;
  while (s > 9 && textWidth(upper, s * 1.18) > maxWidth - 18) s -= 0.5;
  const shown = fit(upper, s * 1.18, maxWidth - 18);
  const w = textWidth(shown, s * 1.18) + 18;
  const x0 = anchor === "middle" ? x - w / 2 : x;
  return `<rect class="tb-panel" x="${num(x0)}" y="${num(y - 14.5)}" width="${num(w)}" height="20" rx="10"/><text class="tb-lab" x="${num(x0 + w / 2)}" y="${num(y)}" font-size="${num(s)}" font-weight="700" letter-spacing=".08em" text-anchor="middle">${esc(shown)}</text>`;
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
    const emblem = isEmblemId(t) ? drawEmblem(t, Number(num(trophyH)), o) : null;
    const svg = emblem ? null : t.startsWith("<") ? cleanSvg(t) : null;
    if (emblem) out.push(`<svg class="tb-emblem" x="${num(cx - trophyH / 2)}" y="${num(y)}" width="${num(trophyH)}" height="${num(trophyH)}" viewBox="${esc(emblem.viewBox)}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${emblem.inner}</svg>`);
    else if (svg) out.push(`<svg class="tb-gold" x="${num(cx - trophyH / 2)}" y="${num(y)}" width="${num(trophyH)}" height="${num(trophyH)}" viewBox="${esc(svg.viewBox)}" preserveAspectRatio="xMidYMid meet">${svg.inner}</svg>`);
    else if (!isEmblemId(t) && safeUrl(t)) out.push(`<image href="${esc(t)}" x="${num(cx - trophyH / 2)}" y="${num(y)}" width="${num(trophyH)}" height="${num(trophyH)}" preserveAspectRatio="xMidYMid meet"/>`);
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

function othersBlock(layout: BracketLayout, list: number[], y0: number, width: number, pad: number, ow: number, oh: number, v: Voice, road: boolean, boxes: Placed[], texts: string[]): void {
  if (!list.length) return;
  const cols = Math.max(1, Math.floor((width - 2 * pad + 10) / (ow + 10)));
  const x0 = pad + (width - 2 * pad - (Math.min(cols, list.length) * (ow + 10) - 10)) / 2;
  texts.push(label(v, road, v.words.other, width / 2, y0 + 12, "middle"));
  list.forEach((i, n) => {
    const rect = { x: x0 + (n % cols) * (ow + 10), y: y0 + 24 + Math.floor(n / cols) * (oh + 10), w: ow, h: oh };
    boxes.push({ rect, tie: layout.ties[i], order: [0, 1], bye: null, byes: [], final: false, champion: false });
  });
}

/** The third-place match with its label, centred on `cx`, its label at `y0`. */
function thirdAtFoot(layout: BracketLayout, y0: number, cx: number, w: number, h: number, v: Voice, road: boolean, boxes: Placed[], texts: string[]): void {
  texts.push(label(v, road, v.words.thirdPlace, cx, y0 + 12, "middle"));
  boxes.push({ rect: { x: cx - w / 2, y: y0 + 18, w, h }, tie: layout.ties[layout.third!], order: [0, 1], bye: null, byes: [], final: false, champion: false });
}


/** The address `href` gives for a tie (or for one side of it), when it is one a drawing may link to; `null` otherwise. */
function hrefOf(o: DrawOptions, tie: Tie, side?: 0 | 1): string | null {
  if (typeof o.href !== "function") return null;
  const url = side === undefined ? o.href(tie) : o.href(tie, side);
  return typeof url === "string" && safeHref(url) ? url.trim() : null;
}

function drawBox(p: Placed, plan: Plan, o: DrawOptions, v: Voice, ctx: MarkContext, linked: { count: number }): string {
  const { rect, tie } = p;
  const { x, y, w, h } = rect;
  const detail = plan.detail;
  const road = plan.road;
  const scoresOn = o.scores ?? true;
  const seedsOn = o.seeds ?? false;
  const highlight = o.winnerHighlight ?? true;
  const description = describeTie(tie, v);
  // A link on the whole box wins; with none, each side that has an address is a link on its own row.
  const boxHref = hrefOf(o, tie);
  const sideHref = (k: 0 | 1): string | null => (boxHref !== null || tie.sides[k] === null ? null : hrefOf(o, tie, k));
  const anchor = (url: string, name: string, inner: string): string => {
    linked.count++;
    return `<a class="tb-link" href="${esc(url)}" aria-label="${esc(name)}">${inner}</a>`;
  };
  const parts: string[] = [];
  parts.push(`<rect class="tb-box" x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" rx="${num(road ? Math.min(14, h / 3.2) : Math.min(7, h / 4))}"${boxHref !== null ? ' pointer-events="all"' : ""}${o.theme === "none" ? ' fill="none" stroke="currentColor" stroke-opacity=".4"' : ""}/>`);
  const r = tie.result;
  const notes = noteParts(tie, v);
  // In the road look every box keeps the strip for the note when any tie has one, so that all the rows are the same size.
  const noteH = detail !== "mark" && h >= (road ? 62 : 50) && (road ? plan.notes : notes.length > 0) ? (road ? 15 : 13) : 0;
  const rowH = (h - noteH) / 2;
  const rowsOrder = p.order;
  const cls = (k: 0 | 1) => (highlight && tie.winner !== null ? (tie.winner === k ? "tb-won" : "tb-lost") : "tb-pending");
  const row = (k: 0 | 1, inner: string, rx: number, ry: number, rw: number, rh: number): string => {
    const url = sideHref(k);
    const team = tie.sides[k];
    if (url === null || team === null) return inner;
    return anchor(url, `${team.name}: ${description}`, `<rect class="tb-hit" x="${num(rx)}" y="${num(ry)}" width="${num(rw)}" height="${num(rh)}" fill="transparent"/>${inner}`);
  };

  if (detail === "mark" && plan.markScores) {
    // Two columns: each team's mark with its score under it.
    const colW = (w - 12) / 2;
    const m = Math.min(colW - 2, 56, h - 14);
    const sf = clamp(m * 0.5, 10, 24);
    const withScore = scoresOn && r.score !== null;
    const markH = withScore ? m : h - 12;
    const top = y + (h - (m + (withScore ? sf * 1.3 : 0))) / 2;
    rowsOrder.forEach((k, n) => {
      const team = tie.sides[k];
      const cx = x + 6 + colW / 2 + n * colW;
      const cy = top + m / 2;
      const inner: string[] = [drawMark(team, cx, cy, withScore ? m : markH, ctx)];
      if (withScore && r.score) {
        const pens = r.pens ? ` (${v.number(r.pens[k])})` : "";
        inner.push(`<text class="tb-score" x="${num(cx)}" y="${num(top + m + sf * 1.05)}" font-size="${num(sf)}" text-anchor="middle" font-variant-numeric="tabular-nums">${esc(v.number(r.score[k]))}${r.pens ? `<tspan class="tb-muted" font-size="${num(sf * 0.6)}" font-weight="600">${esc(pens)}</tspan>` : ""}</text>`);
      }
      parts.push(row(k, `<g class="${cls(k)}">${inner.join("")}</g>`, cx - colW / 2, y, colW, h));
    });
  } else if (detail === "mark") {
    const stack = Math.min((h - 8) / 2, w - 8, road ? 60 : 44);
    const side = Math.min(h - 8, (w - 12) / 2, road ? 60 : 44);
    const stacked = stack >= side;
    const md2 = Math.max(stacked ? stack : side, 8);
    rowsOrder.forEach((k, n) => {
      const team = tie.sides[k];
      const cx = stacked ? x + w / 2 : x + w / 2 + (n === 0 ? -1 : 1) * (md2 / 2 + 3);
      const cy = stacked ? y + h / 2 + (n === 0 ? -1 : 1) * (md2 / 2 + 1) : y + h / 2;
      parts.push(row(k, `<g class="${cls(k)}">${drawMark(team, cx, cy, md2, ctx)}</g>`, cx - md2 / 2, cy - md2 / 2, md2, md2));
    });
  } else {
    const base = metrics(rowH, road);
    const f = plan.fit;
    const font = road ? Math.max(base.font * f, 8.5) : base.font, md = road ? base.md * f : base.md, scoreFont = road ? base.score * f : base.score;
    const padX = road ? clamp(rowH * 0.16, 5, 12) : 6;
    const gap = road ? clamp(rowH * 0.18, 5, 10) : 5;
    const small = Math.max(road ? scoreFont * 0.55 : font - 2, 8);
    const small2 = Math.max(font - 2, 8);
    rowsOrder.forEach((k, n) => {
      const team = tie.sides[k];
      const ry = y + n * rowH;
      const cy = ry + rowH / 2;
      const rowParts: string[] = [];
      let tx = x + padX;
      if (o.markShape !== "none") { rowParts.push(drawMark(team, x + padX + md / 2, cy, md, ctx)); tx = x + padX + md + gap; }
      const score = scoresOn && r.score ? v.number(r.score[k]) : "";
      const pensText = scoresOn && r.pens ? `(${v.number(r.pens[k])})` : "";
      const bye = p.byes.includes(k);
      const right = x + w - padX;
      const scoreW = score ? textWidth(score, scoreFont) : 0;
      const pensW = pensText ? textWidth(pensText, small) + 3 : 0;
      const seed = seedsOn && team?.seed !== undefined ? `${v.number(team.seed)} ` : "";
      const nm = team ? (detail === "full" ? team.name : abbrOf(team, v)) : v.words.tbd;
      // The word for a bye goes beside the score only where the name still fits beside it.
      const byeFits = bye && right - tx - (scoreW + pensW) - (textWidth(v.words.bye, small2) + 6) - 6 >= textWidth(`${seed}${nm}`, font);
      const byeText = byeFits ? v.words.bye : "";
      const byeW = byeText ? textWidth(byeText, small2) : 0;
      const avail = right - tx - (scoreW + pensW) - (byeW ? byeW + 6 : 0) - 6;
      // A name that does not fit is set a little smaller before it is cut.
      let nameFont = font;
      while (nameFont > 9.5 && textWidth(`${seed}${nm}`, nameFont) > avail) nameFont -= 0.5;
      const text = fit(`${seed}${nm}`, nameFont, Math.max(avail, 8));
      rowParts.push(`<text class="tb-name${team ? "" : " tb-muted"}" x="${num(tx)}" y="${num(cy + nameFont * 0.35)}" font-size="${num(nameFont)}">${esc(text)}</text>`);
      if (score) rowParts.push(`<text class="tb-score" x="${num(right)}" y="${num(cy + scoreFont * 0.35)}" font-size="${num(scoreFont)}" text-anchor="end" font-variant-numeric="tabular-nums">${esc(score)}</text>`);
      if (pensText) rowParts.push(`<text class="tb-muted" x="${num(right - scoreW - (road ? 4 : 3))}" y="${num(cy + small * 0.35)}" font-size="${num(small)}" text-anchor="end">${esc(pensText)}</text>`);
      if (byeText) rowParts.push(`<text class="tb-muted" x="${num(right - (scoreW + pensW) - (scoreW || pensW ? 6 : 0))}" y="${num(cy + small2 * 0.35)}" font-size="${num(small2)}" font-style="italic" text-anchor="end">${esc(byeText)}</text>`);
      parts.push(row(k, `<g class="${cls(k)}">${rowParts.join("")}</g>`, x, ry, w, rowH));
    });
    parts.push(`<line class="${road ? "tb-sep" : "tb-line"}" x1="${num(x + 4)}" x2="${num(x + w - 4)}" y1="${num(y + rowH)}" y2="${num(y + rowH)}" stroke-opacity=".35"${o.theme === "none" ? ' stroke="currentColor"' : ""}/>`);
    if (noteH) {
      const f = road ? 9 : 9.5;
      const line = road ? v.upper(notes.join(" · ")) : notes.join(" · ");
      parts.push(`<text class="tb-muted${road ? " tb-note" : ""}" x="${num(x + w / 2)}" y="${num(y + h - (road ? 5 : 4))}" font-size="${f}"${road ? ' font-weight="700" letter-spacing=".05em"' : ""} text-anchor="middle">${esc(fit(line, f * (road ? 1.1 : 1), w - 8))}</text>`);
    }
  }
  const cls2 = `tb-tie${p.final ? " tb-final" : ""}${p.champion ? " tb-has-champ" : ""}${plan.path.has(tie.index) ? " tb-on-path" : ""}`;
  const body = boxHref !== null ? anchor(boxHref, description, parts.join("")) : parts.join("");
  return `<g class="${cls2}"><title>${esc(description)}</title>${body}</g>`;
}
