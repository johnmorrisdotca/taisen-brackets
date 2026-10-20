/**
 * Two more drawings from a ranking's data. `rankingNumberOnes`: the number one of each category (each weight class, each age group) as a card, in a grid: name, club or country, flag,
 * points and "#1 in -57 kg", no photo. `rankingEntryList`: an event's entry list, in the order of the draw, with each athlete's ranking beside the name (the seeding view).
 * Static SVG for a given state, like every drawing here.
 */
import { boardFrame, boardWrap, bw, clampN, fitSize, heading, label, pill, type BoardFrame, type BoardOptions } from "./rank-kit.ts";
import { inkOn } from "./judo-sheets.ts";
import { fill, voiceOf } from "./locales.ts";
import { drawMark } from "./marks.ts";
import { abbreviate, esc, fit, num } from "./text.ts";
import { nameText, pointsText, teamFor, type R, type RankingEntry, type RankingOptions } from "./ranking.ts";

type Shared = Pick<RankingOptions, "nameStyle" | "precision">;

function checkEntry(e: RankingEntry | undefined, where: string): void {
  const n = e?.name;
  const ok = typeof n === "string" ? n.trim() !== "" : !!n && typeof n === "object" && typeof n.surname === "string" && n.surname.trim() !== "";
  if (!ok) throw new RangeError(`taisen-brackets: ${where} needs a name`);
  if (e!.rank !== undefined && !(Number.isInteger(e!.rank) && e!.rank >= 1)) throw new RangeError(`taisen-brackets: the ranking of ${nameOf(e!)} is a whole number from 1`);
}
const nameOf = (e: RankingEntry): string => (typeof e.name === "string" ? e.name : e.name.surname);

// ------------------------------------------------------------------------------------------------ number ones

/** A category and its number one. */
export interface RankingCard {
  /** The category as it is written ("-57 kg", "U18 · Men -60 kg"; `rankingCategoryLabel` writes one). */
  category: string;
  entry: RankingEntry;
}

export interface NumberOnesSource {
  /** The heading. Default: the language's "Number ones". */
  title?: string;
  /** The date or period, at the right of the heading. */
  date?: string;
  /** Where the list comes from, small at the foot. */
  source?: string;
  cards: readonly RankingCard[];
}

export interface NumberOnesOptions extends BoardOptions, Shared {
  /** Columns of cards, 1 to 4. Default: the number that makes the cards biggest. */
  columns?: number;
  /** The colour of each card's number panel, hex codes, taken in turn. The number is white or near-black, whichever reads on the colour. Default `NUMBER_ONE_COLORS`. */
  colors?: readonly string[];
}

/** Orange, crimson, blue, teal, purple and amber, each dark enough for white type (4.5 to 1 or better). */
export const NUMBER_ONE_COLORS: readonly string[] = Object.freeze(["#c2410c", "#be123c", "#1d4ed8", "#0f766e", "#6d28d9", "#a16207"]);
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** The cards as a sentence, the drawing's description. */
export function describeNumberOnes(source: NumberOnesSource, options: Pick<NumberOnesOptions, "locale" | "words" | "nameStyle" | "precision"> = {}): string {
  const v = voiceOf(options);
  const w = v.words;
  const parts = [source.title ?? w.rankNumberOnes];
  if (source.date) parts.push(source.date);
  for (const c of source.cards) {
    const bits = [fill(w.rankNumberOneIn, { category: c.category }), nameText(c.entry.name, options.nameStyle ?? "surname-first", v)];
    const detail = c.entry.club ?? c.entry.country;
    if (detail) bits.push(detail);
    const p = pointsText(c.entry.points, options.precision, v);
    if (p) bits.push(`${p} ${w.rankPoints}`);
    parts.push(bits.join(w.rankJoin));
  }
  return parts.join(w.sep) + w.end;
}

/**
 * The number ones as cards in a grid: a coloured panel with the 1, the flag, the name and the club or country, the points and a pill that says "#1 in -57 kg". Throws a `RangeError` for
 * no cards, a card with no category, an entry with no name, a colour that is not a hex code, columns that are not 1 to 4, or a bad size or theme.
 */
export function rankingNumberOnes(source: NumberOnesSource, options: NumberOnesOptions = {}): string {
  if (!source || !Array.isArray(source.cards) || source.cards.length === 0) throw new RangeError("taisen-brackets: the number ones need at least one card");
  source.cards.forEach((c, i) => {
    if (typeof c?.category !== "string" || c.category.trim() === "") throw new RangeError(`taisen-brackets: card ${i + 1} needs a category`);
    checkEntry(c.entry, `the entry of card ${i + 1}`);
  });
  if (options.columns !== undefined && !(Number.isInteger(options.columns) && options.columns >= 1 && options.columns <= 4)) throw new RangeError("taisen-brackets: columns is a whole number from 1 to 4");
  const colors = options.colors ?? NUMBER_ONE_COLORS;
  if (colors.length === 0 || colors.some((c) => !HEX.test(c))) throw new RangeError("taisen-brackets: colors are hex codes such as #c2410c");
  const f = boardFrame(options, [source, options.columns, options.nameStyle, options.precision, colors]);
  const { W, H, v } = f;
  const w = v.words;
  const unit = Math.min(W, H);
  const pad = Math.round(unit * 0.035);
  const body: string[] = [];
  const header = heading(f, source.title ?? w.rankNumberOnes, undefined, source.date, pad, Math.min(W - pad * 2, unit * 1.45), source.source);
  body.push(...header.svg);
  const boxW = header.boxW, bx = header.bx;
  const n = source.cards.length;
  const gap = Math.round(unit * 0.02);
  const avail = header.bottom - header.top;
  const nameStyle = options.nameStyle ?? "surname-first";
  const texts = source.cards.map((c) => ({ name: nameText(c.entry.name, nameStyle, v), points: pointsText(c.entry.points, options.precision, v), pill: fill(w.rankNumberOneIn, { category: c.category }) }));
  // How many columns: the one that lets the longest name be set biggest (cards must be at least 3.4 times as wide as high, so the type has room).
  let best = { c: 1, ch: 0, cw: 0, size: -1 };
  for (let c = options.columns ?? 1; c <= (options.columns ?? Math.min(4, n)); c++) {
    const rows = Math.ceil(n / c);
    const cw = (boxW - (c - 1) * gap) / c;
    const ch = Math.min((avail - (rows - 1) * gap) / rows, cw / 3.4, unit * 0.24);
    const size = cardType(cw, ch, texts).name;
    if (size > best.size + 0.5 || (Math.abs(size - best.size) <= 0.5 && ch > best.ch)) best = { c, ch, cw, size };
  }
  const { c: cols, ch, cw } = best;
  const top = header.top;
  const m = cardType(cw, ch, texts);
  source.cards.forEach((card, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const r: R = { x: bx + col * (cw + gap), y: top + row * (ch + gap), w: cw, h: ch };
    body.push(drawCard(f, r, card, colors[i % colors.length], nameStyle, options.precision, i, m));
  });
  return boardWrap(f, options.title ?? (source.title ?? w.rankNumberOnes), describeNumberOnes(source, options), body, "number-ones");
}

/** The sizes of a card's parts for a card `cw` by `ch`: shared by every card of a drawing so that they line up, and used to choose the columns. */
interface CardType { he: number; pw: number; pad: number; d: number; ps: number; pillH: number; rightW: number; nameAvail: number; name: number; sub: number }
function cardType(cw: number, ch: number, texts: readonly { name: string; points: string; pill: string }[]): CardType {
  const he = Math.min(ch, cw / 3.4);
  const pad = he * 0.14;
  const pw = he * 0.62;
  const d = he * 0.38;
  const ps = he * 0.22;
  const pillH = he * 0.15;
  const rightW = Math.max(...texts.map((t) => Math.max(bw(t.points, ps), bw(t.pill, pillH * 0.56) + pillH * 0.7)));
  const nameAvail = cw - pw - pad * 2.4 - d - pad - rightW - pad;
  const longest = Math.max(...texts.map((t) => bw(t.name, 1)));
  const name = Math.max(1, Math.min(he * 0.24, nameAvail / longest));
  return { he, pw, pad, d, ps, pillH, rightW, nameAvail, name, sub: Math.min(he * 0.14, name * 0.62) };
}

function drawCard(f: BoardFrame, r: R, card: RankingCard, color: string, nameStyle: NonNullable<RankingOptions["nameStyle"]>, precision: number | undefined, i: number, m: CardType): string {
  const { v } = f;
  const w = v.words;
  const g: string[] = [];
  const e = card.entry;
  const name = nameText(e.name, nameStyle, v);
  const second = e.club ?? e.country ?? "";
  const points = pointsText(e.points, precision, v);
  const rx = Math.min(r.h * 0.12, 22);
  g.push(`<rect class="rk-row" x="${num(r.x)}" y="${num(r.y)}" width="${num(r.w)}" height="${num(r.h)}" rx="${num(rx)}"/>`);
  // The number panel: rounded on the left, square on the right.
  const ink = inkOn(color) === "#ffffff" ? "rk-onaccent" : "rk-onaccent-dark";
  g.push(`<rect x="${num(r.x)}" y="${num(r.y)}" width="${num(m.pw)}" height="${num(r.h)}" rx="${num(rx)}" style="fill:${esc(color)}"/>`);
  g.push(`<rect x="${num(r.x + m.pw - rx)}" y="${num(r.y)}" width="${num(rx)}" height="${num(r.h)}" style="fill:${esc(color)}"/>`);
  const ns1 = m.he * 0.5;
  g.push(label(r.x + m.pw / 2, r.y + r.h / 2 + ns1 * 0.36, ns1, v.number(1), ink, "middle", 800));
  let x = r.x + m.pw + m.pad * 1.2;
  const right = r.x + r.w - m.pad * 1.2;
  // Points and the pill, at the right.
  const pillText = fill(w.rankNumberOneIn, { category: card.category });
  const stackH = (points ? m.ps * 1.1 : 0) + m.pillH;
  let y = r.y + (r.h - stackH) / 2;
  if (points) {
    g.push(label(right - m.rightW / 2, y + m.ps * 0.82, m.ps, points, "rk-ink", "middle", 800));
    y += m.ps * 1.1;
  }
  g.push(pill(right, y + m.pillH / 2, m.pillH, pillText, m.rightW, "rk-pill", "rk-pillink", "end").svg);
  // The flag and the name.
  if (e.flag || e.mark) {
    g.push(drawMark(teamFor(e, `c${i}`, name, abbreviate(e.club ?? name)), x + m.d / 2, r.y + r.h / 2, m.d, f.ctx));
    x += m.d + m.pad;
  }
  const avail = right - m.rightW - m.pad - x;
  const ns = Math.min(m.name, fitSize(name, m.name, avail, 0.9));
  if (second) {
    const ss = Math.min(m.sub, fitSize(second, m.sub, avail, 0.9));
    const block = ns * 1.05 + ss * 1.4;
    const top = r.y + r.h / 2 - block / 2;
    g.push(label(x, top + ns * 0.86, ns, fit(name, ns, avail + 1, bw), "rk-ink", "start", 800));
    g.push(label(x, top + ns * 1.05 + ss * 1.1, ss, fit(second, ss, avail + 1, bw), "rk-sub", "start", 600));
  } else g.push(label(x, r.y + r.h / 2 + ns * 0.36, ns, fit(name, ns, avail + 1, bw), "rk-ink", "start", 800));
  return `<g class="rk-card">${g.join("")}</g>`;
}

// ------------------------------------------------------------------------------------------------ the entry list

export interface EntryListSource {
  /** The heading. Default: the language's "Entry list". */
  title?: string;
  /** The category as a pill under the heading. */
  category?: string;
  /** The event or the date, at the right of the heading. */
  date?: string;
  /** Where the list comes from, small at the foot. */
  source?: string;
  /** The athletes in the order of the draw. An entry's `rank` is its ranking (none: not ranked, written `NR`); `points` are optional. */
  entries: readonly RankingEntry[];
}

export interface EntryListOptions extends BoardOptions, Shared {
  /** `entry` (the default) keeps the order given; `ranking` puts the best ranked first and the unranked last. */
  sort?: "entry" | "ranking";
  /** Number the rows 1, 2, 3 in the order drawn. Default true. */
  numbers?: boolean;
  /** Columns of rows, 1 to 3. Default: as many as the size needs to keep the rows readable. */
  columns?: number;
  /** The most entries drawn, from the first of the page, and which page (0 is the first). Default: as many as fit at a readable size. */
  rows?: number;
  page?: number;
  /** Draw a club's (or the athlete's) initials on a badge for an entry with no flag or mark, even where none has one. */
  badge?: boolean;
}

/** The entry list as a sentence, the drawing's description. */
export function describeEntryList(source: EntryListSource, options: Pick<EntryListOptions, "locale" | "words" | "nameStyle" | "sort" | "precision"> = {}): string {
  const v = voiceOf(options);
  const w = v.words;
  const parts = [source.title ?? w.rankEntryTitle];
  if (source.category) parts.push(source.category);
  if (source.date) parts.push(source.date);
  const list = entryOrder(source, options.sort);
  list.forEach((e, i) => {
    const bits = [v.number(i + 1), nameText(e.name, options.nameStyle ?? "surname-first", v)];
    const detail = e.club ?? e.country;
    if (detail) bits.push(detail);
    bits.push(e.rank === undefined ? w.rankUnranked : `${w.rankColRanking} ${v.number(e.rank)}`);
    parts.push(bits.join(w.rankJoin));
  });
  return parts.join(w.sep) + w.end;
}

const entryOrder = (source: EntryListSource, sort: EntryListOptions["sort"]): RankingEntry[] =>
  sort === "ranking" ? source.entries.map((e, i) => ({ e, i })).sort((a, b) => (a.e.rank ?? Infinity) - (b.e.rank ?? Infinity) || a.i - b.i).map((x) => x.e) : [...source.entries];

/**
 * An event's entry list: a numbered row for each athlete in the order of the draw, with the flag, the name and club, the country's letters and the athlete's ranking (`NR` for none) at the right. Throws a
 * `RangeError` for an entry with no name, a ranking that is not a whole number from 1, an unknown option value or a bad size or theme.
 */
export function rankingEntryList(source: EntryListSource, options: EntryListOptions = {}): string {
  if (!source || !Array.isArray(source.entries)) throw new RangeError("taisen-brackets: an entry list needs a list of entries");
  source.entries.forEach((e, i) => checkEntry(e, `entry ${i + 1} of the entry list`));
  if (options.sort !== undefined && options.sort !== "entry" && options.sort !== "ranking") throw new RangeError(`taisen-brackets: sort is "entry" or "ranking", not ${JSON.stringify(options.sort)}`);
  if (options.columns !== undefined && !(Number.isInteger(options.columns) && options.columns >= 1 && options.columns <= 3)) throw new RangeError("taisen-brackets: columns is a whole number from 1 to 3");
  if (options.rows !== undefined && !(Number.isInteger(options.rows) && options.rows >= 1 && options.rows <= 200)) throw new RangeError("taisen-brackets: rows is a whole number from 1 to 200");
  if (options.page !== undefined && !(Number.isInteger(options.page) && options.page >= 0)) throw new RangeError("taisen-brackets: page is a whole number from 0");
  const f = boardFrame(options, [source, options.sort, options.numbers, options.columns, options.rows, options.page, options.nameStyle, options.precision, options.badge]);
  const { W, H, v } = f;
  const w = v.words;
  const unit = Math.min(W, H);
  const pad = Math.round(unit * 0.035);
  const nameStyle = options.nameStyle ?? "surname-first";
  const all = entryOrder(source, options.sort);
  const body: string[] = [];
  const title = source.title ?? w.rankEntryTitle;
  const header = heading(f, title, source.category, source.date, pad, W - pad * 2, source.source);
  body.push(...header.svg);
  const { bx, boxW } = header;
  const avail = header.bottom - header.top - unit * 0.04;
  const minRow = Math.max(28, unit * 0.034);
  const gap = 0.12;
  const colGap = pad;
  // Columns: the fewest that fit every entry at a readable row height, within what the width allows.
  const maxCols = Math.max(1, Math.min(3, Math.floor(boxW / (unit * 0.55))));
  let cols = options.columns ?? 1;
  // A wide board takes two columns so that a row is not a long way from its number to its ranking; a short list stays in one.
  if (options.columns === undefined) {
    cols = Math.min(maxCols, Math.ceil(boxW / (unit * 1.25)), Math.max(1, Math.ceil(all.length / 6)));
    while (cols < maxCols && Math.ceil(all.length / cols) * minRow * (1 + gap) > avail) cols += 1;
  }
  const perCol = Math.max(1, Math.floor(avail / (minRow * (1 + gap))));
  const page = options.page ?? 0;
  const per = options.rows ?? perCol * cols;
  const from = Math.min(page * per, Math.max(0, all.length - 1));
  const slice = all.slice(from, from + per);
  const rpc = Math.ceil(slice.length / cols);
  const h = Math.min(unit * 0.085, avail / (Math.max(1, rpc) * (1 + gap)));
  const colW = (boxW - (cols - 1) * colGap) / cols;
  const marksAny = options.badge === true || slice.some((e) => e.flag || e.mark);
  const numbers = options.numbers ?? true;
  const he = Math.min(h, colW / 8);
  const cs = he * 0.3;
  const hasCode = slice.some((e) => e.code);
  const hasPoints = slice.some((e) => e.points !== undefined);
  const rs = he * 0.46;
  const rankTexts = slice.map((e) => (e.rank === undefined ? w.rankUnranked : v.number(e.rank)));
  const rankW = Math.max(bw(w.rankColRanking, cs * 0.85) , ...rankTexts.map((t) => bw(t, rs))) + he * 0.2;
  const ptsS = he * 0.3;
  const ptsTexts = slice.map((e) => pointsText(e.points, options.precision, v));
  const ptsW = hasPoints ? Math.max(...ptsTexts.map((t) => bw(t, ptsS))) + he * 0.3 : 0;
  const codeW = hasCode ? Math.max(...slice.map((e) => bw(e.code ?? "", cs))) + he * 0.2 : 0;
  const numW = numbers ? Math.max(he * 0.7, bw(v.number(from + slice.length), he * 0.36)) : 0;
  const d = he * 0.58;
  const rowPad = he * 0.2;
  // The column heading over the ranking.
  const hs = clampN(cs * 0.85, 10, 40);
  for (let c = 0; c < cols; c++) {
    const x1 = bx + c * (colW + colGap) + colW - rowPad;
    body.push(label(x1 - (rankW - he * 0.2) / 2, header.top + hs * 0.8, hs, fit(v.upper(w.rankColRanking), hs, rankW + he * 0.4, bw), "rk-sub", "middle", 700, ' letter-spacing=".08em"'));
  }
  const top = header.top + hs * 1.6;
  const rowH = Math.min(h, (avail - hs * 1.6) / (Math.max(1, rpc) * (1 + gap)));
  slice.forEach((e, i) => {
    const col = Math.floor(i / rpc), idx = i % rpc;
    const r: R = { x: bx + col * (colW + colGap), y: top + idx * rowH * (1 + gap), w: colW, h: rowH };
    const g: string[] = [];
    const name = nameText(e.name, nameStyle, v);
    g.push(`<rect class="rk-row" x="${num(r.x)}" y="${num(r.y)}" width="${num(r.w)}" height="${num(r.h)}" rx="${num(Math.min(r.h * 0.18, 16))}"/>`);
    const cy = r.y + r.h / 2;
    let x = r.x + rowPad;
    const right = r.x + r.w - rowPad;
    if (numbers) { g.push(label(x + numW / 2, cy + he * 0.36 * 0.36, he * 0.36, v.number(from + i + 1), "rk-sub", "middle", 700)); x += numW; }
    if (marksAny) { g.push(drawMark(teamFor(e, `e${from + i}`, name, abbreviate(e.club ?? name).slice(0, 3)), x + d / 2, cy, d, f.ctx)); x += d + rowPad; }
    // The ranking, big, at the right; the code and the points before it. They are written after the name, so that the markup reads in the order the row does.
    const rt = rankTexts[i];
    const tail: { code?: string; points?: string; rank: string } = { rank: label(right - (rankW - he * 0.2) / 2, cy + rs * 0.36, fitSize(rt, rs, rankW - he * 0.2, 0.6), rt, e.rank === undefined ? "rk-sub" : "rk-ink", "middle", 800) };
    let nr = right - rankW;
    if (hasPoints) {
      if (ptsTexts[i]) tail.points = label(nr, cy + ptsS * 0.36, ptsS, ptsTexts[i], "rk-sub", "end", 700);
      nr -= ptsW;
    }
    if (hasCode) {
      if (e.code) tail.code = label(nr, cy + cs * 0.36, cs, e.code, "rk-sub", "end", 700);
      nr -= codeW;
    }
    const nameAvail = Math.max(he, nr - x - rowPad * 0.5);
    const second = e.club ?? e.country ?? "";
    const twoLine = second !== "" && he >= 40;
    const ns = fitSize(name, he * (twoLine ? 0.34 : 0.38), nameAvail, 0.55);
    if (twoLine) {
      const ss = he * 0.22;
      const block = ns * 1.05 + ss * 1.3;
      const t = cy - block / 2;
      g.push(label(x, t + ns * 0.86, ns, fit(name, ns, nameAvail + 1, bw), "rk-ink", "start", 800));
      g.push(label(x, t + ns * 1.05 + ss * 1.05, fitSize(second, ss, nameAvail, 0.7), fit(second, fitSize(second, ss, nameAvail, 0.7), nameAvail + 1, bw), "rk-sub", "start", 600));
    } else g.push(label(x, cy + ns * 0.36, ns, fit(name, ns, nameAvail + 1, bw), "rk-ink", "start", 800));
    g.push(...[tail.code, tail.points, tail.rank].filter((t): t is string => !!t));
    body.push(`<g class="rk-entry">${g.join("")}</g>`);
  });
  if (options.rows !== undefined || slice.length < all.length) {
    const t = fill(w.rankRange, { a: v.number(from + 1), b: v.number(from + slice.length), n: v.number(all.length) });
    if (slice.length < all.length) body.push(label(bx + boxW, header.top - pad * 0.15, hs, fit(t, hs, boxW * 0.35, bw), "rk-sub", "end", 700));
  }
  return boardWrap(f, options.title ?? [title, source.category].filter(Boolean).join(": "), describeEntryList(source, options), body, "entry-list");
}
