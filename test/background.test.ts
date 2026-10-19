// The `background` option of drawBracket and roadToFinal, the seed tags, the codes and the vs, and the tile a team with no picture is drawn as.
import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "../demo/data.js";
import { FLAGS } from "../demo/flags-data.js";
import { WORLD_CUP_ROWS, roadFinalists } from "../demo/road-data.js";
import * as T from "../src/index.ts";
import type { Matchup } from "../src/index.ts";
import { problems } from "./geometry.ts";
import { wellFormed } from "./helpers.ts";
import { parseXml, walk, withClass } from "./xml.ts";

const data = build(T, FLAGS);
const flags = (code: string) => FLAGS[code];
const { wc2022, nhl2024 } = data;

test("with no background asked for, the drawing is what it was: true and left out are the same, false is transparent", () => {
  assert.equal(T.drawBracket(wc2022, { id: "x" }), T.drawBracket(wc2022, { id: "x", background: true }));
  assert.ok(!T.drawBracket(wc2022, { id: "x" }).includes("<g clip-path"));
  assert.ok(!T.drawBracket(wc2022, { id: "x", background: false }).includes('class="tb-bg"'));
  assert.ok(T.drawBracket(wc2022, { id: "x" }).includes('class="tb-bg"'));
});

test("a preset's name draws that background under the bracket, in the look's variant, with the colours that read over it", () => {
  for (const [theme, dark] of [["dark", true], ["light", false], ["poster", true]] as const) {
    const svg = T.drawBracket(nhl2024, { id: "x", look: "road", theme, background: "ice", flags });
    assert.equal(wellFormed(svg), null);
    assert.match(svg, /<rect class="tb-bg"[^>]*\/><g clip-path="url\(#xbc\)">/);
    const ink = T.backgroundSvg("ice", { width: 1200, height: 675, theme: dark ? "dark" : "light", id: "xb" }).ink;
    assert.ok(svg.includes(ink.text), `${theme}: the text colour of the ink is in the style`);
    assert.ok(svg.includes(ink.box));
    assert.ok(!svg.includes("tb-bgl") && !svg.includes("tb-bgd"), "one look, one picture");
    assert.deepEqual(problems(svg), []);
  }
  // auto draws both and the stylesheet shows the one that fits.
  const auto = T.drawBracket(nhl2024, { id: "x", look: "road", background: "ice" });
  assert.match(auto, /class="tb-bgl"/);
  assert.match(auto, /class="tb-bgd"/);
  assert.match(auto, /\.tb-bgd\{display:none\}/);
  assert.match(auto, /prefers-color-scheme: dark/);
  assert.match(auto, /\.tb-bgl\{display:none\}/);
  assert.equal(wellFormed(auto), null);
});

test("every preset draws under both looks, every size, with nothing sticking out", () => {
  for (const name of T.BACKGROUND_PRESETS) for (const size of ["wide", "phone"] as const) {
    const svg = T.drawBracket(wc2022, { look: "road", size, background: name, flags, theme: "dark" });
    assert.equal(wellFormed(svg), null, name);
    assert.deepEqual(problems(svg, { namesOverLines: false }), [], name);
  }
});

test("a tuned preset takes colours, angle, intensity and seed; an unknown preset or a bad option is refused", () => {
  const a = T.drawBracket(wc2022, { id: "x", theme: "dark", background: { preset: "confetti", seed: 1 } });
  const b = T.drawBracket(wc2022, { id: "x", theme: "dark", background: { preset: "confetti", seed: 2 } });
  assert.notEqual(a, b);
  assert.equal(a, T.drawBracket(wc2022, { id: "x", theme: "dark", background: { preset: "confetti", seed: 1 } }), "deterministic");
  assert.ok(T.drawBracket(wc2022, { theme: "dark", background: { colors: ["#112233", "#445566"], angle: 90, intensity: 1 } }).includes("#112233"));
  assert.throws(() => T.drawBracket(wc2022, { background: "nope" as never }), /unknown background "nope"/);
  assert.throws(() => T.drawBracket(wc2022, { background: { preset: "midnight", colors: [3] as never } }), /colors/);
  assert.throws(() => T.drawBracket(wc2022, { background: { preset: "midnight", angle: NaN } }), /angle/);
  // A background of one look can be asked for in the other.
  const svg = T.drawBracket(wc2022, { theme: "light", background: { preset: "midnight", theme: "dark" } });
  assert.ok(svg.includes(T.backgroundSvg("midnight", { width: 1200, height: 675, theme: "dark" }).ink.text));
});

test("your own image: under a veil, fit and dim, and only an address that is http(s), relative or data:image/", () => {
  const ok = ["https://example.com/a.png", "pics/a.jpg", "data:image/png;base64,AAAA", "/a.webp"];
  for (const image of ok) {
    const svg = T.drawBracket(wc2022, { theme: "dark", background: { image, fit: "contain", dim: 0.4 } });
    assert.equal(wellFormed(svg), null);
    assert.ok(svg.includes(`<image href="${image}"`), image);
    assert.match(svg, /preserveAspectRatio="xMidYMid meet"/);
    assert.match(svg, /fill="#000" opacity="0.4"/);
  }
  assert.match(T.drawBracket(wc2022, { theme: "light", background: { image: "a.png" } }), /preserveAspectRatio="xMidYMid slice"[^>]*\/><rect[^>]*fill="#fff" opacity="0.5"/);
  for (const image of ["javascript:alert(1)", "data:text/html;base64,AAAA", "//evil.example/a.png", "file:///etc/passwd", "vbscript:x", ""]) {
    assert.throws(() => T.drawBracket(wc2022, { background: { image } }), /background\.image/, image);
  }
  // A hostile value that passes the check is still escaped.
  const svg = T.drawBracket(wc2022, { theme: "dark", background: { image: 'a.png" onload="alert(1)' } });
  assert.ok(!svg.includes('onload="alert(1)"'));
  assert.equal(wellFormed(svg), null);
  assert.deepEqual(T.drawBracket(wc2022, { theme: "dark", background: { image: "a.png", dim: 5 } }).match(/opacity="1"/)?.length, 1);
});

test("the road to the final takes a background the same way", () => {
  // Argentina and France of 2022, as the data gives them.
  const { finalists } = roadFinalists(WORLD_CUP_ROWS.wc2022);
  assert.deepEqual(finalists.map((f) => f.name), ["Argentina", "France"]);
  const chart = T.roadToFinal(finalists, { size: "card", theme: "dark", background: "aurora", id: "r" });
  const svg = chart.draw();
  assert.equal(wellFormed(svg), null);
  assert.match(svg, /<g clip-path="url\(#rbc\)">/);
  assert.notEqual(svg, chart.draw({ background: "swirl" }));
  assert.ok(!chart.draw({ background: false }).includes('class="tb-bg"'));
  assert.equal(chart.draw({ background: true }), T.roadToFinal(finalists, { size: "card", theme: "dark", id: "r" }).draw());
  assert.throws(() => chart.draw({ background: { image: "javascript:x" } }), /background\.image/);
});

// ----- seed tags, codes, vs and the tile

const ties = (): { matchups: Matchup[]; teams: T.Team[] } => ({
  teams: [
    { id: "VAN", name: "Vancouver Canucks", abbr: "VAN", color: "#00205b", tag: "P1" },
    { id: "NSH", name: "Nashville Predators", abbr: "NSH", tag: "WC1" },
    { id: "EDM", name: "Edmonton Oilers", abbr: "EDM", color: "#fa4616", tag: "P2" },
    { id: "LAK", name: "Los Angeles Kings", abbr: "LAK", tag: "P3" },
  ],
  matchups: [
    { id: "a", sides: ["VAN", "NSH"], round: 1, score: [4, 3], pens: undefined, seeds: ["C1", "WC2"] },
    { id: "b", sides: ["EDM", "LAK"], round: 1, score: [1, 1], pens: [5, 4] },
    { id: "f", sides: ["VAN", "EDM"], round: 2, score: [2, 1] },
  ],
});

test("seed tags: a small tag beside each mark with `seeds`, from the tie, the team's tag or its seed; none without", () => {
  for (const size of ["wide", "card", "phone", "square"] as const) for (const detail of ["auto", "mark", "compact"] as const) {
    const svg = T.drawBracket(ties(), { look: "road", size, seeds: true, detail });
    assert.equal(wellFormed(svg), null);
    const tags = withClass(parseXml(svg), "tb-tag").map((n) => n.text);
    assert.ok(tags.includes("C1") && tags.includes("WC2"), `${size} ${detail}: the tie's own tags: ${tags}`);
    assert.ok(tags.includes("P2") && tags.includes("P3"), "the team's tag where the tie gives none");
    assert.deepEqual(problems(svg), [], `${size} ${detail}`);
  }
  assert.equal(withClass(parseXml(T.drawBracket(ties(), { look: "road", seeds: false })), "tb-tag").length, 0);
  assert.equal(withClass(parseXml(T.drawBracket(ties(), { look: "road", seeds: true })), "tb-tag").length > 0, true);
  // Numbers: a team's seed is the tag.
  const numbered = T.drawBracket({ matchups: [{ sides: ["a", "b"], round: 1, score: [1, 0] }], teams: [{ id: "a", name: "A", seed: 1 }, { id: "b", name: "B", seed: 8 }] }, { look: "road", seeds: true });
  assert.deepEqual(withClass(parseXml(numbered), "tb-tag").map((n) => n.text), ["1", "8"]);
  // The classic look keeps the number before the name.
  assert.equal(withClass(parseXml(T.drawBracket(ties(), { seeds: true })), "tb-tag").length, 0);
  // A hostile tag is escaped.
  const hostile = T.drawBracket({ matchups: [{ sides: ["a", "b"], round: 1, score: [1, 0], seeds: ["<b>", '"x']  }], teams: [] }, { look: "road", seeds: true });
  assert.equal(wellFormed(hostile), null);
  assert.ok(!hostile.includes("<b>"));
});

test("codes and vs in a box of marks: three letters under each mark, a vs between the two, inside the box", () => {
  for (const size of ["wide", "card", "phone", "square"] as const) {
    const svg = T.drawBracket(ties(), { look: "road", size, detail: "mark", codes: true, vs: true, seeds: true });
    assert.deepEqual(problems(svg), [], size);
    const codes = withClass(parseXml(svg), "tb-code").map((n) => n.text);
    assert.ok(["VAN", "NSH", "EDM", "LAK"].every((c) => codes.includes(c)), `${size}: ${codes}`);
  }
  const wide = T.drawBracket(ties(), { look: "road", size: "card", detail: "mark", vs: true });
  assert.ok(withClass(parseXml(wide), "tb-vs").length > 0, "a vs where the marks leave room");
  assert.equal(withClass(parseXml(T.drawBracket(ties(), { look: "road", size: "card", detail: "mark" })), "tb-vs").length, 0, "off by default");
  assert.equal(withClass(parseXml(T.drawBracket(ties(), { look: "road", size: "card", detail: "mark" })), "tb-code").length, 0, "off by default");
});

test("a team with no flag or logo is a tile with its letters in the road look, coloured when it has a colour; the classic look keeps its disc", () => {
  const road = T.drawBracket(ties(), { look: "road", size: "wide" });
  const tiles = withClass(parseXml(road), "tb-tile");
  assert.ok(tiles.length > 0);
  assert.ok(tiles.every((t) => t.name === "rect" && Number(t.attrs.rx) > 2));
  assert.ok(tiles.some((t) => /fill:#00205b/.test(t.attrs.style ?? "")), "the team colour fills the tile");
  assert.ok(tiles.some((t) => t.attrs.style === undefined), "a team without a colour gets the neutral tile");
  assert.ok(walk(parseXml(road)).some((n) => n.name === "text" && n.text === "VAN"), "the abbreviation is on it");
  assert.equal(withClass(parseXml(T.drawBracket(ties(), { size: "wide" })), "tb-tile").length, 0);
  assert.deepEqual(problems(road), []);
});

test("an address as a flag or a logo is written once as a symbol, however many times it is used; `flags` wins over `flagHref`, which wins over `mark`", () => {
  const teams: T.Team[] = [{ id: "ES", name: "Spain", flag: "ES", mark: "https://example.com/own.png" }, { id: "MX", name: "Mexico", flag: "MX" }, { id: "FR", name: "France", flag: "FR" }, { id: "BAD", name: "Badland", flag: "XX" }];
  const matchups: Matchup[] = [
    { sides: ["ES", "MX"], round: 1, score: [1, 0] }, { sides: ["FR", "BAD"], round: 1, score: [2, 0] },
    { sides: ["ES", "FR"], round: 2, score: [1, 1], pens: [4, 3] }, { sides: ["MX", "BAD"], third: true, round: 2, score: [1, 0] },
  ];
  const calls: string[] = [];
  const flagHref = (code: string) => { calls.push(code); return code === "XX" ? "javascript:alert(1)" : `/flags/${code}.png`; };
  for (const look of ["classic", "road"] as const) {
    const svg = T.drawBracket({ matchups, teams }, { look, flagHref, id: "x" });
    assert.equal(wellFormed(svg), null);
    for (const code of ["ES", "MX", "FR"]) assert.equal(svg.split(`<image href="/flags/${code}.png"`).length - 1, 1, `${code} once`);
    assert.ok(!svg.includes("own.png"), "the flag's address wins over the team's mark");
    assert.ok(!svg.includes("javascript:"), "an unsafe address is dropped (the team's initials are drawn)");
    assert.ok(svg.split("<use ").length - 1 >= 6, "used wherever the team appears");
  }
  const withRenderer = T.drawBracket({ matchups, teams }, { flags: (code) => (code === "ES" ? '<svg viewBox="0 0 3 2"><rect width="3" height="2" fill="#c00"/></svg>' : null), flagHref, id: "y" });
  assert.ok(withRenderer.includes('viewBox="0 0 3 2"') && !withRenderer.includes("/flags/ES.png"), "the renderer wins where it has a flag");
  assert.ok(withRenderer.includes("/flags/MX.png"), "the address is used where it has none");
  assert.equal(wellFormed(T.drawBracket({ matchups, teams }, { flagHref: () => { throw new Error("no"); } })), null, "a function that throws draws initials");
  // Logo addresses repeated in the data are written once too.
  const logos = T.drawBracket({ matchups: [{ sides: ["A", "B"], round: 1, score: [1, 0] }, { sides: ["A", "B"], round: 2, score: [2, 0] }], teams: [{ id: "A", name: "A", mark: "https://example.com/a.png" }, { id: "B", name: "B", mark: "https://example.com/b.png" }] });
  assert.equal(logos.split("<image ").length - 1, 2);
  assert.equal(wellFormed(logos), null);
  // The road chart takes it too.
  const [fa, fb] = roadFinalists(WORLD_CUP_ROWS.wc2022).finalists;
  const chart = T.roadToFinal([{ ...fa, flag: "ES", mark: undefined }, { ...fb, flag: "ES", mark: undefined }], { flagHref }).draw();
  assert.ok(chart.includes('<image href="/flags/ES.png"') && wellFormed(chart) === null);
});

test("tieClass adds safe class words to a tie's group, so a page can dim or highlight ties; hostile text adds nothing", () => {
  const svg = T.drawBracket(nhl2024, { tieClass: (tie) => (tie.round === 1 ? "mine" : 'other " onload="x" bad:word 9lives -x ok_2'), id: "x" });
  assert.equal(wellFormed(svg), null);
  const groups = withClass(parseXml(svg), "tb-tie");
  assert.ok(groups.some((g) => g.attrs.class.split(" ").includes("mine")));
  assert.ok(groups.some((g) => g.attrs.class.split(" ").includes("other") && g.attrs.class.split(" ").includes("ok_2")));
  assert.ok(!svg.includes("onload") && !svg.includes("bad:word") && !svg.includes("9lives"));
  assert.equal(T.drawBracket(nhl2024, { id: "x", tieClass: () => { throw new Error("no"); } }), T.drawBracket(nhl2024, { id: "x" }), "a function that throws adds nothing");
  assert.equal(T.drawBracket(nhl2024, { id: "x", tieClass: () => undefined }), T.drawBracket(nhl2024, { id: "x" }));
});
