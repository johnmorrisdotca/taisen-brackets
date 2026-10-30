// The layouts: every sport drawn every way, in both looks and all four sizes, keeps its marks, text and slots inside their boxes and its names of rounds off the lines.
import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "../demo/data.js";
import { FLAGS } from "../demo/flags-data.js";
import * as T from "../src/index.ts";
import type { BracketInput, DrawOptions, LayoutName, SizeName } from "../src/index.ts";
import { problems } from "./geometry.ts";

import { wellFormed } from "./helpers.ts";

const data = build(T, FLAGS);
const flags = (code: string) => FLAGS[code];
const SIZES: SizeName[] = ["wide", "square", "card", "phone"];
const EXAMPLES = Object.entries(data).filter(([, v]) => v && typeof v === "object" && "matchups" in v) as [string, BracketInput][];
const TREE_LAYOUTS: LayoutName[] = ["rows", "shields", "update", "columns", "series", "picture"];

for (const layout of TREE_LAYOUTS) {
  for (const look of ["classic", "road"] as const) {
    for (const size of SIZES) {
      test(`the ${layout} layout, ${look} look, ${size}: marks, text and slots stay inside their boxes and off the lines`, () => {
        const bad: string[] = [];
        for (const [name, ex] of EXAMPLES) {
          const namesOverLines = size === "phone" && name === "wc2026";
          const options: DrawOptions = { layout, look, size, flags };
          const variants: [string, DrawOptions][] = [["", options], [" (marks only)", { ...options, detail: "mark" }], [" (scores off)", { ...options, scores: false }], [" (seeds)", { ...options, seeds: true }], [" (headers)", { ...options, headers: true }]];
          if (layout === "columns") variants.push([" (at)", { ...options, at: true }]);
          for (const [what, o] of variants) {
            const svg = T.drawBracket(ex, o);
            assert.equal(wellFormed(svg), null, `${name}${what}: well-formed`);
            for (const p of problems(svg, { namesOverLines })) bad.push(`${name}${what}: ${p}`);
          }
        }
        assert.deepEqual(bad.slice(0, 12), [], `${bad.length} problems`);
      });
    }
  }
}
