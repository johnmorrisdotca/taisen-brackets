// The broadcast-style medal table: its size from the rows, the order and ranks it shares with medalTable, what a row says, looks, languages, and that every text sits inside its row.
import assert from "node:assert/strict";
import { test } from "node:test";
import { FLAGS, FLAGS_RECT } from "../demo/flags-data.js";
import { MEDALS_SAMPLE as M } from "../demo/data/results-sample.js";
import * as T from "../src/index.ts";
import type { BroadcastMedalOptions, MedalRow, MedalTableSource } from "../src/index.ts";
import { overlap, textBox } from "./geometry.ts";
import { wellFormed } from "./helpers.ts";
import { parseXml, walk, withClass } from "./xml.ts";

const flags = (code: string, r: { shape: string }) => (r.shape === "rect" ? (FLAGS_RECT as Record<string, string>)[code] : (FLAGS as Record<string, string>)[code]);
const source = (): MedalTableSource => ({ subtitle: M.subtitle, date: M.date, rows: M.rows });
const texts = (svg: string): string[] => walk(parseXml(svg)).filter((n) => n.name === "text").map((n) => n.text);
const rowTexts = (g: ReturnType<typeof withClass>[number]) => walk(g).filter((n) => n.name === "text" && n.attrs.class !== "tb-initials").map((n) => n.text);
const view = (svg: string): [number, number] => /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)!.slice(1).map(Number) as [number, number];

test("the size follows from the rows: the width given and 64 + 36 + 10 + 48 a row + 10, scaled", () => {
  assert.deepEqual(T.broadcastMedalSize(10), { width: 1280, height: 600 });
  assert.deepEqual(T.broadcastMedalSize(10, { width: 640 }), { width: 640, height: 300 });
  for (const width of [720, 960, 1280, 1920]) assert.deepEqual(view(T.broadcastMedalTable(source(), { width, flags })), [width, T.broadcastMedalSize(10, { width }).height]);
  assert.deepEqual(view(T.broadcastMedalTable(source(), { top: 3 })), [1280, T.broadcastMedalSize(3).height]);
});

test("a row says its rank, code and the three counts and the total, in that order, with a 4:3 flag and a disc for each medal", () => {
  const svg = T.broadcastMedalTable(source(), { flags });
  assert.equal(wellFormed(svg), null);
  assert.equal(svg, T.broadcastMedalTable(source(), { flags }));
  const root = parseXml(svg);
  const rows = withClass(root, "bc-row");
  assert.equal(rows.length, 10);
  assert.deepEqual(rowTexts(rows[0]), ["1", "USA", "46", "29", "29", "104"]);
  assert.deepEqual(rowTexts(rows[9]), ["10", "NED", "0", "1", "0", "1"]);
  const t = texts(svg);
  for (const x of ["MEDAL TABLE", "GAMES", "DAY 16", "TOTAL"]) assert.ok(t.includes(x), x);
  assert.equal(withClass(root, "bc-medalhead").length, 3);
  assert.equal(withClass(rows[0], "bc-g1").length, 1);
  assert.match(svg, /data-board="broadcast-medal-table"/);
  const asked = new Set<string>();
  T.broadcastMedalTable(source(), { flags: (c, r) => { asked.add(r.shape); return flags(c, r); } });
  assert.deepEqual([...asked], ["rect"]);
});

test("it ranks and ties like medalTable: gold first or by total, equal rows sharing a rank, top, skipEmpty", () => {
  const rowsIn: MedalRow[] = [{ name: "A", code: "AAA", gold: 1 }, { name: "B", code: "BBB", gold: 1 }, { name: "C", code: "CCC", silver: 3 }, { name: "D", code: "DDD" }];
  const ranks = (o: BroadcastMedalOptions) => withClass(parseXml(T.broadcastMedalTable({ rows: rowsIn }, o)), "bc-row").map((g) => rowTexts(g).slice(0, 2).join(" "));
  assert.deepEqual(ranks({}), ["1 AAA", "1 BBB", "3 CCC", "4 DDD"]);
  assert.deepEqual(ranks({ sort: "total" }), ["1 CCC", "2 AAA", "2 BBB", "4 DDD"]);
  assert.deepEqual(ranks({ ties: false }), ["1 AAA", "2 BBB", "3 CCC", "4 DDD"]);
  assert.deepEqual(ranks({ top: 2 }), ["1 AAA", "1 BBB"]);
  assert.deepEqual(ranks({ skipEmpty: true }), ["1 AAA", "1 BBB", "3 CCC"]);
});

test("labels: the code where every row has one, else the name; labels and ranks can be chosen", () => {
  const label = (rows: MedalRow[], o: BroadcastMedalOptions = {}) => rowTexts(withClass(parseXml(T.broadcastMedalTable({ rows }, o)), "bc-row")[0]);
  assert.deepEqual(label([{ name: "France", code: "FRA", gold: 1 }]), ["1", "FRA", "1", "0", "0", "1"]);
  assert.deepEqual(label([{ name: "France", gold: 1 }]), ["1", "France", "1", "0", "0", "1"]);
  assert.deepEqual(label([{ name: "France", code: "FRA", gold: 1 }], { labels: "name" }), ["1", "France", "1", "0", "0", "1"]);
  assert.deepEqual(label([{ name: "France", code: "FRA", gold: 1 }], { ranks: false }), ["FRA", "1", "0", "0", "1"]);
  assert.deepEqual(label([{ name: "Soviet Union", code: "URS", note: "1922–1991", gold: 2 }]).slice(0, 2), ["1", "URS"]);
});

test("the looks and icons draw, and an empty table says so", () => {
  for (const look of T.BROADCAST_LOOKS) for (const icon of ["medal", "stopwatch", "none"] as const) assert.equal(wellFormed(T.broadcastMedalTable(source(), { look, icon, flags })), null);
  const none = T.broadcastMedalTable({ rows: [] });
  assert.equal(wellFormed(none), null);
  assert.ok(texts(none).includes("No medals yet"));
  assert.deepEqual(view(none), [1280, T.broadcastMedalSize(0).height]);
});

test("the table refuses what cannot be drawn", () => {
  assert.throws(() => T.broadcastMedalTable({} as never), /list of rows/);
  assert.throws(() => T.broadcastMedalTable({ rows: [{ name: "" }] }), /needs a name/);
  assert.throws(() => T.broadcastMedalTable({ rows: [{ name: "A", gold: -1 }] }), /gold medals/);
  assert.throws(() => T.broadcastMedalTable({ rows: Array.from({ length: 25 }, (_, i) => ({ name: `T${i}`, gold: i })) }), /at most 24 rows/);
  assert.equal(wellFormed(T.broadcastMedalTable({ rows: Array.from({ length: 25 }, (_, i) => ({ name: `T${i}`, gold: i })) }, { top: 24 })), null);
  assert.throws(() => T.broadcastMedalTable(source(), { labels: "x" as never }), /labels/);
  assert.throws(() => T.broadcastMedalTable(source(), { sort: "x" as never }), /sort/);
  assert.throws(() => T.broadcastMedalTable(source(), { look: "red" as never }), /look/);
  assert.throws(() => T.broadcastMedalTable(source(), { width: 700 }), /width is from 720/);
});

test("every language draws with no hole left unfilled, and nothing is stretched", () => {
  for (const locale of T.LOCALE_CODES) {
    const svg = T.broadcastMedalTable(source(), { locale, flags });
    assert.equal(wellFormed(svg), null, locale);
    assert.ok(!/undefined|\{[a-z]+\}/.test(svg.replace(/<style>[\s\S]*?<\/style>/, "")), locale);
  }
  assert.ok(texts(T.broadcastMedalTable(source(), { locale: "fr" })).includes("TABLEAU DES MÉDAILLES"));
  for (const width of [720, 1280]) {
    const svg = T.broadcastMedalTable(source(), { width });
    assert.ok(!/textLength|lengthAdjust/.test(svg));
    for (const n of walk(parseXml(svg)).filter((x) => x.name === "text")) {
      assert.equal(n.attrs.transform, undefined);
      assert.ok(Number(n.attrs["font-size"]) >= 9, `${width}: "${n.text}" is ${n.attrs["font-size"]}`);
    }
  }
});

test("every text stays inside the board and its row, and no two texts of a row touch, at every width and look, with big numbers, long names and several languages", () => {
  const long = "The Federation of Maximilian Alexander Konstantinopoulos-Wilhelmsen";
  const bad: string[] = [];
  for (const width of [720, 960, 1280, 1920, 4000]) for (const look of T.BROADCAST_LOOKS) for (const locale of ["en", "ja", "de"]) for (const wide of [false, true]) for (const labels of ["code", "name"] as const) {
    const rows = wide ? M.rows.map((r, i) => (i % 2 === 0 ? { ...r, name: long, code: "ABC", gold: 1234, silver: 5678, bronze: 9012 } : r)) : M.rows;
    const svg = T.broadcastMedalTable({ subtitle: wide ? `${long} day` : "Day 16", date: wide ? long : "Games", rows }, { width, look, locale, flags, labels });
    const root = parseXml(svg);
    const [W, H] = view(svg);
    const tag = `${width} ${look} ${locale} ${labels} ${wide ? "long" : "short"}`;
    for (const n of walk(root).filter((x) => x.name === "text")) {
      const b = textBox(n);
      if (b.x < -0.5 || b.x + b.w > W + 0.5 || b.y < -0.5 || b.y + b.h > H + 0.5) bad.push(`${tag}: "${n.text}" is outside ${W}x${H}`);
    }
    for (const g of withClass(root, "bc-row")) {
      const r = g.children[0];
      const box = { x: Number(r.attrs.x), y: Number(r.attrs.y), w: Number(r.attrs.width), h: Number(r.attrs.height) };
      const ts = walk(g).filter((n) => n.name === "text").map((n) => ({ n, b: textBox(n) }));
      for (const { n, b } of ts) if (b.x < box.x - 0.5 || b.x + b.w > box.x + box.w + 0.5 || b.y < box.y - 0.5 || b.y + b.h > box.y + box.h + 0.5) bad.push(`${tag}: "${n.text}" leaves its row`);
      ts.forEach(({ n, b }, i) => ts.slice(i + 1).forEach(({ n: m, b: c }) => { if (overlap({ ...b, h: b.h * 0.7, y: b.y + b.h * 0.15 }, { ...c, h: c.h * 0.7, y: c.y + c.h * 0.15 }, -1)) bad.push(`${tag}: "${n.text}" touches "${m.text}"`); }));
    }
  }
  assert.deepEqual(bad.slice(0, 8), [], `${bad.length} problems`);
});
