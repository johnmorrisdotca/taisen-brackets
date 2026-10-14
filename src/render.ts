import type { BracketInput, BracketLayout, Detail, DrawOptions, LayoutBox, LayoutName, Matchup, Place, Size, SizeName, Team, ThemeName, Tie } from "./types.ts";
import { layoutBracket } from "./layout.ts";
import { abbrOf, describeTie, noteParts } from "./matchup.ts";
import { cleanSvg, drawEmblem, drawMark, hasTrophy as hasTrophyOf, isEmblemId, markDefs, safeHref, safeUrl, type MarkContext } from "./marks.ts";
import { roundLabel } from "./rounds.ts";
import { styleFor } from "./theme.ts";
import { resolveBackground } from "./background.ts";
import { emWidth, esc, fit, hash, num } from "./text.ts";
import { fill, voiceOf, type Voice } from "./locales.ts";
import { paintVariant, seriesLineWidth, type PaintEnv, type VariantKind } from "./layouts.ts";
import { drawGroups } from "./groups.ts";
import { headTile } from "./furniture.ts";
import { drawPlayIn } from "./playin.ts";

/** The names of the layouts, the tree first. */
export const LAYOUTS: readonly LayoutName[] = Object.freeze(["tree", "rows", "shields", "update", "columns", "playin", "series", "groups"] as const);
const VARIANTS: readonly string[] = ["rows", "shields", "update", "columns", "series"];

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
  /** Seed tags are drawn (the road look with `seeds`, and some tie has one). */
  tags: boolean;
  /** A box of marks alone is laid out in two columns (marks, tags, codes, scores): the road look with scores, tags or codes. */
  markCols: boolean;
  /** Each mark's three letters are written under it in such a box. */
  codes: boolean;
  /** The layout that draws a tie its own way (`rows`, `shields`, `update`, `columns`, `series`), or `null` for the tree's boxes. */
  variant: VariantKind | null;
  /** The widest name, and the widest three-letter name, in ems. */
  em: { full: number; abbr: number; tag: number };
}

interface Seg { x0: number; y0: number; x1: number; y1: number }

/** A label whose place is chosen once every connector line is known. */
type Late = () => string;

/** The width of a text in the road look, set in a bold face: a little generous, so that it stays inside its place whichever font the page falls back to. */
const boldWidth = (text: string, size: number): number => emWidth(text) * size;

/** The seed tag of a side: the tie's own, else the team's tag, else its seed number; `""` for none. */
function tagOf(tie: Tie, k: 0 | 1): string {
  const given = tie.seeds?.[k];
  const team = tie.sides[k];
  const text = given ?? team?.tag ?? team?.seed;
  return text === undefined || text === null ? "" : String(text).slice(0, 4);
}

/** The classes `tieClass` asks for on a tie's group, each a word of letters, digits, `-` and `_`; a leading space for each, `""` for none. A function that throws adds none. */
function tieClassOf(o: DrawOptions, tie: Tie): string {
  if (typeof o.tieClass !== "function") return "";
  let asked: unknown;
  try { asked = o.tieClass(tie); } catch { return ""; }
  if (typeof asked !== "string") return "";
  return asked.split(/\s+/).filter((word) => /^[A-Za-z_][\w-]*$/.test(word)).map((word) => ` ${word}`).join("");
}

/**
 * Where a pill or a name of `w` wide can stand in the band `y0`..`y1` so that no connector line is within 5 of it: `pref` (its left edge) when that is clear, else the nearest clear place
 * between the edges `lo` and `hi`; `null` when there is none.
 */
function freeX(segs: readonly Seg[], y0: number, y1: number, w: number, pref: number, lo: number, hi: number): number | null {
  const margin = 4;
  const blocks = segs.filter((s) => Math.max(s.y0, s.y1) >= y0 - 1 && Math.min(s.y0, s.y1) <= y1 + 1).map((s) => [Math.min(s.x0, s.x1) - margin, Math.max(s.x0, s.x1) + margin] as const);
  const ok = (x: number) => x >= lo && x + w <= hi && blocks.every(([a, b]) => x + w <= a || x >= b);
  if (ok(pref)) return pref;
  const found = [lo, hi - w, ...blocks.flatMap(([a, b]) => [b, a - w])].filter(ok);
  return found.length === 0 ? null : found.reduce((best, x) => (Math.abs(x - pref) < Math.abs(best - pref) ? x : best));
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
  const kind: LayoutName = options.layout ?? "tree";
  if (!LAYOUTS.includes(kind)) throw new RangeError(`taisen-brackets: unknown layout ${JSON.stringify(String(kind))}: use one of ${LAYOUTS.join(", ")}`);
  // The series card lists the east first: with no order asked for, a group named east goes before one named west.
  const groupOrder = kind === "series" && options.groupOrder === undefined && !isLayout(input) ? eastFirst(input) : options.groupOrder;
  const layout = localizedLayout(isLayout(input) ? input : layoutBracket(input, groupOrder ? { ...options, groupOrder } : options), v);
  const theme: ThemeName = options.theme ?? "auto";
  // The series card is a tall card unless a size is asked for.
  const sizeName = typeof options.size === "string" || options.size === undefined ? options.size ?? (kind === "series" ? "card" : "wide") : null;
  const size: Size = sizeName ? SIZES[sizeName] : { width: (options.size as { width: number }).width, height: (options.size as { height?: number | null }).height ?? null };
  const orientation = options.orientation && options.orientation !== "auto" ? options.orientation : kind === "series" || sizeName === "phone" || sizeName === "card" || (size.height !== null && size.width < size.height * 0.8) ? "vertical" : "horizontal";
  const road = options.look === "road";
  const hasBg = typeof options.background === "string" || (typeof options.background === "object" && options.background !== null);
  const prefix = options.id ?? `tb-${hash(JSON.stringify([v.locale.code, layout.teams.map((t) => t.name), layout.ties.map((t) => [t.id, t.sides.map((s) => s?.id ?? null), t.winner, t.result.score, t.round]), options.size, orientation, options.detail, theme, options.title, options.subtitle, options.seeds, options.scores, options.champion, options.markShape, options.roundLabels, options.thirdPlace, options.trophy ? 1 : 0, road ? 1 : 0, options.highlightPath ?? null, options.flags ? 1 : 0, ...(hasBg ? [options.background, options.vs, options.codes, options.seeds] : []), ...(options.flagHref ? ["h"] : []), ...(kind !== "tree" ? [kind, options.at, options.standings, options.qualify] : []), ...(options.headers ? ["head"] : [])]))}`;
  const ctx: MarkContext = { radii: new Set(), symbols: new Map(), prefix, shape: options.markShape ?? "round", look: road ? "road" : "classic", flags: options.flags, flagHref: options.flagHref, theme: theme === "light" ? "light" : theme === "dark" || theme === "poster" ? "dark" : "inherit", flagCache: new Map(), defs: new Map() };
  const path = pathOf(layout, options.highlightPath);
  const linked = { count: 0 };
  const title = options.title ?? v.words.title;
  const desc = describeBracket(layout, options);
  // The group tables and the play-in are not the tree: they plan and draw their own parts, and share the frame (the style, the background, the title) with it.
  const own = kind === "groups" ? drawGroups(layout, options, v, size, ctx, road, linked) : kind === "playin" ? drawPlayIn(layout, options, v, size, ctx, road, linked) : null;
  if (own) return frame({ prefix, v, options, theme, road, kind, title, desc: own.desc ?? desc, width: own.width, height: own.height, followed: false, links: [], parts: [...own.body, ...own.texts], linkCount: linked.count, ctx });
  const plan = planBracket(layout, options, v, size, orientation === "vertical", ctx, road, path, kind);
  const drawn = plan.boxes.map((b) => drawBox(b, plan, options, v, ctx, linked, layout.place[b.tie.index])); // draws the marks, so before the defs are written
  return frame({ prefix, v, options, theme, road, kind, title, desc, width: plan.width, height: plan.height, followed: path.size > 0, links: plan.links, parts: [...drawn, ...plan.texts, ...plan.extras], linkCount: linked.count, ctx });
}

/** The drawing's frame: the root `<svg>` with its title, its style, the defs the marks wrote and the background, round the parts a layout drew. */
function frame(f: { prefix: string; v: Voice; options: DrawOptions; theme: ThemeName; road: boolean; kind: LayoutName; title: string; desc: string; width: number; height: number; followed: boolean; links: string[]; parts: string[]; linkCount: number; ctx: MarkContext }): string {
  const { prefix, v, options, theme, road, ctx } = f;
  const picture = resolveBackground(options.background, theme, f.width, f.height, prefix);
  const defs = markDefs(ctx) + (picture?.defs ?? "");
  const scope = scopeOf(options, prefix);
  const style = theme === "none" || options.style === false ? "" : `<style>${styleFor(`.${scope}`, theme, { road, links: f.linkCount > 0, follow: f.followed, bgAuto: picture?.auto, layout: f.kind !== "tree" || options.headers === true }, picture?.inks)}</style>`;
  const bg = options.background === false ? "" : `<rect class="tb-bg" width="${num(f.width)}" height="${num(f.height)}"${theme === "none" ? ' fill="none"' : ""}/>${picture?.body ?? ""}`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" lang="${esc(v.locale.code)}" class="taisen ${prefix}${scope !== prefix ? ` ${scope}` : ""}${road ? " tb-look-road" : ""}${f.followed ? " tb-follow" : ""}${options.className ? ` ${esc(options.className)}` : ""}" viewBox="0 0 ${num(f.width)} ${num(f.height)}" width="${num(f.width)}" height="${num(f.height)}" style="max-width:100%;height:auto" role="img" aria-labelledby="${prefix}-t ${prefix}-d">`,
    `<title id="${prefix}-t">${esc(f.title)}</title><desc id="${prefix}-d">${esc(f.desc)}</desc>`,
    style,
    defs ? `<defs>${defs}</defs>` : "",
    bg,
    ...f.links,
    ...f.parts,
    "</svg>",
  ].filter(Boolean).join("\n");
}

/** The class that carries a drawing's rules: its `styleScope` when it has one, else its own id prefix. */
function scopeOf(o: Pick<DrawOptions, "styleScope">, prefix: string): string {
  if (o.styleScope === undefined) return prefix;
  if (typeof o.styleScope !== "string" || !/^[A-Za-z_][\w-]*$/.test(o.styleScope)) throw new RangeError("taisen-brackets: styleScope is one word of letters, digits, - and _");
  return o.styleScope;
}

/**
 * The stylesheet of a drawing with these options, for a page that draws the same bracket twice (a desk's size and a phone's): put it in the page once, give each drawing the same `styleScope`
 * and `style: false`, and every drawing takes its colours from it. Needs `styleScope`; `theme`, `look`, `background`, `layout`, `headers`, and whether there is an `href` or a `highlightPath` decide which rules are in it.
 */
export function bracketStyle(options: DrawOptions): string {
  if (options.styleScope === undefined) throw new RangeError("taisen-brackets: bracketStyle needs a styleScope");
  const scope = scopeOf(options, "");
  const theme: ThemeName = options.theme ?? "auto";
  if (theme === "none") return "";
  const picture = resolveBackground(options.background, theme, 100, 100, "x");
  return styleFor(`.${scope}`, theme, { road: options.look === "road", links: typeof options.href === "function", follow: options.highlightPath !== undefined, bgAuto: picture?.auto, layout: (options.layout ?? "tree") !== "tree" || options.headers === true }, picture?.inks);
}

/** The groups' names with the east first, for the series card: the names the teams carry, ordered so that a name with "east" comes before one with "west". */
function eastFirst(input: readonly Matchup[] | BracketInput): string[] | undefined {
  const teams = Array.isArray(input) ? [] : (input as BracketInput).teams ?? [];
  const names = [...new Set(teams.map((t) => t.group).filter((g): g is string => typeof g === "string"))];
  if (names.length < 2) return undefined;
  const rank = (g: string) => (/east/i.test(g) ? 0 : /west/i.test(g) ? 2 : 1);
  return names.sort((a, b) => rank(a) - rank(b) || (a < b ? -1 : 1));
}

// ---------------------------------------------------------------------------------------------- the plan

function planBracket(layout: BracketLayout, o: DrawOptions, v: Voice, size: Size, vertical: boolean, ctx: MarkContext, road: boolean, path: ReadonlySet<number>, kind: LayoutName): Plan {
  // The layouts that draw each tie their own way take the tree's places and lines, and fill the boxes themselves.
  const V: VariantKind | null = VARIANTS.includes(kind) ? (kind as VariantKind) : null;
  const pad = vertical ? 14 : 22;
  const showLabels = o.roundLabels ?? true;
  const poster = o.theme === "poster";
  const boxes: Placed[] = [];
  const links: string[] = [];
  const texts: (string | Late)[] = [];
  const extras: string[] = [];
  // The connector lines as they are drawn, so that the names of the rounds can be placed clear of them.
  const segs: Seg[] = [];
  const addLine = (...pts: [number, number][]) => pts.slice(1).forEach(([x, y], i) => segs.push({ x0: pts[i][0], y0: pts[i][1], x1: x, y1: y }));
  const clear = (lo: number, hi: number) => (w: number, pref: number, y: number) => freeX(segs, y - 16, y + 7, w, pref, lo, hi);
  const finish = (plan: Omit<Plan, "texts"> & { texts: (string | Late)[] }): Plan => ({ ...plan, texts: plan.texts.map((t) => (typeof t === "function" ? t() : t)) });
  const W0 = size.width;
  const titleH = (o.title ? (poster ? 46 : 38) : 0) + (o.subtitle ? 24 : 0) + (o.title || o.subtitle ? 10 : 0);
  const hasGroups = layout.sides.some((s) => s.label);
  const groupRoom = o.headers === true ? 34 : 28;
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
  let labelRoom = showLabels ? 24 : 6;
  if (!vertical) {
    const availW = W0 - 2 * pad;
    const g = 0.2;
    const centreMin = halves ? 168 : 150;
    let d = (availW - centreMin) / ((halves ? 2 : 1) * Math.max(nc, 1) * (1 + g));
    if (1.2 * d > centreMin) d = availW / ((halves ? 2 : 1) * Math.max(nc, 1) * (1 + g) + 1.2);
    D = clamp(d, 40, 220);
    gapT = D * g;
    centreT = Math.max(centreMin, D * 1.2);
    // The names of the rounds head their columns: a name that cannot be one line in its column is set on two, which needs a taller strip over the boxes.
    if (showLabels && layout.columns.some((c) => !nameFits(v, road, roundLabel(layout, c, o.roundNames, v), D + gapT * 0.8))) labelRoom = 34;
    const top = pad + titleH + (hasGroups ? groupRoom : 0) + labelRoom;
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
  const wide = boldWidth;
  const longest = Math.max(0, ...layout.teams.map((t) => wide(t.name, 13)));
  const longestAbbr = Math.max(0, ...layout.teams.map((t) => wide(abbrOf(t, v), 13)));
  // Seed tags (the road look with `seeds`): a small pill beside each mark, or above it in a box of marks alone.
  const seedsDefault = V === "rows" || V === "update" || V === "series" || V === "columns";
  const tagsOn = (road || (V !== null && V !== "columns")) && (o.seeds ?? seedsDefault) && layout.ties.some((t) => tagOf(t, 0) !== "" || tagOf(t, 1) !== "");
  const tagW = tagsOn ? Math.max(...layout.ties.flatMap((t) => [tagOf(t, 0), tagOf(t, 1)]).map((x) => boldWidth(x, 8))) + 8 : 0;
  // The road look's marks and scores are large: they are scaled down together until a row fits its box, before a name is dropped for its abbreviation.
  const anyNotes = layout.ties.some((t) => noteParts(t, v).length > 0);
  // The road look's boxes of marks alone carry each score under its mark, unless marks alone were asked for.
  const markScores = road && o.detail !== "mark" && (o.scores ?? true) && layout.ties.some((t) => t.result.score !== null);
  const fitOf = (w: number, h: number, named: "full" | "compact"): number => {
    const rowH = (h - (anyNotes && h >= 62 ? 15 : 0)) / 2;
    const { font, md, score } = metrics(rowH, road);
    const anyBye = layout.sides.some((sd) => sd.boxes.some((b) => b.byes.length > 0));
    const anyPens = layout.ties.some((t) => t.result.pens !== null);
    const extra = (anyBye ? wide(v.words.bye, Math.max(font - 2, 8)) + 8 : 0) + (anyPens ? wide("(00)", Math.max(score * 0.55, 8)) + 5 : 0);
    const fixed = clamp(rowH * 0.16, 5, 12) + clamp(rowH * 0.18, 5, 10) + 8 + 10 + (tagW > 0 ? tagW + 3 : 0);
    const varying = md + (named === "full" ? longest : longestAbbr) * (font / 13) + wide("00", score) + extra;
    return Math.min(1, (w - fixed) / varying);
  };
  let fitNow = 1;
  const pick = (w: number, h: number): Exclude<Detail, "auto"> => {
    const rowH = h / 2;
    const { font, md, score } = metrics(rowH, false);
    // Room for the score, and for the words some boxes carry beside it: a bye, a shoot-out's score.
    const anyBye = layout.sides.some((sd) => sd.boxes.some((b) => b.byes.length > 0));
    const anyPens = layout.ties.some((t) => t.result.pens !== null);
    const extra = (anyBye ? boldWidth(v.words.bye, Math.max(font - 2, 8)) + 8 : 0) + (anyPens ? boldWidth("(00)", Math.max(font - 2, 8)) + 3 : 0);
    const needed = 6 + md + 5 + longest * (font / 13) + 8 + boldWidth("00", score) + extra + 14;
    const named = o.detail && o.detail !== "auto" ? o.detail : w >= needed && h >= 36 ? "full" : w >= 76 && h >= 28 ? "compact" : "mark";
    return named === "mark" && o.markShape === "none" ? "compact" : named;
  };
  // The road look: a box is as high as its width lets the large marks and scores be. A name is kept (full) only where that leaves rows of 28 or more;
  // else the abbreviation (compact) where rows of 18 or more fit; else only the marks.
  const codesOn = road && (o.codes ?? false);
  const markCols = road && (markScores || tagsOn || codesOn || o.vs === true);
  const anyPensAll = layout.ties.some((t) => t.result.pens !== null);
  const roadPick = (w: number, hMax: number, grow = false): { detail: Exclude<Detail, "auto">; h: number } => {
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
    // A box of marks alone is as high as its marks, tags, codes and scores need; on a tall page it may be higher than the usual box, in a row it may not.
    const m = Math.min((w - 12) / 2 - 3, 56);
    const sf = clamp(m * 0.5, 9, 24);
    const need = 10 + m + 3 + (markScores ? sf * 1.15 + (anyPensAll && m < 40 ? sf * 0.7 : 0) : 0) + (codesOn ? clamp(m * 0.24, 7, 11) * 1.25 : 0) + (tagsOn ? 12 : 0);
    chosen ??= { detail: o.markShape === "none" ? "compact" : "mark", h: markCols ? Math.min(grow ? Math.max(hMax, need) : hMax, need) : Math.min(hMax, 2 * Math.min(w - 8, 60) + 8) };
    if (chosen.detail !== "mark") fitNow = Math.min(1, fitOf(w, chosen.h, chosen.detail));
    return chosen;
  };
  // The layouts of their own: how much a box says follows from its width and height; a tall page gives each a height of its own.
  const variantDetail = (w: number): Exclude<Detail, "auto"> => {
    if (o.detail && o.detail !== "auto") return o.detail;
    if (V === "shields") return "mark";
    if (V === "update" || V === "series") return w >= 56 ? "compact" : "mark";
    // The box's own painter leaves out what does not fit (the tag, then the names' length); the names are asked for where there is room for most of them.
    if (V === "columns") return w >= 110 ? "full" : w >= 60 ? "compact" : "mark";
    return w >= 150 ? "full" : w >= 84 ? "compact" : "mark";
  };
  const oneLine = V === "series" && vertical && layout.ties.every((t) => seriesLineWidth(t, v, 10, o.scores ?? true) <= boxW - 8);
  const variantH = V === "rows" ? 54 : V === "shields" ? 76 : V === "update" ? 46 : V === "columns" ? 84 : oneLine ? 32 : 46;
  let detail: Exclude<Detail, "auto">;
  if (V !== null) {
    detail = variantDetail(boxW);
    if (vertical) boxH = variantH;
  } else if (road) {
    const picked = roadPick(boxW, vertical ? clamp(boxW * 0.42, 48, 124) : boxH, vertical);
    detail = picked.detail;
    if (vertical) boxH = picked.h; else { S = picked.h; boxH = S; }
  } else {
    detail = pick(boxW, vertical ? 48 : boxH);
    if (vertical) boxH = detail === "full" ? 50 : detail === "compact" ? 42 : boxW >= 76 ? 38 : 2 * Math.min(boxW - 8, 24) + 8;
  }
  // The names of the rounds stand on their own strip between the rounds, under the lines that join them: 6 for the bus, 20 for the pill, and room round both.
  if (vertical) { D = boxH; gapT = showLabels ? 32 : 16; }

  // The champion's block: a trophy, a large mark, the name and the word; and the third-place match below the final.
  const champMark = vertical ? (road ? clamp(size.width * 0.14, 54, 96) : 54) : clamp(centreT * (road ? 0.4 : 0.34), 44, road ? 96 : 84);
  const trophyH = hasTrophy ? (vertical ? 56 : clamp(centreT * 0.45, 48, 84)) : 0;
  const nameFont = clamp(champMark * 0.3, 13, 20);
  const champH = champ ? trophyH + (hasTrophy ? 6 : 0) + champMark + 8 + nameFont + 6 + 11 + 2 : 0;
  const finalW = halves ? (vertical ? Math.min(size.width - 2 * pad, Math.max(boxW, 160)) : Math.min(centreT - 12, Math.max(D * 1.1, 120))) : D;
  let finalH = vertical ? (detail === "mark" ? Math.max(boxH, 52) : boxH) : boxH;
  // The final of the columns layout is two tall slots side by side.
  if (V === "columns") finalH = vertical ? Math.max(boxH, 96) : Math.min(Math.max(boxH * 1.7, 120), 220);
  const thirdH = withThird && !bottomThird ? 18 + boxH + 14 : 0;

  // A final alone (the World Cups of 1974 and 1978 ended with one and a third-place match): there is no tree to join, so it is centred, the champion over it and the third place under it.
  const lone = !halves && layout.sides.length === 1 && layout.sides[0].boxes.length === 1 && layout.finalIndex !== null && layout.sides[0].boxes[0].i === layout.finalIndex;
  if (lone) {
    const availW = W0 - 2 * pad;
    const wl = vertical ? Math.min(availW, road ? 340 : 300) : clamp(availW * 0.3, 240, 380);
    let hl = V === "columns" ? 120 : V === "shields" ? 86 : V !== null ? 72 : road ? 0 : 92;
    let dl: Exclude<Detail, "auto">;
    if (V !== null) dl = variantDetail(wl);
    else if (road) { const picked = roadPick(wl, 132); dl = picked.detail; hl = picked.h; }
    else dl = pick(wl, hl);
    const strays = othersOf(layout);
    const ows = Math.min(availW, 200);
    const strayH = othersHeight(strays.length, W0, pad, ows, OTHER_H);
    const labelH = showLabels ? 22 : 8;
    const content = (champ ? champH + 14 : 0) + labelH + hl + (withThird ? 8 + 18 + hl + 8 : 0) + strayH;
    const top0 = pad + titleH;
    const height = Math.max(size.height ?? 0, top0 + content + pad);
    const cx = W0 / 2;
    let y = top0 + Math.max(6, (height - top0 - pad - content) / 2);
    if (champ) { extras.push(...championBlock(layout.champion!, cx, y, champMark, trophyH, nameFont, o, v, ctx, poster)); y += champH + 14; }
    if (showLabels) texts.push(label(v, road, roundLabel(layout, layout.rounds, o.roundNames, v), cx, y + 12, "middle"));
    y += labelH;
    boxes.push({ rect: { x: cx - wl / 2, y, w: wl, h: hl }, tie: layout.ties[layout.finalIndex!], order: layout.sides[0].boxes[0].order, bye: null, byes: [], final: true, champion: champ });
    y += hl;
    if (withThird) { thirdAtFoot(layout, y + 8, cx, wl, hl, v, road, boxes, texts); y += 8 + 18 + hl + 8; }
    if (strays.length > 0) othersBlock(layout, strays, y + 6, W0, pad, ows, OTHER_H, v, road, boxes, texts);
    texts.push(...headings(v, o, W0, pad, poster));
    return finish({ width: W0, height, boxes, links: [], texts, extras, detail: dl, vertical, road, path, fit: fitNow, notes: anyNotes, markScores, markCols, tags: tagsOn, codes: codesOn, variant: V, em: { full: longest / 13, abbr: longestAbbr / 13, tag: tagsOn ? Math.max(...layout.ties.flatMap((t) => [tagOf(t, 0), tagOf(t, 1)]).map((x) => boldWidth(x, 1))) : 0 } });
  }

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
    const top = pad + titleH + (hasGroups ? groupRoom : 0) + labelRoom;
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
    if (V === "columns") growColumns(layout, rects, false, S, treeH, top, height - pad - extraH0);
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
        const labelY = top - (showLabels ? labelRoom + 12 : 14);
        if (o.headers === true) texts.push(headTile(poster ? v.upper(sd.label) : sd.label, (x0 + x1) / 2, x1 - x0, labelY, sd.key === "l" ? 0 : 1, layout.sides.length === 2));
        else texts.push(`<text class="tb-half" x="${num((x0 + x1) / 2)}" y="${num(labelY)}" font-size="${poster ? 16 : 15}" font-weight="700" letter-spacing=".1em" text-anchor="middle">${esc(poster ? v.upper(sd.label) : sd.label)}</text>`);
      });
    }
    // lines
    for (const t of layout.ties) {
      const p = layout.parent[t.index];
      if (p === -1 || V === "shields") continue;
      const a = rects.get(t.index), b = rects.get(p);
      if (!a || !b || layout.place[t.index] === "o") continue;
      const goingRight = b.x > a.x;
      const x0 = goingRight ? a.x + a.w : a.x, x1 = goingRight ? b.x : b.x + b.w;
      const y0 = a.y + a.h / 2, y1 = b.y + b.h / 2;
      const xm = (x0 + x1) / 2;
      addLine([x0, y0], [xm, y0], [xm, y1], [x1, y1]);
      links.push(`<path class="${lineClass(path, t.index, p)}" d="M${num(x0)} ${num(y0)}H${num(xm)}V${num(y1)}H${num(x1)}"${lineAttrs(o)}/>`);
    }
    if (bottomThird) thirdAtFoot(layout, height - pad - extraH0 + 6, width / 2, ow, OTHER_H, v, road, boxes, texts);
    othersBlock(layout, others, height - pad - extraH0 + thirdBlock + 6, width, pad, ow, OTHER_H, v, road, boxes, texts);
    texts.push(...headings(v, o, width, pad, poster));
    return finish({ width, height, boxes, links: orderLinks(links), texts, extras, detail, vertical, road, path, fit: fitNow, notes: anyNotes, markScores, markCols, tags: tagsOn, codes: codesOn, variant: V, em: { full: longest / 13, abbr: longestAbbr / 13, tag: tagsOn ? Math.max(...layout.ties.flatMap((t) => [tagOf(t, 0), tagOf(t, 1)]).map((x) => boldWidth(x, 1))) : 0 } });
  }

  // ----- vertical: the rounds are rows. The left half is the top; the final is a band in the middle.
  const groupBand = hasGroups ? (o.headers === true ? 34 : 26) : 0;
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
    const finalHere = V === "columns" ? Math.max(h, finalH) : detail === "mark" ? Math.max(h, 52) : h;
    const centre = (showLabels ? 32 : 0) + 6 + finalHere + 14;
    const thirdV = bottomThird ? 18 + (road ? h : 52) + 16 : 0;
    const band = h + gap;
    return (halves ? topT + bandsPerSide * band + centre + bandsPerSide * band + groupBand + pad : topT + (nc + (champ ? 1 : 0)) * band + (champ ? champH : 0) + pad) + othersV + thirdV;
  };
  // The road look fits a tall page: the boxes are made lower until the rounds fit, or, with room to spare, the room left over is shared between the rounds.
  if (road && size.height !== null && V === null) {
    while (boxH > 40 && needOf(boxH, gapT) > size.height) boxH -= 2;
    const slack = size.height - needOf(boxH, gapT);
    if (slack > 0 && bandCount > 0) gapT += Math.min(slack / bandCount, boxH * 0.5);
    D = boxH;
    finalH = detail === "mark" ? Math.max(boxH, 52) : boxH;
  }
  // The layouts of their own fill a tall page too: the boxes are made taller, and the rounds are spaced apart, until the page is as high as it was asked to be.
  if (V !== null && size.height !== null && vertical) {
    const cap = V === "series" ? (oneLine ? 52 : 60) : V === "columns" ? 150 : V === "shields" ? 110 : V === "rows" ? 96 : 80;
    while (boxH < cap && needOf(boxH + 2, gapT) <= size.height) { boxH += 2; if (V !== "columns") finalH = boxH; }
    D = boxH;
    const slack = size.height - needOf(boxH, gapT);
    if (slack > 0 && bandCount > 0) gapT += Math.min(slack / bandCount, 56);
    if (V !== "columns") finalH = boxH;
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
    if (showLabels) {
      const at = y + 12;
      texts.push(() => label(v, road, roundLabel(layout, layout.rounds, o.roundNames, v), midX, at, "middle", 1e9, clear(pad - 4, W0 - pad + 4)));
      y += 16;
    }
    const rect = { x: midX - finalW / 2, y: y + 6, w: finalW, h: finalH };
    rects.set(layout.final.i, rect);
    boxes.push({ rect, tie: layout.ties[layout.final.i], order: layout.final.order, bye: null, byes: [], final: true, champion: champ });
  } else if (!halves && champ && layout.finalIndex !== null) {
    const fr = rects.get(layout.finalIndex)!;
    extras.push(...championBlock(layout.champion!, fr.x + fr.w / 2, fr.y + fr.h + 12, champMark, trophyH, nameFont, o, v, ctx, poster));
  }
  if (V === "columns") growColumns(layout, rects, true, S, treeW, pad, W0 - pad);
  if (showLabels) {
    layout.columns.forEach((c, ci) => {
      const name = roundLabel(layout, c, o.roundNames, v);
      const sides: ("l" | "r")[] = halves ? (layout.sides.length > 1 ? ["l", "r"] : ["l"]) : ["l"];
      for (const sd of sides) {
        const at = bandStart(sd, ci) - 8;
        texts.push(() => {
          if (road) return label(v, road, name, pad, at, "start", 1e9, clear(pad - 4, W0 - pad + 4));
          const shown = v.upper(name);
          let size = 11, left = pad - 4;
          for (const s of [11, 9.5, 8.5]) {
            size = s;
            const found = freeX(segs, at - 16, at + 7, boldWidth(shown, s) * 1.06 + 8, pad - 4, pad - 4, W0 - pad + 4);
            if (found !== null) { left = found; break; }
          }
          return `<text class="tb-round tb-halo" x="${num(left + 4)}" y="${num(at)}" font-size="${size}" font-weight="600" letter-spacing=".08em">${esc(shown)}</text>`;
        });
      }
    });
  }
  if (hasGroups) {
    layout.sides.forEach((sd) => {
      if (!sd.label) return;
      const y = sd.key === "l" ? pad + titleH + champTop + 16 : totalT - pad - 2;
      if (o.headers === true) texts.push(headTile(v.upper(sd.label), midX, W0 - 2 * pad, y, sd.key === "l" ? 0 : 1, layout.sides.length === 2));
      else texts.push(`<text class="tb-half" x="${num(midX)}" y="${num(y)}" font-size="14" font-weight="700" letter-spacing=".1em" text-anchor="middle">${esc(v.upper(sd.label))}</text>`);
    });
  }
  for (const t of layout.ties) {
    const p = layout.parent[t.index];
    if (p === -1 || V === "shields") continue;
    const a = rects.get(t.index), b = rects.get(p);
    if (!a || !b || layout.place[t.index] === "o") continue;
    const down = b.y > a.y;
    const y0 = down ? a.y + a.h : a.y, y1 = down ? b.y : b.y + b.h;
    const x0c = a.x + a.w / 2, x1c = b.x + b.w / 2;
    // With the rounds named, the line turns just outside the box it leaves (going down) or just outside the box it enters (going up), so that the strip in front of the later round is free for its name.
    const ym = showLabels ? (down ? y0 + 6 : y1 + 6) : down ? y0 + gapT * 0.4 : y0 - gapT * 0.4;
    addLine([x0c, y0], [x0c, ym], [x1c, ym], [x1c, y1]);
    links.push(`<path class="${lineClass(path, t.index, p)}" d="M${num(x0c)} ${num(y0)}V${num(ym)}H${num(x1c)}V${num(y1)}"${lineAttrs(o)}/>`);
  }
  if (bottomThird) thirdAtFoot(layout, totalT - pad + 6, W0 / 2, Math.min(W0 - 2 * pad, road ? Math.max(boxW, 200) : 200), thirdH2, v, road, boxes, texts);
  othersBlock(layout, others, totalT - pad + thirdBlockV + 6, W0, pad, ow, OTHER_H, v, road, boxes, texts);
  texts.push(...headings(v, o, W0, pad, poster));
  return finish({ width: W0, height, boxes, links: orderLinks(links), texts, extras, detail, vertical, road, path, fit: fitNow, notes: anyNotes, markScores, markCols, tags: tagsOn, codes: codesOn, variant: V, em: { full: longest / 13, abbr: longestAbbr / 13, tag: tagsOn ? Math.max(...layout.ties.flatMap((t) => [tagOf(t, 0), tagOf(t, 1)]).map((x) => boldWidth(x, 1))) : 0 } });
}

/**
 * The columns layout's tall slots: a tie of a later round is made taller than the first round's, as tall as the room between its neighbours of the same column leaves (`base` times 1.55 for each round in, at most),
 * on the same centre. `span` is the room across the tree, for a column with a single tie.
 */
function growColumns(layout: BracketLayout, rects: Map<number, Rect>, vertical: boolean, base: number, span: number, lo: number, hi: number): void {
  const centre = (r: Rect) => (vertical ? r.x + r.w / 2 : r.y + r.h / 2);
  for (const sd of layout.sides) {
    layout.columns.forEach((col, ci) => {
      const here = sd.boxes.filter((b) => b.round === col).map((b) => rects.get(b.i)).filter((r): r is Rect => r !== undefined);
      if (here.length === 0) return;
      const at = here.map(centre).sort((a, b) => a - b);
      let gap = Infinity;
      for (let i = 1; i < at.length; i++) gap = Math.min(gap, at[i] - at[i - 1]);
      const want = Math.max(base, Math.min(base * 1.55 ** ci, gap === Infinity ? span * 0.6 : gap - 8));
      for (const r of here) {
        const c = centre(r);
        // Never past the room there is on either side of the centre.
        const size = Math.max(Math.min(base, 2 * (c - lo), 2 * (hi - c)), Math.min(want, 2 * (c - lo), 2 * (hi - c)));
        if (vertical) { r.x = c - size / 2; r.w = size; } else { r.y = c - size / 2; r.h = size; }
      }
    });
  }
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

/** The two lines a name is best broken into at a space (the widest line as narrow as it can be), or `null` for a name of one word. */
function twoLines(text: string, size: number, measure: (t: string, size: number) => number): [string, string] | null {
  const words = text.split(" ");
  let best: [string, string] | null = null;
  for (let i = 1; i < words.length; i += 1) {
    const pair: [string, string] = [words.slice(0, i).join(" "), words.slice(i).join(" ")];
    if (best === null || Math.max(measure(pair[0], size), measure(pair[1], size)) < Math.max(measure(best[0], size), measure(best[1], size))) best = pair;
  }
  return best;
}

/** The bold, letter-spaced width of a round's name (as a pill or a heading sets it). */
const nameWidth = (t: string, size: number): number => boldWidth(t, size) * 1.06;

/**
 * How a round's name is set within `maxWidth` (the column it heads): on one line at 11, smaller down to 9 (the pill's own room is 9 either side, or 4 where that is all there is), or, where it still does not
 * fit, on two lines at 9, 8.5 and 8: a name is never cut while a smaller or a second line will hold it. The road look's pill and the classic look's heading take the same rule.
 */
function nameFits(v: Voice, road: boolean, text: string, maxWidth: number): boolean {
  const upper = v.upper(text);
  return nameWidth(upper, 9) + (road ? 8 : 0) <= maxWidth;
}

function label(v: Voice, road: boolean, text: string, x: number, y: number, anchor: "start" | "middle", maxWidth = 1e9, place?: (w: number, pref: number, y: number) => number | null): string {
  const upper = v.upper(text);
  if (!road) {
    // A column's heading: 11 down to 9.5 on one line, then two lines at 9.5, 9 and 8.5; the last resort cuts it.
    if (maxWidth < 1e9 && nameWidth(upper, 11) > maxWidth) {
      let size = 11;
      while (size > 9.5 && nameWidth(upper, size) > maxWidth) size -= 0.5;
      if (nameWidth(upper, size) <= maxWidth) return `<text class="tb-round" x="${num(x)}" y="${num(y)}" font-size="${size}" font-weight="600" letter-spacing=".08em" text-anchor="${anchor}">${esc(upper)}</text>`;
      for (const s of [9.5, 9, 8.5]) {
        const pair = twoLines(upper, s, nameWidth);
        if (pair && Math.max(nameWidth(pair[0], s), nameWidth(pair[1], s)) <= maxWidth) return pair.map((line, i) => `<text class="tb-round" x="${num(x)}" y="${num(y - (1 - i) * 10)}" font-size="${s}" font-weight="600" letter-spacing=".08em" text-anchor="${anchor}">${esc(line)}</text>`).join("");
      }
      return `<text class="tb-round" x="${num(x)}" y="${num(y)}" font-size="8.5" font-weight="600" letter-spacing=".08em" text-anchor="${anchor}">${esc(fit(upper, 8.5, maxWidth, nameWidth))}</text>`;
    }
    const shown = upper;
    const plain = `<text class="tb-round" x="${num(x)}" y="${num(y)}" font-size="11" font-weight="600" letter-spacing=".08em" text-anchor="${anchor}">${esc(shown)}</text>`;
    if (!place) return plain;
    // The name is kept clear of the connector lines: where it cannot stand where it was put, it moves along its row.
    for (const size of [11, 9.5, 8.5]) {
      const w = nameWidth(shown, size) + 8;
      const pref = anchor === "middle" ? x - w / 2 : x - 4;
      const left = place(w, pref, y);
      if (left === null) continue;
      return left === pref && size === 11 ? plain : `<text class="tb-round" x="${num(left + 4)}" y="${num(y)}" font-size="${size}" font-weight="600" letter-spacing=".08em" text-anchor="start">${esc(shown)}</text>`;
    }
    return plain;
  }
  // The road look names a round on a pill. Down to 9 on one line (with 9 either side), then a snugger pill (4 either side), then two lines at 9, 8.5 and 8.
  let s = 11;
  while (s > 9 && nameWidth(upper, s) > maxWidth - 18) s -= 0.5;
  let rows: string[] = [upper];
  let side = 9;
  if (nameWidth(upper, s) > maxWidth - 18) {
    if (nameWidth(upper, s) <= maxWidth - 8) side = 4;
    else {
      rows = [fit(upper, s, maxWidth - 12, nameWidth)];
      for (const size of [9, 8.5, 8]) {
        const pair = twoLines(upper, size, nameWidth);
        if (pair && Math.max(nameWidth(pair[0], size), nameWidth(pair[1], size)) <= maxWidth - 12) { rows = pair; s = size; side = 6; break; }
        if (pair && size === 8) { rows = pair.map((line) => fit(line, 8, maxWidth - 12, nameWidth)); s = 8; side = 6; }
      }
    }
  }
  const widest = Math.max(...rows.map((r) => nameWidth(r, s)));
  let w = widest + 2 * side;
  let x0 = anchor === "middle" ? x - w / 2 : x;
  let fs = s;
  if (place && rows.length === 1) {
    // Where the lines leave no room, the name is set smaller (to 8) and the pill made snugger (side 6, then 4).
    search: for (const size of s > 8 ? [s, 8.5, 8].filter((z) => z <= s) : [s]) {
      for (const sd of [9, 6, 4]) {
        w = nameWidth(rows[0], size) + 2 * sd;
        const pref = anchor === "middle" ? x - w / 2 : x;
        const found = place(w, pref, y);
        x0 = found ?? pref;
        fs = size;
        if (found !== null) break search;
      }
    }
  }
  const put = (line: string, by: number) => `<text class="tb-lab" x="${num(x0 + w / 2)}" y="${num(by)}" font-size="${num(fs)}" font-weight="700" letter-spacing=".08em" text-anchor="middle">${esc(line)}</text>`;
  if (rows.length === 2) return `<rect class="tb-panel" x="${num(x0)}" y="${num(y - 23.5)}" width="${num(w)}" height="29" rx="12"/>${put(rows[0], y - 12)}${put(rows[1], y - 1.5)}`;
  return `<rect class="tb-panel" x="${num(x0)}" y="${num(y - 14.5)}" width="${num(w)}" height="20" rx="10"/>${put(rows[0], y)}`;
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
  return [...layout.other, ...layout.robin, ...layout.playIn];
}

function othersHeight(count: number, width: number, pad: number, ow: number, oh: number): number {
  if (!count) return 0;
  const cols = Math.max(1, Math.floor((width - 2 * pad + 10) / (ow + 10)));
  return 26 + Math.ceil(count / cols) * (oh + 10) + 6;
}

function othersBlock(layout: BracketLayout, list: number[], y0: number, width: number, pad: number, ow: number, oh: number, v: Voice, road: boolean, boxes: Placed[], texts: (string | Late)[]): void {
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
function thirdAtFoot(layout: BracketLayout, y0: number, cx: number, w: number, h: number, v: Voice, road: boolean, boxes: Placed[], texts: (string | Late)[]): void {
  texts.push(label(v, road, v.words.thirdPlace, cx, y0 + 12, "middle"));
  boxes.push({ rect: { x: cx - w / 2, y: y0 + 18, w, h }, tie: layout.ties[layout.third!], order: [0, 1], bye: null, byes: [], final: false, champion: false });
}


/** The address `href` gives for a tie (or for one side of it), when it is one a drawing may link to; `null` otherwise. */
function hrefOf(o: DrawOptions, tie: Tie, side?: 0 | 1): string | null {
  if (typeof o.href !== "function") return null;
  const url = side === undefined ? o.href(tie) : o.href(tie, side);
  return typeof url === "string" && safeHref(url) ? url.trim() : null;
}

function drawBox(p: Placed, plan: Plan, o: DrawOptions, v: Voice, ctx: MarkContext, linked: { count: number }, side: Place): string {
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

  if (plan.variant !== null) {
    const env: PaintEnv = {
      kind: plan.variant, x, y, w, h, tie, order: p.order, side, final: p.final, road, detail, vertical: plan.vertical, tags: plan.tags, codes: plan.codes, scoresOn, v, ctx, o,
      cls, link: row, tagOf, em: plan.em,
    };
    parts.push(...paintVariant(env));
  } else if (detail === "mark" && plan.markCols) {
    // Two columns, each a stack: the seed tag, the mark, its three letters, the score. The marks are as large as the box lets the whole stack be, and every part is inside the box.
    const padX = 6, padY = 5;
    const colW = (w - 2 * padX) / 2;
    const withScore = plan.markScores && scoresOn && r.score !== null;
    const tags = ([0, 1] as const).map((k) => (plan.tags ? tagOf(tie, k) : ""));
    const tagH = tags.some((t) => t !== "") ? 12 : 0;
    const scoreOf = (k: 0 | 1): string => (withScore && r.score ? v.number(r.score[k]) : "");
    const pensOf = (k: 0 | 1): string => (withScore && r.pens ? `(${v.number(r.pens[k])})` : "");
    const hasPens = withScore && r.pens !== null;
    const lay = (m: number) => {
      const cf = clamp(m * 0.24, 7, 11);
      let sf = clamp(m * 0.5, 9, 24);
      const pf = (size: number) => Math.max(size * 0.55, 8);
      // The score and the shoot-out's score share a line where they fit the column; else the shoot-out goes under the score.
      const need = (size: number) => Math.max(...([0, 1] as const).map((k) => boldWidth(scoreOf(k), size) + (pensOf(k) ? boldWidth(pensOf(k), pf(size)) + 3 : 0)));
      if (withScore) while (sf > 10 && need(sf) > colW - 2) sf -= 0.5;
      const inline = !withScore || need(sf) <= colW - 2;
      const height = tagH + m + (plan.codes ? 3 + cf * 1.25 : 0) + (withScore ? 3 + sf * 1.15 + (hasPens && !inline ? pf(sf) * 1.15 : 0) : 0);
      return { cf, sf, pf: pf(sf), inline, height };
    };
    let m = Math.max(10, Math.min(colW - 3, 56, h - 2 * padY));
    let L = lay(m);
    while (m > 10 && L.height > h - 2 * padY) { m -= 0.5; L = lay(m); }
    const top = y + (h - L.height) / 2;
    const midY = top + tagH + m / 2;
    rowsOrder.forEach((k, n) => {
      const team = tie.sides[k];
      const cx = x + padX + colW / 2 + n * colW;
      const inner: string[] = [];
      let yy = top;
      if (tagH && tags[k]) {
        const tw = boldWidth(tags[k], 8) + 8;
        inner.push(`<rect class="tb-tagbox" x="${num(cx - tw / 2)}" y="${num(yy)}" width="${num(tw)}" height="11" rx="5.5"/><text class="tb-tag" x="${num(cx)}" y="${num(yy + 8.2)}" font-size="8" text-anchor="middle">${esc(tags[k])}</text>`);
      }
      yy += tagH;
      inner.push(drawMark(team, cx, yy + m / 2, m, ctx));
      yy += m;
      if (plan.codes) {
        yy += 3;
        inner.push(`<text class="tb-code" x="${num(cx)}" y="${num(yy + L.cf * 0.75)}" font-size="${num(L.cf)}" text-anchor="middle">${esc(fit(abbrOf(team, v), L.cf, colW - 2, boldWidth))}</text>`);
        yy += L.cf * 1.25;
      }
      if (withScore) {
        yy += 3;
        const pens = pensOf(k);
        const span = pens && L.inline ? `<tspan class="tb-muted" dx="3" font-size="${num(L.pf)}" font-weight="600">${esc(pens)}</tspan>` : "";
        inner.push(`<text class="tb-score" x="${num(cx)}" y="${num(yy + L.sf * 0.8)}" font-size="${num(L.sf)}" text-anchor="middle" font-variant-numeric="tabular-nums">${esc(scoreOf(k))}${span}</text>`);
        yy += L.sf * 1.15;
        if (pens && !L.inline) inner.push(`<text class="tb-muted" x="${num(cx)}" y="${num(yy + L.pf * 0.8)}" font-size="${num(L.pf)}" font-weight="600" text-anchor="middle">${esc(pens)}</text>`);
      }
      parts.push(row(k, `<g class="${cls(k)}">${inner.join("")}</g>`, cx - colW / 2, y, colW, h));
    });
    // "vs" between the two marks, where they leave room for it.
    const vf = clamp(m * 0.26, 7, 11);
    if (o.vs === true && colW - m >= boldWidth(v.words.roadVs, vf) + 4) parts.push(`<text class="tb-vs" x="${num(x + w / 2)}" y="${num(midY + vf * 0.35)}" font-size="${num(vf)}" text-anchor="middle">${esc(v.words.roadVs)}</text>`);
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
    const mw = boldWidth;
    const tf = clamp(font * 0.62, 7, 9.5);
    rowsOrder.forEach((k, n) => {
      const team = tie.sides[k];
      const ry = y + n * rowH;
      const cy = ry + rowH / 2;
      const rowParts: string[] = [];
      let tx = x + padX;
      if (o.markShape !== "none") { rowParts.push(drawMark(team, x + padX + md / 2, cy, md, ctx)); tx = x + padX + md + gap; }
      // The seed tag, a small pill between the mark and the name.
      const tag = plan.tags ? tagOf(tie, k) : "";
      if (tag) {
        const tw = boldWidth(tag, tf) + 8;
        rowParts.push(`<rect class="tb-tagbox" x="${num(tx)}" y="${num(cy - (tf + 4) / 2)}" width="${num(tw)}" height="${num(tf + 4)}" rx="${num((tf + 4) / 2)}"/><text class="tb-tag" x="${num(tx + tw / 2)}" y="${num(cy + tf * 0.35)}" font-size="${num(tf)}" text-anchor="middle">${esc(tag)}</text>`);
        tx += tw + 3;
      }
      const score = scoresOn && r.score ? v.number(r.score[k]) : "";
      const pensText = scoresOn && r.pens ? `(${v.number(r.pens[k])})` : "";
      const bye = p.byes.includes(k);
      const right = x + w - padX;
      const scoreW = score ? mw(score, scoreFont) : 0;
      const pensW = pensText ? mw(pensText, small) + (road ? 4 : 3) : 0;
      const seed = seedsOn && !road && team?.seed !== undefined ? `${v.number(team.seed)} ` : "";
      const nm = team ? (detail === "full" ? team.name : abbrOf(team, v)) : v.words.tbd;
      // The word for a bye goes beside the score only where the name still fits beside it.
      const byeFits = bye && right - tx - (scoreW + pensW) - (mw(v.words.bye, small2) + 6) - 6 >= mw(`${seed}${nm}`, font);
      const byeText = byeFits ? v.words.bye : "";
      const byeW = byeText ? mw(byeText, small2) : 0;
      const avail = right - tx - (scoreW + pensW) - (byeW ? byeW + 6 : 0) - 6;
      // A name that does not fit is set a little smaller before it is cut.
      let nameFont = font;
      while (nameFont > 9.5 && mw(`${seed}${nm}`, nameFont) > avail) nameFont -= 0.5;
      const text = fit(`${seed}${nm}`, nameFont, Math.max(avail, 8), mw);
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
  const extra = tieClassOf(o, tie);
  // The layouts of their own colour a half by its side: the first half (the left, or the top) is `tb-c0`, the second `tb-c1`.
  const conf = plan.variant !== null && (side === "l" || side === "r") ? ` tb-c${side === "l" ? 0 : 1}` : "";
  const cls2 = `tb-tie${p.final ? " tb-final" : ""}${p.champion ? " tb-has-champ" : ""}${plan.path.has(tie.index) ? " tb-on-path" : ""}${conf}${extra}`;
  const body = boxHref !== null ? anchor(boxHref, description, parts.join("")) : parts.join("");
  return `<g class="${cls2}"><title>${esc(description)}</title>${body}</g>`;
}
