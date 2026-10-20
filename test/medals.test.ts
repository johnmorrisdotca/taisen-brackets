// The medal table: ranks (gold first or by the total, ties sharing a rank), the filters of tallyMedals, historical countries drawn as badges, every size, theme and language, and that every text sits inside its row.
import assert from "node:assert/strict";
import { test } from "node:test";
import { FLAGS } from "../demo/flags-data.js";
import { MEDAL_AWARDS } from "../demo/data/medal-sample.js";
import * as T from "../src/index.ts";
import type { MedalAward, MedalRow, MedalTableOptions } from "../src/index.ts";
import { overlap, textBox } from "./geometry.ts";
import { wellFormed } from "./helpers.ts";
import { parseXml, walk, withClass } from "./xml.ts";

const flags = (code: string) => (FLAGS as Record<string, string>)[code];
const rows: MedalRow[] = [
  { name: "France", flag: "FR", gold: 6, silver: 1, bronze: 3 },
  { name: "Japan", flag: "JP", gold: 5, silver: 3, bronze: 2 },
  { name: "Soviet Union", code: "URS", note: "1922–1991", gold: 1, silver: 0, bronze: 4 },
  { name: "Netherlands", flag: "NL", gold: 1, silver: 0, bronze: 1 },
  { name: "Czech Republic", flag: "CZ", gold: 1 },
  { name: "Unified Team", code: "EUN", gold: 1 },
  { name: "Russia", flag: "RU", silver: 2, bronze: 1 },
  { name: "West Germany", code: "FRG", silver: 2 },
  { name: "Canada", flag: "CA", silver: 1, bronze: 1 },
  { name: "Uzbekistan", flag: "UZ", silver: 1, bronze: 1 },
];
const texts = (svg: string): string[] => walk(parseXml(svg)).filter((n) => n.name === "text").map((n) => n.text);
const entries = (svg: string) => withClass(parseXml(svg), "rk-entry");
const rowTexts = (g: ReturnType<typeof entries>[number]) => walk(g).filter((n) => n.name === "text" && n.attrs.class !== "tb-initials").map((n) => n.text);
const nameOf = (g: ReturnType<typeof entries>[number]) => rowTexts(g)[1];

test("ranks go by gold, silver and bronze, equal rows share a rank (5, 5, 7), and the order given breaks nothing", () => {
  assert.deepEqual(T.medalRanks(rows), [1, 2, 3, 4, 5, 5, 7, 8, 9, 9]);
  assert.deepEqual(T.medalRanks(rows, { ties: false }), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const shuffled = [rows[3], rows[0], rows[6], rows[1]];
  assert.deepEqual(T.medalRanks(shuffled), [1, 2, 3, 4]);
});

test("sort: total puts the most medals first, then gold; sort: given keeps the order", () => {
  const a: MedalRow[] = [{ name: "Few golds", gold: 3 }, { name: "Many medals", gold: 1, silver: 4, bronze: 4 }, { name: "Mid", gold: 2, silver: 3 }];
  const byGold = entries(T.medalTable({ rows: a }, { size: "portrait" })).map(nameOf);
  const byTotal = entries(T.medalTable({ rows: a }, { sort: "total", size: "portrait" })).map(nameOf);
  assert.deepEqual(byGold, ["Few golds", "Mid", "Many medals"]);
  assert.deepEqual(byTotal, ["Many medals", "Mid", "Few golds"]);
  assert.deepEqual(T.medalRanks(a, { sort: "total" }), [1, 2, 3]);
  assert.deepEqual(entries(T.medalTable({ rows: a }, { sort: "given", size: "portrait" })).map(nameOf), ["Few golds", "Many medals", "Mid"]);
  // Total ties need the same total and the same golds and silvers.
  assert.deepEqual(T.medalRanks([{ name: "A", gold: 1, silver: 1 }, { name: "B", gold: 1, silver: 1 }, { name: "C", gold: 0, silver: 2 }], { sort: "total" }), [1, 1, 3]);
});

test("the table shows each row's rank, name, the three counts and the total, with a disc over each medal", () => {
  const svg = T.medalTable({ subtitle: "Men's judo +100 kg", date: "All Games", source: "Sample", rows }, { flags, size: "portrait" });
  assert.equal(wellFormed(svg), null);
  assert.equal(svg, T.medalTable({ subtitle: "Men's judo +100 kg", date: "All Games", source: "Sample", rows }, { flags, size: "portrait" }));
  const list = entries(svg);
  assert.equal(list.length, 10);
  const row = (i: number) => rowTexts(list[i]);
  assert.deepEqual(row(0), ["1", "France", "6", "1", "3", "10"]);
  assert.deepEqual(row(4).slice(0, 2), ["5", "Czech Republic"]);
  assert.deepEqual(row(5).slice(0, 2), ["5", "Unified Team"]);
  assert.deepEqual(row(6).slice(0, 2), ["7", "Russia"]);
  const t = texts(svg);
  for (const x of ["Medal table", "Men's judo +100 kg", "All Games", "Sample", "G", "S", "B", "TOTAL"]) assert.ok(t.includes(x), x);
  const root = parseXml(svg);
  assert.equal(withClass(root, "rk-medalhead").length, 3);
  assert.match(svg, /data-board="medal-table"/);
  assert.match(svg, /<title id="[^"]+">Medal table: Men's judo \+100 kg<\/title>/);
});

test("the first three ranks get a bar in gold, silver and bronze, and ties share it; highlight: false leaves them out", () => {
  const bars = (o: MedalTableOptions) => ["rk-bar1", "rk-bar2", "rk-bar3"].map((c) => withClass(parseXml(T.medalTable({ rows }, { size: "portrait", ...o })), c).length);
  assert.deepEqual(bars({}), [1, 1, 1]);
  assert.deepEqual(bars({ highlight: false }), [0, 0, 0]);
  const tied = withClass(parseXml(T.medalTable({ rows: [{ name: "A", gold: 1 }, { name: "B", gold: 1 }, { name: "C" }] }, { size: "portrait" })), "rk-bar1").length;
  assert.equal(tied, 2);
});

test("a row with no flag is a badge with its code or initials, and the note sits under the name", () => {
  const svg = T.medalTable({ rows }, { flags, size: "portrait" });
  const t = texts(svg);
  assert.ok(t.includes("URS") && t.includes("EUN") && t.includes("FRG"));
  assert.ok(t.includes("1922–1991"));
  const initials = T.medalTable({ rows: [{ name: "Cedar Hollow Club", gold: 1 }] });
  assert.ok(texts(initials).includes("CHC"));
  assert.match(T.medalTable({ rows: [{ name: "A", mark: "https://example.com/e.png", gold: 1 }] }), /<image href="https:\/\/example.com\/e.png"/);
});

test("top, rows, page and skipEmpty choose the rows, and the header says which are shown", () => {
  const n = (o: MedalTableOptions) => entries(T.medalTable({ rows }, { size: "portrait", ...o })).length;
  assert.equal(n({ top: 3 }), 3);
  assert.equal(n({ rows: 4 }), 4);
  assert.ok(texts(T.medalTable({ rows }, { size: "portrait", rows: 4 })).includes("1–4 of 10"));
  assert.deepEqual(entries(T.medalTable({ rows }, { size: "portrait", rows: 4, page: 1 })).map(nameOf), ["Czech Republic", "Unified Team", "Russia", "West Germany"]);
  assert.equal(n({ skipEmpty: true }), 10);
  assert.equal(entries(T.medalTable({ rows: [...rows, { name: "Nobody" }] }, { size: "portrait", skipEmpty: true })).length, 10);
  assert.equal(entries(T.medalTable({ rows: [...rows, { name: "Nobody" }] }, { size: "portrait" })).length, 11);
  assert.ok(!texts(T.medalTable({ rows }, { size: "portrait" })).some((x) => /of 10$/.test(x)));
});

test("columns: a wide board with many rows takes two, the first column running down first", () => {
  const many = Array.from({ length: 14 }, (_, i) => ({ name: `Team ${i + 1}`, gold: 20 - i }));
  const xs = (o: MedalTableOptions) => [...new Set(entries(T.medalTable({ rows: many }, o)).map((g) => g.children[0].attrs.x))];
  assert.equal(xs({ size: "tv" }).length, 2);
  assert.equal(xs({ size: "tv", columns: 1 }).length, 1);
  assert.equal(xs({ size: "portrait" }).length, 1);
  assert.equal(xs({ size: "portrait", columns: 2 }).length, 2);
  const names = entries(T.medalTable({ rows: many }, { size: "tv" })).map(nameOf);
  assert.deepEqual(names, many.map((r) => r.name));
  const ys = entries(T.medalTable({ rows: many }, { size: "tv" })).map((g) => Number(g.children[0].attrs.y));
  assert.ok(ys[1] > ys[0] && ys[7] < ys[6] + 1);
});

test("tallyMedals adds the medals up by name, and filters by sport, category and Games, each a value or a list", () => {
  const awards: MedalAward[] = [
    { name: "France", flag: "FR", medal: "gold", sport: "judo", category: "-66 kg", games: 2024 },
    { name: "France", medal: "bronze", sport: "judo", category: "-100 kg", games: 2024 },
    { name: "Japan", flag: "JP", medal: "silver", sport: "judo", category: "-66 kg", games: 2020 },
    { name: "Japan", medal: "gold", sport: "wrestling", category: "-65 kg", games: 2024 },
    { name: "Soviet Union", code: "URS", note: "1922–1991", medal: "gold", sport: "judo", category: "-66 kg", games: 1988 },
  ];
  const sum = (r: MedalRow[]) => r.map((x) => `${x.name} ${x.gold}-${x.silver}-${x.bronze}`);
  assert.deepEqual(sum(T.tallyMedals(awards)), ["France 1-0-1", "Japan 1-1-0", "Soviet Union 1-0-0"]);
  assert.deepEqual(sum(T.tallyMedals(awards, { sport: "judo" })), ["France 1-0-1", "Japan 0-1-0", "Soviet Union 1-0-0"]);
  assert.deepEqual(sum(T.tallyMedals(awards, { sport: "judo", category: "-66 kg", games: 2024 })), ["France 1-0-0"]);
  assert.deepEqual(sum(T.tallyMedals(awards, { games: [2020, 2024] })), ["France 1-0-1", "Japan 1-1-0"]);
  assert.deepEqual(sum(T.tallyMedals(awards, { category: ["-65 kg", "-100 kg"] })), ["France 0-0-1", "Japan 1-0-0"]);
  assert.deepEqual(T.tallyMedals(awards, { games: 1988 })[0], { name: "Soviet Union", gold: 1, silver: 0, bronze: 0, code: "URS", note: "1922–1991" });
  assert.equal(T.tallyMedals(awards)[0].flag, "FR");
  assert.deepEqual(T.tallyMedals([]), []);
  assert.deepEqual(T.tallyMedals(awards, { sport: "sumo" }), []);
});

test("the sample medals tally to a table whose every medal is counted, and filter to an event of four medals", () => {
  const all = T.tallyMedals(MEDAL_AWARDS);
  assert.equal(all.reduce((a, r) => a + (r.gold ?? 0) + (r.silver ?? 0) + (r.bronze ?? 0), 0), MEDAL_AWARDS.length);
  const event = T.tallyMedals(MEDAL_AWARDS, { sport: "judo", category: "+100 kg", games: 2024 });
  assert.equal(event.reduce((a, r) => a + (r.gold ?? 0) + (r.silver ?? 0) + (r.bronze ?? 0), 0), 4);
  assert.ok(MEDAL_AWARDS.filter((a) => a.name === "Soviet Union").every((a) => a.games === 1988));
});

test("a table with no rows, or only empty ones, says so", () => {
  const none = T.medalTable({ rows: [] });
  assert.equal(wellFormed(none), null);
  assert.ok(texts(none).includes("No medals yet"));
  assert.ok(texts(T.medalTable({ rows: [{ name: "Nobody" }] }, { skipEmpty: true })).includes("No medals yet"));
  assert.match(T.describeMedalTable({ rows: [] }), /^Medal table\. No medals yet\.$/);
});

test("the description is a sentence with each row's medals", () => {
  assert.equal(T.describeMedalTable({ subtitle: "Judo", rows: rows.slice(0, 2) }), "Medal table. Judo. 1, France, 6 gold, 1 silver, 3 bronze, 10 total. 2, Japan, 5 gold, 3 silver, 2 bronze, 10 total.");
});

test("the table refuses what cannot be drawn", () => {
  assert.throws(() => T.medalTable({} as never), /list of rows/);
  assert.throws(() => T.medalTable({ rows: [{ name: " " }] }), /row 1 .* needs a name/);
  assert.throws(() => T.medalTable({ rows: [{ name: "A", gold: -1 }] }), /gold medals of A/);
  assert.throws(() => T.medalTable({ rows: [{ name: "A", silver: 1.5 }] }), /silver medals/);
  assert.throws(() => T.medalTable({ rows }, { sort: "points" as never }), /sort/);
  assert.throws(() => T.medalTable({ rows }, { top: 0 }), /top/);
  assert.throws(() => T.medalTable({ rows }, { rows: 0 }), /rows/);
  assert.throws(() => T.medalTable({ rows }, { page: -1 }), /page/);
  assert.throws(() => T.medalTable({ rows }, { columns: 3 as never }), /columns/);
  assert.throws(() => T.medalTable({ rows }, { size: { width: 10, height: 10 } }), /size/);
  assert.throws(() => T.medalTable({ rows }, { theme: "poster" as never }), /theme/);
  assert.throws(() => T.tallyMedals([{ name: "A", medal: "tin" as never }]), /"gold", "silver" or "bronze"/);
  assert.throws(() => T.tallyMedals([{ name: "", medal: "gold" }]), /needs a name/);
});

test("the table is drawn in every language, light and dark, with no hole left unfilled, and nothing is stretched", () => {
  for (const locale of T.LOCALE_CODES) {
    const svg = T.medalTable({ rows }, { locale, flags, size: "portrait" });
    assert.equal(wellFormed(svg), null, locale);
    assert.ok(!/undefined|\{[a-z]+\}/.test(svg.replace(/<style>[\s\S]*?<\/style>/, "")), locale);
    assert.ok(!/undefined|\{[a-z]+\}/.test(T.describeMedalTable({ rows }, { locale })), locale);
  }
  assert.ok(texts(T.medalTable({ rows }, { locale: "fr" })).includes("Tableau des médailles"));
  assert.ok(texts(T.medalTable({ rows }, { locale: "ja" })).includes("メダル獲得表"));
  for (const theme of ["auto", "light", "dark"] as const) assert.equal(wellFormed(T.medalTable({ rows }, { theme })), null);
  for (const size of ["tv", "phone", "square"] as const) {
    const svg = T.medalTable({ rows }, { size });
    assert.ok(!/textLength|lengthAdjust/.test(svg));
    for (const n of walk(parseXml(svg)).filter((x) => x.name === "text")) {
      assert.equal(n.attrs.transform, undefined);
      assert.ok(Number(n.attrs["font-size"]) >= 9, `${size}: "${n.text}" is ${n.attrs["font-size"]}`);
    }
  }
});

test("every text stays inside the drawing and its row, and no two texts of a row touch, in every size, option and several languages", () => {
  const SIZES = ["tv", "tablet", "tablet-tall", "phone", "square", "portrait", { width: 1000, height: 1000 }, { width: 640, height: 360 }] as const;
  const long = "The Federation of Maximilian Alexander Konstantinopoulos-Wilhelmsen";
  const bad: string[] = [];
  const OPTIONS: MedalTableOptions[] = [{}, { columns: 2 }, { sort: "total", rankStyle: "hash" }, { highlight: false }];
  for (const size of SIZES) for (const locale of ["en", "ja", "de"]) for (const wide of [false, true]) for (const o of OPTIONS) {
    const list = wide ? rows.map((r, i) => (i % 2 === 0 ? { ...r, name: long, note: `${long} since 1922`, gold: 123, silver: 456, bronze: 789 } : r)) : rows;
    const svg = T.medalTable({ rows: list, subtitle: "Men's judo +100 kg" }, { size, locale, flags, ...o });
    const root = parseXml(svg);
    const { width: W, height: H } = typeof size === "string" ? T.BOARD_SIZES[size] : size;
    const tag = `${JSON.stringify(size)} ${locale} ${JSON.stringify(o)} ${wide ? "long" : "short"}`;
    for (const n of walk(root).filter((x) => x.name === "text")) {
      const b = textBox(n);
      if (b.x < -0.5 || b.x + b.w > W + 0.5 || b.y < -0.5 || b.y + b.h > H + 0.5) bad.push(`${tag}: "${n.text}" is outside ${W}x${H}`);
    }
    for (const g of withClass(root, "rk-entry")) {
      const r = g.children[0];
      const box = { x: Number(r.attrs.x), y: Number(r.attrs.y), w: Number(r.attrs.width), h: Number(r.attrs.height) };
      const ts = walk(g).filter((n) => n.name === "text").map((n) => ({ n, b: textBox(n) }));
      for (const { n, b } of ts) if (b.x < box.x - 0.5 || b.x + b.w > box.x + box.w + 0.5 || b.y < box.y - 0.5 || b.y + b.h > box.y + box.h + 0.5) bad.push(`${tag}: "${n.text}" leaves its row`);
      ts.forEach(({ n, b }, i) => ts.slice(i + 1).forEach(({ n: m, b: c }) => { if (overlap({ ...b, h: b.h * 0.7, y: b.y + b.h * 0.15 }, { ...c, h: c.h * 0.7, y: c.y + c.h * 0.15 }, -1)) bad.push(`${tag}: "${n.text}" touches "${m.text}"`); }));
    }
  }
  assert.deepEqual(bad.slice(0, 8), [], `${bad.length} problems`);
});
