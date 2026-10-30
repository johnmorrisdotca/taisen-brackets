// What each layout draws, beyond keeping everything inside its box (test/layouts.test.ts): the groups' tables, the play-in's arrows, the columns' tall slots, the series card, headers, and the options between them.
import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "../demo/data.js";
import { FLAGS } from "../demo/flags-data.js";
import * as T from "../src/index.ts";
import type { BracketInput, LayoutName, SizeName } from "../src/index.ts";
import { problems } from "./geometry.ts";
import { parseXml, withClass } from "./xml.ts";
import { wellFormed } from "./helpers.ts";

const data = build(T, FLAGS);
const flags = (code: string) => FLAGS[code];
const SIZES: SizeName[] = ["wide", "square", "card", "phone"];
const GROUPED = [data.cupGroups, data.softballGroups] as BracketInput[];

for (const look of ["classic", "road"] as const) {
  for (const size of SIZES) {
    test(`the groups layout, ${look} look, ${size}: every mark and text is inside its card`, () => {
      const bad: string[] = [];
      for (const [i, ex] of GROUPED.entries()) {
        for (const standings of ["points", "record"] as const) for (const qualify of [0, 2]) for (const locale of T.LOCALE_CODES) {
          const svg = T.drawBracket(ex, { layout: "groups", look, size, standings, qualify, flags, locale, title: "Cup", subtitle: "Group stage", background: "midnight" });
          assert.equal(wellFormed(svg), null);
          for (const p of problems(svg)) bad.push(`example ${i} ${standings} ${qualify} ${locale}: ${p}`);
        }
      }
      assert.deepEqual(bad.slice(0, 12), [], `${bad.length} problems`);
    });
    test(`the playin layout, ${look} look, ${size}: marks, text and slots are inside their boxes`, () => {
      const bad: string[] = [];
      for (const locale of T.LOCALE_CODES) for (const background of [false, "hardwood"] as const) {
        const svg = T.drawBracket(data.nba2024playin, { layout: "playin", look, size, flags, locale, background, title: "NBA" });
        assert.equal(wellFormed(svg), null);
        for (const p of problems(svg)) bad.push(`${locale} ${String(background)}: ${p}`);
      }
      assert.deepEqual(bad.slice(0, 12), [], `${bad.length} problems`);
    });
  }
}

test("every layout is drawn in every language, all text escaped, and the same every time", () => {
  const teams = [{ id: "a", name: "<script>alert(1)</script> & \"Co\"", abbr: "<b>", group: "<East>", seed: 1 }, { id: "b", name: "Plain", group: "<West>", seed: 2 }];
  const tie = { id: "x", sides: ["a", "b"] as const, score: [2, 1] as const };
  for (const layout of T.LAYOUTS) for (const locale of T.LOCALE_CODES) {
    const matchups = layout === "groups" ? [{ ...tie, round: 0 }] : layout === "playin" ? [{ ...tie, stage: "play-in" as const }] : [{ ...tie, round: 1 }];
    const a = T.drawBracket({ teams, matchups }, { layout, locale, headers: true, seeds: true });
    assert.equal(wellFormed(a), null, `${layout} ${locale}`);
    assert.ok(!a.includes("<script"), `${layout} ${locale}: escaped`);
    assert.equal(a, T.drawBracket({ teams, matchups }, { layout, locale, headers: true, seeds: true }), `${layout} ${locale}: the same string twice`);
  }
});

test("the default layout is the tree, drawn exactly as before, and an unknown layout is refused", () => {
  const ex = data.wc2022;
  assert.equal(T.drawBracket(ex, { layout: "tree" }), T.drawBracket(ex));
  assert.throws(() => T.drawBracket(ex, { layout: "pyramid" as LayoutName }), /unknown layout "pyramid"/);
  assert.deepEqual([...T.LAYOUTS], ["tree", "rows", "shields", "update", "columns", "playin", "series", "groups", "picture"]);
  assert.throws(() => T.drawBracket(ex, { layout: "playin" }), /play-in games/);
  assert.throws(() => T.drawBracket({ matchups: [] }, { layout: "groups" }), /round-robin/);
});

test("headers: a title tile over each half in the colour of the half, in any layout", () => {
  for (const layout of ["tree", "rows", "columns", "update"] as LayoutName[]) {
    for (const size of SIZES) {
      const svg = T.drawBracket(data.nfl2024, { layout, size, headers: true, look: "road" });
      const tree = parseXml(svg);
      const heads = withClass(tree, "tb-head");
      assert.equal(heads.length, 2, `${layout} ${size}`);
      assert.deepEqual(heads.map((h) => h.attrs.class), ["tb-head tb-c0", "tb-head tb-c1"]);
      assert.deepEqual(withClass(tree, "tb-head-t").map((t) => t.text.toLowerCase()), ["american football conference", "national football conference"]);
      assert.deepEqual(problems(svg), [], `${layout} ${size}`);
    }
  }
  // Off by default: the halves' names are plain text.
  assert.equal(withClass(parseXml(T.drawBracket(data.nfl2024, {})), "tb-head").length, 0);
});

test("the columns layout: tall slots that grow toward the centre, VS or AT on a tag, the final as two slots", () => {
  const svg = T.drawBracket(data.nfl2024, { layout: "columns", look: "road" });
  const tree = parseXml(svg);
  const ties = withClass(tree, "tb-tie");
  const heights = ties.map((t) => Number(withClass(t, "tb-box")[0].attrs.height));
  assert.ok(Math.max(...heights) > Math.min(...heights) * 1.5, "later rounds are taller");
  assert.ok(withClass(tree, "tb-atag-t").every((t) => t.text === "VS"));
  assert.equal(withClass(tree, "tb-cslot").length, 2 * ties.length, "two slots a tie");
  const [a, b] = withClass(withClass(tree, "tb-final")[0], "tb-cslot");
  assert.ok(Number(b.attrs.x) > Number(a.attrs.x) + Number(a.attrs.width) - 1, "the final's slots stand side by side");
  // `at`: the word of the language, and the side at home second.
  assert.ok(withClass(parseXml(T.drawBracket(data.nfl2024, { layout: "columns", at: true })), "tb-atag-t").every((t) => t.text === "AT"));
  assert.ok(withClass(parseXml(T.drawBracket(data.nfl2024, { layout: "columns", at: true, locale: "fr" })), "tb-atag-t").every((t) => t.text === "À"));
  const input = { matchups: [{ sides: ["AAA", "BBB"] as const, round: 1, score: [3, 1] as const, home: 0 as const }, { sides: ["CCC", "DDD"] as const, round: 1, score: [1, 0] as const }] };
  const names = withClass(parseXml(T.drawBracket(input, { layout: "columns", at: true })), "tb-name").map((t) => t.text);
  assert.ok(names.indexOf("BBB") < names.indexOf("AAA"), "the home side (the first, said by `home: 0`) is drawn second");
  assert.ok(names.indexOf("CCC") < names.indexOf("DDD"), "with no `home`, the second side is the home side");
});

test("the series layout is a tall card of one line a series, the east on top, the winner bold", () => {
  const svg = T.drawBracket(data.nba2024, { layout: "series" });
  assert.match(svg, /viewBox="0 0 1080 1350"/, "a card unless a size is asked for");
  const tree = parseXml(svg);
  assert.deepEqual(withClass(tree, "tb-half").map((t) => t.text), ["EASTERN CONFERENCE", "WESTERN CONFERENCE"]);
  const lines = withClass(tree, "tb-series").map((t) => t.text);
  assert.ok(lines.includes("4–1") && lines.includes("4–0"), lines.join(" "));
  const ties = withClass(tree, "tb-tie");
  const at = (name: string) => ties.find((t) => withClass(t, "tb-name").map((n) => n.text).join(" ") === name);
  const top = at("BOS MIA");
  const bottom = at("DEN LAL");
  assert.ok(top && bottom);
  assert.ok(Number(withClass(top, "tb-box")[0].attrs.y) < Number(withClass(bottom, "tb-box")[0].attrs.y), "the east's boxes are above the west's");
  assert.ok(withClass(top, "tb-won").some((g) => g.text.includes("BOS")), "the winner is in a group of the class tb-won");
});

test("the update layout shows each side's abbreviation, seed and series score, and leaves the rounds to come empty", () => {
  const teams = [{ id: "A", name: "Alpha", abbr: "ALP", seed: 1 }, { id: "B", name: "Beta", abbr: "BET", seed: 8 }, { id: "C", name: "Gamma", abbr: "GAM", seed: 4 }, { id: "D", name: "Delta", abbr: "DEL", seed: 5 }];
  const matchups = [{ id: "q1", sides: ["A", "B"] as const, round: 1, bestOf: 7, score: [4, 2] as const }, { id: "q2", sides: ["C", "D"] as const, round: 1, bestOf: 7, score: [2, 1] as const }, { id: "f", sides: [null, null] as const, round: 2, feeds: ["q1", "q2"] as const }];
  const svg = T.drawBracket({ teams, matchups }, { layout: "update", subtitle: "as of May 1" });
  const tree = parseXml(svg);
  assert.deepEqual(withClass(tree, "tb-name").map((t) => t.text).slice(0, 4), ["ALP", "BET", "GAM", "DEL"]);
  assert.deepEqual(withClass(tree, "tb-seed").map((t) => t.text).slice(0, 4), ["1", "8", "4", "5"]);
  assert.equal(withClass(tree, "tb-emptybar").length, 2, "the final's two sides are empty bars");
  assert.deepEqual(problems(svg), []);
});

test("the shields layout draws marks in shields with a vs between, and no lines", () => {
  const svg = T.drawBracket(data.wc2022, { layout: "shields", flags });
  const tree = parseXml(svg);
  assert.ok(withClass(tree, "tb-shield").length >= 2 * 15);
  assert.ok(withClass(tree, "tb-vs").length >= 10 && withClass(tree, "tb-vs").every((t) => t.text === "vs"));
  assert.equal(withClass(tree, "tb-line").filter((n) => n.name === "path").length, 0, "no connector lines");
  assert.match(svg, /clipPathUnits="objectBoundingBox"/);
});

test("the rows layout: the name left, the mark right, the result slot toward the centre", () => {
  const tree = parseXml(T.drawBracket(data.nhl2024, { layout: "rows", look: "road" }));
  const ties = withClass(tree, "tb-tie");
  const left = ties.find((t) => t.attrs.class?.includes("tb-c0"))!;
  const right = ties.find((t) => t.attrs.class?.includes("tb-c1"))!;
  const mid = (t: typeof left) => Number(withClass(t, "tb-box")[0].attrs.x) + Number(withClass(t, "tb-box")[0].attrs.width) / 2;
  const slot = (t: typeof left) => Number(withClass(t, "tb-slot")[0].attrs.x);
  assert.ok(slot(left) > mid(left), "a left box's slot is at its right end");
  assert.ok(slot(right) < mid(right), "a right box's slot is at its left end");
});

test("a bracket of a final and a third-place match alone is centred, with the champion over it", () => {
  // The World Cups of 1974 and 1978 ended with a second group stage, a final and a third-place match.
  const input = {
    matchups: [
      { id: "F", sides: ["NED", "GER"] as const, round: 1, score: [1, 2] as const, date: "1974-07-07" },
      { id: "T", sides: ["POL", "BRA"] as const, third: true, score: [1, 0] as const, date: "1974-07-06" },
      { id: "g1", sides: ["NED", "BRA"] as const, round: 0, score: [2, 0] as const },
      { id: "g2", sides: ["GER", "POL"] as const, round: 0, score: [1, 0] as const },
    ],
  };
  for (const look of ["classic", "road"] as const) for (const size of SIZES) for (const layout of ["tree", "rows", "shields", "columns"] as LayoutName[]) {
    const svg = T.drawBracket(input, { look, size, layout, trophy: undefined });
    const tree = parseXml(svg);
    const [w] = /viewBox="0 0 ([\d.]+)/.exec(svg)!.slice(1).map(Number);
    const boxes = withClass(tree, "tb-tie");
    const final = boxes.find((t) => t.attrs.class?.includes("tb-final"))!;
    const third = boxes.find((t) => t.text.includes("POL 1, BRA 0"))!;
    const centre = (t: typeof final) => Number(withClass(t, "tb-box")[0].attrs.x) + Number(withClass(t, "tb-box")[0].attrs.width) / 2;
    assert.ok(Math.abs(centre(final) - w / 2) < 1, `${look} ${size} ${layout}: the final is centred (${centre(final)} of ${w})`);
    assert.ok(Math.abs(centre(third) - w / 2) < 1, `${look} ${size} ${layout}: the third place is centred`);
    const champ = withClass(tree, "tb-champ")[0];
    assert.ok(champ, "the champion is drawn");
    assert.deepEqual(problems(svg), [], `${look} ${size} ${layout}`);
  }
});

test("a tie can be fed by another's loser: `from` says where each side comes from, and a cycle is refused", () => {
  const ties = [
    { id: "p78", sides: ["T7", "T8"] as const, stage: "play-in" as const, score: [105, 104] as const },
    { id: "p910", sides: ["T9", "T10"] as const, stage: "play-in" as const, score: [131, 116] as const },
    { id: "dec", sides: ["T8", "T9"] as const, stage: "play-in" as const, score: [112, 91] as const, feeds: [{ tie: "p78", result: "loser" }, "p910"] as const },
  ];
  const layout = T.layoutBracket({ matchups: ties });
  assert.deepEqual(layout.playIn, [0, 1, 2]);
  assert.deepEqual(layout.ties[2].from, [{ tie: 0, result: "loser" }, { tie: 1, result: "winner" }]);
  assert.equal(layout.ties[0].from, undefined, "a tie that says nothing of the kind has no `from`");
  assert.ok(layout.ties.every((t) => t.round === 0 && t.playIn === true));
  assert.deepEqual(layout.parent, [-1, -1, -1], "the tree is untouched");
  assert.throws(() => T.layoutBracket({ matchups: [{ id: "a", sides: ["x", "y"] as const, feeds: [{ tie: "b", result: "loser" }, null] as const }, { id: "b", sides: ["y", "z"] as const, feeds: [{ tie: "a", result: "winner" }, null] as const }] }), /circle: "a" -> "b" -> "a"|circle: "b" -> "a" -> "b"/);
  assert.throws(() => T.layoutBracket({ matchups: [{ id: "a", sides: ["x", "y"] as const, feeds: [{ tie: "a", result: "winner" }, null] as const }] }), /fed by itself/);
  assert.throws(() => T.layoutBracket({ matchups: [{ id: "a", sides: ["x", "y"] as const, feeds: [{ tie: "nope", result: "loser" }, null] as const }] }), /not a matchup/);
  assert.throws(() => T.layoutBracket({ matchups: [{ id: "a", sides: ["x", "y"] as const }, { id: "b", sides: ["x", "z"] as const, feeds: [{ tie: "a", result: "second" as "loser" }, null] as const }] }), /"winner" or "loser"/);
  // The table says where a side comes from.
  const table = T.bracketTable({ matchups: ties }, { locale: "en" });
  assert.match(table, /Loser of T7 v T8, Winner of T9 v T10/);
  assert.match(table, />Play-in</);
  // advanceWinners fills a loser's place.
  const advanced = T.advanceWinners([{ id: "a", sides: ["x", "y"], score: [2, 0] }, { id: "b", sides: [null, "z"], feeds: [{ tie: "a", result: "loser" }, null] }]);
  assert.equal(advanced[1].sides[0], "y");
});

test("the play-in layout draws solid arrows for winners and dashed ones for losers, from where they leave to where they go", () => {
  const svg = T.drawBracket(data.nba2024playin, { layout: "playin", look: "road" });
  const tree = parseXml(svg);
  const arrows = withClass(tree, "tb-arrow");
  const dashed = arrows.filter((a) => a.attrs.class.includes("tb-arrow-loser"));
  assert.equal(arrows.length, 8, "in each half: the 7/8 winner and loser, the 9/10 winner and the decider's winner");
  assert.equal(dashed.length, 2, "a loser's arrow, in each half");
  assert.equal(withClass(tree, "tb-arrowhead").length, 8);
  assert.deepEqual(withClass(tree, "tb-head-t").map((t) => t.text), ["Western Conference", "Eastern Conference"]);
  assert.equal(withClass(tree, "tb-group").length, 2 * 6 + 2 * 2, "six seed tiles and two seed slots in each half");
  assert.equal(withClass(tree, "tb-tie").length, 6);
  // A box that takes a winner or a loser says so until it is played.
  const open = T.drawBracket({ ...data.nba2024playin, matchups: data.nba2024playin.matchups.map((m): T.Matchup => (m.id === "east-8" ? { ...m, sides: [null, null], games: [] } : m)) }, { layout: "playin" });
  assert.match(open, /Loser 7\/8/);
  assert.match(open, /Winner 9\/10/);
  // A drawing with no arrow in sight for a bracket with no loser edges: no `tb-arrow` anywhere.
  assert.equal(withClass(parseXml(T.drawBracket(data.nba2024, {})), "tb-arrow").length, 0);
});

test("group standings: points, goal difference, the places that go through", () => {
  const tables = T.groupStandings(data.cupGroups);
  assert.deepEqual(tables.map((t) => t.name), ["Group A", "Group B", "Group C", "Group D"]);
  for (const t of tables) {
    assert.equal(t.rows.length, 4);
    for (const r of t.rows) { assert.equal(r.played, 3); assert.equal(r.points, 3 * r.won + r.drawn); assert.equal(r.diff, r.goalsFor - r.goalsAgainst); }
    assert.deepEqual(t.rows.map((r) => r.points), [...t.rows.map((r) => r.points)].sort((a, b) => b - a));
  }
  const small = T.groupStandings({ teams: [{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C" }], matchups: [{ sides: ["a", "b"], round: 0, score: [2, 2] }, { sides: ["a", "c"], round: 0, score: [1, 0] }, { sides: ["b", "c"], round: 0, score: [3, 0] }] });
  assert.equal(small.length, 1, "the games join the teams into one group");
  assert.deepEqual(small[0].rows.map((r) => [r.team.id, r.points, r.diff]), [["b", 4, 3], ["a", 4, 1], ["c", 0, -4]]);
  assert.equal(small[0].name, "Group A");
  // The count of rows marked as going through is `qualify`.
  const drawn = parseXml(T.drawBracket(data.cupGroups, { layout: "groups", qualify: 2 }));
  assert.equal(withClass(drawn, "tb-qual").length, 8);
  const record = parseXml(T.drawBracket(data.softballGroups, { layout: "groups", standings: "record" }));
  assert.deepEqual(withClass(record, "tb-ghead").map((t) => t.text).slice(0, 2), ["W", "L"]);
  // The table for a reader the picture does not serve.
  const html = T.groupsTable(data.cupGroups, { locale: "fr" });
  assert.match(html, /<caption>Groupe A<\/caption>/);
  assert.equal(wellFormed(html), null);
  // Teams with a group and no games are rows of placeholders.
  const none = T.groupStandings({ teams: [{ id: "a", name: "Africa TBD", group: "A" }, { id: "b", name: "Asia TBD", group: "A" }], matchups: [] });
  assert.deepEqual(none[0].rows.map((r) => r.played), [0, 0]);
});

test("one stylesheet for two sizes of the same bracket: styleScope, style: false, and bracketStyle", () => {
  const options = { look: "road" as const, background: "ice" as const, styleScope: "my-bracket", theme: "dark" as const };
  const desk = T.drawBracket(data.nhl2024, { ...options, size: "wide" });
  const phone = T.drawBracket(data.nhl2024, { ...options, size: "phone", style: false });
  assert.match(desk, /<style>/);
  assert.ok(desk.includes(".my-bracket .tb-box"), "the rules are scoped by the styleScope");
  assert.ok(!phone.includes("<style>"), "the second drawing writes none");
  assert.match(phone, /class="taisen tb-[a-z0-9]+ my-bracket /, "and carries the scope class");
  const ids = (svg: string) => new Set([...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
  const a = ids(desk), b = ids(phone);
  assert.ok(![...a].some((id) => b.has(id)), "the ids of the two drawings are apart");
  // The page's own copy of the rules is the same text the first drawing carries.
  assert.ok(desk.includes(T.bracketStyle(options)), "bracketStyle is the stylesheet the drawing writes");
  assert.throws(() => T.bracketStyle({}), /styleScope/);
  assert.throws(() => T.drawBracket(data.nhl2024, { styleScope: "two words" }), /one word/);
  // `style: false` alone leaves the rules out, and the default still writes them.
  assert.ok(!T.drawBracket(data.nhl2024, { style: false }).includes("<style>"));
  assert.ok(T.drawBracket(data.nhl2024, {}).includes("<style>"));
});
