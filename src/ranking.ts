/**
 * Ranking lists for any ranked sport, drawn from the caller's data (a provincial or club feed, a federation's list): a title and a category, then the entries as a podium (the top
 * three in gold, silver and bronze rows) above a compact list, as one featured row above two columns, or as a plain list. Text first: rank, flag, name, club, points and the
 * movement since the last list, with no photo slot to leave empty. A champion row ("C"), an interim champion, newly ranked athletes ("NR"), tied ranks and paging are in.
 * Static SVG for a given state, like every drawing here.
 */
import { arrow, boardFrame, boardWrap, bw, clampN, fitSize, label, pill, type BoardFrame, type BoardOptions } from "./rank-kit.ts";
import { fill, voiceOf, type Voice } from "./locales.ts";
import { drawMark } from "./marks.ts";
import { abbreviate, fit, num } from "./text.ts";
import type { Team } from "./types.ts";

/** A name in two parts: the family name is written in capitals and first by default (`SURNAME Given`, as judo and the IJF write it). */
export interface RankingName {
  given?: string;
  surname: string;
}

/** One line of a ranking. Only `name` is needed. */
export interface RankingEntry {
  /** The name as it is to be written, or its two parts (set by `nameStyle`). */
  name: string | RankingName;
  /** The rank. Left out, the position in the list, with equal points sharing a rank (`ties`). A champion has none. */
  rank?: number;
  /** A number (shown to `precision` decimals) or text (shown as it is). */
  points?: number | string;
  club?: string;
  /** The country's or region's name, written under the name in a podium row. */
  country?: string;
  /** The country's three letters (`CAN`), written in the compact rows. */
  code?: string;
  /** A code for the `flags` renderer: a country (`JP`) or a Canadian province or territory (`CA-BC`). */
  flag?: string;
  /** A mark of your own (an image address or inline SVG) in place of a flag: a club's emblem. */
  mark?: string;
  /** This athlete's category ("U18 · -60 kg"), written in the second line when `categories` is on: for a list that mixes categories. */
  category?: string;
  /** The movement since the last list: whole places up (positive) or down (negative), `0` for none, `"new"` for newly ranked ("NR"). */
  change?: number | "new";
  /** The champion of the division: a row marked "C" above the ranks (`"interim"` for an interim champion). */
  champion?: boolean | "interim";
}

export interface RankingSource {
  /** The heading. Default: the language's word for ranking. */
  title?: string;
  /** The category as a line under the heading ("U18 · Men -60 kg"; `rankingCategoryLabel` writes one). */
  category?: string;
  /** The date or period of the list, at the right of the heading ("October 2026"). */
  date?: string;
  /** Where the list comes from, small at the foot ("Source: BC Judo"). */
  source?: string;
  entries: readonly RankingEntry[];
}

export interface RankingOptions extends BoardOptions {
  /** `podium` (the default): the top three as big rows, tinted gold, silver and bronze, above the compact rest. `featured`: one big row above two columns. `list`: every row compact. */
  style?: "podium" | "list" | "featured";
  /** How many rows, from the top, are big (0 to 3). Default by `style`. Only on the first page. */
  big?: number;
  /** One column or two for the compact rows (the first column runs down before the second starts). Default 1, and 2 for `featured`. */
  columns?: 1 | 2;
  /** The most entries drawn, from the first of the page. Default: as many as fit at a readable size. */
  rows?: number;
  /** Which page of `rows` entries (0 is the first). The header says which entries are shown. */
  page?: number;
  /** On a wide board (at least 3:2) the big rows go in a panel on the left and the compact ones beside them, in place of one above the other. Default true; `false` stacks them. */
  split?: boolean;
  /** Tint the rows of ranks 1 to 3 gold, silver and bronze. Default: on for `podium` and `featured` (off when the list has a champion row), off for `list`. */
  medals?: boolean;
  /** How movement is shown: `arrow` (an arrow and the number of places, the default), `row` (the row tinted green or red), `both`, or `none`. */
  movement?: "arrow" | "row" | "both" | "none";
  /** `surname-first` (the default: `SURNAME Given`), `given-first` (`Given SURNAME`) or `as-is`, for a `name` given in two parts. */
  nameStyle?: "surname-first" | "given-first" | "as-is";
  /** `plain` (`10`, the default) or `hash` (`#10`). */
  rankStyle?: "plain" | "hash";
  /** Decimals for numeric points (`2` writes `91.60` and `50.00`). Default: as many as the number has, up to three. */
  precision?: number;
  /** Equal points share a rank where an entry names none (`1, 2, 2, 4`). Default true. */
  ties?: boolean;
  /** `given` (the default) keeps the order of the entries; `points` puts the most points first. */
  sort?: "given" | "points";
  /** Write each entry's own `category` in the second line. */
  categories?: boolean;
  /** Draw a club's (or the athlete's) initials on a badge for an entry with no flag or mark, even where no entry has one. Default: only where some entry has a flag or mark. */
  badge?: boolean;
}

/** The ranks of a list, in order: an entry's own `rank`, else its position, with equal points sharing a rank; `null` for a champion row. Pure; takes the list as it is ordered. */
export function rankingRanks(entries: readonly RankingEntry[], options: { ties?: boolean } = {}): (number | null)[] {
  const ties = options.ties ?? true;
  const out: (number | null)[] = [];
  let seen = 0;
  let last: { rank: number; points: number | string | undefined } | null = null;
  for (const e of entries) {
    if (e.champion) { out.push(null); continue; }
    seen += 1;
    let rank = seen;
    if (e.rank !== undefined) rank = e.rank;
    else if (ties && last && typeof e.points === "number" && last.points === e.points) rank = last.rank;
    out.push(rank);
    last = { rank, points: e.points };
  }
  return out;
}

/** A category as a heading ("U18 · Men -60 kg"): an age group, a sex and a weight, any of them, joined by a dot. A weight is `-60` or `+100` (kg) or any text. */
export function rankingCategoryLabel(category: { age?: string; sex?: "men" | "women" | "open"; weight?: string }, locale?: string): string {
  const v = voiceFor(locale);
  const w = v.words;
  const parts: string[] = [];
  if (category.age) parts.push(category.age);
  const sex = category.sex === "men" ? w.judoMen : category.sex === "women" ? w.judoWomen : undefined;
  const kg = category.weight === undefined ? undefined : /^[-+]\d{2,3}$/.test(category.weight) ? fill(category.weight.startsWith("+") ? w.judoWeightOver : w.judoWeightClass, { sex: sex ?? "", w: category.weight.slice(1) }).trim() : [sex, category.weight].filter(Boolean).join(" ");
  if (kg) parts.push(kg);
  else if (sex) parts.push(sex);
  return parts.join(" · ");
}

export const voiceFor = (locale?: string): Voice => voiceOf(locale === undefined ? {} : { locale });

export const nameText = (n: RankingEntry["name"], style: NonNullable<RankingOptions["nameStyle"]>, v: Voice): string => {
  if (typeof n === "string") return n;
  const given = (n.given ?? "").trim();
  const sur = style === "as-is" ? n.surname.trim() : v.upper(n.surname.trim());
  if (!given) return sur;
  return style === "given-first" || style === "as-is" ? `${given} ${sur}` : `${sur} ${given}`;
};

export const pointsText = (p: RankingEntry["points"], precision: number | undefined, v: Voice): string => {
  if (p === undefined || p === null) return "";
  if (typeof p === "string") return p;
  if (!Number.isFinite(p)) return "";
  return precision === undefined ? v.number(p) : new Intl.NumberFormat(v.locale.tag, { minimumFractionDigits: precision, maximumFractionDigits: precision }).format(p);
};

/** One row, worked out: what it says and how it is dressed. */
interface Row {
  e: RankingEntry;
  rank: number | null;
  rankText: string;
  name: string;
  second: string;
  code: string;
  points: string;
  /** 0 none, 1 gold, 2 silver, 3 bronze. */
  medal: 0 | 1 | 2 | 3;
  change: number | "new" | undefined;
  team: Team;
}

export interface R { x: number; y: number; w: number; h: number }

function validate(source: RankingSource, options: RankingOptions): void {
  if (!source || !Array.isArray(source.entries)) throw new RangeError("taisen-brackets: a ranking needs a list of entries");
  source.entries.forEach((e, i) => {
    const nm = e?.name;
    const ok = typeof nm === "string" ? nm.trim() !== "" : !!nm && typeof nm === "object" && typeof nm.surname === "string" && nm.surname.trim() !== "";
    if (!ok) throw new RangeError(`taisen-brackets: entry ${i + 1} of the ranking needs a name`);
    if (e.rank !== undefined && !(Number.isInteger(e.rank) && e.rank >= 1)) throw new RangeError(`taisen-brackets: the rank of ${typeof nm === "string" ? nm : nm.surname} is a whole number from 1, not ${JSON.stringify(e.rank)}`);
    if (e.change !== undefined && e.change !== "new" && !Number.isInteger(e.change)) throw new RangeError(`taisen-brackets: the change of ${typeof nm === "string" ? nm : nm.surname} is a whole number of places or "new", not ${JSON.stringify(e.change)}`);
    if (e.points !== undefined && typeof e.points !== "number" && typeof e.points !== "string") throw new RangeError(`taisen-brackets: the points of ${typeof nm === "string" ? nm : nm.surname} are a number or a text`);
  });
  const oneOf = (name: string, value: unknown, allowed: readonly unknown[]): void => {
    if (value !== undefined && !allowed.includes(value)) throw new RangeError(`taisen-brackets: ${name} is ${allowed.map((a) => JSON.stringify(a)).join(", ")}, not ${JSON.stringify(value)}`);
  };
  oneOf("a ranking's style", options.style, ["podium", "list", "featured"]);
  oneOf("movement", options.movement, ["arrow", "row", "both", "none"]);
  oneOf("nameStyle", options.nameStyle, ["surname-first", "given-first", "as-is"]);
  oneOf("rankStyle", options.rankStyle, ["plain", "hash"]);
  oneOf("sort", options.sort, ["given", "points"]);
  oneOf("columns", options.columns, [1, 2]);
  if (options.big !== undefined && !(Number.isInteger(options.big) && options.big >= 0 && options.big <= 3)) throw new RangeError("taisen-brackets: big is a whole number from 0 to 3");
  if (options.rows !== undefined && !(Number.isInteger(options.rows) && options.rows >= 1 && options.rows <= 100)) throw new RangeError("taisen-brackets: rows is a whole number from 1 to 100");
  if (options.page !== undefined && !(Number.isInteger(options.page) && options.page >= 0)) throw new RangeError("taisen-brackets: page is a whole number from 0");
  if (options.precision !== undefined && !(Number.isInteger(options.precision) && options.precision >= 0 && options.precision <= 6)) throw new RangeError("taisen-brackets: precision is a whole number from 0 to 6");
}

/** The entries in the order they are drawn, with their ranks. */
function ordered(source: RankingSource, options: RankingOptions): { e: RankingEntry; rank: number | null }[] {
  const list = options.sort === "points"
    ? source.entries.map((e, i) => ({ e, i })).sort((a, b) => (a.e.champion ? 0 : 1) - (b.e.champion ? 0 : 1) || (typeof b.e.points === "number" ? b.e.points : -Infinity) - (typeof a.e.points === "number" ? a.e.points : -Infinity) || a.i - b.i).map((x) => x.e)
    : [...source.entries];
  const ranks = rankingRanks(list, options.ties === undefined ? {} : { ties: options.ties });
  return list.map((e, i) => ({ e, rank: ranks[i] }));
}

/** The ranking as a sentence, the drawing's description. */
export function describeRanking(source: RankingSource, options: Pick<RankingOptions, "locale" | "words" | "nameStyle" | "precision" | "ties" | "sort" | "rankStyle" | "rows" | "page"> = {}): string {
  const vv = voiceOf(options);
  const w = vv.words;
  const parts = [source.title ?? w.rankTitle];
  if (source.category) parts.push(source.category);
  if (source.date) parts.push(source.date);
  const all = ordered(source, options);
  const start = options.rows ? (options.page ?? 0) * options.rows : 0;
  const shown = options.rows ? all.slice(start, start + options.rows) : all;
  if (shown.length === 0) parts.push(w.rankNone);
  for (const { e, rank } of shown) {
    const bits = [e.champion ? (e.champion === "interim" ? w.rankInterimLong : w.rankChampionLong) : String(rank), nameText(e.name, options.nameStyle ?? "surname-first", vv)];
    const detail = [e.club, e.country].filter(Boolean).join(", ");
    if (detail) bits.push(detail);
    const p = pointsText(e.points, options.precision, vv);
    if (p) bits.push(`${p} ${w.rankPoints}`);
    if (e.change === "new") bits.push(w.rankNewLong);
    else if (typeof e.change === "number" && e.change !== 0) bits.push(fill(e.change > 0 ? w.rankUp : w.rankDown, { n: vv.number(Math.abs(e.change)) }));
    parts.push(bits.join(w.rankJoin));
  }
  return parts.join(w.sep) + w.end;
}

export const teamFor = (e: RankingEntry, id: string, name: string, badge: string): Team => ({ id, name, abbr: badge, ...(e.flag ? { flag: e.flag } : {}), ...(e.mark ? { mark: e.mark } : {}) });

/**
 * The ranking list as an SVG. Throws a `RangeError` for an entry with no name, a rank or change that is not a whole number, an option that is not one of its values, or a bad size or theme.
 */
export function rankingList(source: RankingSource, options: RankingOptions = {}): string {
  validate(source, options);
  const style = options.style ?? "podium";
  const f = boardFrame(options, [source, style, options.big, options.columns, options.split, options.rows, options.page, options.medals, options.movement, options.nameStyle, options.rankStyle, options.precision, options.ties, options.sort, options.categories, options.badge]);
  const { W, H, v } = f;
  const w = v.words;
  const unit = Math.min(W, H);
  const nameStyle = options.nameStyle ?? "surname-first";
  const movement = options.movement ?? "arrow";
  const all = ordered(source, options);
  const hasChampion = all.some((x) => x.e.champion);
  const medals = options.medals ?? (style !== "list" && !hasChampion);
  const columns = options.columns ?? (style === "featured" ? 2 : 1);
  const page = options.page ?? 0;
  const bigWanted = page > 0 ? 0 : options.big ?? (style === "podium" ? 3 : style === "featured" ? 1 : 0);

  // The box the content is drawn in: as wide as a row reads well, centred.
  const pad = Math.round(unit * 0.035);
  const split = bigWanted > 0 && all.length - page * (options.rows ?? 0) > Math.min(bigWanted, all.length) && columns === 1 && W / H >= 1.45 && options.split !== false;
  const boxW = Math.min(W - pad * 2, columns === 2 || split ? W - pad * 2 : unit * 1.3);
  const bx = (W - boxW) / 2;

  // The header.
  const title = source.title ?? w.rankTitle;
  const hs = clampN(unit * 0.05, 18, 70);
  const cs = hs * 0.58;
  let y = pad;
  const body: string[] = [];
  const dateText = source.date ?? "";
  const dateW = dateText ? Math.min(boxW * 0.4, bw(dateText, cs) + 4) : 0;
  const titleAvail = boxW - (dateW ? dateW + pad : 0);
  const tsz = fitSize(title, hs, titleAvail, 0.5);
  body.push(label(bx, y + hs * 0.85, tsz, fit(title, tsz, titleAvail + 1, bw), "rk-ink", "start", 800));
  if (dateText) body.push(label(bx + boxW, y + hs * 0.85, cs, fit(dateText, cs, dateW, bw), "rk-sub", "end", 700));
  y += hs * 1.05;
  const catText = source.category ?? "";
  // The page's range sits on the second line at the right.
  const total = all.length;
  const perPage = options.rows;
  const fromIdx = perPage ? page * perPage : 0;
  if (catText) {
    const p = pill(bx, y + cs * 0.7, cs * 1.35, catText, boxW * 0.62, "rk-accent", "rk-accentink");
    body.push(p.svg);
  }
  y += catText ? cs * 1.35 + pad * 0.7 : pad * 0.35;
  const footerH = source.source ? Math.max(14, unit * 0.026) + pad * 0.5 : 0;
  const bodyTop = y;
  const bodyBottom = H - pad - footerH;
  const avail = bodyBottom - bodyTop;

  // Which entries fit.
  const cols = columns;
  const minComp = Math.max(30, unit * 0.04);
  const k = cols === 2 && style === "featured" ? 2.3 : 2.1;
  const GAP = 0.14;
  // How many entries fit when each compact row is at least `minComp` high.
  const fitCount = (nBig: number): number => nBig + cols * Math.max(1, Math.floor((split ? avail / minComp : avail / minComp - nBig * (k + GAP)) / (1 + GAP)));
  const wanted = perPage ?? total - fromIdx;
  const bigCap = Math.min(bigWanted, Math.max(0, total - fromIdx));
  const count = Math.max(0, Math.min(wanted, total - fromIdx, perPage ? wanted : fitCount(bigCap)));
  const slice = all.slice(fromIdx, fromIdx + count);
  const nBig = Math.min(bigCap, slice.length);
  const nComp = slice.length - nBig;
  const rpc = Math.ceil(nComp / cols);
  const denom = split ? rpc * (1 + GAP) : nBig * (k + GAP) + rpc * (1 + GAP);
  const maxComp = unit * 0.11;
  const compH = denom > 0 ? Math.min(maxComp, avail / denom) : maxComp;
  // Side by side, the big rows stack in their own panel and take its whole height; stacked, they are `k` times a compact row.
  const bigH = split ? Math.min(unit * 0.27, avail / (nBig * (1 + GAP))) : compH * k;
  const gap = compH * GAP;
  const bigGap = split ? bigH * GAP : gap;
  const leftW = split ? Math.round((boxW - pad) * 0.44) : boxW;

  // Rows, worked out.
  const marksAny = options.badge === true || slice.some((x) => x.e.flag || x.e.mark);
  const rows: Row[] = slice.map(({ e, rank }, i) => {
    const name = nameText(e.name, nameStyle, v);
    const medal = medals && rank !== null && rank <= 3 ? (rank as 1 | 2 | 3) : e.champion ? 1 : 0;
    const rankText = e.champion ? (e.champion === "interim" ? w.rankInterim : w.rankChampion) : `${options.rankStyle === "hash" ? "#" : ""}${v.number(rank ?? 0)}`;
    const second = [e.club ?? e.country, options.categories ? e.category : undefined].filter((x): x is string => !!x).join(" · ");
    const badge = abbreviate(e.club ?? name).slice(0, 3);
    return { e, rank, rankText, name, second, code: e.code ?? "", points: pointsText(e.points, options.precision, v), medal, change: e.change, team: teamFor(e, `r${fromIdx + i}`, name, badge) };
  });

  const bigRows = rows.slice(0, nBig), compRows = rows.slice(nBig);
  const bigM = metrics(f, bigRows, bigH, true, movement, marksAny, leftW);
  const colGap = pad;
  const colW = split ? boxW - leftW - pad : cols === 2 ? (boxW - colGap) / 2 : boxW;
  const compM = metrics(f, compRows, compH, false, movement, marksAny, colW);
  let cy = bodyTop;
  bigRows.forEach((row) => {
    drawRow(body, f, { x: bx, y: cy, w: leftW, h: bigH }, row, bigM, true, movement);
    cy += bigH + bigGap;
  });
  const compTop = split ? bodyTop : cy;
  const compX = split ? bx + leftW + pad : bx;
  compRows.forEach((row, i) => {
    const col = Math.floor(i / rpc), idx = i % rpc;
    drawRow(body, f, { x: compX + col * (colW + colGap), y: compTop + idx * (compH + gap), w: colW, h: compH }, row, compM, false, movement);
  });
  if (rows.length === 0) body.push(label(bx, bodyTop + hs, cs, w.rankNone, "rk-sub", "start", 700));
  // The range at the right of the category line, where entries are paged.
  if (perPage && total > perPage && rows.length) {
    const t = fill(w.rankRange, { a: v.number(fromIdx + 1), b: v.number(fromIdx + rows.length), n: v.number(total) });
    body.push(label(bx + boxW, bodyTop - pad * 0.7 - cs * 0.3, cs * 0.85, fit(t, cs * 0.85, boxW * 0.35, bw), "rk-sub", "end", 700));
  }
  if (source.source) {
    const fs = Math.max(12, unit * 0.022);
    body.push(label(bx, H - pad - fs * 0.2, fs, fit(source.source, fs, boxW, bw), "rk-sub", "start", 600));
  }
  const desc = describeRanking(source, options);
  return boardWrap(f, options.title ?? [title, source.category].filter(Boolean).join(": "), desc, body, "ranking");
}

interface Metrics {
  /** The height the type is sized by: the row's, or less where the row is short and wide in proportion. */
  he: number;
  rs: number; rankW: number; ms: number; moveW: number; d: number; markW: number; ps: number; pointsW: number; ns: number; ss: number; cs: number; codeW: number; pad: number;
  /** The widest name at the compact size, for the column the club sits after. */
  nameCol: number;
}

/**
 * The widths of the columns a class of rows shares, so that the ranks, arrows, flags and points line up down the list. Where the row is narrow for them the type steps down until the
 * name has room, and the code (which only repeats the flag) goes first.
 */
function metrics(f: BoardFrame, rows: readonly Row[], h: number, big: boolean, movement: string, marksAny: boolean, rowW: number): Metrics {
  const v = f.v;
  const he = Math.min(h, rowW / (big ? 4.4 : 7.2));
  const showMove = movement !== "none" && rows.some((r) => r.change !== undefined);
  const moveText = (r: Row): string => (r.change === "new" ? v.words.rankNew : typeof r.change === "number" && r.change !== 0 ? v.number(Math.abs(r.change)) : "");
  const longest = Math.max(0, ...rows.map((r) => bw(r.name, he * (big ? 0.34 : 0.4) * 0.62)));
  const need = Math.min(rowW * 0.42, longest);
  let m!: Metrics;
  for (const sc of [1, 0.92, 0.84, 0.76, 0.68, 0.6, 0.52]) {
    const e = he * sc;
    const pad = e * 0.2;
    const rs = e * (big ? 0.56 : 0.5);
    const rankW = Math.max(e * 0.7, ...rows.map((r) => bw(r.rankText, rs))) + e * 0.2;
    const ms = e * (big ? 0.26 : 0.3);
    const moveW = showMove ? Math.max(ms * 1.4, ...rows.map((r) => (r.change === "new" ? bw(moveText(r), ms * 0.9) + ms * 0.9 : r.change === undefined ? 0 : ms * 1.1 + ms * 0.35 + bw(moveText(r), ms)))) + e * 0.16 : 0;
    const d = e * (big ? 0.52 : 0.6);
    const markW = marksAny ? d + e * 0.2 : 0;
    const ps = e * 0.4;
    const pointsRaw = Math.max(0, ...rows.map((r) => (r.points ? bw(r.points, ps) : 0)));
    const bigLabel = big && pointsRaw > 0 ? bw(v.upper(v.words.rankPoints), Math.max(ps * 0.3, 10)) : 0;
    const suffixW = !big && pointsRaw > 0 ? bw(v.words.rankPointsShort, Math.max(ps * 0.5, 10)) + ps * 0.3 : 0;
    const pointsW = Math.max(pointsRaw + suffixW, bigLabel);
    const cs = e * 0.3;
    const codeW = !big && rows.some((r) => r.code) ? Math.max(...rows.map((r) => bw(r.code, cs))) + e * 0.2 : 0;
    const ns = e * (big ? 0.34 : 0.4);
    const ss = e * (big ? 0.19 : 0.26);
    const fixed = pad * 2 + rankW + moveW + markW + pointsW + (big ? pad * 1.8 : pad * 0.8);
    const nameCol = Math.min(Math.max(0, ...rows.map((r) => bw(r.name, ns))) + pad, rowW);
    m = { he: e, rs, rankW, ms, moveW, d, markW, ps, pointsW, ns, ss, cs, codeW: 0, pad, nameCol };
    if (rowW - fixed >= need) {
      if (rowW - fixed - codeW >= need * 1.3) m.codeW = codeW;
      break;
    }
  }
  return m;
}

function drawRow(out: string[], f: BoardFrame, r: R, row: Row, m: Metrics, big: boolean, movement: string): void {
  const { v } = f;
  const w = v.words;
  const g: string[] = [];
  const tint = row.medal ? `rk-medal${row.medal}` : "";
  const mv = typeof row.change === "number" && row.change !== 0 ? (row.change > 0 ? "up" : "down") : "";
  const tintMove = (movement === "row" || movement === "both") && mv && !row.medal ? `rk-m${mv}` : "";
  const rx = Math.min(r.h * 0.18, 18);
  g.push(`<rect class="${["rk-row", tint, tintMove].filter(Boolean).join(" ")}" x="${num(r.x)}" y="${num(r.y)}" width="${num(r.w)}" height="${num(r.h)}" rx="${num(rx)}"${row.medal ? ` fill="url(#${f.scope}-g${row.medal})"` : ""}/>`);
  const cy = r.y + r.h / 2;
  let x = r.x + m.pad;
  const right = r.x + r.w - m.pad;
  // The rank.
  const rankCls = row.medal ? `rk-num${row.medal}` : "rk-ink";
  g.push(label(x + (m.rankW - m.pad * 0.2) / 2, cy + m.rs * 0.36, m.rs, row.rankText, rankCls, "middle", 800));
  x += m.rankW;
  // The movement: an arrow and the number of places, or NR.
  if (m.moveW > 0) {
    if (row.change === "new") {
      const p = pill(x, cy, m.ms * 1.35, w.rankNew, m.moveW, "rk-nr", "rk-nrink");
      g.push(p.svg);
    } else if (mv && (movement === "arrow" || movement === "both" || movement === "row")) {
      const n = v.number(Math.abs(row.change as number));
      if (movement !== "row") {
        g.push(arrow(x + m.ms * 0.55, cy, m.ms * 0.85, mv === "up"));
        g.push(label(x + m.ms * 1.1 + m.ms * 0.3, cy + m.ms * 0.36, m.ms, n, mv === "up" ? "rk-up" : "rk-down", "start", 800));
      } else {
        g.push(label(x, cy + m.ms * 0.36, m.ms, `${mv === "up" ? "+" : "−"}${n}`, mv === "up" ? "rk-up" : "rk-down", "start", 800));
      }
    } else if (row.change === 0) {
      g.push(label(x + m.ms * 0.55, cy + m.ms * 0.36, m.ms, "–", "rk-sub", "middle", 800));
    }
    x += m.moveW;
  }
  // The flag, a mark, or initials.
  if (m.markW > 0) {
    g.push(drawMark(row.team, x + m.d / 2, cy, m.d, f.ctx));
    x += m.markW;
  }
  // The points, at the right.
  let nameRight = right;
  if (m.pointsW > 0 && row.points) {
    if (big) {
      const sepX = right - m.pointsW - m.pad * 0.9;
      g.push(`<line class="rk-sep" x1="${num(sepX)}" x2="${num(sepX)}" y1="${num(r.y + r.h * 0.2)}" y2="${num(r.y + r.h * 0.8)}"/>`);
      const ps = fitSize(row.points, m.ps, m.pointsW, 0.5);
      const ls = Math.max(m.ps * 0.3, 10);
      g.push(label(right - m.pointsW / 2, cy + ps * 0.2, ps, row.points, "rk-ink", "middle", 800));
      g.push(label(right - m.pointsW / 2, cy + ps * 0.2 + ls * 1.6, ls, fit(v.upper(w.rankPoints), ls, m.pointsW, bw), "rk-sub", "middle", 700, ' letter-spacing=".12em"'));
      nameRight = sepX - m.pad * 0.9;
    } else {
      const suffix = w.rankPointsShort;
      const sz = Math.max(m.ps * 0.5, 10);
      const sw = bw(suffix, sz);
      g.push(label(right, cy + sz * 0.36, sz, suffix, "rk-sub", "end", 700));
      g.push(label(right - sw - m.ps * 0.3, cy + m.ps * 0.36, m.ps, row.points, "rk-ink", "end", 800));
      nameRight = right - m.pointsW - m.pad * 0.8;
    }
  } else if (m.pointsW > 0) {
    nameRight = right - m.pointsW - m.pad * 0.8;
  }
  // The code, then the name and what goes under or beside it.
  let codeX = nameRight;
  if (m.codeW > 0 && !big) {
    codeX = nameRight - m.codeW;
    if (row.code) g.push(label(codeX + m.codeW, cy + m.cs * 0.36, m.cs, row.code, "rk-sub", "end", 700));
    nameRight = codeX - m.pad * 0.3;
  }
  const avail = Math.max(m.ns, nameRight - x);
  const twoLine = big || m.he >= 42;
  if (twoLine && row.second) {
    const ns = fitSize(row.name, m.ns, avail, 0.5);
    const ss = fitSize(row.second, m.ss, avail, 0.6);
    const block = ns * 1.05 + ss * 1.3;
    const top = cy - block / 2;
    g.push(label(x, top + ns * 0.86, ns, fit(row.name, ns, avail + 1, bw), "rk-ink", "start", 800));
    g.push(label(x, top + ns * 1.05 + ss * 1.05, ss, fit(row.second, ss, avail + 1, bw), "rk-sub", "start", 600));
  } else {
    const club = row.second;
    const nameAvail0 = Math.min(avail, m.nameCol + m.pad);
    const clubW = club && avail - nameAvail0 > m.he * 3 ? avail - nameAvail0 : 0;
    const nameAvail = clubW ? nameAvail0 : avail;
    const ns = fitSize(row.name, m.ns, nameAvail, 0.55);
    g.push(label(x, cy + ns * 0.36, ns, fit(row.name, ns, nameAvail + 1, bw), "rk-ink", "start", 800));
    if (clubW) {
      const ss = m.ss * 1.05;
      g.push(label(x + nameAvail, cy + ss * 0.36, ss, fit(club, ss, clubW + 1, bw), "rk-sub", "start", 600));
    }
  }
  out.push(`<g class="rk-entry">${g.join("")}</g>`);
}
