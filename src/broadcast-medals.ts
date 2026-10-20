/**
 * The medal table in the manner of a television graphic: a title band (the heading, with the date at its right), a sub bar with the three medal discs and the total over their columns, and a row
 * for each country or team with its rank, a 4:3 flag, the country code (or the name) and the gold, silver and bronze counts, each beside its disc, and the total. The rows are ranked and tied as
 * `medalTable` ranks them. One standalone SVG of a width you choose and a height that follows from the rows (`broadcastMedalSize`), made to be placed over a picture.
 */
import { BC, box, broadcastFrame, broadcastWrap, bw, fitSize, gloss, panel, t, titleBand, type BroadcastOptions } from "./broadcast-kit.ts";
import { chosenMedalRows, describeMedalTable, validateMedalSource, type MedalRow, type MedalTableOptions, type MedalTableSource } from "./medals.ts";
import { drawMark } from "./marks.ts";
import { abbreviate, esc, fit, num } from "./text.ts";

export interface BroadcastMedalOptions extends BroadcastOptions, Pick<MedalTableOptions, "sort" | "ties" | "top" | "skipEmpty"> {
  /** Write each row's `code` (the default where every row has one) or its `name`. */
  labels?: "code" | "name";
  /** Write the rank before each row. Default true. */
  ranks?: boolean;
}

const MAX_ROWS = 24;
/** The height of a row of this table, in units of the width over 1280. */
const ROW = 46;

/** The width and the height of a broadcast medal table of `rowCount` rows: the width given (1280 by default) and a height of 64 + 36 + 10 + 48 a row + 10, in units of the width over 1280. */
export function broadcastMedalSize(rowCount: number, options: Pick<BroadcastOptions, "width"> = {}): { width: number; height: number } {
  const width = options.width ?? 1280;
  const u = width / 1280;
  return { width, height: Math.round((BC.title + BC.sub + BC.pad + rowCount * (ROW + BC.gap) + BC.pad) * u) };
}

const count = (n: number | undefined): number => n ?? 0;

/** A medal disc: a filled circle in the medal's colour with a lighter rim and a highlight. */
function disc(cx: number, cy: number, r: number, kind: 1 | 2 | 3): string {
  return `<circle class="bc-g${kind}" cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}"/><circle class="bc-discrim" cx="${num(cx)}" cy="${num(cy)}" r="${num(r * 0.72)}"/>`;
}

/**
 * The broadcast-style medal table as a standalone SVG. Throws a `RangeError` for what `medalTable` refuses, more than 24 rows after `top` and `skipEmpty`, a `labels` that is not `code` or `name`,
 * a look or icon that is not one of its values, or a width outside 720 to 4000.
 */
export function broadcastMedalTable(source: MedalTableSource, options: BroadcastMedalOptions = {}): string {
  const rule: MedalTableOptions = { ...(options.sort !== undefined ? { sort: options.sort } : {}), ...(options.ties !== undefined ? { ties: options.ties } : {}), ...(options.top !== undefined ? { top: options.top } : {}), ...(options.skipEmpty !== undefined ? { skipEmpty: options.skipEmpty } : {}) };
  validateMedalSource(source, rule);
  if (options.labels !== undefined && options.labels !== "code" && options.labels !== "name") throw new RangeError(`taisen-brackets: labels is "code" or "name", not ${JSON.stringify(options.labels)}`);
  if (options.width !== undefined && options.width < 720) throw new RangeError("taisen-brackets: a board's width is from 720 to 4000");
  const rows = chosenMedalRows(source, rule);
  if (rows.length > MAX_ROWS) throw new RangeError(`taisen-brackets: a broadcast medal table has at most ${MAX_ROWS} rows (it is a screen graphic): cut the list with top`);
  const size = broadcastMedalSize(rows.length, options);
  const f = broadcastFrame(options, [source, options.sort, options.ties, options.top, options.skipEmpty, options.labels, options.ranks], size.height / (size.width / 1280));
  const { W, u, v } = f;
  const w = v.words;
  const body: string[] = [panel(f)];
  const title = titleBand(f, 0, source.title ?? w.medalTitle, source.date);
  body.push(title.svg);

  // The columns, from the right: a disc and a count for each medal, then the total.
  const ns = 28 * u;
  const maxMedal = Math.max(1, ...rows.map(({ row }) => Math.max(count(row.gold), count(row.silver), count(row.bronze))));
  const maxTotal = Math.max(1, ...rows.map(({ row }) => count(row.gold) + count(row.silver) + count(row.bronze)));
  const discR = 11 * u;
  const medalW = discR * 2 + 12 * u + bw(v.number(maxMedal), ns) + 22 * u;
  const totalLabel = v.upper(w.medalTotal);
  const totalW = Math.max(bw(v.number(maxTotal), ns), bw(totalLabel, 18 * u * 1.07)) + 30 * u;
  const right = W - 16 * u;
  const totalX = right - totalW / 2;
  const medalX = [0, 1, 2].map((k) => right - totalW - (2 - k) * medalW - medalW / 2);
  const left = medalX[0] - medalW / 2;
  // The sub bar: the subtitle at the left, the discs over their columns and the word total.
  const sub = { svg: "", h: BC.sub * u };
  const sy = title.h;
  const subParts: string[] = [box(0, sy, W, sub.h, "", 0, ` fill="url(#${esc(f.scope)}-gs)"`)];
  const fs = 20 * u;
  const subText = v.upper(source.subtitle ?? "");
  if (subText) { const room = (left - 20 * u - 14 * u) / 1.07; const z = fitSize(subText, fs, room, 0.6); subParts.push(t(20 * u, sy + sub.h / 2 + z * 0.36, z, fit(subText, z, room, bw), "bc-subink", "start", 800, ' letter-spacing=".02em"')); }
  ([1, 2, 3] as const).forEach((k, i) => {
    const name = [w.medalGold, w.medalSilver, w.medalBronze][i];
    subParts.push(`<g class="bc-medalhead"><title>${esc(name)}</title>${disc(medalX[i] - medalW / 2 + discR + 4 * u, sy + sub.h / 2, 12 * u, k)}</g>`);
  });
  const tz = fitSize(totalLabel, 18 * u, (totalW - 8 * u) / 1.07, 0.6);
  subParts.push(t(totalX, sy + sub.h / 2 + tz * 0.36, tz, fit(totalLabel, tz, (totalW - 8 * u) / 1.07, bw), "bc-subink", "middle", 800, ' letter-spacing=".02em"'));
  body.push(subParts.join(""));

  const top = title.h + sub.h + BC.pad * u;
  const h = ROW * u;
  const showRank = options.ranks ?? true;
  const useCode = (options.labels ?? (rows.every(({ row }) => row.code) ? "code" : "name")) === "code";
  const labelOf = (r: MedalRow): string => (useCode ? r.code ?? abbreviate(r.name).slice(0, 3).toUpperCase() : r.name);
  const rankTexts = rows.map(({ rank }) => String(v.number(rank)));
  const rankW = showRank ? Math.max(...rankTexts.map((x) => bw(x, ns))) + 18 * u : 0;
  const flagH = 28 * u, flagW = flagH * (4 / 3);
  rows.forEach(({ row }, i) => {
    const y = top + i * (h + BC.gap * u);
    const cy = y + h / 2;
    const g: string[] = [box(0, y, W, h, i % 2 === 0 ? "bc-rowa" : "bc-rowb"), gloss(f, 0, y, W, h)];
    let x = 14 * u;
    if (showRank) { g.push(t(x + rankW / 2 - 6 * u, cy + ns * 0.36, ns * 0.9, rankTexts[i], "bc-ink", "middle", 800)); x += rankW; }
    g.push(drawMark({ id: `m${i}`, name: row.name, abbr: (row.code ?? abbreviate(row.name)).slice(0, 3).toUpperCase(), ...(row.flag ? { flag: row.flag } : {}), ...(row.mark ? { mark: row.mark } : {}) }, x + flagW / 2, cy, flagH, f.ctx));
    x += flagW + 14 * u;
    const label = labelOf(row);
    const avail = Math.max(40 * u, left - 12 * u - x);
    const lz = fitSize(label, 28 * u, avail, 0.6);
    g.push(t(x, cy + lz * 0.36, lz, fit(label, lz, avail + 1, bw), "bc-ink", "start", 700));
    [row.gold, row.silver, row.bronze].forEach((c, k) => {
      const cx = medalX[k];
      g.push(disc(cx - medalW / 2 + discR + 4 * u, cy, discR, (k + 1) as 1 | 2 | 3));
      g.push(t(cx + medalW / 2 - 14 * u, cy + ns * 0.36, ns, v.number(count(c)), "bc-ink", "end", 700));
    });
    g.push(t(totalX + totalW / 2 - 14 * u, cy + ns * 0.36 * 1.05, ns * 1.05, v.number(count(row.gold) + count(row.silver) + count(row.bronze)), "bc-ink", "end", 800));
    body.push(`<g class="bc-row">${g.join("")}</g>`);
  });
  if (rows.length === 0) body.push(t(20 * u, top + 30 * u, 24 * u, w.medalNone, "bc-sub", "start", 700));
  return broadcastWrap(f, options.title ?? source.title ?? w.medalTitle, describeMedalTable(source, { ...rule, ...(options.locale !== undefined ? { locale: options.locale } : {}), ...(options.words !== undefined ? { words: options.words } : {}) }), body, "broadcast-medal-table");
}
