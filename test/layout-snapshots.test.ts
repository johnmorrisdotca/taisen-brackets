// What each layout is made of, as a count of every element and class of its drawing: a change to any layout shows here, and `UPDATE_SNAPSHOTS=1 pnpm test` accepts it when it is meant.
import { test } from "node:test";
import { build } from "../demo/data.js";
import { FLAGS } from "../demo/flags-data.js";
import * as T from "../src/index.ts";
import type { BracketInput, DrawOptions, LayoutName } from "../src/index.ts";
import { matchSnapshot } from "./snapshot.ts";
import { structure } from "./xml.ts";

const data = build(T, FLAGS);
const flags = (code: string) => FLAGS[code];

const CASES: [LayoutName, BracketInput, DrawOptions][] = [
  ["rows", data.nhl2024, { look: "road", seeds: true }],
  ["shields", data.wc2022, { look: "road", flags }],
  ["update", data.nhl2024, { look: "classic" }],
  ["columns", data.nfl2024, { look: "road", headers: true }],
  ["playin", data.nba2024playin, { look: "road", flags }],
  ["series", data.nba2024, { look: "classic", headers: true }],
  ["groups", data.cupGroups, { look: "road", qualify: 2 }],
];

for (const [layout, input, options] of CASES) {
  for (const size of ["wide", "phone"] as const) {
    test(`the ${layout} layout's structure, ${size}`, () => {
      matchSnapshot("layouts", `${layout} ${size}`, structure(T.drawBracket(input, { ...options, layout, size })));
    });
  }
}
