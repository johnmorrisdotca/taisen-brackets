// The family's background module: the file is held to a hash (a copy in another package must match it byte for byte), every preset is drawn the same way every time, stays small, and the
// ink it names reads over what it draws.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { BACKGROUND_PRESETS, FAMILY_BACKGROUNDS_VERSION, backgroundSvg, contrastRatio, parseColor, type BackgroundPresetName } from "../src/backgrounds-entry.ts";
import { wellFormed } from "./helpers.ts";

/** The sha256 of src/family-backgrounds.ts at FAMILY_BACKGROUNDS_VERSION. Another package that copies the file checks its copy against this; a change to the file changes the version and this line together. */
const SHA256 = "23e1ce89ed072365813df6255414aa51b056fb582f4b253d041e78c4d16b57d0";
const VERSION = "1.0.0";

const SIZES: [number, number][] = [[1080, 1350], [1200, 675], [1080, 1080], [390, 1600]];
const rgb = (text: string) => parseColor(text)!;

test("family-backgrounds.ts is the file the family shares: its version and its sha256 are pinned", () => {
  assert.equal(FAMILY_BACKGROUNDS_VERSION, VERSION);
  const text = readFileSync(new URL("../src/family-backgrounds.ts", import.meta.url));
  assert.equal(createHash("sha256").update(text).digest("hex"), SHA256, "the file changed: raise FAMILY_BACKGROUNDS_VERSION, update VERSION and SHA256 here, and copy the file to the other packages");
  assert.match(text.toString("utf8").split("\n").find((l) => l.startsWith("export const FAMILY_BACKGROUNDS_VERSION")) ?? "", new RegExp(`"${VERSION}"`));
  assert.ok(!/^import\s.*from\s/m.test(text.toString("utf8")), "the module imports nothing");
});

test("there are twenty-five presets with distinct names, and every one has a dark and a light variant", () => {
  assert.equal(BACKGROUND_PRESETS.length, 25);
  assert.equal(new Set(BACKGROUND_PRESETS).size, 25);
  for (const name of ["pitch", "ice", "hardwood", "infield", "turf"]) assert.ok((BACKGROUND_PRESETS as readonly string[]).includes(name), `${name} is a playing surface`);
  const dark = new Set<string>(), light = new Set<string>();
  for (const name of BACKGROUND_PRESETS) {
    dark.add(backgroundSvg(name, { width: 1200, height: 675, theme: "dark" }).body);
    light.add(backgroundSvg(name, { width: 1200, height: 675, theme: "light" }).body);
  }
  assert.equal(dark.size, 25, "every dark preset is its own picture");
  assert.equal(light.size, 25);
  assert.throws(() => backgroundSvg("nope" as BackgroundPresetName, { width: 10, height: 10 }), /Unknown background/);
});

for (const name of BACKGROUND_PRESETS) {
  test(`background ${name}: deterministic, small, well-formed, and its ink reads over it (AA for large text at least)`, () => {
    for (const theme of ["dark", "light"] as const) {
      for (const [width, height] of SIZES) {
        const made = backgroundSvg(name, { width, height, theme });
        assert.deepEqual(backgroundSvg(name, { width, height, theme }), made, "the same options give the same markup");
        const size = made.defs.length + made.body.length;
        assert.ok(size <= 6000, `${name} ${theme} ${width}x${height} is ${size} bytes: the budget is 6000`);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><defs>${made.defs}</defs><rect fill="${made.ink.base}"/>${made.body}</svg>`;
        assert.equal(wellFormed(svg), null);
        assert.ok(!/NaN|undefined|Infinity/.test(svg));
        // Every id the picture writes starts with its prefix, and every reference finds its id.
        const ids = [...made.defs.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
        assert.equal(new Set(ids).size, ids.length, "ids are unique");
        for (const ref of made.body.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(ref[1]), `${ref[1]} is defined`);
        // Contrast: the text over every colour the picture mostly is, at its strongest glow.
        const { ink } = made;
        assert.equal(ink.dark, theme === "dark" || ink.dark, "the ink knows its ground");
        for (const ground of ink.dominant) {
          assert.ok(contrastRatio(rgb(ink.text), rgb(ground)) >= 4.5, `${name} ${theme}: text on ${ground} is ${contrastRatio(rgb(ink.text), rgb(ground)).toFixed(2)}`);
          assert.ok(contrastRatio(rgb(ink.muted), rgb(ground)) >= 3, `${name} ${theme}: muted text on ${ground}`);
          if (ink.dominant.indexOf(ground) < 2) assert.ok(contrastRatio(rgb(ink.accent), rgb(ground)) >= 3, `${name} ${theme}: accent on ${ground}`);
          // The box laid on the ground keeps the text readable: the rgba of the box over the ground.
          const box = /rgba\((\d+),(\d+),(\d+),([\d.]+)\)/.exec(ink.box)!.slice(1).map(Number);
          const over = [0, 1, 2].map((i) => box[3] * box[i] + (1 - box[3]) * rgb(ground)[i]) as unknown as [number, number, number];
          assert.ok(contrastRatio(rgb(ink.text), over) >= 4.5, `${name} ${theme}: text in a box over ${ground}`);
        }
      }
    }
  });
}

test("the ink holds with colours of your own, including mid-tones that suit neither a dark nor a pale text", () => {
  const sets = [["#808080"], ["#7a7a7a", "#8a8a8a"], ["#ff0000", "#00ff00", "#0000ff", "#ffff00"], ["#777788", "#888877", "#ffffff", "#000000"], ["#fff", "#eee"], ["#102030"], ["rgb(120, 130, 140)", "rgb(150, 140, 130)"]];
  for (const colors of sets) for (const name of BACKGROUND_PRESETS) for (const intensity of [0, 0.6, 1]) {
    const { ink } = backgroundSvg(name, { width: 1080, height: 1350, colors, intensity });
    for (const ground of ink.dominant) assert.ok(contrastRatio(rgb(ink.text), rgb(ground)) >= 4.5, `${name} ${colors.join(",")} ${intensity}: ${ground}`);
  }
});

test("colors, angle, intensity and seed change the picture; the seed moves the scattered parts and nothing else does", () => {
  const base = { width: 1080, height: 1350, id: "t" };
  const plain = backgroundSvg("confetti", base);
  assert.notEqual(backgroundSvg("confetti", { ...base, seed: 7 }).body, plain.body);
  assert.equal(backgroundSvg("confetti", { ...base, seed: 7 }).body, backgroundSvg("confetti", { ...base, seed: 7 }).body);
  assert.notEqual(backgroundSvg("midnight", { ...base, colors: ["#220000", "#550000"] }).defs, backgroundSvg("midnight", base).defs);
  assert.notEqual(backgroundSvg("midnight", { ...base, angle: 40 }).defs, backgroundSvg("midnight", base).defs);
  assert.notEqual(backgroundSvg("midnight", { ...base, intensity: 1 }).body, backgroundSvg("midnight", { ...base, intensity: 0.1 }).body);
  assert.equal(backgroundSvg("midnight", { ...base, id: "x" }).defs.includes('id="xg"'), true, "an id option is the prefix");
  // A bad colour is ignored, not drawn.
  assert.equal(backgroundSvg("midnight", { ...base, colors: ["not a colour"] }).defs, backgroundSvg("midnight", base).defs);
});

test("a copy of the module is the same text in every package: it has no import, no clock and no random number", () => {
  const text = readFileSync(new URL("../src/family-backgrounds.ts", import.meta.url), "utf8");
  assert.ok(!/Math\.random|Date\.now|new Date|performance\.now/.test(text));
});
