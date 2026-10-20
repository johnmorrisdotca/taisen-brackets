// A caller's `id` option reaches element ids, a class name and the selectors of the <style>: every drawing that takes one lets only letters, digits, `_` and `-` through.
import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "../demo/data.js";
import { FLAGS } from "../demo/flags-data.js";
import * as T from "../src/index.ts";
import type { BracketInput, JudoAthlete, JudoContest, JudoMat, JudoRoadSource } from "../src/index.ts";
import { wellFormed } from "./helpers.ts";
import { parseXml, walk } from "./xml.ts";

const flags = (code: string) => (FLAGS as Record<string, string>)[code];
const judo66 = build(T, FLAGS).judo66 as BracketInput;
const A: JudoAthlete = { name: "Daiki Hoshino", code: "JPN", flag: "JP" };
const B: JudoAthlete = { name: "Mathis Roussel", code: "FRA", flag: "FR" };
const contest: JudoContest = { white: A, blue: B, clock: "2:14", weight: "Men -66 kg", round: "Final", mat: 1, contest: "G-24" };
const mat: JudoMat = { mat: 1, contests: [{ number: "G-1", white: A, blue: B }] };
const road: JudoRoadSource = { athlete: A, wins: T.judoWins(judo66, "J01") };
const finalists = [
  { name: "Argentina", abbr: "ARG", path: [{ round: "final", opponent: { name: "France", abbr: "FRA" }, score: "3-3" }] },
  { name: "France", abbr: "FRA", path: [{ round: "final", opponent: { name: "Argentina", abbr: "ARG" }, score: "3-3" }] },
] as unknown as Parameters<typeof T.roadToFinal>[0];

const HOSTILE = [`x"><script>alert(7)</script>`, `a}</style><script>alert(7)</script><style>b{`, `x" onload="alert(7)`, `1 starts with a digit`, `.x{fill:red}`, `a\nb`];
const SAFE = /^[\w-]+$/;

const drawings: Record<string, (id: string) => string> = {
  judoScoreboard: (id) => T.judoScoreboard(contest, { id, flags }),
  judoScoreboardFlip: (id) => T.judoScoreboard(contest, { id, flags, style: "flip" }),
  judoContestCard: (id) => T.judoContestCard({ white: A, blue: B, weight: "Men -66 kg", round: "Final", mat: 1, contest: "G-24" }, { id, flags }),
  judoMatQueue: (id) => T.judoMatQueue(mat, { id, flags }),
  judoRoadPanel: (id) => T.judoRoadPanel(road, { id, flags }),
  drawBracket: (id) => T.drawBracket(judo66, { id, flags }),
  drawBracketRoad: (id) => T.drawBracket(judo66, { id, flags, look: "road" }),
  roadToFinal: (id) => T.roadToFinal(finalists, { id }).draw(),
  resultsBoard: (id) => T.resultsBoard({ title: "Final", rows: [{ name: "A", values: ["1"] }], columns: [{ label: "S" }] }, { id }),
  boutBoard: (id) => T.boutBoard({ title: "Bout", red: { name: "A" }, blue: { name: "B" } }, { id }),
  medalTable: (id) => T.medalTable({ rows: [{ name: "France", flag: "FR", gold: 1 }] }, { id, flags }),
  broadcastMedalTable: (id) => T.broadcastMedalTable({ rows: [{ name: "France", flag: "FR", gold: 1 }] }, { id, flags }),
};

for (const [name, draw] of Object.entries(drawings)) {
  test(`${name}: a hostile id cannot reach the markup or the style`, () => {
    for (const id of HOSTILE) {
      const svg = draw(id);
      assert.equal(wellFormed(svg), null, `${name} ${JSON.stringify(id)}: well formed`);
      assert.ok(!/<script|\sonload=|\(7\)/.test(svg), `${name} ${JSON.stringify(id)}: nothing of the id's markup`);
      const doc = parseXml(svg);
      for (const n of walk(doc)) {
        if (n.attrs.id !== undefined) assert.match(n.attrs.id, SAFE, `${name}: element id`);
        if (n.name === "style") assert.ok(!n.text.includes("<"), `${name}: <style> holds only rules`);
      }
      for (const token of (doc.attrs.class ?? "").split(/\s+/).filter(Boolean)) assert.match(token, SAFE, `${name}: root class`);
    }
  });

  test(`${name}: a plain id is kept, the same id draws the same, and no id draws the same each time`, () => {
    assert.equal(draw("my-board_2"), draw("my-board_2"));
    assert.ok(draw("my-board_2").includes("my-board_2"), "a safe id is kept as written");
    assert.notEqual(draw("my-board_2"), draw("other-board"));
  });
}

test("an id that starts with a digit or has a space gets a safe form, not a refusal", () => {
  const svg = T.judoScoreboard(contest, { id: "7 mat", flags });
  assert.match(svg, /class="taisen taisen-judo jb-7-mat"/);
  assert.match(T.judoScoreboard(contest, { id: "mat7" }), /class="taisen taisen-judo mat7"/);
});
