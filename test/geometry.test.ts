// The geometry of every drawing: nothing sticks out of its box. For each example, each size and both looks, every mark's bounding box (ring and hairline included) lies inside its tie's
// box with padding and off the other marks and the text, every text lies inside its box, and the names of the rounds (pills in the road look) stand clear of the connector lines, the boxes and each other.
import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "../demo/data.js";
import { FLAGS } from "../demo/flags-data.js";
import * as T from "../src/index.ts";
import type { BracketInput, DrawOptions, SizeName } from "../src/index.ts";
import { problems } from "./geometry.ts";
import { parseXml, withClass } from "./xml.ts";

const data = build(T, FLAGS);
const flags = (code: string) => FLAGS[code];
const SIZES: SizeName[] = ["wide", "square", "card", "phone"];
const EXAMPLES = Object.entries(data).filter(([, v]) => v && typeof v === "object" && "matchups" in v) as [string, BracketInput][];

for (const look of ["classic", "road"] as const) {
  for (const size of SIZES) {
    test(`geometry, ${look} look, ${size}: marks, text and round names stay inside their boxes and off the lines`, () => {
      const bad: string[] = [];
      for (const [name, ex] of EXAMPLES) {
        // On a phone a round of eight or more boxes across (the 32-team World Cup) leaves no room between its lines for a name: the name stands over them, on its own pill.
        const namesOverLines = size === "phone" && name === "wc2026";
        const options: DrawOptions = { look, size, flags };
        const variants: [string, DrawOptions][] = [["", options], [" (marks only)", { ...options, detail: "mark" }], [" (scores off)", { ...options, scores: false }]];
        if (look === "road") variants.push([" (codes, vs and seeds)", { ...options, detail: "mark", codes: true, vs: true, seeds: true }], [" (names)", { ...options, detail: "full" }]);
        for (const [what, o] of variants) for (const p of problems(T.drawBracket(ex, o), { namesOverLines })) bad.push(`${name}${what}: ${p}`);
      }
      assert.deepEqual(bad.slice(0, 12), [], `${bad.length} problems`);
    });
  }
}

test("a shoot-out's score has room beside the score in a box of marks, or goes under it", () => {
  const ties = [
    { id: "a", sides: ["AAA", "BBB"] as const, round: 1, score: [1, 1] as const, pens: [11, 10] as const },
    { id: "b", sides: ["CCC", "DDD"] as const, round: 1, score: [0, 0] as const, pens: [4, 3] as const },
    { id: "c", sides: ["AAA", "CCC"] as const, round: 2, score: [10, 12] as const },
  ];
  for (const size of SIZES) for (const look of ["classic", "road"] as const) {
    const svg = T.drawBracket({ matchups: ties }, { size, look, detail: "mark" });
    assert.deepEqual(problems(svg), [], `${look} ${size}`);
  }
});

test("long round names are never cut: smaller, or on two lines, in every size and both looks, and clear of the group headings and the lines", () => {
  const long = ["Conference First Round", "Conference Quarterfinals", "Conference Championships", "Stanley Cup Championship Final"];
  const bad: string[] = [];
  for (const look of ["classic", "road"] as const) for (const size of SIZES) for (const [name, ex] of [["nhl2024", data.nhl2024], ["nba2024", data.nba2024], ["nhl1984", data.nhl1984]] as const) {
    // On a phone a name as long as these is wider than the room between the lines of its round, so it stands over them (whole, on its own pill).
    for (const p of problems(T.drawBracket(ex, { look, size, flags, roundNames: long }), { namesOverLines: size === "phone" })) bad.push(`${look} ${size} ${name}: ${p}`);
  }
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} problems`);
  // On a wide drawing the name that cannot be one line is two: its pill is taller.
  const wide = T.drawBracket(data.nhl2024, { look: "road", size: "wide", roundNames: long });
  assert.ok(withClass(parseXml(wide), "tb-panel").some((p) => Number(p.attrs.height) > 25), "a pill of two lines");
  assert.ok(withClass(parseXml(wide), "tb-lab").some((t) => t.text === "CONFERENCE"), "broken at a space, not cut");
  const classic = T.drawBracket(data.nhl2024, { look: "classic", size: "wide", roundNames: long });
  assert.ok(withClass(parseXml(classic), "tb-round").some((t) => t.text === "CONFERENCE"));
  // A name that fits stays on one line.
  assert.ok(withClass(parseXml(T.drawBracket(data.nhl2024, { look: "road", size: "wide" })), "tb-panel").every((p) => Number(p.attrs.height) === 20));
});

test("the word 'bye' never meets a score or a name, in the phone's road look or anywhere else", () => {
  const bad: string[] = [];
  for (const look of ["classic", "road"] as const) for (const size of SIZES) for (const detail of ["auto", "full", "compact"] as const) {
    for (const [name, ex] of [["cfl2024", data.cfl2024], ["nfl2024", data.nfl2024], ["mlb2022", data.mlb2022], ["mls2024", data.mls2024]] as const) {
      for (const p of problems(T.drawBracket(ex, { look, size, detail, flags }))) bad.push(`${look} ${size} ${detail} ${name}: ${p}`);
    }
  }
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} problems`);
});
