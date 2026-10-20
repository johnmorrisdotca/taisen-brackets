// The road to the final of a judoka: the wins read from a bracket, and the panel that draws them.
import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "../demo/data.js";
import { FLAGS } from "../demo/flags-data.js";
import * as T from "../src/index.ts";
import type { BracketInput, JudoRoadSource, Matchup, Team } from "../src/index.ts";
import { textBox } from "./geometry.ts";
import { wellFormed } from "./helpers.ts";
import { parseXml, walk, withClass } from "./xml.ts";

const flags = (code: string) => (FLAGS as Record<string, string>)[code];
const judo66 = build(T, FLAGS).judo66 as BracketInput;
const lines = (id: string, o: Parameters<typeof T.judoWins>[2] = {}) => T.judoWins(judo66, id, o).map((w) => `${w.round}|${w.opponent?.name ?? "-"}|${w.how}`);

test("the wins of the champion are every contest of the tree, oldest first, with how each was won", () => {
  assert.deepEqual(lines("J01"), [
    "Round of 16|Balázs Kertész|ippon · 1:12",
    "Quarter-finals|Emil Hartmann|ippon · 2:30",
    "Semi-finals|Rafael Tavares|ippon · 3:21",
    "Final|Jasur Rakhimov|decision · GS · 7:02",
  ]);
});

test("a bronze medallist's wins include the repechage and the bronze medal contest, named as such", () => {
  assert.deepEqual(lines("J02"), [
    "Round of 16|Marcus Whitfield|ippon · 0:48",
    "Quarter-finals|Alonso Caballero|decision · GS · 6:05",
    "Bronze medal contest|Min-jae Seong|ippon · 3:40",
  ]);
  const four = lines("J04");
  assert.equal(four.at(-1), "Repechage|Emil Hartmann|ippon · 2:05");
});

test("a default is a win, and a win by a score with no judo result is the score", () => {
  assert.ok(lines("J03")[0].endsWith("|fusen-gachi"));
  const plain = T.judoWins([{ id: "a", round: 1, sides: ["A", "B"], score: [3, 1] }, { id: "b", round: 2, sides: ["A", "C"], score: [2, 0] }], "A");
  assert.deepEqual(plain.map((w) => [w.round, w.opponent?.name, w.how]), [["Semi-finals", "B", "3–1"], ["Final", "C", "2–0"]]);
});

test("a bye is a row for each round skipped at the start, unless byes are off", () => {
  const teams: Team[] = Array.from({ length: 12 }, (_, i) => ({ id: `T${i + 1}`, name: `Athlete ${i + 1}`, seed: i + 1 }));
  const made = T.judoBracket(teams);
  let m: Matchup[] = made.matchups;
  for (let pass = 0; pass < 30; pass++) {
    m = T.advanceWinners(m);
    const i = m.findIndex((x) => x.judo === undefined && x.sides[0] !== null && x.sides[1] !== null);
    if (i < 0) break;
    const lowerFirst = Number(String(typeof m[i].sides[0] === "object" ? (m[i].sides[0] as Team).id : m[i].sides[0]).slice(1)) < Number(String(typeof m[i].sides[1] === "object" ? (m[i].sides[1] as Team).id : m[i].sides[1]).slice(1));
    m = m.map((q, k) => (k === i ? { ...q, judo: { sides: lowerFirst ? [{ ippon: true }, {}] : [{}, { ippon: true }] } } : q));
  }
  const wins = T.judoWins({ matchups: m, teams: made.teams }, "T1");
  assert.equal(wins[0].bye, true);
  assert.equal(wins[0].how, "bye");
  assert.equal(wins.filter((w) => w.bye).length, 1);
  assert.equal(T.judoWins({ matchups: m, teams: made.teams }, "T1", { byes: false }).some((w) => w.bye), false);
});

test("the athlete is mapped with the code, and the language names the rounds", () => {
  const coded = T.judoWins(judo66, "J01", { athlete: (t) => ({ name: t.name.toUpperCase(), code: t.code }) });
  assert.equal(coded[0].opponent?.name, "BALÁZS KERTÉSZ");
  assert.equal(coded[0].opponent?.code, "HUN");
  assert.equal(T.judoWins(judo66, "J01")[0].opponent?.code, "HUN");
  assert.equal(lines("J01", { locale: "fr" })[3].split("|")[0], "Finale");
  assert.equal(lines("J02", { locale: "fr" })[2].split("|")[0], "Combat pour la médaille de bronze");
  assert.throws(() => T.judoWins(judo66, "nobody"), /not in the bracket/);
});

const A = { name: "Daiki Hoshino", code: "JPN", flag: "JP", coach: "Yuki Mori" };
const source = (): JudoRoadSource => ({ athlete: A, wins: T.judoWins(judo66, "J01") });
const texts = (svg: string) => walk(parseXml(svg)).filter((n) => n.name === "text").map((n) => n.text);

test("the panel shows the athlete and the wins, most recent first (or oldest first)", () => {
  const svg = T.judoRoadPanel(source(), { flags, weight: "Men -66 kg" });
  assert.equal(wellFormed(svg), null);
  assert.equal(svg, T.judoRoadPanel(source(), { flags, weight: "Men -66 kg" }));
  const t = texts(svg);
  for (const x of ["Road to the final", "Men -66 kg", "JPN", "Coach: Yuki Mori"]) assert.ok(t.includes(x), x);
  assert.ok(t.join(" ").includes("Daiki") && t.join(" ").includes("Hoshino"));
  const order = (o: Parameters<typeof T.judoRoadPanel>[1]) => withClass(parseXml(T.judoRoadPanel(source(), o)), "jr-win").map((g) => walk(g).filter((n) => n.name === "text")[0].text);
  assert.deepEqual(order({}), ["FINAL", "SEMI-FINALS", "QUARTER-FINALS", "ROUND OF 16"]);
  assert.deepEqual(order({ order: "first" }), ["ROUND OF 16", "QUARTER-FINALS", "SEMI-FINALS", "FINAL"]);
  assert.equal(order({ rows: 2 }).length, 2);
  assert.match(svg, /<title id="[^"]+">Road to the final<\/title>/);
  assert.equal(T.describeJudoRoad(source(), { weight: "Men -66 kg" }), "Road to the final: Daiki Hoshino (JPN). Men -66 kg. Final: Jasur Rakhimov (decision · GS · 7:02). Semi-finals: Rafael Tavares (ippon · 3:21). Quarter-finals: Emil Hartmann (ippon · 2:30). Round of 16: Balázs Kertész (ippon · 1:12).");
});

test("the athlete's block takes the colour of a judogi, and the coach can be left out", () => {
  assert.equal(withClass(parseXml(T.judoRoadPanel(source())), "jb-b").length, 1);
  assert.equal(withClass(parseXml(T.judoRoadPanel(source(), { side: "white" })), "jb-w").length, 1);
  assert.ok(!texts(T.judoRoadPanel(source(), { coach: false })).some((x) => x.includes("Yuki Mori")));
  assert.throws(() => T.judoRoadPanel(source(), { side: "red" as never }), /side/);
});

test("a bye is a quiet row; an athlete with no win yet is only the block", () => {
  const bye = T.judoRoadPanel({ athlete: A, wins: [{ round: "Round of 16", how: "bye", bye: true }, { round: "Quarter-finals", opponent: { name: "Emil Hartmann", code: "GER" }, how: "ippon · 2:30" }] });
  assert.equal(withClass(parseXml(bye), "jr-bye").length, 1);
  assert.ok(texts(bye).includes("BYE"));
  const none = T.judoRoadPanel({ athlete: A, wins: [] });
  assert.equal(wellFormed(none), null);
  assert.equal(withClass(parseXml(none), "jr-win").length, 0);
});

test("the panel refuses what cannot be drawn", () => {
  assert.throws(() => T.judoRoadPanel({ athlete: { name: "" }, wins: [] }), /needs a name/);
  assert.throws(() => T.judoRoadPanel({ athlete: A, wins: [{ round: "", how: "" }] }), /needs a round/);
  assert.throws(() => T.judoRoadPanel(source(), { rows: 0 }), /rows/);
  assert.throws(() => T.judoRoadPanel(source(), { size: { width: 10, height: 10 } }), /size/);
});

test("the panel is drawn in every language, light and dark", () => {
  for (const locale of T.LOCALE_CODES) {
    const svg = T.judoRoadPanel({ athlete: A, wins: T.judoWins(judo66, "J02", { locale }) }, { locale, flags });
    assert.equal(wellFormed(svg), null, locale);
    assert.ok(!/undefined|\{[a-z]+\}/.test(svg.replace(/<style>[\s\S]*?<\/style>/, "")), locale);
  }
  assert.ok(texts(T.judoRoadPanel(source(), { locale: "fr" })).includes("Parcours vers la finale"));
  for (const theme of ["auto", "light", "dark"] as const) assert.equal(wellFormed(T.judoRoadPanel(source(), { theme })), null);
});

test("every text of the panel stays inside the drawing and every opponent inside its row, in every size and several languages", () => {
  const SIZES = ["tv", "tablet", "tablet-tall", { width: 1000, height: 1000 }, { width: 640, height: 360 }] as const;
  const bad: string[] = [];
  for (const size of SIZES) for (const locale of ["en", "ja", "fr", "de"]) for (const long of [false, true]) {
    const wins = T.judoWins(judo66, "J02", { locale }).map((w, i) => (long && i === 0 && w.opponent ? { ...w, opponent: { ...w.opponent, name: "Maximilian Alexander Konstantinopoulos-Wilhelmsen" } } : w));
    const svg = T.judoRoadPanel({ athlete: long ? { ...A, name: "Maximilian Alexander Konstantinopoulos-Wilhelmsen" } : A, wins }, { size, locale, flags, weight: "Men -66 kg" });
    const root = parseXml(svg);
    const W = typeof size === "string" ? T.JUDO_BOARD_SIZES[size].width : size.width, H = typeof size === "string" ? T.JUDO_BOARD_SIZES[size].height : size.height;
    for (const node of walk(root).filter((n) => n.name === "text")) {
      const b = textBox(node);
      if (b.x < -0.5 || b.x + b.w > W + 0.5 || b.y < -0.5 || b.y + b.h > H + 0.5) bad.push(`${JSON.stringify(size)} ${locale}: "${node.text}" is outside ${W}x${H}`);
    }
    for (const g of withClass(root, "jr-win")) {
      const row = g.children[0];
      const box = { x: Number(row.attrs.x), w: Number(row.attrs.width) };
      for (const t of walk(g).filter((n) => n.name === "text")) {
        const b = textBox(t);
        if (b.x < box.x - 0.5 || b.x + b.w > box.x + box.w + 0.5) bad.push(`${JSON.stringify(size)} ${locale}: "${t.text}" leaves its row`);
      }
    }
  }
  assert.deepEqual(bad.slice(0, 6), [], `${bad.length} problems`);
});
