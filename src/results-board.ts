/**
 * A results board in the manner of a television graphic: a title band (the event, in capitals, with an icon square), a sub bar (the phase, and the heading of each score column), and a row for
 * each athlete: a rank in a box, the country code and a 4:3 flag, the name, a record badge ("OR", "WR", "NR") and one or more columns of scores or times at the sport's own precision. It is
 * a standalone SVG of a width you choose and a height that follows from the rows (`resultsBoardSize`), made to be placed over a picture. No mark of any games or broadcaster is drawn.
 */
import { BC, box, broadcastFrame, broadcastWrap, bw, fitSize, gloss, panel, rankBox, recordBadge, subBar, t, titleBand, type BroadcastOptions } from "./broadcast-kit.ts";
import { voiceOf, type Voice } from "./locales.ts";
import { drawMark } from "./marks.ts";
import { nameText, type RankingName, type RankingOptions } from "./ranking.ts";
import { abbreviate, fit } from "./text.ts";

/** One line of a results board. Only `name` is needed. */
export interface ResultsRow {
  /** The name as it is to be written ("A. SACRAMONE", "Svetlana Khorkina"), or its two parts (set by `nameStyle`). */
  name: string | RankingName;
  /** The rank: a number, or a text ("=3", "DQ"). Left out, the place in the list (equal results share one, see `ties`). */
  rank?: number | string;
  /** The country's three letters, written before the flag. */
  code?: string;
  /** A code for the `flags` function (`US`, `CA-BC`), drawn 4:3. */
  flag?: string;
  /** A mark of your own (an image address or inline SVG) in place of a flag. */
  mark?: string;
  /** One value for each column: a number (written to the column's `precision` decimals), a text (written as it is: `1:08.34`), or none. */
  values?: readonly (number | string | null)[];
  /** A record badge or several beside the last value: `"OR"`, `["WR", "NR"]`. */
  record?: string | readonly string[];
  /** Written in place of the values when there are none to show: `DNS`, `DNF`, `DQ`. */
  note?: string;
}

/** A column of scores: its heading in the sub bar, and the decimals of its numbers. */
export interface ResultsColumn {
  label?: string;
  precision?: number;
}

export interface ResultsBoardSource {
  /** The event, in capitals in the title band ("Women's apparatus final"). */
  title: string;
  /** The phase in the sub bar ("Result", "Final", "Preliminaries"). Default: the language's "Result". */
  phase?: string;
  /** The score columns, left to right. Default: one column per value of the longest row, with no heading. */
  columns?: readonly ResultsColumn[];
  rows: readonly ResultsRow[];
}

export interface ResultsBoardOptions extends BroadcastOptions, Pick<RankingOptions, "nameStyle"> {
  /** `box` (the default: a red square, as a broadcast has it), `medal` (gold, silver and bronze boxes for the first three) or `plain` (a white numeral). */
  rankStyle?: "box" | "medal" | "plain";
  /** Decimals for numeric values where a column names none (`3` writes `38.387`). Default: as many as the number has, up to three. */
  precision?: number;
  /** Equal results share a rank (`1, 2, 2, 4`). Default true. */
  ties?: boolean;
  /** `upper` writes the names in capitals; `as-is` (the default) leaves them as given. */
  nameCase?: "as-is" | "upper";
}

const MAX_ROWS = 24;

/** The width and the height of a results board with `rowCount` rows: the width given (1280 by default) and a height of 64 + 36 + 20 + 54 a row, in units of the width over 1280. */
export function resultsBoardSize(rowCount: number, options: Pick<BroadcastOptions, "width"> = {}): { width: number; height: number } {
  const width = options.width ?? 1280;
  const u = width / 1280;
  return { width, height: Math.round((BC.title + BC.sub + BC.pad * 2 + rowCount * (BC.row + BC.gap)) * u) };
}

function validate(source: ResultsBoardSource, options: ResultsBoardOptions): void {
  if (!source || typeof source.title !== "string" || source.title.trim() === "") throw new RangeError("taisen-brackets: a results board needs a title");
  if (!Array.isArray(source.rows) || source.rows.length === 0) throw new RangeError("taisen-brackets: a results board needs at least one row");
  if (source.rows.length > MAX_ROWS) throw new RangeError(`taisen-brackets: a results board has at most ${MAX_ROWS} rows (it is a screen graphic): cut the list or draw a ranking list`);
  source.rows.forEach((r, i) => {
    const n = r?.name;
    const ok = typeof n === "string" ? n.trim() !== "" : !!n && typeof n === "object" && typeof n.surname === "string" && n.surname.trim() !== "";
    if (!ok) throw new RangeError(`taisen-brackets: row ${i + 1} of the results board needs a name`);
    if (r.values !== undefined) {
      if (!Array.isArray(r.values)) throw new RangeError(`taisen-brackets: the values of row ${i + 1} are a list`);
      r.values.forEach((x: unknown) => { if (x !== null && typeof x !== "number" && typeof x !== "string") throw new RangeError(`taisen-brackets: a value of row ${i + 1} is a number, a text or null`); if (typeof x === "number" && !Number.isFinite(x)) throw new RangeError(`taisen-brackets: a value of row ${i + 1} is not a finite number`); });
    }
  });
  source.columns?.forEach((c) => { if (c.precision !== undefined && !(Number.isInteger(c.precision) && c.precision >= 0 && c.precision <= 6)) throw new RangeError("taisen-brackets: a column's precision is a whole number from 0 to 6"); });
  if (options.precision !== undefined && !(Number.isInteger(options.precision) && options.precision >= 0 && options.precision <= 6)) throw new RangeError("taisen-brackets: precision is a whole number from 0 to 6");
  if (options.rankStyle !== undefined && !["box", "medal", "plain"].includes(options.rankStyle)) throw new RangeError(`taisen-brackets: rankStyle is "box", "medal" or "plain", not ${JSON.stringify(options.rankStyle)}`);
  if (options.nameCase !== undefined && !["as-is", "upper"].includes(options.nameCase)) throw new RangeError(`taisen-brackets: nameCase is "as-is" or "upper", not ${JSON.stringify(options.nameCase)}`);
  if (options.nameStyle !== undefined && !["surname-first", "given-first", "as-is"].includes(options.nameStyle)) throw new RangeError(`taisen-brackets: nameStyle is "surname-first", "given-first" or "as-is", not ${JSON.stringify(options.nameStyle)}`);
}

const records = (r: ResultsRow): string[] => (r.record === undefined ? [] : typeof r.record === "string" ? [r.record] : [...r.record]).filter((x) => x.trim() !== "");

/** A value as it is written: a number to its precision, a text as it is, none as a dash. */
function valueText(x: number | string | null | undefined, precision: number | undefined, v: Voice): string {
  if (x === null || x === undefined) return "";
  if (typeof x === "string") return x;
  return precision === undefined ? v.number(x) : new Intl.NumberFormat(v.locale.tag, { minimumFractionDigits: precision, maximumFractionDigits: precision }).format(x);
}

/** The ranks as the board writes them, in the order of the rows. */
function ranksOf(rows: readonly ResultsRow[], ties: boolean): (number | string)[] {
  const out: (number | string)[] = [];
  rows.forEach((r, i) => {
    if (r.rank !== undefined) { out.push(r.rank); return; }
    const prev = rows[i - 1];
    const same = ties && prev && prev.rank === undefined && r.values && prev.values && r.values.length > 0 && r.values.length === prev.values.length && r.values.every((x, k) => x === prev.values![k]);
    out.push(same ? out[i - 1] : i + 1);
  });
  return out;
}

/** The board as a sentence, the drawing's description. */
export function describeResultsBoard(source: ResultsBoardSource, options: Pick<ResultsBoardOptions, "locale" | "words" | "nameStyle" | "precision" | "ties" | "nameCase"> = {}): string {
  const v = voiceOf(options);
  const w = v.words;
  const parts = [source.title, source.phase ?? w.rbResult];
  const ranks = ranksOf(source.rows, options.ties ?? true);
  source.rows.forEach((r, i) => {
    const name = nameText(r.name, options.nameStyle ?? "surname-first", v);
    const vals = (r.values ?? []).map((x, k) => valueText(x, source.columns?.[k]?.precision ?? options.precision, v)).filter(Boolean);
    const bits = [String(ranks[i]), options.nameCase === "upper" ? v.upper(name) : name, r.code ?? "", ...(r.note ? [r.note] : vals), ...records(r)].filter(Boolean);
    parts.push(bits.join(w.rankJoin));
  });
  return parts.join(w.sep) + w.end;
}

/**
 * The results board as a standalone SVG. Throws a `RangeError` for a board with no title or no rows, more than 24 rows, a row with no name, a value that is not a number, a text or null, a precision
 * that is not a whole number from 0 to 6, an unknown option value, or a width outside 720 to 4000.
 */
export function resultsBoard(source: ResultsBoardSource, options: ResultsBoardOptions = {}): string {
  validate(source, options);
  if (options.width !== undefined && options.width < 720) throw new RangeError("taisen-brackets: a board's width is from 720 to 4000");
  const n = source.rows.length;
  const size = resultsBoardSize(n, options);
  const f = broadcastFrame(options, [source, options.rankStyle, options.precision, options.ties, options.nameCase, options.nameStyle], size.height / (size.width / 1280));
  const { W, u, v } = f;
  const w = v.words;
  const style = options.nameStyle ?? "surname-first";
  const ranks = ranksOf(source.rows, options.ties ?? true);
  const body: string[] = [panel(f)];
  const title = titleBand(f, 0, source.title);
  body.push(title.svg);

  // The columns, from the right: the widest value or heading sets a column's width.
  const cols = Math.max(source.columns?.length ?? 0, ...source.rows.map((r) => r.values?.length ?? 0));
  const vs = 27 * u, ls = 17 * u;
  const texts = source.rows.map((r) => Array.from({ length: cols }, (_, k) => valueText(r.values?.[k], source.columns?.[k]?.precision ?? options.precision, v)));
  const widths = Array.from({ length: cols }, (_, k) => Math.max(...texts.map((row) => bw(row[k], vs)), bw(v.upper(source.columns?.[k]?.label ?? ""), ls * 1.1)) + 30 * u);
  const right = W - 14 * u;
  const centres: number[] = [];
  let edge = right;
  for (let k = cols - 1; k >= 0; k--) { centres[k] = edge - widths[k] / 2; edge -= widths[k]; }
  const labels = source.columns?.map((c, k) => ({ x: centres[k], w: widths[k], label: c.label ?? "" })).filter((l) => l.label) ?? [];
  const sub = subBar(f, title.h, source.phase ?? w.rbResult, labels);
  body.push(sub.svg);

  const top = title.h + sub.h + BC.pad * u;
  const h = BC.row * u;
  const anyFlag = source.rows.some((r) => r.flag || r.mark);
  const anyCode = source.rows.some((r) => r.code);
  const rankW = 46 * u;
  const cs = 24 * u;
  const codeW = anyCode ? Math.max(...source.rows.map((r) => bw(r.code ?? "", cs))) + 12 * u : 0;
  const flagH = 28 * u, flagW = flagH * (4 / 3);
  source.rows.forEach((r, i) => {
    const y = top + i * (h + BC.gap * u);
    const cy = y + h / 2;
    const g: string[] = [];
    g.push(box(0, y, W, h, i % 2 === 0 ? "bc-rowa" : "bc-rowb"));
    g.push(gloss(f, 0, y, W, h));
    let x = 12 * u;
    const rank = ranks[i];
    g.push(rankBox(x, cy, rankW, 36 * u, typeof rank === "number" ? v.number(rank) : rank, typeof rank === "number" ? rank : null, options.rankStyle ?? "box", u));
    x += rankW + 14 * u;
    if (anyCode) { g.push(t(x, cy + cs * 0.36, cs, r.code ?? "", "bc-ink", "start", 700)); x += codeW; }
    if (anyFlag) {
      if (r.flag || r.mark) g.push(drawMark({ id: `r${i}`, name: String(typeof r.name === "string" ? r.name : r.name.surname), abbr: (r.code ?? abbreviate(typeof r.name === "string" ? r.name : r.name.surname)).slice(0, 3), ...(r.flag ? { flag: r.flag } : {}), ...(r.mark ? { mark: r.mark } : {}) }, x + flagW / 2, cy, flagH, f.ctx));
      x += flagW + 14 * u;
    }
    // The values at the right, then the badges before the last value, then the name in what is left.
    let nameRight = (cols > 0 ? edge : right) - 8 * u;
    const vals: string[] = [];
    if (r.note) vals.push(t(right - 6 * u, cy + vs * 0.36, vs * 0.85, r.note, "bc-sub", "end", 700));
    else texts[i].forEach((text, k) => { if (text) vals.push(t(centres[k] + widths[k] / 2 - 14 * u, cy + vs * 0.36, vs, text, "bc-ink", "end", k === cols - 1 ? 800 : 700)); });
    if (r.note) nameRight = right - bw(r.note, vs * 0.85) - 18 * u;
    const badges: string[] = [];
    let bx = cols > 0 && !r.note ? edge - 4 * u : nameRight;
    for (const rec of records(r)) { const b = recordBadge(bx, cy, 26 * u, rec, u); badges.push(b.svg); bx -= b.w; }
    if (badges.length) nameRight = bx - 4 * u;
    const name = options.nameCase === "upper" ? v.upper(nameText(r.name, style, v)) : nameText(r.name, style, v);
    const avail = Math.max(40 * u, nameRight - x);
    const ns = fitSize(name, 27 * u, avail, 0.6);
    g.push(t(x, cy + ns * 0.36, ns, fit(name, ns, avail + 1, bw), "bc-ink", "start", 700));
    g.push(...badges, ...vals);
    body.push(`<g class="bc-row">${g.join("")}</g>`);
  });
  return broadcastWrap(f, options.title ?? source.title, describeResultsBoard(source, options), body, "results-board");
}
