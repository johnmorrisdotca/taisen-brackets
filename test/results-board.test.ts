// The results board: its size from its rows, what a row says (rank, code, flag, name, values, record badge, note), ranks and ties, precision, looks, languages, and that every text sits inside its row.
import assert from "node:assert/strict";
import { test } from "node:test";
import { FLAGS, FLAGS_RECT } from "../demo/flags-data.js";
import { RESULTS_SAMPLE as R } from "../demo/data/results-sample.js";
import * as T from "../src/index.ts";
import type { ResultsBoardOptions, ResultsBoardSource, ResultsRow } from "../src/index.ts";
import { overlap, textBox } from "./geometry.ts";
import { wellFormed } from "./helpers.ts";
import { parseXml, walk, withClass } from "./xml.ts";

const flags = (code: string, r: { shape: string }) => (r.shape === "rect" ? (FLAGS_RECT as Record<string, string>)[code] : (FLAGS as Record<string, string>)[code]);
const texts = (svg: string): string[] => walk(parseXml(svg)).filter((n) => n.name === "text").map((n) => n.text);
const rows = (svg: string) => withClass(parseXml(svg), "bc-row");
const rowTexts = (g: ReturnType<typeof rows>[number]) => walk(g).filter((n) => n.name === "text" && n.attrs.class !== "tb-initials").map((n) => n.text);
const view = (svg: string): [number, number] => /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)!.slice(1).map(Number) as [number, number];

test("the size follows from the rows: the width given and a height of 64 + 36 + 20 + 54 a row, scaled", () => {
  assert.deepEqual(T.resultsBoardSize(8), { width: 1280, height: 552 });
  assert.deepEqual(T.resultsBoardSize(1), { width: 1280, height: 174 });
  assert.deepEqual(T.resultsBoardSize(8, { width: 640 }), { width: 640, height: 276 });
  for (const width of [720, 960, 1280, 1920]) for (const key of Object.keys(R) as (keyof typeof R)[]) {
    const svg = T.resultsBoard(R[key], { width, flags });
    assert.deepEqual(view(svg), [width, T.resultsBoardSize(R[key].rows.length, { width }).height], `${key} ${width}`);
    assert.match(svg, new RegExp(`width="${width}" height="${T.resultsBoardSize(R[key].rows.length, { width }).height}"`));
  }
});

test("a row says its rank, code, name and values in the order a screen reads them, with a 4:3 flag", () => {
  const svg = T.resultsBoard(R.apparatus, { flags });
  assert.equal(wellFormed(svg), null);
  assert.equal(svg, T.resultsBoard(R.apparatus, { flags }));
  const list = rows(svg);
  assert.equal(list.length, 8);
  assert.deepEqual(rowTexts(list[0]), ["1", "PRK", "H. Un-jong", "15.550", "15.750", "15.650"]);
  assert.deepEqual(rowTexts(list[7]), ["8", "SWE", "A. Lindgren", "15.625", "0.000", "7.812"]);
  const t = texts(svg);
  for (const x of ["APPARATUS FINAL WOMEN", "VAULT", "VAULT 1", "VAULT 2", "SCORE"]) assert.ok(t.includes(x), x);
  assert.match(svg, /data-board="results-board"/);
  assert.match(svg, /<title id="[^"]+">Apparatus final women<\/title>/);
  // Flags are asked for 4:3 and drawn as rectangles: a symbol each, none clipped to a circle.
  const asked: string[] = [];
  T.resultsBoard({ title: "x", rows: [{ name: "A", flag: "US" }] }, { flags: (c, r) => { asked.push(`${c}:${r.shape}`); return flags(c, r); } });
  assert.deepEqual(asked, ["US:rect"]);
  assert.ok(!/<circle class="tb-ring"/.test(svg), "no round marks");
  assert.ok((svg.match(/<symbol /g) ?? []).length >= 8);
});

test("the sub bar holds the phase at the left and the column headings over the columns; the default phase is the language's Result", () => {
  const sub = (src: ResultsBoardSource, o: ResultsBoardOptions = {}) => texts(T.resultsBoard(src, o));
  assert.ok(sub(R.allAround).includes("RESULT"));
  assert.ok(sub({ title: "x", rows: [{ name: "A" }] }, { locale: "fr" }).includes("RÉSULTAT"));
  assert.ok(sub(R.swimming).includes("RESULTS · FINAL"));
  assert.ok(sub({ ...R.allAround, phase: "Preliminaries" }).includes("PRELIMINARIES"));
  const two = parseXml(T.resultsBoard(R.athletics));
  const heads = walk(two).filter((n) => n.name === "text" && n.attrs.class === "bc-subink").map((n) => n.text);
  assert.deepEqual(heads, ["FINAL · WIND +0.3", "REACT", "TIME"]);
});

test("a record badge sits before the values, several in a row, and a note stands in for the values", () => {
  const svg = T.resultsBoard(R.athletics, { flags });
  const list = rows(svg);
  assert.ok(rowTexts(list[0]).includes("OR") && rowTexts(list[1]).includes("NR"));
  assert.equal(withClass(parseXml(svg), "bc-badge").length, 3);
  const badgeX = (g: ReturnType<typeof rows>[number]) => Number(withClass(g, "bc-badge")[0].attrs.x) + Number(withClass(g, "bc-badge")[0].attrs.width);
  const firstValueX = (g: ReturnType<typeof rows>[number]) => Math.min(...walk(g).filter((n) => n.name === "text" && /^\d\.\d+$/.test(n.text)).map((n) => textBox(n).x));
  assert.ok(badgeX(list[0]) <= firstValueX(list[0]), "the badge ends before the first value");
  const two = T.resultsBoard({ title: "x", rows: [{ name: "A", values: [9.5], record: ["WR", "OR"] }] });
  assert.equal(withClass(parseXml(two), "bc-badge").length, 2);
  assert.deepEqual(rowTexts(list[7]).slice(-2), ["Andre De Grassi", "DQ"]);
  assert.ok(!rowTexts(list[7]).some((x) => /^\d/.test(x)));
});

test("rank styles: a red box, gold, silver and bronze boxes, or a plain numeral", () => {
  const boxes = (o: ResultsBoardOptions) => ["bc-rank", "bc-g1", "bc-g2", "bc-g3"].map((c) => withClass(parseXml(T.resultsBoard(R.swimming, o)), c).length);
  assert.deepEqual(boxes({}), [8, 0, 0, 0]);
  assert.deepEqual(boxes({ rankStyle: "medal" }), [5, 1, 1, 1]);
  assert.deepEqual(boxes({ rankStyle: "plain" }), [0, 0, 0, 0]);
  assert.ok(texts(T.resultsBoard(R.swimming, { rankStyle: "plain" })).includes("1"));
});

test("ranks are the place in the list, equal values share one, an own rank wins, and text is allowed", () => {
  const src = (rs: ResultsRow[]): ResultsBoardSource => ({ title: "x", rows: rs });
  const ranks = (s: ResultsBoardSource, o: ResultsBoardOptions = {}) => rows(T.resultsBoard(s, o)).map((g) => rowTexts(g)[0]);
  const tied = src([{ name: "A", values: [9.8] }, { name: "B", values: [9.9] }, { name: "C", values: [9.9] }, { name: "D", values: [10] }]);
  assert.deepEqual(ranks(tied), ["1", "2", "2", "4"]);
  assert.deepEqual(ranks(tied, { ties: false }), ["1", "2", "3", "4"]);
  assert.deepEqual(ranks(src([{ name: "A", rank: 3 }, { name: "B" }, { name: "C", rank: "=5" }])), ["3", "2", "=5"]);
  assert.deepEqual(ranks(src([{ name: "A" }, { name: "B" }])), ["1", "2"]);
});

test("numbers are written to the column's precision, then the board's, in the language's decimal mark; a text is written as it is", () => {
  const one = (values: (number | string | null)[], o: ResultsBoardOptions = {}, column = {}) => rowTexts(rows(T.resultsBoard({ title: "x", columns: [column], rows: [{ name: "A", values }] }, o))[0]).slice(2);
  assert.deepEqual(one([38.4], {}, { precision: 3 }), ["38.400"]);
  assert.deepEqual(one([38.4], { precision: 2 }), ["38.40"]);
  assert.deepEqual(one([38.4], { precision: 2 }, { precision: 0 }), ["38"]);
  assert.deepEqual(one([38.4]), ["38.4"]);
  assert.deepEqual(one(["1:08.34"]), ["1:08.34"]);
  assert.deepEqual(one([15.55], { precision: 3, locale: "de" }), ["15,550"]);
  assert.deepEqual(one([null]), []);
});

test("the description is a sentence with each row", () => {
  assert.equal(T.describeResultsBoard({ title: "Men's 100m", rows: [{ name: "A. Runner", code: "USA", values: [9.8], record: "NR" }, { name: "B. Slow", code: "CAN", note: "DQ" }] }, { precision: 2 }),
    "Men's 100m. Result. 1, A. Runner, USA, 9.80, NR. 2, B. Slow, CAN, DQ.");
  assert.equal(T.describeResultsBoard({ title: "x", rows: [{ name: { surname: "Hoshino", given: "Daiki" } }] }, { nameCase: "upper" }), "x. Result. 1, HOSHINO DAIKI.");
});

test("name styles and case: two-part names, capitals", () => {
  const name = (o: ResultsBoardOptions) => rowTexts(rows(T.resultsBoard({ title: "x", rows: [{ name: { surname: "Hoshino", given: "Daiki" } }] }, o))[0])[1];
  assert.equal(name({}), "HOSHINO Daiki");
  assert.equal(name({ nameStyle: "given-first" }), "Daiki HOSHINO");
  assert.equal(name({ nameCase: "upper" }), "HOSHINO DAIKI");
  assert.equal(rowTexts(rows(T.resultsBoard({ title: "x", rows: [{ name: "Own Name" }] }, { nameCase: "upper" }))[0])[1], "OWN NAME");
});

test("the looks, the icons and a mark of your own", () => {
  for (const look of T.BROADCAST_LOOKS) {
    const svg = T.resultsBoard(R.swimming, { look, flags });
    assert.equal(wellFormed(svg), null, look);
    assert.match(svg, /<style>/);
  }
  assert.notEqual(T.resultsBoard(R.swimming, { look: "night" }), T.resultsBoard(R.swimming, { look: "paper" }));
  assert.match(T.resultsBoard(R.swimming, { look: "night" }), /#14a9cc/);
  const iconed = (o: ResultsBoardOptions) => T.resultsBoard(R.swimming, o);
  assert.notEqual(iconed({ icon: "medal" }), iconed({ icon: "stopwatch" }));
  assert.ok(!/bc-gi\b|-gi"/.test(iconed({ icon: "none" }).replace(/<defs>[\s\S]*?<\/defs>/, "").replace(/<style>[\s\S]*?<\/style>/, "")), "no icon square");
  assert.match(iconed({ iconMark: '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>' }), /<svg x="[\d.]+" y="[\d.]+" width="[\d.]+" height="[\d.]+" viewBox="0 0 10 10"><circle/);
  assert.match(iconed({ iconMark: "https://example.com/i.png" }), /<image href="https:\/\/example.com\/i.png"/);
  assert.ok(!iconed({ iconMark: "javascript:alert(1)" }).includes("javascript"));
});

test("hostile text is escaped", () => {
  const svg = T.resultsBoard({ title: `<script>alert(1)</script>`, phase: `"><img src=x>`, columns: [{ label: "<b>" }], rows: [{ name: `<i>&"x"</i>`, code: "<u>", values: ["<1>"], record: "<o>", note: "<n>" }] }, { id: `x"><script>` });
  assert.equal(wellFormed(svg), null);
  assert.ok(!/<script|<img|<b>|<i>|<u>|<o>|<n>/.test(svg));
  assert.match(svg, /class="taisen taisen-broadcast x---script-"/);
});

test("the board refuses what cannot be drawn", () => {
  assert.throws(() => T.resultsBoard({ title: "", rows: [{ name: "A" }] }), /needs a title/);
  assert.throws(() => T.resultsBoard({ title: "x", rows: [] }), /at least one row/);
  assert.throws(() => T.resultsBoard({ title: "x" } as never), /at least one row/);
  assert.throws(() => T.resultsBoard({ title: "x", rows: Array.from({ length: 25 }, (_, i) => ({ name: `A${i}` })) }), /at most 24 rows/);
  assert.throws(() => T.resultsBoard({ title: "x", rows: [{ name: " " }] }), /row 1 .* needs a name/);
  assert.throws(() => T.resultsBoard({ title: "x", rows: [{ name: "A", values: [{} as never] }] }), /number, a text or null/);
  assert.throws(() => T.resultsBoard({ title: "x", rows: [{ name: "A", values: [Infinity] }] }), /finite/);
  assert.throws(() => T.resultsBoard({ title: "x", rows: [{ name: "A", values: 5 as never }] }), /a list/);
  assert.throws(() => T.resultsBoard({ title: "x", columns: [{ precision: 9 }], rows: [{ name: "A" }] }), /precision/);
  assert.throws(() => T.resultsBoard(R.swimming, { precision: -1 }), /precision/);
  assert.throws(() => T.resultsBoard(R.swimming, { rankStyle: "x" as never }), /rankStyle/);
  assert.throws(() => T.resultsBoard(R.swimming, { nameCase: "x" as never }), /nameCase/);
  assert.throws(() => T.resultsBoard(R.swimming, { nameStyle: "x" as never }), /nameStyle/);
  assert.throws(() => T.resultsBoard(R.swimming, { look: "red" as never }), /look/);
  assert.throws(() => T.resultsBoard(R.swimming, { icon: "x" as never }), /icon/);
  assert.throws(() => T.resultsBoard(R.swimming, { width: 100 }), /width/);
  assert.throws(() => T.resultsBoard(R.swimming, { width: 700 }), /width is from 720/);
  assert.throws(() => T.resultsBoard(R.swimming, { width: 5000 }), /width/);
});

test("every language draws with no hole left unfilled, and nothing is stretched", () => {
  for (const locale of T.LOCALE_CODES) {
    const svg = T.resultsBoard(R.athletics, { locale, flags });
    assert.equal(wellFormed(svg), null, locale);
    assert.ok(!/undefined|\{[a-z]+\}/.test(svg.replace(/<style>[\s\S]*?<\/style>/, "")), locale);
  }
  for (const width of [720, 1280]) {
    const svg = T.resultsBoard(R.athletics, { width });
    assert.ok(!/textLength|lengthAdjust/.test(svg));
    for (const n of walk(parseXml(svg)).filter((x) => x.name === "text")) {
      assert.equal(n.attrs.transform, undefined);
      assert.ok(Number(n.attrs["font-size"]) >= 9, `${width}: "${n.text}" is ${n.attrs["font-size"]}`);
    }
  }
});

test("every text stays inside the board and inside its row, and no two texts of a row touch, at every width, in every look, with long names and several languages", () => {
  const long = "Maximilian Alexander Konstantinopoulos-Wilhelmsen";
  const bad: string[] = [];
  for (const width of [720, 960, 1280, 1920, 4000]) for (const look of T.BROADCAST_LOOKS) for (const locale of ["en", "ja", "de"]) for (const wide of [false, true]) for (const key of Object.keys(R) as (keyof typeof R)[]) {
    const base = R[key];
    const src: ResultsBoardSource = wide
      ? { ...base, title: `${long} Championships Final`, phase: `${long} phase`, columns: base.columns?.map((c) => ({ ...c, label: "A very long heading" })), rows: base.rows.map((r, i) => (i % 2 === 0 ? { ...r, name: long, record: ["WR", "OR", "NR"], values: r.values?.map((x) => (typeof x === "number" ? x * 1000 : `${x}99:59.999`)) } : r)) }
      : base;
    const svg = T.resultsBoard(src, { width, look, locale, flags, rankStyle: "medal", nameCase: wide ? "upper" : "as-is" });
    const root = parseXml(svg);
    const [W, H] = view(svg);
    const tag = `${key} ${width} ${look} ${locale} ${wide ? "long" : "short"}`;
    for (const n of walk(root).filter((x) => x.name === "text")) {
      const b = textBox(n);
      if (b.x < -0.5 || b.x + b.w > W + 0.5 || b.y < -0.5 || b.y + b.h > H + 0.5) bad.push(`${tag}: "${n.text}" is outside ${W}x${H}`);
    }
    for (const g of withClass(root, "bc-row")) {
      const r = g.children[0];
      const bx = { x: Number(r.attrs.x), y: Number(r.attrs.y), w: Number(r.attrs.width), h: Number(r.attrs.height) };
      const ts = walk(g).filter((n) => n.name === "text").map((n) => ({ n, b: textBox(n) }));
      for (const { n, b } of ts) if (b.x < bx.x - 0.5 || b.x + b.w > bx.x + bx.w + 0.5 || b.y < bx.y - 0.5 || b.y + b.h > bx.y + bx.h + 0.5) bad.push(`${tag}: "${n.text}" leaves its row`);
      ts.forEach(({ n, b }, i) => ts.slice(i + 1).forEach(({ n: m, b: c }) => { if (overlap({ ...b, h: b.h * 0.7, y: b.y + b.h * 0.15 }, { ...c, h: c.h * 0.7, y: c.y + c.h * 0.15 }, -1)) bad.push(`${tag}: "${n.text}" touches "${m.text}"`); }));
      for (const badge of withClass(g, "bc-badge")) {
        const b = { x: Number(badge.attrs.x), y: Number(badge.attrs.y), w: Number(badge.attrs.width), h: Number(badge.attrs.height) };
        for (const { n, b: tb } of ts) if (overlap(b, { ...tb, h: tb.h * 0.7, y: tb.y + tb.h * 0.15 }, -1) && !["OR", "WR", "NR"].includes(n.text)) bad.push(`${tag}: a badge touches "${n.text}"`);
      }
    }
  }
  assert.deepEqual(bad.slice(0, 8), [], `${bad.length} problems`);
});
