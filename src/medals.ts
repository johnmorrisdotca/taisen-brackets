/**
 * A medal table for any sport and event (an Olympic Games, a world championship, a club tournament): the rows ranked by gold first (as the Olympic table is) or by the total, equal rows
 * sharing a rank (5, 5, 7), a flag or a badge for each country or team, the three kinds of medal and the total. `tallyMedals` adds up a list of medals, filtered to one sport, one weight class or
 * one Games, so that the same data draws the table of an event, of a sport or of all time. Static SVG for a given state, like every drawing here.
 */
import { boardFrame, boardWrap, bw, clampN, fitSize, heading, label, type BoardFrame, type BoardOptions } from "./rank-kit.ts";
import { fill, voiceOf } from "./locales.ts";
import { drawMark } from "./marks.ts";
import { abbreviate, fit, num } from "./text.ts";
import type { R } from "./ranking.ts";
import type { Team } from "./types.ts";

/** One row of a medal table: a country or a team and its medals. Only `name` is needed. */
export interface MedalRow {
  /** The country's or team's name as it is to be written ("France", "Soviet Union", "Unified Team"). */
  name: string;
  /** A code for the `flags` function (`FR`, `CA-BC`); a country that has no flag in it (a former one, a team) is drawn as a badge with `code` or the initials. */
  flag?: string;
  /** A mark of your own (an image address or inline SVG) in place of a flag. */
  mark?: string;
  /** The country's three letters, for the badge of a row with no flag. */
  code?: string;
  gold?: number;
  silver?: number;
  bronze?: number;
  /** A small line under the name: the years a former country existed ("1922–1991"), or what a team is. */
  note?: string;
}

export interface MedalTableSource {
  /** The heading. Default: the language's "Medal table". */
  title?: string;
  /** The sport, event or Games as a pill under the heading ("Men's judo +100 kg"). */
  subtitle?: string;
  /** The date or the edition, at the right of the heading. */
  date?: string;
  /** Where the numbers come from, small at the foot. */
  source?: string;
  rows: readonly MedalRow[];
}

export interface MedalTableOptions extends BoardOptions {
  /** `gold` (the default): by gold, then silver, then bronze, as the Olympic Games rank. `total`: by the total of medals, then gold, then silver. `given`: the order given, ranked by the same rule as `gold`. */
  sort?: "gold" | "total" | "given";
  /** Equal rows share a rank (`1, 2, 2, 4`). Default true; false numbers every row. */
  ties?: boolean;
  /** `plain` (`10`, the default) or `hash` (`#10`). */
  rankStyle?: "plain" | "hash";
  /** Only the first N rows, after sorting. */
  top?: number;
  /** The most rows drawn, from the first of the page, and which page (0 is the first). Default: as many as fit at a readable size. */
  rows?: number;
  page?: number;
  /** One column or two (the first column runs down before the second starts). Default 1, and 2 on a wide board with more than 10 rows. */
  columns?: 1 | 2;
  /** Mark the first three ranks with a bar in gold, silver and bronze. Default true. */
  highlight?: boolean;
  /** Hide the rows with no medal at all. Default false. */
  skipEmpty?: boolean;
}

/** A medal won: who won it and what kind, with whatever you filter on. */
export interface MedalAward {
  name: string;
  flag?: string;
  mark?: string;
  code?: string;
  note?: string;
  medal: "gold" | "silver" | "bronze";
  /** What the medal was won in, for the filter: a sport, a weight class or category, a Games or a year. Any of them can be left out of a filter. */
  sport?: string;
  category?: string;
  games?: string | number;
}

/** What `tallyMedals` keeps: awards equal to every field given. A value can be a list (any of them). */
export interface MedalFilter {
  sport?: string | readonly string[];
  category?: string | readonly string[];
  games?: string | number | readonly (string | number)[];
}

const KINDS = ["gold", "silver", "bronze"] as const;
const count = (n: number | undefined): number => n ?? 0;
const totalOf = (r: MedalRow): number => count(r.gold) + count(r.silver) + count(r.bronze);
const matches = (value: string | number | undefined, want: unknown): boolean => want === undefined || (Array.isArray(want) ? want.includes(value) : want === value);

/**
 * Adds up a list of medals into the rows of a table, one row for each name, keeping the first flag, mark, code and note given for it. `filter` keeps only the medals of one sport, one category or
 * one Games (or a list of them): the same list gives the table of an event, of a sport and of all time. Throws a `RangeError` for a medal that is not gold, silver or bronze or has no name.
 */
export function tallyMedals(awards: readonly MedalAward[], filter: MedalFilter = {}): MedalRow[] {
  const rows = new Map<string, MedalRow>();
  awards.forEach((a, i) => {
    if (typeof a?.name !== "string" || a.name.trim() === "") throw new RangeError(`taisen-brackets: medal ${i + 1} needs a name`);
    if (!KINDS.includes(a.medal)) throw new RangeError(`taisen-brackets: medal ${i + 1} is "gold", "silver" or "bronze", not ${JSON.stringify(a.medal)}`);
    if (!matches(a.sport, filter.sport) || !matches(a.category, filter.category) || !matches(a.games, filter.games)) return;
    let row = rows.get(a.name);
    if (!row) {
      row = { name: a.name, gold: 0, silver: 0, bronze: 0, ...(a.flag ? { flag: a.flag } : {}), ...(a.mark ? { mark: a.mark } : {}), ...(a.code ? { code: a.code } : {}), ...(a.note ? { note: a.note } : {}) };
      rows.set(a.name, row);
    }
    row[a.medal] = count(row[a.medal]) + 1;
  });
  return [...rows.values()];
}

/** The rows in the order they are drawn, with their ranks. */
function ordered(rows: readonly MedalRow[], sort: NonNullable<MedalTableOptions["sort"]>, ties: boolean): { row: MedalRow; rank: number }[] {
  const key = (r: MedalRow): number[] => (sort === "total" ? [totalOf(r), count(r.gold), count(r.silver)] : [count(r.gold), count(r.silver), count(r.bronze)]);
  const list = rows.map((row, i) => ({ row, i }));
  // `given` keeps the order, the others sort by the key, then by the order given.
  if (sort !== "given") list.sort((a, b) => { const x = key(a.row), y = key(b.row); for (let k = 0; k < x.length; k++) if (x[k] !== y[k]) return y[k] - x[k]; return a.i - b.i; });
  const same = (a: MedalRow, b: MedalRow): boolean => key(a).every((v, k) => v === key(b)[k]) && totalOf(a) === totalOf(b);
  const out: { row: MedalRow; rank: number }[] = [];
  list.forEach(({ row }, n) => {
    const prev = out[n - 1];
    out.push({ row, rank: ties && prev && same(prev.row, row) ? prev.rank : n + 1 });
  });
  return out;
}

/** The ranks of a list of rows, as `medalTable` draws them (`[1, 2, 2, 4]`), in the order they are drawn. */
export function medalRanks(rows: readonly MedalRow[], options: Pick<MedalTableOptions, "sort" | "ties"> = {}): number[] {
  return ordered(rows, options.sort ?? "gold", options.ties ?? true).map((x) => x.rank);
}

/** Checks a medal table's source and options (shared by the broadcast-style table). */
export function validateMedalSource(source: MedalTableSource, options: MedalTableOptions): void {
  if (!source || !Array.isArray(source.rows)) throw new RangeError("taisen-brackets: a medal table needs a list of rows");
  source.rows.forEach((r, i) => {
    if (typeof r?.name !== "string" || r.name.trim() === "") throw new RangeError(`taisen-brackets: row ${i + 1} of the medal table needs a name`);
    for (const k of KINDS) if (r[k] !== undefined && !(Number.isInteger(r[k]) && (r[k] as number) >= 0)) throw new RangeError(`taisen-brackets: the ${k} medals of ${r.name} are a whole number from 0, not ${JSON.stringify(r[k])}`);
  });
  const oneOf = (name: string, value: unknown, allowed: readonly unknown[]): void => {
    if (value !== undefined && !allowed.includes(value)) throw new RangeError(`taisen-brackets: ${name} is ${allowed.map((a) => JSON.stringify(a)).join(", ")}, not ${JSON.stringify(value)}`);
  };
  oneOf("sort", options.sort, ["gold", "total", "given"]);
  oneOf("rankStyle", options.rankStyle, ["plain", "hash"]);
  oneOf("columns", options.columns, [1, 2]);
  if (options.top !== undefined && !(Number.isInteger(options.top) && options.top >= 1)) throw new RangeError("taisen-brackets: top is a whole number from 1");
  if (options.rows !== undefined && !(Number.isInteger(options.rows) && options.rows >= 1 && options.rows <= 200)) throw new RangeError("taisen-brackets: rows is a whole number from 1 to 200");
  if (options.page !== undefined && !(Number.isInteger(options.page) && options.page >= 0)) throw new RangeError("taisen-brackets: page is a whole number from 0");
}

/** The rows that are drawn: sorted, ranked, with the empty ones and all but the top N left out when asked. */
export function chosenMedalRows(source: MedalTableSource, options: Pick<MedalTableOptions, "sort" | "ties" | "skipEmpty" | "top">): { row: MedalRow; rank: number }[] {
  let list = ordered(source.rows, options.sort ?? "gold", options.ties ?? true);
  if (options.skipEmpty) list = list.filter((x) => totalOf(x.row) > 0);
  return options.top ? list.slice(0, options.top) : list;
}

/** The table as a sentence, the drawing's description. */
export function describeMedalTable(source: MedalTableSource, options: Pick<MedalTableOptions, "locale" | "words" | "sort" | "ties" | "top" | "skipEmpty"> = {}): string {
  const v = voiceOf(options);
  const w = v.words;
  const parts = [source.title ?? w.medalTitle];
  if (source.subtitle) parts.push(source.subtitle);
  if (source.date) parts.push(source.date);
  const list = chosenMedalRows(source, options);
  if (list.length === 0) parts.push(w.medalNone);
  for (const { row, rank } of list) parts.push([fill(w.medalRank, { n: v.number(rank) }), row.name, fill(w.medalLine, { g: v.number(count(row.gold)), s: v.number(count(row.silver)), b: v.number(count(row.bronze)), t: v.number(totalOf(row)) })].join(w.rankJoin));
  return parts.join(w.sep) + w.end;
}

const teamFor = (r: MedalRow, id: string): Team => ({ id, name: r.name, abbr: (r.code ?? abbreviate(r.name)).slice(0, 3).toUpperCase(), ...(r.flag ? { flag: r.flag } : {}), ...(r.mark ? { mark: r.mark } : {}) });

/**
 * The medal table as an SVG. Throws a `RangeError` for a row with no name, a medal count that is not a whole number from 0, an option that is not one of its values, or a bad size or theme.
 */
export function medalTable(source: MedalTableSource, options: MedalTableOptions = {}): string {
  validateMedalSource(source, options);
  const f = boardFrame(options, [source, options.sort, options.ties, options.rankStyle, options.top, options.rows, options.page, options.columns, options.highlight, options.skipEmpty]);
  const { W, H, v } = f;
  const w = v.words;
  const unit = Math.min(W, H);
  const pad = Math.round(unit * 0.035);
  const all = chosenMedalRows(source, options);
  const columns = options.columns ?? (W / H >= 1.5 && all.length > 10 ? 2 : 1);
  const head = heading(f, source.title ?? w.medalTitle, source.subtitle, source.date, pad, columns === 2 ? W - pad * 2 : Math.min(W - pad * 2, unit * 1.3), source.source);
  const body: string[] = [...head.svg];
  const { bx, boxW } = head;
  const colGap = pad;
  const colW = (boxW - (columns - 1) * colGap) / columns;
  const hs = clampN(unit * 0.03, 12, 40);
  const headRowH = hs * 2.1;
  const avail = head.bottom - head.top - headRowH;
  const minRow = Math.max(28, unit * 0.04);
  const GAP = 0.1;
  const perCol = Math.max(1, Math.floor(avail / (minRow * (1 + GAP))));
  const page = options.page ?? 0;
  const per = options.rows ?? perCol * columns;
  const from = Math.min(page * per, Math.max(0, all.length - 1));
  const slice = all.slice(from, from + per);
  const rpc = Math.max(1, Math.ceil(slice.length / columns));
  const rowH = Math.min(unit * 0.085, avail / (rpc * (1 + GAP)));
  const he = Math.min(rowH, colW / 8);
  const digits = (n: number): string => v.number(n);
  const maxMedal = Math.max(1, ...slice.map((x) => Math.max(count(x.row.gold), count(x.row.silver), count(x.row.bronze))));
  const maxTotal = Math.max(1, ...slice.map((x) => totalOf(x.row)));
  const ns = he * 0.4;
  const cellW = Math.max(he * 0.95, bw(digits(maxMedal), ns) + he * 0.4);
  const totW = Math.max(he * 1.2, bw(digits(maxTotal), ns) + he * 0.5);
  const rankTexts = slice.map((x) => `${options.rankStyle === "hash" ? "#" : ""}${v.number(x.rank)}`);
  const rs = he * 0.42;
  const rankW = Math.max(he * 0.8, ...rankTexts.map((t) => bw(t, rs))) + he * 0.2;
  const d = he * 0.58;
  const rowPad = he * 0.2;
  const cellGap = he * 0.08;
  const highlight = options.highlight ?? true;
  for (let c = 0; c < columns; c++) {
    const x0 = bx + c * (colW + colGap);
    const right = x0 + colW - rowPad;
    const cy = head.top + headRowH / 2;
    // The heading over the columns: a disc for each medal, with its letter, and the total.
    const xs = columnX(right, totW, cellW, cellGap);
    KINDS.forEach((_, i) => {
      const r = Math.min(cellW, headRowH) * 0.4;
      const letter = [w.medalGoldShort, w.medalSilverShort, w.medalBronzeShort][i];
      body.push(`<g class="rk-medalhead"><title>${[w.medalGold, w.medalSilver, w.medalBronze][i]}</title><circle class="rk-disc${i + 1}" cx="${num(xs[i])}" cy="${num(cy)}" r="${num(r)}"/>${label(xs[i], cy + fitSize(letter, r * 1.1, r * 1.5, 0.6) * 0.36, fitSize(letter, r * 1.1, r * 1.5, 0.6), letter, "rk-onaccent-dark", "middle", 800)}</g>`);
    });
    const totalText = v.upper(w.medalTotal);
    const tz = fitSize(totalText, hs, totW + cellGap, 0.6);
    body.push(label(xs[3], cy + tz * 0.36, tz, fit(totalText, tz, totW + cellGap + 1, bw), "rk-sub", "middle", 700, ' letter-spacing=".06em"'));
  }
  slice.forEach(({ row, rank }, i) => {
    const col = Math.floor(i / rpc), idx = i % rpc;
    const r: R = { x: bx + col * (colW + colGap), y: head.top + headRowH + idx * rowH * (1 + GAP), w: colW, h: rowH };
    body.push(drawRow(f, r, row, rank, rankTexts[i], { he, ns, rs, rankW, d, rowPad, cellW, totW, cellGap, highlight }, from + i));
  });
  if (slice.length === 0) body.push(label(bx, head.top + hs * 3, hs * 1.2, w.medalNone, "rk-sub", "start", 700));
  if (slice.length < all.length) {
    const t = fill(w.rankRange, { a: v.number(from + 1), b: v.number(from + slice.length), n: v.number(all.length) });
    body.push(label(bx + boxW, head.top - pad * 0.15, hs, fit(t, hs, boxW * 0.35, bw), "rk-sub", "end", 700));
  }
  return boardWrap(f, options.title ?? [source.title ?? w.medalTitle, source.subtitle].filter(Boolean).join(": "), describeMedalTable(source, options), body, "medal-table");
}

/** The centres of the gold, silver and bronze columns and of the total's, counted from the right edge. */
function columnX(right: number, totW: number, cellW: number, gap: number): [number, number, number, number] {
  const t = right - totW / 2;
  const b = right - totW - gap - cellW / 2;
  const s = b - cellW - gap;
  const g = s - cellW - gap;
  return [g, s, b, t];
}

interface Sizes { he: number; ns: number; rs: number; rankW: number; d: number; rowPad: number; cellW: number; totW: number; cellGap: number; highlight: boolean }

function drawRow(f: BoardFrame, r: R, row: MedalRow, rank: number, rankText: string, z: Sizes, index: number): string {
  const { v } = f;
  const g: string[] = [];
  g.push(`<rect class="rk-row" x="${num(r.x)}" y="${num(r.y)}" width="${num(r.w)}" height="${num(r.h)}" rx="${num(Math.min(r.h * 0.18, 16))}"/>`);
  const cy = r.y + r.h / 2;
  if (z.highlight && rank <= 3) g.push(`<rect class="rk-bar${rank}" x="${num(r.x)}" y="${num(r.y + r.h * 0.18)}" width="${num(Math.max(4, r.h * 0.08))}" height="${num(r.h * 0.64)}" rx="2"/>`);
  let x = r.x + z.rowPad;
  g.push(label(x + (z.rankW - z.rowPad) / 2, cy + z.rs * 0.36, z.rs, rankText, rank <= 3 && z.highlight ? `rk-num${rank}` : "rk-ink", "middle", 800));
  x += z.rankW;
  g.push(drawMark(teamFor(row, `m${index}`), x + z.d / 2, cy, z.d, f.ctx));
  x += z.d + z.rowPad;
  const right = r.x + r.w - z.rowPad;
  const xs = columnX(right, z.totW, z.cellW, z.cellGap);
  const medals = [row.gold, row.silver, row.bronze].map(count);
  const total = medals.reduce((a, b) => a + b, 0);
  const cellH = r.h * 0.7;
  const cells: string[] = [];
  medals.forEach((n, i) => {
    cells.push(`<rect class="${n > 0 ? `rk-cell${i + 1}` : "rk-pill"}" x="${num(xs[i] - z.cellW / 2)}" y="${num(cy - cellH / 2)}" width="${num(z.cellW)}" height="${num(cellH)}" rx="${num(cellH * 0.22)}"${n > 0 ? "" : ' opacity=".55"'}/>`);
    cells.push(label(xs[i], cy + z.ns * 0.36, z.ns, v.number(n), n > 0 ? `rk-num${i + 1}` : "rk-sub", "middle", 800));
  });
  const tx = xs[3];
  cells.push(label(tx, cy + z.ns * 0.36 * 1.1, z.ns * 1.1, v.number(total), "rk-ink", "middle", 800));
  const nameAvail = xs[0] - z.cellW / 2 - z.rowPad - x;
  const note = row.note;
  const name = row.name;
  const twoLine = !!note && z.he >= 40;
  if (twoLine) {
    const nz = fitSize(name, z.he * 0.36, nameAvail, 0.55);
    const sz = fitSize(note!, z.he * 0.21, nameAvail, 0.7);
    const block = nz * 1.05 + sz * 1.3;
    const top = cy - block / 2;
    g.push(label(x, top + nz * 0.86, nz, fit(name, nz, nameAvail + 1, bw), "rk-ink", "start", 800));
    g.push(label(x, top + nz * 1.05 + sz * 1.05, sz, fit(note!, sz, nameAvail + 1, bw), "rk-sub", "start", 600));
  } else {
    const nz = fitSize(name, z.he * 0.4, nameAvail, 0.55);
    g.push(label(x, cy + nz * 0.36, nz, fit(name, nz, nameAvail + 1, bw), "rk-ink", "start", 800));
  }
  g.push(...cells);
  return `<g class="rk-entry">${g.join("")}</g>`;
}
