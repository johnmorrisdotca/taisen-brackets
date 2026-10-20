// The ranking list: the ranks and ties, what it writes for a champion, movement and newly ranked athletes, the podium and the other styles, paging, every size, theme and language,
// and that every text sits inside its row and nothing is stretched.
import assert from "node:assert/strict";
import { test } from "node:test";
import { FLAGS } from "../demo/flags-data.js";
import { RANKING_SAMPLE } from "../demo/data/ranking-sample.js";
import * as T from "../src/index.ts";
import type { RankingEntry, RankingOptions, RankingSource } from "../src/index.ts";
import { textBox, overlap } from "./geometry.ts";
import { wellFormed } from "./helpers.ts";
import { parseXml, walk, withClass } from "./xml.ts";

const flags = (code: string) => (FLAGS as Record<string, string>)[code];
const u18 = RANKING_SAMPLE.lists["u18-men-60"];
const senior = RANKING_SAMPLE.lists["senior-women-57"];
const source = (n = 15): RankingSource => ({ title: "Provincial ranking", category: T.rankingCategoryLabel(u18.category), date: u18.date, source: RANKING_SAMPLE.source, entries: u18.entries.slice(0, n) as RankingEntry[] });
const withChampion = (): RankingSource => ({ title: "Division ranking", category: T.rankingCategoryLabel(senior.category), entries: senior.entries as RankingEntry[] });
const texts = (svg: string): string[] => walk(parseXml(svg)).filter((n) => n.name === "text").map((n) => n.text);
const entries = (svg: string) => withClass(parseXml(svg), "rk-entry");
const firstText = (g: ReturnType<typeof entries>[number]) => walk(g).filter((n) => n.name === "text").map((n) => n.text);

test("ranks are the position, with equal points sharing a rank, an own rank winning, and no rank for a champion", () => {
  const list: RankingEntry[] = [{ name: "A", points: 9 }, { name: "B", points: 8 }, { name: "C", points: 8 }, { name: "D", points: 7 }];
  assert.deepEqual(T.rankingRanks(list), [1, 2, 2, 4]);
  assert.deepEqual(T.rankingRanks(list, { ties: false }), [1, 2, 3, 4]);
  assert.deepEqual(T.rankingRanks([{ name: "Champ", champion: true }, ...list]), [null, 1, 2, 2, 4]);
  assert.deepEqual(T.rankingRanks([{ name: "A", rank: 1 }, { name: "B", rank: 1 }, { name: "C" }]), [1, 1, 3]);
  assert.deepEqual(T.rankingRanks([{ name: "A", points: "n/a" }, { name: "B", points: "n/a" }]), [1, 2]);
});

test("the category is an age group, a sex and a weight, in the language", () => {
  assert.equal(T.rankingCategoryLabel({ age: "U18", sex: "men", weight: "-60" }), "U18 · Men -60 kg");
  assert.equal(T.rankingCategoryLabel({ sex: "women", weight: "+78" }, "fr"), "Femmes +78 kg");
  assert.equal(T.rankingCategoryLabel({ age: "Masters", weight: "Open" }), "Masters · Open");
  assert.equal(T.rankingCategoryLabel({ sex: "men" }), "Men");
  assert.equal(T.rankingCategoryLabel({}), "");
});

test("the list shows the title, the category, the date, each name as SURNAME Given, club, points and the source", () => {
  const svg = T.rankingList(source(), { flags, precision: 2 });
  assert.equal(wellFormed(svg), null);
  assert.equal(svg, T.rankingList(source(), { flags, precision: 2 }));
  const t = texts(svg);
  for (const x of ["Provincial ranking", "U18 · Men -60 kg", "October 2026", "Sample data, invented for the demo", "NAKAMURA Kenji", "Coastal Pine Judo", "412.50", "POINTS"]) assert.ok(t.includes(x), x);
  assert.match(svg, /<title id="[^"]+">Provincial ranking: U18 · Men -60 kg<\/title>/);
  assert.match(svg, /data-board="ranking"/);
  // Round flags once each, drawn as symbols.
  assert.ok((svg.match(/<symbol /g) ?? []).length >= 3);
});

test("a name can be a text, or two parts written by nameStyle", () => {
  const one = (nameStyle?: RankingOptions["nameStyle"]) => texts(T.rankingList({ entries: [{ name: { surname: "Nakamura", given: "Kenji" } }] }, { nameStyle })).filter((x) => /Kenji/.test(x))[0];
  assert.equal(one(), "NAKAMURA Kenji");
  assert.equal(one("surname-first"), "NAKAMURA Kenji");
  assert.equal(one("given-first"), "Kenji NAKAMURA");
  assert.equal(one("as-is"), "Kenji Nakamura");
  assert.ok(texts(T.rankingList({ entries: [{ name: "Own Style Name" }] })).includes("Own Style Name"));
  assert.ok(texts(T.rankingList({ entries: [{ name: { surname: "Sato" } }] })).includes("SATO"));
});

test("the podium draws the top three as big gold, silver and bronze rows above the compact rest", () => {
  const svg = T.rankingList(source(12), { flags, size: "portrait" });
  const root = parseXml(svg);
  const rows = withClass(root, "rk-entry");
  assert.equal(rows.length, 12);
  const classes = rows.map((g) => g.children[0].attrs.class);
  assert.deepEqual(classes.slice(0, 4), ["rk-row rk-medal1", "rk-row rk-medal2", "rk-row rk-medal3", "rk-row"]);
  const heights = rows.map((g) => Number(g.children[0].attrs.height));
  assert.ok(heights[0] > heights[3] * 1.8, "the big rows are about twice a compact one");
  assert.equal(heights[0], heights[2]);
  assert.equal(heights[3], heights[11]);
  assert.match(svg, /<linearGradient id="[^"]+-g1"/);
});

test("the list style is compact throughout with no medal tint, and big and medals can be set", () => {
  const rows = (o: RankingOptions) => entries(T.rankingList(source(8), { size: "portrait", ...o })).map((g) => [g.children[0].attrs.class, Number(g.children[0].attrs.height)] as const);
  const list = rows({ style: "list" });
  assert.ok(list.every(([c, h]) => !/medal/.test(c) && h === list[0][1]));
  const tinted = rows({ style: "list", medals: true });
  assert.deepEqual(tinted.slice(0, 4).map(([c]) => /medal(\d)/.exec(c)?.[1] ?? "-"), ["1", "2", "3", "-"]);
  const one = rows({ big: 1 });
  assert.ok(one[0][1] > one[1][1] * 1.8 && one[1][1] === one[2][1]);
  assert.ok(rows({ big: 0 }).every(([, h]) => h === list[0][1]));
  const featured = rows({ style: "featured" });
  assert.ok(featured[0][1] > featured[1][1] * 1.8);
});

test("featured puts one big row above two columns that fill downward, the first column first", () => {
  const svg = T.rankingList(source(9), { style: "featured", size: "square", flags });
  const rows = entries(svg).map((g) => ({ x: Number(g.children[0].attrs.x), y: Number(g.children[0].attrs.y), w: Number(g.children[0].attrs.width) }));
  const left = rows.slice(1).filter((r) => r.x === rows[1].x), right = rows.slice(1).filter((r) => r.x !== rows[1].x);
  assert.equal(left.length, 4);
  assert.equal(right.length, 4);
  assert.deepEqual(left.map((r) => r.y), [...left.map((r) => r.y)].sort((a, b) => a - b));
  assert.ok(right[0].x > left[0].x + left[0].w);
  assert.ok(rows[0].w > left[0].w * 1.9, "the big row spans both columns");
  assert.deepEqual(entries(svg).map((g) => firstText(g)[0]), ["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
});

test("on a wide board the big rows stand in a panel beside the compact ones, and split: false stacks them", () => {
  const rows = (o: RankingOptions) => entries(T.rankingList(source(10), { size: "tv", ...o })).map((g) => ({ x: Number(g.children[0].attrs.x), y: Number(g.children[0].attrs.y) }));
  const split = rows({});
  assert.ok(split[3].x > split[0].x + 500 && split[3].y < split[1].y);
  const stacked = rows({ split: false });
  assert.equal(stacked[3].x, stacked[0].x);
  assert.ok(stacked[3].y > stacked[2].y);
  // An upright board never splits.
  assert.equal(entries(T.rankingList(source(10), { size: "tablet-tall" })).map((g) => g.children[0].attrs.x).filter((x, i, a) => a.indexOf(x) === i).length, 1);
});

test("a champion is a gold row marked C above the ranks, an interim champion IC, and the ranks start at 1", () => {
  const svg = T.rankingList(withChampion(), { flags, style: "list" });
  const rows = entries(svg);
  assert.equal(firstText(rows[0])[0], "C");
  assert.match(rows[0].children[0].attrs.class, /rk-medal1/);
  assert.equal(firstText(rows[1])[0], "1");
  assert.equal(firstText(rows[9])[0], "9");
  const interim = T.rankingList({ entries: [{ name: "Aoki Mio", champion: "interim" }, { name: "Other" }] }, { style: "list" });
  assert.equal(firstText(entries(interim)[0])[0], "IC");
  assert.match(T.describeRanking(withChampion()), /Champion, AOKI Mio/);
  assert.match(T.describeRanking({ entries: [{ name: "Aoki", champion: "interim" }] }), /Interim champion, Aoki/);
});

test("movement: arrows with the change in places, NR for the newly ranked, a dash for no change, and rows tinted green or red", () => {
  const svg = T.rankingList(source(10), { size: "portrait", flags });
  const root = parseXml(svg);
  assert.equal(withClass(root, "rk-up").filter((n) => n.name === "polygon").length, 4);
  assert.equal(withClass(root, "rk-down").filter((n) => n.name === "polygon").length, 4);
  assert.ok(texts(svg).includes("12"));
  assert.ok(texts(svg).includes("NR"));
  assert.ok(texts(svg).includes("–"));
  const rowClasses = (movement: RankingOptions["movement"]) => entries(T.rankingList(source(10), { size: "portrait", movement, style: "list" })).map((g) => g.children[0].attrs.class);
  assert.equal(rowClasses("row").filter((c) => c.includes("rk-mup")).length, 4);
  assert.equal(rowClasses("row").filter((c) => c.includes("rk-mdown")).length, 4);
  assert.equal(rowClasses("both").filter((c) => c.includes("rk-mdown")).length, 4);
  assert.equal(rowClasses("arrow").filter((c) => /rk-m(up|down)/.test(c)).length, 0);
  const none = T.rankingList(source(10), { movement: "none" });
  assert.equal(withClass(parseXml(none), "rk-up").length, 0);
  assert.ok(!texts(none).includes("NR"));
  assert.match(T.describeRanking(source(2)), /up 1/);
  assert.match(T.describeRanking(source(2)), /down 1/);
  assert.match(T.describeRanking(source(11).entries.length ? source(11) : source()), /newly ranked/);
});

test("tied ranks show the same number twice, hash style writes #10, and an own rank wins", () => {
  const svg = T.rankingList(source(12), { size: "portrait", rankStyle: "hash", style: "list" });
  const ranks = entries(svg).map((g) => firstText(g)[0]);
  assert.deepEqual(ranks.slice(8, 12), ["#9", "#10", "#10", "#12"]);
  const plain = entries(T.rankingList(source(12), { style: "list", size: "portrait" })).map((g) => firstText(g)[0]);
  assert.deepEqual(plain.slice(8, 12), ["9", "10", "10", "12"]);
  assert.equal(entries(T.rankingList({ entries: [{ name: "A", rank: 5 }, { name: "B" }] }, { style: "list" })).map((g) => firstText(g)[0]).join(), "5,2");
});

test("points are shown to the sport's own precision, or as the text they are", () => {
  const one = (points: number | string, precision?: number) => texts(T.rankingList({ entries: [{ name: "A", points }] }, precision === undefined ? {} : { precision })).filter((x) => /\d/.test(x)).slice(1)[0];
  assert.equal(one(91.6, 2), "91.60");
  assert.equal(one(50, 2), "50.00");
  assert.equal(one(8915, 0), "8,915");
  assert.equal(one(91.6), "91.6");
  assert.equal(one("1st seed"), "1st seed");
  assert.equal(texts(T.rankingList({ entries: [{ name: "A", points: 1234.5 }] }, { precision: 1, locale: "de" })).filter((x) => /\d/.test(x)).slice(1)[0], "1.234,5");
});

test("sort: points puts the most points first and ranks them; categories write each athlete's own category", () => {
  const mixed: RankingEntry[] = [{ name: "Low", points: 10, category: "U15 -50 kg" }, { name: "High", points: 30, category: "U18 -60 kg" }, { name: "Mid", points: 20, category: "U15 -50 kg" }];
  const svg = T.rankingList({ entries: mixed }, { sort: "points", categories: true, size: "portrait" });
  const who = (g: ReturnType<typeof entries>[number]) => ["High", "Mid", "Low"].find((n) => firstText(g).includes(n));
  assert.deepEqual(entries(svg).map(who), ["High", "Mid", "Low"]);
  assert.ok(texts(svg).includes("U18 -60 kg"));
  assert.deepEqual(entries(T.rankingList({ entries: mixed }, { sort: "given" })).map(who), ["Low", "High", "Mid"]);
});

test("paging: rows and page cut the list, say which entries are shown, and the first page keeps the podium", () => {
  const first = T.rankingList(source(15), { rows: 5, flags });
  assert.equal(entries(first).length, 5);
  assert.ok(texts(first).includes("1–5 of 15"));
  assert.match(entries(first)[0].children[0].attrs.class, /medal1/);
  const second = T.rankingList(source(15), { rows: 5, page: 1, flags });
  assert.deepEqual(entries(second).map((g) => firstText(g)[0]), ["6", "7", "8", "9", "10"]);
  assert.ok(texts(second).includes("6–10 of 15"));
  assert.ok(entries(second).every((g) => !/medal/.test(g.children[0].attrs.class)));
  const last = T.rankingList(source(15), { rows: 5, page: 2 });
  assert.ok(texts(last).includes("11–15 of 15"));
  assert.ok(!texts(T.rankingList(source(4), { rows: 5 })).some((x) => /of 4/.test(x)));
  assert.match(T.describeRanking(source(15), { rows: 5, page: 1 }), /^Provincial ranking\. U18 · Men -60 kg\. October 2026\. 6, /);
});

test("with no photo and no flag the rows are text and the flag column is not drawn; badge draws initials", () => {
  const plain: RankingSource = { entries: [{ name: "Alpha One", club: "Cedar Club" }, { name: "Beta Two", club: "Pine Club" }, { name: "Gamma Three" }] };
  const svg = T.rankingList(plain, { style: "list" });
  assert.equal(withClass(parseXml(svg), "tb-mark").length, 0);
  assert.ok(!/<image/.test(svg));
  const badge = T.rankingList(plain, { style: "list", badge: true });
  assert.equal(withClass(parseXml(badge), "tb-mark").length, 3);
  assert.ok(texts(badge).includes("CC"));
  assert.ok(!/photo/i.test(svg));
});

test("an empty list says so, a mark of your own replaces a flag, and square flags are asked for", () => {
  const empty = T.rankingList({ entries: [] });
  assert.equal(wellFormed(empty), null);
  assert.ok(texts(empty).includes("No ranked athletes yet"));
  const asked: string[] = [];
  T.rankingList({ entries: [{ name: "A", flag: "CA-BC" }] }, { flags: (code, r) => { asked.push(`${code}:${r.shape}`); return flags("CA-BC"); }, flagShape: "square" });
  assert.deepEqual(asked, ["CA-BC:square"]);
  const mark = T.rankingList({ entries: [{ name: "A", mark: "https://example.com/emblem.png" }] });
  assert.match(mark, /<image href="https:\/\/example.com\/emblem.png"/);
  const bad = T.rankingList({ entries: [{ name: "A", mark: "javascript:alert(1)", club: "Zed Club" }] }, { badge: true });
  assert.ok(!bad.includes("javascript"));
});

test("hostile text is escaped", () => {
  const svg = T.rankingList({ title: `<script>alert(1)</script>`, category: `"><img src=x>`, entries: [{ name: `<b>&"x"</b>`, club: "<i>", points: "<1>" }] }, { id: `x"><script>` });
  assert.equal(wellFormed(svg), null);
  assert.ok(!/<script|<img|<b>|<i>/.test(svg));
  assert.match(svg, /class="taisen taisen-board x---script-"/);
});

test("the list refuses what cannot be drawn", () => {
  assert.throws(() => T.rankingList({ entries: [{ name: "" }] }), /entry 1 .* needs a name/);
  assert.throws(() => T.rankingList({ entries: [{ name: { surname: " " } }] }), /needs a name/);
  assert.throws(() => T.rankingList({ entries: [{ name: "A", rank: 0 }] }), /rank/);
  assert.throws(() => T.rankingList({ entries: [{ name: "A", rank: 1.5 }] }), /rank/);
  assert.throws(() => T.rankingList({ entries: [{ name: "A", change: 1.5 }] }), /change/);
  assert.throws(() => T.rankingList({ entries: [{ name: "A", change: "up" as never }] }), /change/);
  assert.throws(() => T.rankingList({ entries: [{ name: "A", points: {} as never }] }), /points/);
  assert.throws(() => T.rankingList({} as never), /list of entries/);
  assert.throws(() => T.rankingList(source(), { style: "grid" as never }), /style/);
  assert.throws(() => T.rankingList(source(), { movement: "x" as never }), /movement/);
  assert.throws(() => T.rankingList(source(), { big: 4 }), /big/);
  assert.throws(() => T.rankingList(source(), { rows: 0 }), /rows/);
  assert.throws(() => T.rankingList(source(), { page: -1 }), /page/);
  assert.throws(() => T.rankingList(source(), { precision: 7 }), /precision/);
  assert.throws(() => T.rankingList(source(), { size: { width: 10, height: 10 } }), /size/);
  assert.throws(() => T.rankingList(source(), { theme: "poster" as never }), /theme/);
  assert.throws(() => T.rankingList(source(), { flagShape: "oval" as never }), /flag shape/);
});

test("the list is drawn in every language, light and dark, with no hole left unfilled", () => {
  for (const locale of T.LOCALE_CODES) {
    const svg = T.rankingList({ ...withChampion(), title: undefined, category: T.rankingCategoryLabel(senior.category, locale) }, { locale, flags, precision: 2, rows: 8, page: 0, movement: "both" });
    assert.equal(wellFormed(svg), null, locale);
    assert.ok(!/undefined|\{[a-z]+\}/.test(svg.replace(/<style>[\s\S]*?<\/style>/, "")), locale);
  }
  assert.ok(texts(T.rankingList({ entries: source(3).entries }, { locale: "fr" })).includes("Classement"));
  assert.ok(texts(T.rankingList({ entries: source(3).entries }, { locale: "ja" })).includes("ランキング"));
  for (const theme of ["auto", "light", "dark"] as const) assert.equal(wellFormed(T.rankingList(source(), { theme })), null);
  const auto = T.rankingList(source(3), { theme: "auto" });
  assert.match(auto, /prefers-color-scheme: dark/);
  assert.ok(!/prefers-color-scheme/.test(T.rankingList(source(3), { theme: "dark" })));
  assert.match(T.rankingList(source(3), { theme: "dark" }), /#0b0f17/);
});

test("nothing is stretched: no text is scaled, squeezed to a length or transformed", () => {
  for (const size of ["tv", "phone", "square"] as const) {
    const svg = T.rankingList(source(), { size, flags, precision: 2, movement: "both" });
    assert.ok(!/textLength|lengthAdjust|preserveAspectRatio="none"/.test(svg), size);
    for (const n of walk(parseXml(svg)).filter((x) => x.name === "text")) {
      assert.equal(n.attrs.transform, undefined, `${size}: ${n.text}`);
      assert.equal(n.attrs.style, undefined, `${size}: ${n.text}`);
      assert.ok(Number(n.attrs["font-size"]) >= 9, `${size}: "${n.text}" is ${n.attrs["font-size"]}`);
    }
  }
});

test("every text stays inside the drawing and inside its row, and the texts of a row do not touch, in every size, style and several languages", () => {
  const SIZES = ["tv", "tablet", "tablet-tall", "phone", "square", "portrait", { width: 1000, height: 1000 }, { width: 640, height: 360 }] as const;
  const STYLES: RankingOptions[] = [{}, { style: "list" }, { style: "featured" }, { style: "list", columns: 2 }, { style: "podium", columns: 2, split: false }, { movement: "both", rankStyle: "hash", categories: true }];
  const long = "Maximilian Alexander Konstantinopoulos-Wilhelmsen";
  const bad: string[] = [];
  for (const size of SIZES) for (const locale of ["en", "ja", "de"]) for (const o of STYLES) for (const wide of [false, true]) {
    const list = wide
      ? { ...source(), entries: source().entries.map((e, i) => (i % 3 === 0 ? { ...e, name: long, club: `${long} Judo Club`, points: 123456.789 } : { ...e, category: "U18 · Men -60 kg" })) }
      : source();
    const svg = T.rankingList(list, { size, locale, flags, precision: 2, ...o });
    const root = parseXml(svg);
    const W = typeof size === "string" ? T.BOARD_SIZES[size].width : size.width, H = typeof size === "string" ? T.BOARD_SIZES[size].height : size.height;
    const tag = `${JSON.stringify(size)} ${locale} ${JSON.stringify(o)} ${wide ? "long" : "short"}`;
    for (const node of walk(root).filter((n) => n.name === "text")) {
      const b = textBox(node);
      if (b.x < -0.5 || b.x + b.w > W + 0.5 || b.y < -0.5 || b.y + b.h > H + 0.5) bad.push(`${tag}: "${node.text}" is outside ${W}x${H}`);
    }
    for (const g of withClass(root, "rk-entry")) {
      const r = g.children[0];
      const box = { x: Number(r.attrs.x), y: Number(r.attrs.y), w: Number(r.attrs.width), h: Number(r.attrs.height) };
      const ts = walk(g).filter((n) => n.name === "text").map((n) => ({ n, b: textBox(n) }));
      for (const { n, b } of ts) {
        if (b.x < box.x - 0.5 || b.x + b.w > box.x + box.w + 0.5 || b.y < box.y - 0.5 || b.y + b.h > box.y + box.h + 0.5) bad.push(`${tag}: "${n.text}" leaves its row`);
      }
      ts.forEach(({ n, b }, i) => ts.slice(i + 1).forEach(({ n: m, b: c }) => { if (overlap(b, { ...c, h: c.h * 0.8, y: c.y + c.h * 0.1 }, -1) && overlap({ ...b, h: b.h * 0.8, y: b.y + b.h * 0.1 }, c, -1)) bad.push(`${tag}: "${n.text}" touches "${m.text}"`); }));
    }
  }
  assert.deepEqual(bad.slice(0, 8), [], `${bad.length} problems`);
});
