// The head-to-head card: the two athletes, the record, the meetings in order and who won each, every size, theme and language, and that every text sits inside its panel or row.
import assert from "node:assert/strict";
import { test } from "node:test";
import { FLAGS } from "../demo/flags-data.js";
import { RANKING_SAMPLE } from "../demo/data/ranking-sample.js";
import * as T from "../src/index.ts";
import type { MatchupSource } from "../src/index.ts";
import { overlap, textBox } from "./geometry.ts";
import { wellFormed } from "./helpers.ts";
import { parseXml, walk, withClass } from "./xml.ts";

const flags = (code: string) => (FLAGS as Record<string, string>)[code];
const m = RANKING_SAMPLE.matchup;
const source = (): MatchupSource => ({ category: m.category, date: "Final", a: m.a, b: m.b, meetings: m.meetings, source: RANKING_SAMPLE.source });
const texts = (svg: string): string[] => walk(parseXml(svg)).filter((n) => n.name === "text").map((n) => n.text);
const rowTexts = (g: ReturnType<typeof withClass>[number]) => walk(g).filter((n) => n.name === "text").map((n) => n.text);

test("the record counts each athlete's wins; a draw is in neither", () => {
  assert.deepEqual(T.matchupRecord(m.meetings), [3, 2]);
  assert.deepEqual(T.matchupRecord([]), [0, 0]);
  assert.deepEqual(T.matchupRecord(), [0, 0]);
  assert.deepEqual(T.matchupRecord([{ winner: null }, {}, { winner: 1 }]), [0, 1]);
});

test("the card shows both athletes with ranking and points, the record and every meeting", () => {
  const svg = T.rankingMatchup(source(), { flags, precision: 2 });
  assert.equal(wellFormed(svg), null);
  assert.equal(svg, T.rankingMatchup(source(), { flags, precision: 2 }));
  const t = texts(svg);
  for (const x of ["Head to head", "U18 · Men -60 kg", "Final", "NAKAMURA Kenji", "BRAR Harpreet", "Coastal Pine Judo", "Salmonberry Judo Club", "412.50", "398.00", "VS", "PREVIOUS MEETINGS", "3", "2", "ippon · 2:11"]) assert.ok(t.includes(x), x);
  const root = parseXml(svg);
  assert.equal(withClass(root, "rk-panel").length, 2);
  assert.equal(withClass(root, "rk-meeting").length, 6);
  assert.match(svg, /data-board="matchup"/);
  assert.match(svg, /<title id="[^"]+">Head to head: NAKAMURA Kenji – BRAR Harpreet<\/title>/);
  // The panels are in the sides' colours, and a meeting's winner is marked in his side's.
  assert.equal(withClass(root, "rk-sa").filter((n) => n.name === "rect").length, 1);
  assert.equal(withClass(root, "rk-sb").filter((n) => n.name === "rect").length, 1);
  const winners = withClass(root, "rk-meeting").map((g) => walk(g).find((n) => n.name === "circle")?.attrs.class ?? "none");
  assert.deepEqual(winners, ["rk-sa", "rk-sb", "rk-sa", "rk-sa", "rk-sb", "none"]);
});

test("the meetings are written in the order given, with the date the language's way, and a meeting with no winner has a dash", () => {
  const rows = withClass(parseXml(T.rankingMatchup(source(), { flags, size: "tv" })), "rk-meeting").map(rowTexts);
  assert.deepEqual(rows[0], ["Sep 13, 2026", "Fall Open · Semi-final", "NAKAMURA Kenji", "ippon · 2:11"]);
  assert.deepEqual(rows[5], ["Mar 1, 2025", "Winter Cup · Semi-final", "–", "no contest"]);
  const fr = withClass(parseXml(T.rankingMatchup(source(), { locale: "fr", size: "tv" })), "rk-meeting").map(rowTexts);
  assert.match(fr[0][0], /13 sept\. 2026/);
  assert.equal(withClass(parseXml(T.rankingMatchup({ ...source(), meetings: [{ date: "last spring", winner: 0 }] })), "rk-meeting").map(rowTexts)[0][0], "last spring");
});

test("with no meetings the card says so, and rows cut a long list and count the rest", () => {
  const none = T.rankingMatchup({ ...source(), meetings: [] }, { flags });
  assert.ok(texts(none).includes("No previous meetings"));
  assert.equal(withClass(parseXml(none), "rk-meeting").length, 0);
  assert.ok(!texts(none).includes("PREVIOUS MEETINGS"));
  const cut = T.rankingMatchup(source(), { rows: 2 });
  assert.equal(withClass(parseXml(cut), "rk-meeting").length, 2);
  assert.ok(texts(cut).includes("+4 more"));
  assert.ok(texts(cut).includes("3") && texts(cut).includes("2"), "the record counts them all");
  const many = { ...source(), meetings: Array.from({ length: 40 }, (_, i) => ({ date: "2026-01-01", winner: (i % 2) as 0 | 1, result: "ippon" })) };
  const crowded = T.rankingMatchup(many, { size: "tablet" });
  assert.ok(withClass(parseXml(crowded), "rk-meeting").length < 40);
  assert.ok(texts(crowded).some((x) => /^\+\d+ more$/.test(x)));
});

test("an athlete with no ranking says NR, ranking style and name style are the list's, and the description is a sentence", () => {
  const svg = T.rankingMatchup({ ...source(), b: { ...m.b, rank: undefined } }, { rankStyle: "hash", nameStyle: "given-first" });
  const t = texts(svg);
  assert.ok(t.includes("#1") && t.includes("NR") && t.includes("Kenji NAKAMURA"));
  assert.match(T.describeMatchup(source(), { precision: 2 }), /^Head to head: NAKAMURA Kenji v BRAR Harpreet\. U18 · Men -60 kg\. Final\. NAKAMURA Kenji, Ranking 1, 412\.50 points\. BRAR Harpreet, Ranking 2, 398\.00 points\. Previous meetings 3–2\. Sep 13, 2026, Fall Open Semi-final, NAKAMURA Kenji, ippon · 2:11\./);
});

test("the card refuses what cannot be drawn", () => {
  assert.throws(() => T.rankingMatchup(undefined as never), /two athletes/);
  assert.throws(() => T.rankingMatchup({ ...source(), a: { name: "" } }), /athlete a .* needs a name/);
  assert.throws(() => T.rankingMatchup({ ...source(), b: { name: { surname: " " } } }), /athlete b .* needs a name/);
  assert.throws(() => T.rankingMatchup({ ...source(), a: { name: "A", rank: 0 } }), /ranking/);
  assert.throws(() => T.rankingMatchup({ ...source(), meetings: [{ winner: 2 as never }] }), /meeting 1/);
  assert.throws(() => T.rankingMatchup(source(), { rows: 0 }), /rows/);
  assert.throws(() => T.rankingMatchup(source(), { size: { width: 10, height: 10 } }), /size/);
  assert.throws(() => T.rankingMatchup(source(), { theme: "poster" as never }), /theme/);
});

test("the card is drawn in every language, light and dark, with no hole left unfilled, and nothing is stretched", () => {
  for (const locale of T.LOCALE_CODES) {
    const svg = T.rankingMatchup(source(), { locale, flags });
    assert.equal(wellFormed(svg), null, locale);
    assert.ok(!/undefined|\{[a-z]+\}/.test(svg.replace(/<style>[\s\S]*?<\/style>/, "")), locale);
  }
  assert.ok(texts(T.rankingMatchup(source(), { locale: "fr" })).includes("Face-à-face"));
  assert.ok(texts(T.rankingMatchup(source(), { locale: "ja" })).includes("直接対決"));
  for (const theme of ["auto", "light", "dark"] as const) assert.equal(wellFormed(T.rankingMatchup(source(), { theme })), null);
  const svg = T.rankingMatchup(source(), { size: "phone" });
  assert.ok(!/textLength|lengthAdjust/.test(svg));
  for (const n of walk(parseXml(svg)).filter((x) => x.name === "text")) {
    assert.equal(n.attrs.transform, undefined);
    assert.ok(Number(n.attrs["font-size"]) >= 9, `"${n.text}" is ${n.attrs["font-size"]}`);
  }
});

test("every text stays inside the drawing and its own panel or row, and no two texts of one touch, in every size and several languages", () => {
  const SIZES = ["tv", "tablet", "tablet-tall", "phone", "square", "portrait", { width: 1000, height: 1000 }, { width: 640, height: 360 }] as const;
  const long = "Maximilian Alexander Konstantinopoulos-Wilhelmsen";
  const bad: string[] = [];
  for (const size of SIZES) for (const locale of ["en", "ja", "de"]) for (const wide of [false, true]) {
    const src: MatchupSource = wide
      ? { ...source(), a: { ...m.a, name: long, club: `${long} Judo Club`, points: 123456.789 }, b: { ...m.b, name: long }, meetings: m.meetings.map((x) => ({ ...x, event: `${long} Invitational Tournament`, result: "waza-ari awasete ippon · golden score · 12:34" })) }
      : source();
    const svg = T.rankingMatchup(src, { size, locale, flags, precision: 2 });
    const root = parseXml(svg);
    const { width: W, height: H } = typeof size === "string" ? T.BOARD_SIZES[size] : size;
    const tag = `${JSON.stringify(size)} ${locale} ${wide ? "long" : "short"}`;
    for (const n of walk(root).filter((x) => x.name === "text")) {
      const b = textBox(n);
      if (b.x < -0.5 || b.x + b.w > W + 0.5 || b.y < -0.5 || b.y + b.h > H + 0.5) bad.push(`${tag}: "${n.text}" is outside ${W}x${H}`);
    }
    for (const cls of ["rk-panel", "rk-meeting"]) for (const g of withClass(root, cls)) {
      const r = g.children[0];
      const box = { x: Number(r.attrs.x), y: Number(r.attrs.y), w: Number(r.attrs.width), h: Number(r.attrs.height) };
      const ts = walk(g).filter((n) => n.name === "text").map((n) => ({ n, b: textBox(n) }));
      for (const { n, b } of ts) if (b.x < box.x - 0.5 || b.x + b.w > box.x + box.w + 0.5 || b.y < box.y - 0.5 || b.y + b.h > box.y + box.h + 0.5) bad.push(`${tag}: "${n.text}" leaves its ${cls}`);
      ts.forEach(({ n, b }, i) => ts.slice(i + 1).forEach(({ n: o, b: c }) => { if (overlap({ ...b, h: b.h * 0.7, y: b.y + b.h * 0.15 }, { ...c, h: c.h * 0.7, y: c.y + c.h * 0.15 }, -1)) bad.push(`${tag}: "${n.text}" touches "${o.text}" in ${cls}`); }));
    }
  }
  assert.deepEqual(bad.slice(0, 8), [], `${bad.length} problems`);
});
