import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "../demo/data.js";
import * as T from "../src/index.ts";
import { wellFormed } from "./helpers.ts";

const data = build(T);
const CODES = ["en", "fr", "ja", "es", "de"] as const;

/** What each example's data says, pinned: the champion, the final's score, how many teams and ties, and how it is drawn. */
const PINS = [
  { key: "nhl2024", league: "nhl", year: 2024, champion: "Florida Panthers", final: [4, 3], teams: 16, ties: 15, rounds: 4, byes: 0, halves: ["Western Conference", "Eastern Conference"] },
  { key: "nhl1984", league: "nhl", year: 1984, champion: "Edmonton Oilers", final: [1, 4], teams: 16, ties: 15, rounds: 4, byes: 0, halves: ["Clarence Campbell Conference", "Prince of Wales Conference"] },
  { key: "nba2024", league: "nba", year: 2024, champion: "Boston Celtics", final: [4, 1], teams: 16, ties: 15, rounds: 4, byes: 0, halves: ["Western Conference", "Eastern Conference"] },
  { key: "mlb2022", league: "mlb", year: 2022, champion: "Houston Astros", final: [4, 2], teams: 12, ties: 11, rounds: 4, byes: 4, halves: ["American League", "National League"] },
  { key: "nfl2024", league: "nfl", year: 2024, champion: "Philadelphia Eagles", final: [40, 22], teams: 14, ties: 13, rounds: 4, byes: 2, halves: ["American Football Conference", "National Football Conference"] },
  { key: "cfl2024", league: "cfl", year: 2024, champion: "Toronto Argonauts", final: [41, 24], teams: 6, ties: 5, rounds: 3, byes: 2, halves: ["West", "East"] },
] as const;

for (const pin of PINS) {
  test(`${pin.key}: the champion, the final's score and the shape come from the data`, () => {
    const layout = T.layoutBracket(data[pin.key]);
    assert.equal(layout.champion!.name, pin.champion);
    const final = layout.ties[layout.finalIndex!];
    assert.deepEqual(final.result.score, pin.final, `${pin.key}: the final, in the order of its sides`);
    assert.equal(layout.teams.length, pin.teams);
    assert.equal(layout.ties.length, pin.ties);
    assert.equal(layout.rounds, pin.rounds);
    assert.equal(layout.shape, "halves");
    assert.equal(layout.other.length, 0, "every tie is in the tree");
    assert.equal(layout.sides.flatMap((s) => s.boxes).filter((b) => b.bye !== null).length, pin.byes);
    assert.deepEqual(layout.sides.map((s) => s.label), pin.halves);
    const format = T.playoffFormat(pin.league, pin.year)!;
    assert.equal(format.rounds.length, layout.rounds, "the era's format has the rounds the data has");
    assert.equal(format.teams, pin.teams);
  });
}

test("the NFL's and the CFL's rounds are single games with their scores; the others are series", () => {
  for (const key of ["nfl2024", "cfl2024"] as const) {
    const layout = T.layoutBracket(data[key]);
    assert.ok(layout.ties.every((t) => t.result.kind === "game" && t.result.played === 1), key);
  }
  for (const key of ["nhl2024", "nba2024", "nhl1984"] as const) assert.ok(T.layoutBracket(data[key]).ties.every((t) => t.result.kind === "series"), key);
  const nhl84 = T.layoutBracket(data.nhl1984);
  assert.deepEqual([...new Set(nhl84.ties.filter((t) => t.round === 1).map((t) => t.result.bestOf))], [5], "the first round of 1984 was best of five");
  assert.deepEqual([...new Set(nhl84.ties.filter((t) => t.round === 2).map((t) => t.result.bestOf))], [7]);
});

test("the NFL's Super Bowl is at the centre and the top seeds have byes; the CFL's Grey Cup too", () => {
  const nfl = T.layoutBracket(data.nfl2024);
  assert.equal(nfl.final!.i, nfl.finalIndex);
  const byes = nfl.sides.flatMap((s) => s.boxes).filter((b) => b.bye !== null).map((b) => nfl.ties[b.i].sides[b.bye!]!.name).sort();
  assert.deepEqual(byes, ["Detroit Lions", "Kansas City Chiefs"], "the top seed of each conference had the bye");
  const cfl = T.layoutBracket(data.cfl2024);
  assert.deepEqual(cfl.sides.flatMap((s) => s.boxes).filter((b) => b.bye !== null).map((b) => cfl.ties[b.i].sides[b.bye!]!.name).sort(), ["Montreal Alouettes", "Winnipeg Blue Bombers"]);
});

for (const pin of PINS) {
  for (const code of CODES) {
    test(`${pin.key} in ${code}: the drawing and the table are written in the language, and clubs keep their names`, () => {
      const names = T.playoffFormat(pin.league, pin.year)!;
      const svg = T.drawBracket(data[pin.key], { locale: code, roundNames: names });
      assert.equal(wellFormed(svg), null);
      assert.match(svg, new RegExp(`lang="${code}"`));
      const v = T.voiceOf({ locale: code });
      assert.ok(svg.includes(v.upper(v.round(names.rounds.at(-1)!.name))), `the last round, ${code}`);
      assert.ok(svg.includes(v.upper(v.words.champion)));
      assert.ok(svg.includes(pin.champion), "the champion's name is as it is");
      const table = T.bracketTable(data[pin.key], { locale: code, roundNames: names });
      assert.equal(wellFormed(table), null);
      assert.ok(table.includes(v.round(names.rounds[0].name)));
      assert.equal(svg, T.drawBracket(data[pin.key], { locale: code, roundNames: names }), "deterministic");
    });
  }
}
