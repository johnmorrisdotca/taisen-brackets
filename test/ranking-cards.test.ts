// The number-one cards and the entry list: what they show, the order, every size, theme and language, and that every text sits inside its card or row and nothing is stretched.
import assert from "node:assert/strict";
import { test } from "node:test";
import { FLAGS } from "../demo/flags-data.js";
import { RANKING_SAMPLE } from "../demo/data/ranking-sample.js";
import * as T from "../src/index.ts";
import type { EntryListOptions, NumberOnesOptions, RankingCard, RankingEntry } from "../src/index.ts";
import { overlap, textBox } from "./geometry.ts";
import { wellFormed } from "./helpers.ts";
import { parseXml, walk, withClass } from "./xml.ts";

const flags = (code: string) => (FLAGS as Record<string, string>)[code];
const cards = (n = 6): RankingCard[] => RANKING_SAMPLE.numberOnes.slice(0, n) as RankingCard[];
const entries = (n = 16): RankingEntry[] => RANKING_SAMPLE.entryList.entries.slice(0, n) as RankingEntry[];
const texts = (svg: string): string[] => walk(parseXml(svg)).filter((n) => n.name === "text").map((n) => n.text);
const long = "Maximilian Alexander Konstantinopoulos-Wilhelmsen";
const SIZES = ["tv", "tablet", "tablet-tall", "phone", "square", "portrait", { width: 1000, height: 1000 }, { width: 640, height: 360 }] as const;
const dims = (size: (typeof SIZES)[number]) => (typeof size === "string" ? T.BOARD_SIZES[size] : size);

test("the number ones: a card for each category with the 1, the name, the club, the points and #1 in the category", () => {
  const svg = T.rankingNumberOnes({ date: "October 2026", source: "Sample", cards: cards() }, { flags });
  assert.equal(wellFormed(svg), null);
  assert.equal(svg, T.rankingNumberOnes({ date: "October 2026", source: "Sample", cards: cards() }, { flags }));
  const root = parseXml(svg);
  assert.equal(withClass(root, "rk-card").length, 6);
  const t = texts(svg);
  for (const x of ["Number ones", "October 2026", "Sample", "NAKAMURA Kenji", "Coastal Pine Judo", "1,240", "#1 in -60 kg", "#1 in +100 kg"]) assert.ok(t.includes(x), x);
  assert.equal(t.filter((x) => x === "1").length, 6);
  assert.match(svg, /data-board="number-ones"/);
  assert.match(svg, /<title id="[^"]+">Number ones<\/title>/);
  assert.match(T.describeNumberOnes({ cards: cards(2), date: "October 2026" }), /^Number ones\. October 2026\. #1 in -60 kg, NAKAMURA Kenji, Coastal Pine Judo, 1,240 points\. #1 in -66 kg, /);
});

test("each card's number panel takes a colour in turn, with ink that reads on it; colors and columns can be set", () => {
  const svg = T.rankingNumberOnes({ cards: cards(3) }, { colors: ["#ffd400", "#0b3d91"] });
  const fills = [...svg.matchAll(/rx="[\d.]+" style="fill:(#[0-9a-f]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(fills)], ["#ffd400", "#0b3d91"]);
  assert.equal(withClass(parseXml(svg), "rk-onaccent-dark").length, 2);
  assert.equal(withClass(parseXml(svg), "rk-onaccent").length, 1);
  const xs = (o: NumberOnesOptions) => new Set(withClass(parseXml(T.rankingNumberOnes({ cards: cards(4) }, { size: "square", ...o })), "rk-card").map((g) => g.children[0].attrs.x)).size;
  assert.equal(xs({ columns: 1 }), 1);
  assert.equal(xs({ columns: 2 }), 2);
  assert.equal(xs({ columns: 4 }), 4);
});

test("the number ones refuse what cannot be drawn", () => {
  assert.throws(() => T.rankingNumberOnes({ cards: [] }), /at least one card/);
  assert.throws(() => T.rankingNumberOnes({} as never), /at least one card/);
  assert.throws(() => T.rankingNumberOnes({ cards: [{ category: " ", entry: { name: "A" } }] }), /card 1 needs a category/);
  assert.throws(() => T.rankingNumberOnes({ cards: [{ category: "-60 kg", entry: { name: "" } }] }), /needs a name/);
  assert.throws(() => T.rankingNumberOnes({ cards: cards(1) }, { colors: ["red"] }), /hex codes/);
  assert.throws(() => T.rankingNumberOnes({ cards: cards(1) }, { colors: [] }), /hex codes/);
  assert.throws(() => T.rankingNumberOnes({ cards: cards(1) }, { columns: 5 }), /columns/);
  assert.throws(() => T.rankingNumberOnes({ cards: cards(1) }, { size: { width: 10, height: 10 } }), /size/);
  assert.throws(() => T.rankingNumberOnes({ cards: cards(1) }, { theme: "poster" as never }), /theme/);
});

test("the entry list: a numbered row for each athlete in the draw's order, with the code and the ranking, NR where there is none", () => {
  const svg = T.rankingEntryList({ category: "Men -66 kg", date: "Invitational", entries: entries() }, { flags });
  assert.equal(wellFormed(svg), null);
  assert.equal(svg, T.rankingEntryList({ category: "Men -66 kg", date: "Invitational", entries: entries() }, { flags }));
  const rows = withClass(parseXml(svg), "rk-entry");
  assert.equal(rows.length, 16);
  const row = (i: number) => walk(rows[i]).filter((n) => n.name === "text").map((n) => n.text);
  assert.deepEqual(row(0), ["1", "HOSHINO Daiki", "JPN", "3"]);
  assert.deepEqual(row(14), ["15", "WHITFIELD Marcus", "USA", "NR"]);
  const t = texts(svg);
  for (const x of ["Entry list", "Men -66 kg", "Invitational", "RANKING"]) assert.ok(t.includes(x), x);
  assert.match(svg, /data-board="entry-list"/);
  assert.equal(T.describeEntryList({ category: "Men -66 kg", entries: entries(2) }), "Entry list. Men -66 kg. 1, HOSHINO Daiki, Ranking 3. 2, ROUSSEL Mathis, Ranking 9.");
});

test("the entry list can be sorted by ranking, unnumbered, paged and in columns", () => {
  const first = (o: EntryListOptions) => withClass(parseXml(T.rankingEntryList({ entries: entries() }, { flags, ...o })), "rk-entry").map((g) => walk(g).filter((n) => n.name === "text").map((n) => n.text));
  const sorted = first({ sort: "ranking" });
  assert.equal(sorted[0][1], "MTCHEDLISHVILI Levan");
  assert.equal(sorted.at(-1)![1], "WHITFIELD Marcus");
  assert.equal(sorted[0][0], "1");
  const plain = first({ numbers: false });
  assert.equal(plain[0][0], "HOSHINO Daiki");
  const page = first({ rows: 5, page: 1 });
  assert.equal(page.length, 5);
  assert.equal(page[0][0], "6");
  assert.ok(texts(T.rankingEntryList({ entries: entries() }, { rows: 5, page: 1 })).includes("6–10 of 16"));
  const xs = (columns: number) => new Set(withClass(parseXml(T.rankingEntryList({ entries: entries() }, { columns, size: "square" })), "rk-entry").map((g) => g.children[0].attrs.x)).size;
  assert.equal(xs(1), 1);
  assert.equal(xs(2), 2);
  assert.equal(xs(3), 3);
  // A wide board takes two columns by itself; a short list stays in one.
  assert.equal(new Set(withClass(parseXml(T.rankingEntryList({ entries: entries() })), "rk-entry").map((g) => g.children[0].attrs.x)).size, 2);
  assert.equal(new Set(withClass(parseXml(T.rankingEntryList({ entries: entries(4) })), "rk-entry").map((g) => g.children[0].attrs.x)).size, 1);
});

test("an entry list with points and clubs shows them, and the ranking heading is over each column", () => {
  const list = entries(6).map((e, i) => ({ ...e, club: `Club ${i}`, points: 1000 - i * 7.5 }));
  const svg = T.rankingEntryList({ entries: list }, { precision: 1, size: "portrait" });
  const t = texts(svg);
  assert.ok(t.includes("1,000.0") && t.includes("992.5") && t.includes("Club 0"));
  assert.equal(t.filter((x) => x === "RANKING").length, 1);
});

test("the entry list refuses what cannot be drawn", () => {
  assert.throws(() => T.rankingEntryList({} as never), /list of entries/);
  assert.throws(() => T.rankingEntryList({ entries: [{ name: "" }] }), /entry 1 .* needs a name/);
  assert.throws(() => T.rankingEntryList({ entries: [{ name: "A", rank: 0 }] }), /ranking/);
  assert.throws(() => T.rankingEntryList({ entries: entries(2) }, { sort: "x" as never }), /sort/);
  assert.throws(() => T.rankingEntryList({ entries: entries(2) }, { columns: 4 }), /columns/);
  assert.throws(() => T.rankingEntryList({ entries: entries(2) }, { rows: 0 }), /rows/);
  assert.throws(() => T.rankingEntryList({ entries: entries(2) }, { page: -1 }), /page/);
  assert.throws(() => T.rankingEntryList({ entries: entries(2) }, { size: { width: 10, height: 10 } }), /size/);
  assert.equal(wellFormed(T.rankingEntryList({ entries: [] })), null);
});

test("both are drawn in every language, light and dark, with no hole left unfilled, and are not stretched", () => {
  for (const locale of T.LOCALE_CODES) {
    const a = T.rankingNumberOnes({ cards: cards() }, { locale, flags });
    const b = T.rankingEntryList({ entries: entries() }, { locale, flags });
    for (const svg of [a, b]) {
      assert.equal(wellFormed(svg), null, locale);
      assert.ok(!/undefined|\{[a-z]+\}/.test(svg.replace(/<style>[\s\S]*?<\/style>/, "")), locale);
    }
  }
  assert.ok(texts(T.rankingNumberOnes({ cards: cards(1) }, { locale: "fr" })).includes("Les numéros un"));
  assert.ok(texts(T.rankingEntryList({ entries: entries(2) }, { locale: "ja" })).includes("エントリーリスト"));
  for (const theme of ["auto", "light", "dark"] as const) {
    assert.equal(wellFormed(T.rankingNumberOnes({ cards: cards() }, { theme })), null);
    assert.equal(wellFormed(T.rankingEntryList({ entries: entries() }, { theme })), null);
  }
  for (const svg of [T.rankingNumberOnes({ cards: cards() }, { size: "phone" }), T.rankingEntryList({ entries: entries() }, { size: "phone" })]) {
    assert.ok(!/textLength|lengthAdjust/.test(svg));
    for (const n of walk(parseXml(svg)).filter((x) => x.name === "text")) {
      assert.equal(n.attrs.transform, undefined);
      assert.ok(Number(n.attrs["font-size"]) >= 9, `"${n.text}" is ${n.attrs["font-size"]}`);
    }
  }
});

test("every text of the cards and the rows stays inside the drawing and its own card or row, and no two texts touch, in every size and several languages", () => {
  const bad: string[] = [];
  const check = (svg: string, tag: string, size: (typeof SIZES)[number], cls: string, boxOf: (g: ReturnType<typeof withClass>[number]) => { x: number; y: number; w: number; h: number }): void => {
    const root = parseXml(svg);
    const { width: W, height: H } = dims(size);
    for (const n of walk(root).filter((x) => x.name === "text")) {
      const b = textBox(n);
      if (b.x < -0.5 || b.x + b.w > W + 0.5 || b.y < -0.5 || b.y + b.h > H + 0.5) bad.push(`${tag}: "${n.text}" is outside ${W}x${H}`);
    }
    for (const g of withClass(root, cls)) {
      const box = boxOf(g);
      const ts = walk(g).filter((n) => n.name === "text").map((n) => ({ n, b: textBox(n) }));
      for (const { n, b } of ts) if (b.x < box.x - 0.5 || b.x + b.w > box.x + box.w + 0.5 || b.y < box.y - 0.5 || b.y + b.h > box.y + box.h + 0.5) bad.push(`${tag}: "${n.text}" leaves its ${cls}`);
      ts.forEach(({ n, b }, i) => ts.slice(i + 1).forEach(({ n: m, b: c }) => { if (overlap({ ...b, h: b.h * 0.7, y: b.y + b.h * 0.15 }, { ...c, h: c.h * 0.7, y: c.y + c.h * 0.15 }, -1)) bad.push(`${tag}: "${n.text}" touches "${m.text}"`); }));
    }
  };
  const rectOf = (g: ReturnType<typeof withClass>[number]) => ({ x: Number(g.children[0].attrs.x), y: Number(g.children[0].attrs.y), w: Number(g.children[0].attrs.width), h: Number(g.children[0].attrs.height) });
  for (const size of SIZES) for (const locale of ["en", "ja", "de"]) for (const wide of [false, true]) {
    const cs = cards().map((c, i) => (wide && i % 2 === 0 ? { ...c, entry: { ...c.entry, name: long, club: `${long} Judo Club`, points: 123456789 } } : c));
    const es = entries().map((e, i) => (wide && i % 2 === 0 ? { ...e, name: long, club: `${long} Judo Club`, points: 123456.789 } : e));
    for (const n of [1, 3, 6]) check(T.rankingNumberOnes({ cards: cs.slice(0, n) }, { size, locale, flags }), `numbers ${JSON.stringify(size)} ${locale} ${n} ${wide}`, size, "rk-card", rectOf);
    for (const o of [{}, { columns: 1 }, { columns: 3 }, { numbers: false }] as EntryListOptions[]) check(T.rankingEntryList({ entries: es, category: "Men -66 kg" }, { size, locale, flags, ...o }), `entries ${JSON.stringify(size)} ${locale} ${JSON.stringify(o)} ${wide}`, size, "rk-entry", rectOf);
  }
  assert.deepEqual(bad.slice(0, 8), [], `${bad.length} problems`);
});
