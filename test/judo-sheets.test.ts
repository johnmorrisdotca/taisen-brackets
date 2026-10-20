// The contest card and the mat queue board: what they show, the order of the contests, the colours of the mats, every size, theme and language, and that nothing sticks out.
import assert from "node:assert/strict";
import { test } from "node:test";
import { FLAGS } from "../demo/flags-data.js";
import * as T from "../src/index.ts";
import type { JudoAthlete, JudoCardContest, JudoMat } from "../src/index.ts";
import { textBox } from "./geometry.ts";
import { wellFormed } from "./helpers.ts";
import { parseXml, walk, withClass } from "./xml.ts";

const flags = (code: string) => (FLAGS as Record<string, string>)[code];
const names: [string, string, string][] = [
  ["Daiki Hoshino", "JPN", "JP"], ["Mathis Roussel", "FRA", "FR"], ["Levan Mtchedlishvili", "GEO", "GE"], ["Min-jae Seong", "KOR", "KR"], ["Rafael Tavares", "BRA", "BR"],
  ["Jasur Rakhimov", "UZB", "UZ"], ["Tomás Zaldívar", "CUB", "CU"], ["Joris van Dijk", "NED", "NL"], ["Emil Hartmann", "GER", "DE"], ["Alonso Caballero", "ESP", "ES"],
];
const athlete = (i: number): JudoAthlete => ({ name: names[i % names.length][0], code: names[i % names.length][1], flag: names[i % names.length][2] });
const mat = (n: number, count: number, start = 1): JudoMat => ({ mat: n, contests: Array.from({ length: count }, (_, i) => ({ number: `G-${start + i}`, white: athlete(i * 2 + n), blue: athlete(i * 2 + n + 1) })) });
const card: JudoCardContest = { white: athlete(0), blue: athlete(1), weight: "Men -66 kg", round: "Final", mat: 1, contest: "G-24" };
const SIZES = ["tv", "tablet", "tablet-tall", { width: 1000, height: 1000 }, { width: 640, height: 360 }] as const;
const texts = (svg: string): string[] => walk(parseXml(svg)).filter((n) => n.name === "text").map((n) => n.text);

test("the contest card shows the category, the round, and the white athlete over the blue one", () => {
  const svg = T.judoContestCard(card, { flags });
  assert.equal(wellFormed(svg), null);
  assert.equal(svg, T.judoContestCard(card, { flags }));
  const t = texts(svg);
  for (const x of ["Men -66 kg", "Final", "Mat 1 · Contest G-24", "Daiki Hoshino", "JPN", "Mathis Roussel", "FRA"]) assert.ok(t.includes(x), x);
  assert.deepEqual(withClass(parseXml(svg), "jb-pink").map((n) => n.text), ["Daiki Hoshino", "Mathis Roussel"]);
  assert.deepEqual(withClass(parseXml(T.judoContestCard(card, { swap: true })), "jb-pink").map((n) => n.text), ["Mathis Roussel", "Daiki Hoshino"]);
  assert.equal((svg.match(/<symbol /g) ?? []).length, 2);
  assert.match(svg, /<title id="[^"]+">Judo contest card<\/title>/);
  assert.equal(T.describeJudoCard(card), "Men -66 kg. Final. Mat 1. Contest G-24. white: Daiki Hoshino (JPN). blue: Mathis Roussel (FRA).");
});

test("the card and the board refuse what cannot be drawn", () => {
  assert.throws(() => T.judoContestCard({ ...card, white: { name: " " } }), /white athlete needs a name/);
  assert.throws(() => T.judoContestCard(card, { size: { width: 50, height: 50 } }), /size/);
  assert.throws(() => T.judoContestCard(card, { theme: "poster" as never }), /theme/);
  assert.throws(() => T.judoMatQueue([]), /at least one mat/);
  assert.throws(() => T.judoMatQueue(Array.from({ length: 9 }, (_, i) => mat(i + 1, 1))), /eight mats/);
  assert.throws(() => T.judoMatQueue({ mat: "", contests: [] }), /needs a number/);
  assert.throws(() => T.judoMatQueue({ ...mat(1, 1), color: "red" }), /hex code/);
  assert.throws(() => T.judoMatQueue({ mat: 1, contests: [{ number: "", white: athlete(0), blue: athlete(1) }] }), /needs a number/);
  assert.throws(() => T.judoMatQueue({ mat: 1, contests: [{ number: "G-1", white: { name: "" }, blue: athlete(1) }] }), /needs a name/);
  assert.throws(() => T.judoMatQueue(mat(1, 2), { rows: 0 }), /rows/);
  assert.throws(() => T.judoMatQueue(mat(1, 2), { colors: ["blue"] }), /hex code/);
});

test("the queue lists each mat's contests in order, with the number, the white athlete and the blue one", () => {
  const svg = T.judoMatQueue([mat(1, 3), mat(2, 2, 10)], { flags });
  assert.equal(wellFormed(svg), null);
  const t = texts(svg);
  assert.deepEqual(t.filter((x) => /^G-\d+$/.test(x)), ["G-1", "G-2", "G-3", "G-10", "G-11"]);
  // The mat numbers, and for each row the white name before the blue one.
  assert.ok(t.includes("1") && t.includes("2"));
  const root = parseXml(svg);
  const rows = withClass(root, "jq-mat");
  assert.equal(rows.length, 2);
  const first = withClass(rows[0], "jb-pink").map((n) => n.text);
  assert.deepEqual(first.slice(0, 2), [athlete(1).name, athlete(2).name]);
  assert.match(svg, /Mat 1/);
  assert.equal(svg, T.judoMatQueue([mat(1, 3), mat(2, 2, 10)], { flags }));
});

test("the first contest of a mat is the one on now, unless current is off; swap puts blue first", () => {
  const now = (o: Parameters<typeof T.judoMatQueue>[1]) => withClass(parseXml(T.judoMatQueue(mat(1, 4), o)), "jq-now").length;
  assert.equal(now({}), 1);
  assert.equal(now({ current: false }), 0);
  const swapped = withClass(parseXml(T.judoMatQueue(mat(1, 1), { swap: true })), "jb-pink").map((n) => n.text);
  assert.deepEqual(swapped, [athlete(2).name, athlete(1).name]);
});

test("the mats take the colours in turn, or the colour they name, and the number reads on it", () => {
  const svg = T.judoMatQueue([mat(1, 1), mat(2, 1), { ...mat(3, 1), color: "#fff200" }, mat(4, 1)]);
  const fills = [...svg.matchAll(/<rect x="[\d.]+" y="[\d.]+" width="[\d.]+" height="[\d.]+" rx="\d+" style="fill:(#[0-9a-f]{3,6})"\/>/g)].map((m) => m[1]);
  assert.deepEqual(fills, ["#d2232a", "#1e9c4c", "#fff200", "#7a3fb4"]);
  // Dark letters on the yellow, white on the red.
  const inks = [...svg.matchAll(/font-weight="800" text-anchor="middle" style="fill:(#[0-9a-f]{6})">\d+<\/text><\/g>/g)].map((m) => m[1]);
  assert.deepEqual(inks, ["#ffffff", "#ffffff", "#15181a", "#ffffff"]);
  assert.deepEqual(T.JUDO_MAT_COLORS.length, 6);
  assert.ok(T.judoMatQueue(mat(1, 1), { colors: ["#112233"] }).includes("fill:#112233"));
});

test("rows limits the contests drawn for a mat, and a mat with none is a bare strip", () => {
  const count = (svg: string) => texts(svg).filter((x) => /^G-\d+$/.test(x)).length;
  assert.equal(count(T.judoMatQueue(mat(1, 30), { rows: 5 })), 5);
  assert.ok(count(T.judoMatQueue(mat(1, 30))) <= 12);
  assert.equal(count(T.judoMatQueue(mat(1, 0))), 0);
  assert.equal(wellFormed(T.judoMatQueue(mat(1, 0))), null);
});

test("the contest card and the queue are drawn in every language and look", () => {
  for (const locale of T.LOCALE_CODES) {
    for (const svg of [T.judoContestCard(card, { locale, flags }), T.judoMatQueue([mat(1, 3), mat(2, 3)], { locale, flags })]) {
      assert.equal(wellFormed(svg), null, locale);
      assert.ok(!/undefined|\{[a-z]+\}/.test(svg.replace(/<style>[\s\S]*?<\/style>/, "")), locale);
    }
  }
  assert.match(T.judoMatQueue(mat(1, 1), { locale: "fr" }), /Prochains combats par tapis/);
  assert.match(T.judoContestCard(card, { locale: "es" }), /Ficha de un combate de judo/);
  for (const theme of ["auto", "light", "dark"] as const) assert.equal(wellFormed(T.judoMatQueue(mat(1, 2), { theme })), null);
  assert.ok(!/prefers-color-scheme/.test(T.judoMatQueue(mat(1, 2), { theme: "light" })));
});

for (const [what, make] of [
  ["contest card", (size: (typeof SIZES)[number], locale: string, long: boolean) => T.judoContestCard({ ...card, white: long ? { name: "Maximilian Alexander Konstantinopoulos-Wilhelmsen", code: "GBR" } : card.white }, { size, locale, flags })],
  ["queue of one mat", (size: (typeof SIZES)[number], locale: string, long: boolean) => T.judoMatQueue({ mat: 1, contests: mat(1, 14).contests.map((c, i) => (long && i === 0 ? { ...c, white: { name: "Maximilian Alexander Konstantinopoulos-Wilhelmsen", code: "GBR" } } : c)) }, { size, locale, flags })],
  ["queue of five mats", (size: (typeof SIZES)[number], locale: string, long: boolean) => T.judoMatQueue([1, 2, 3, 4, 5].map((n) => mat(n, 9, n * 10)).map((m, i) => (long && i === 0 ? { ...m, contests: m.contests.map((c, j) => (j === 0 ? { ...c, blue: { name: "李明", code: "CHN" } } : c)) } : m)), { size, locale, flags })],
] as const) {
  test(`the ${what} keeps every text inside the drawing, in every size and several languages`, () => {
    const bad: string[] = [];
    for (const size of SIZES) for (const locale of ["en", "ja", "fr", "de"]) for (const long of [false, true]) {
      const svg = make(size, locale, long);
      const W = typeof size === "string" ? T.JUDO_BOARD_SIZES[size].width : size.width, H = typeof size === "string" ? T.JUDO_BOARD_SIZES[size].height : size.height;
      for (const node of walk(parseXml(svg)).filter((n) => n.name === "text")) {
        const b = textBox(node);
        if (b.x < -0.5 || b.x + b.w > W + 0.5 || b.y < -0.5 || b.y + b.h > H + 0.5) bad.push(`${JSON.stringify(size)} ${locale}: "${node.text}" is outside ${W}x${H}`);
      }
    }
    assert.deepEqual(bad.slice(0, 6), [], `${bad.length} problems`);
  });
}

test("a name in the queue stays inside the side of its row", () => {
  const bad: string[] = [];
  for (const size of SIZES) {
    const svg = T.judoMatQueue([mat(1, 6), mat(2, 6)], { size, flags });
    const root = parseXml(svg);
    for (const g of withClass(root, "jq-mat")) {
      const sides = g.children.filter((c) => c.name === "g" && /jb-(w|b)/.test(c.attrs.class ?? ""));
      for (const side of sides) {
        const panel = side.children.find((c) => (c.attrs.class ?? "").includes("jb-panel"))!;
        const box = { x: Number(panel.attrs.x), y: Number(panel.attrs.y), w: Number(panel.attrs.width), h: Number(panel.attrs.height) };
        for (const t of walk(side).filter((n) => n.name === "text")) {
          const b = textBox(t);
          if (b.x < box.x - 0.5 || b.x + b.w > box.x + box.w + 0.5) bad.push(`${JSON.stringify(size)}: "${t.text}" leaves its side`);
        }
      }
    }
  }
  assert.deepEqual(bad.slice(0, 6), [], `${bad.length} problems`);
});
