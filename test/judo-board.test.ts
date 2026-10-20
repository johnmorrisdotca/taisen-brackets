// The scoreboard of a judo contest: the state it shows, both styles, every size, light and dark, five languages, and that nothing sticks out of its panel or the canvas.
import assert from "node:assert/strict";
import { test } from "node:test";
import { FLAGS } from "../demo/flags-data.js";
import * as T from "../src/index.ts";
import type { JudoBoardOptions, JudoContest } from "../src/index.ts";
import { textBox } from "./geometry.ts";
import { wellFormed } from "./helpers.ts";
import { parseXml, walk, withClass, type Node } from "./xml.ts";

const flags = (code: string) => (FLAGS as Record<string, string>)[code];
const contest: JudoContest = {
  white: { name: "Daiki Hoshino", code: "JPN", flag: "JP", coach: "Yuki Mori" },
  blue: { name: "Mathis Roussel", code: "FRA", flag: "FR", coach: "Alain Lefort" },
  sides: [{ wazaAri: 1, shido: 1 }, { yuko: 2, shido: 2 }],
  clock: "2:14",
  osaekomi: { side: 0, seconds: 12 },
  weight: "Men -66 kg",
  round: "Final",
  mat: 1,
  contest: "G-24",
};
const SIZES = ["tv", "tablet", "tablet-tall", { width: 1000, height: 1000 }, { width: 640, height: 360 }] as const;

test("a scoreboard is a well-formed, deterministic drawing with a title and a description", () => {
  const svg = T.judoScoreboard(contest, { flags });
  assert.equal(wellFormed(svg), null);
  assert.equal(svg, T.judoScoreboard(contest, { flags }));
  assert.match(svg, /<title id="[^"]+">Judo contest scoreboard<\/title>/);
  const desc = T.describeJudoContest(contest);
  assert.equal(desc, "Men -66 kg. Final. Mat 1. Contest G-24. white: Daiki Hoshino (JPN), waza-ari, Shido: 1 shido. blue: Mathis Roussel (FRA), 2 yuko, Shido: 2 shido. 2:14. Osaekomi 12 (white).");
  assert.ok(svg.includes(`<desc id=`) && svg.includes("Daiki Hoshino (JPN), waza-ari"));
});

test("the sizes: a TV's, a tablet's both ways, and one of your own; a bad size or style is a RangeError", () => {
  assert.deepEqual(T.JUDO_BOARD_SIZES, { tv: { width: 1920, height: 1080 }, tablet: { width: 1280, height: 800 }, "tablet-tall": { width: 800, height: 1280 } });
  assert.match(T.judoScoreboard(contest, { size: "tablet" }), /viewBox="0 0 1280 800"/);
  assert.match(T.judoScoreboard(contest, { size: "tablet-tall" }), /viewBox="0 0 800 1280"/);
  assert.throws(() => T.judoScoreboard(contest, { size: { width: 100, height: 100 } }), /scoreboard size/);
  assert.throws(() => T.judoScoreboard(contest, { style: "led" as never }), /"board" or "flip"/);
  assert.throws(() => T.judoScoreboard(contest, { theme: "poster" as never }), /theme/);
});

test("the state is checked: two ippon, a third waza-ari, a bad clock and a bad osaekomi are refused", () => {
  assert.throws(() => T.judoScoreboard({ ...contest, sides: [{ ippon: true }, { ippon: true }] }), /both sides/);
  assert.throws(() => T.judoScoreboard({ ...contest, sides: [{ wazaAri: 3 }, {}] }), /waza-ari/);
  assert.throws(() => T.judoScoreboard({ ...contest, clock: "4:75" }), /m:ss/);
  assert.throws(() => T.judoScoreboard({ ...contest, osaekomi: { side: 2 as never, seconds: 3 } }), /osaekomi/);
});

const texts = (svg: string): string[] => walk(parseXml(svg)).filter((n) => n.name === "text").map((n) => n.text);

test("the counters show what was scored; the clock, golden score and the osaekomi seconds are drawn", () => {
  const t = texts(T.judoScoreboard(contest, { flags }));
  assert.ok(t.includes("2:14") && t.includes("12"));
  assert.ok(t.includes("IPPON") && t.includes("WAZA-ARI") && t.includes("YUKO") && t.includes("SHIDO") && t.includes("OSAEKOMI"));
  assert.ok(!t.includes("GOLDEN SCORE"));
  assert.ok(texts(T.judoScoreboard({ ...contest, goldenScore: true })).includes("GOLDEN SCORE"));
  // The osaekomi past 20 seconds is the ippon's 20; none draws a dash.
  assert.ok(texts(T.judoScoreboard({ ...contest, osaekomi: { side: 1, seconds: 31 } })).includes("20"));
  assert.ok(texts(T.judoScoreboard({ ...contest, osaekomi: undefined })).includes("–"));
  assert.ok(texts(T.judoScoreboard({ ...contest, clock: undefined })).includes("–:––"));
});

test("the shido cards: a yellow one each, a red third; a direct hansoku-make is red on the side given it", () => {
  const count = (svg: string, cls: string) => withClass(parseXml(svg), cls).length;
  const a = T.judoScoreboard({ ...contest, sides: [{ shido: 1 }, { shido: 2 }] });
  assert.deepEqual([count(a, "jb-sy"), count(a, "jb-sr")], [3, 0]);
  const b = T.judoScoreboard({ ...contest, sides: [{ shido: 3 }, {}] });
  assert.deepEqual([count(b, "jb-sy"), count(b, "jb-sr")], [2, 1]);
  const c = T.judoScoreboard({ ...contest, sides: [{}, {}], hansokuMake: 0 });
  assert.deepEqual([count(c, "jb-sy"), count(c, "jb-sr")], [0, 1]);
});

test("the winner is shown when something ended the contest: ippon at once, a lead only once finished", () => {
  const winnerText = (c: JudoContest) => texts(T.judoScoreboard(c)).find((x) => x.startsWith("Winner:"));
  assert.equal(winnerText(contest), undefined);
  assert.equal(winnerText({ ...contest, sides: [{ ippon: true }, {}] }), "Winner: Daiki Hoshino · ippon");
  assert.equal(winnerText({ ...contest, finished: true }), "Winner: Daiki Hoshino · decision");
  assert.equal(winnerText({ ...contest, sides: [{ wazaAri: 2 }, {}], goldenScore: true }), "Winner: Daiki Hoshino · waza-ari awasete ippon · GS");
  assert.equal(winnerText({ ...contest, sides: [{}, { shido: 3 }] }), "Winner: Daiki Hoshino · hansoku-make");
  assert.equal(winnerText({ ...contest, sides: [{}, {}], method: "kiken-gachi", winner: 1 }), "Winner: Mathis Roussel · kiken-gachi");
  assert.ok(withClass(parseXml(T.judoScoreboard({ ...contest, sides: [{ ippon: true }, {}] })), "jb-win").length === 1);
});

test("swap draws blue first; the flag is drawn once as a symbol, and a country with no flag is a tile with its code", () => {
  const order = (svg: string) => withClass(parseXml(svg), "jb-pink").map((n) => n.text).filter((x) => /Hoshino|Roussel/.test(x));
  assert.deepEqual(order(T.judoScoreboard(contest)), ["Daiki Hoshino", "Mathis Roussel"]);
  assert.deepEqual(order(T.judoScoreboard(contest, { swap: true })), ["Mathis Roussel", "Daiki Hoshino"]);
  const svg = T.judoScoreboard(contest, { flags });
  assert.equal((svg.match(/<symbol /g) ?? []).length, 2);
  const bare = T.judoScoreboard(contest);
  assert.ok(texts(bare).includes("JPN") && !bare.includes("<symbol"));
});

test("the coaches can be left out", () => {
  assert.ok(texts(T.judoScoreboard(contest)).some((x) => x.includes("Yuki Mori")));
  assert.ok(!texts(T.judoScoreboard(contest, { coaches: false })).some((x) => x.includes("Yuki Mori")));
});

test("a scoreboard is drawn in every language, with its own words and no hole left open", () => {
  for (const locale of T.LOCALE_CODES) {
    const svg = T.judoScoreboard({ ...contest, finished: true }, { locale, flags });
    assert.equal(wellFormed(svg), null, locale);
    assert.ok(!/undefined|\{[a-z]+\}/.test(svg.replace(/<style>[\s\S]*?<\/style>/, "")), locale);
  }
  assert.ok(texts(T.judoScoreboard(contest, { locale: "ja" })).includes("抑え込み"));
  assert.ok(texts(T.judoScoreboard(contest, { locale: "fr" })).some((x) => /Tapis 1/.test(x)));
});

interface Placed { node: Node; dy: number }
/** Every text with the vertical shift of the groups it sits in. */
function placed(svg: string): Placed[] {
  const out: Placed[] = [];
  const go = (node: Node, dy: number): void => {
    const m = /translate\(0 ([-\d.]+)\)/.exec(node.attrs.transform ?? "");
    const here = dy + (m ? Number(m[1]) : 0);
    if (node.name === "text") out.push({ node, dy: here });
    for (const c of node.children) go(c, here);
  };
  go(parseXml(svg), 0);
  return out;
}

for (const style of ["board", "flip"] as const) {
  test(`${style}: every text stays inside the drawing, in every size, theme and language`, () => {
    const bad: string[] = [];
    for (const size of SIZES) for (const theme of ["auto", "light", "dark"] as const) for (const locale of ["en", "ja", "fr", "de"]) {
      const opts: JudoBoardOptions = { size, style, theme, locale, flags };
      for (const c of [contest, { ...contest, goldenScore: true, finished: true, sides: [{ yuko: 12, wazaAri: 1 }, { shido: 3 }] as const }, { ...contest, white: { name: "Maximilian Alexander Konstantinopoulos-Wilhelmsen", code: "GBR" }, blue: { name: "李" } }] as JudoContest[]) {
        const svg = T.judoScoreboard(c, opts);
        const W = typeof size === "string" ? T.JUDO_BOARD_SIZES[size].width : size.width, H = typeof size === "string" ? T.JUDO_BOARD_SIZES[size].height : size.height;
        for (const { node, dy } of placed(svg)) {
          const b = textBox(node);
          if (b.x < -0.5 || b.x + b.w > W + 0.5 || b.y + dy < -0.5 || b.y + dy + b.h > H + 0.5) bad.push(`${JSON.stringify(size)} ${theme} ${locale}: "${node.text}" (${b.x.toFixed(0)},${(b.y + dy).toFixed(0)} ${b.w.toFixed(0)}x${b.h.toFixed(0)}) is outside ${W}x${H}`);
        }
      }
    }
    assert.deepEqual(bad.slice(0, 8), [], `${bad.length} problems`);
  });

  test(`${style}: an athlete's name, code and coach stay inside the panel that carries them`, () => {
    const bad: string[] = [];
    for (const size of SIZES) {
      const svg = T.judoScoreboard({ ...contest, white: { ...contest.white, name: "Maximilian Alexander Konstantinopoulos" } }, { size, style, flags });
      const root = parseXml(svg);
      for (const g of [...withClass(root, "jb-w"), ...withClass(root, "jb-b")].filter((n) => n.name === "g" && n.children.some((c) => (c.attrs.class ?? "").includes("jb-panel")))) {
        const m = /translate\(0 ([-\d.]+)\)/.exec(g.attrs.transform ?? "");
        const dy = m ? Number(m[1]) : 0;
        const panel = g.children.find((c) => (c.attrs.class ?? "").includes("jb-panel"))!;
        const box = { x: Number(panel.attrs.x), y: Number(panel.attrs.y) + dy, w: Number(panel.attrs.width), h: Number(panel.attrs.height) };
        for (const t of walk(g).filter((n) => n.name === "text" && /jb-(pink|psub)/.test(n.attrs.class ?? "") && !/^\d$/.test(n.text) && !/^(IPPON|WAZA-ARI|YUKO|SHIDO)$/.test(n.text))) {
          const b = textBox(t);
          if (b.x < box.x - 0.5 || b.x + b.w > box.x + box.w + 0.5 || b.y + dy < box.y - 0.5 || b.y + dy + b.h > box.y + box.h + 0.5) bad.push(`${JSON.stringify(size)}: "${t.text}" leaves its panel`);
        }
      }
    }
    assert.deepEqual(bad.slice(0, 8), [], `${bad.length} problems`);
  });
}

test("the flip style has a card for each counter on each side, the label printed on it", () => {
  const svg = T.judoScoreboard(contest, { style: "flip" });
  const root = parseXml(svg);
  assert.equal(withClass(root, "jb-card").length, 10);
  assert.equal(withClass(root, "jb-ringbind").length, 20);
  const labels = withClass(root, "jb-lab").flatMap((n) => n.text);
  assert.equal(withClass(root, "jb-lab").length >= 10, true);
  assert.ok(labels.join("").includes("IPPON"));
  // The numerals are the counters: white 0 1 0 1 0 (ippon, waza-ari, yuko, shido, hansoku-make), blue 0 0 2 2 0.
  assert.deepEqual(withClass(root, "jb-num").map((n) => n.text), ["0", "1", "0", "1", "0", "0", "0", "2", "2", "0"]);
  assert.deepEqual(withClass(parseXml(T.judoScoreboard({ ...contest, sides: [{ shido: 3 }, {}] }, { style: "flip" })), "jb-num").map((n) => n.text).slice(0, 5), ["0", "0", "0", "3", "1"]);
});

test("the style's rules are in the drawing, as custom properties with a fallback", () => {
  const svg = T.judoScoreboard(contest);
  assert.match(svg, /var\(--jb-bg, #ecebe4\)/);
  assert.match(svg, /var\(--jb-blue-panel, #1f4fa8\)/);
  assert.match(svg, /prefers-color-scheme: dark/);
  assert.ok(!/prefers-color-scheme/.test(T.judoScoreboard(contest, { theme: "dark" })));
});
