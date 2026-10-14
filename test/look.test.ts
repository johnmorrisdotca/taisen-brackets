import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { build } from "../demo/data.js";
import * as T from "../src/index.ts";
import type { DrawOptions, FlagRenderer, SizeName, Team, Tie } from "../src/index.ts";
import { wellFormed } from "./helpers.ts";
import { parseXml, walk, withClass } from "./xml.ts";

const data = build(T);
const { wc2022, nhl2024, mlb2022, mls2024, wc1938, twoLegs } = data;
const count = (text: string, part: string) => text.split(part).length - 1;
const viewBox = (svg: string) => /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)!.slice(1).map(Number);
const SIZES: SizeName[] = ["wide", "square", "card", "phone"];
const idOf = (name: string) => wc2022.teams.find((t) => t.name === name)!.id;

test("a card is 1080 by 1350, a tall post, and the sizes are card, square, wide and phone", () => {
  assert.deepEqual(Object.keys(T.SIZES).sort(), ["card", "phone", "square", "wide"]);
  assert.deepEqual(T.SIZES.card, { width: 1080, height: 1350 });
  for (const look of ["classic", "road"] as const) {
    const [w, h] = viewBox(T.drawBracket(wc2022, { size: "card", look }));
    assert.equal(w, 1080);
    assert.ok(h >= 1350, `${look}: ${h}`);
  }
  assert.deepEqual(viewBox(T.drawBracket(wc2022, { size: "card", look: "road" })), [1080, 1350]);
  // A card is a tall page: the rounds are rows.
  assert.match(T.drawBracket(wc2022, { size: "card" }), /class="tb-round tb-halo"/);
});

test("the classic look is the default and has none of the road's marks", () => {
  const svg = T.drawBracket(wc2022);
  assert.ok(!svg.includes("tb-look-road") && !svg.includes("tb-ring-r") && !svg.includes('class="tb-panel"'));
  assert.equal(svg, T.drawBracket(wc2022, { look: "classic" }));
});

for (const size of SIZES) {
  test(`the road look at ${size}: every example draws well-formed, with a box for every tie and nothing beyond the edges`, () => {
    for (const ex of [wc2022, nhl2024, mlb2022, mls2024, wc1938, twoLegs, data.nba2024, data.nfl2024, data.cfl2024]) {
      const svg = T.drawBracket(ex, { look: "road", size, roundNames: undefined });
      assert.equal(wellFormed(svg), null);
      assert.ok(!/NaN|undefined|Infinity|\bnull\b/.test(svg));
      assert.equal(count(svg, 'class="tb-tie'), ex.matchups.length, "a box for every tie");
      assert.match(svg, /class="taisen [^"]*tb-look-road/);
      const [W] = viewBox(svg);
      for (const box of withClass(parseXml(svg), "tb-box")) {
        const x = Number(box.attrs.x), w = Number(box.attrs.width);
        assert.ok(x >= -0.5 && x + w <= W + 0.5, `a box lies inside the picture (${x}..${x + w} of ${W})`);
      }
    }
  });
}

test("the road look draws larger marks and a heavier score than the classic one, the same size in every box", () => {
  const radii = (svg: string, cls: string) => withClass(parseXml(svg), cls).map((n) => Number(n.attrs.r));
  const classic = T.drawBracket(nhl2024, { size: "wide" });
  const road = T.drawBracket(nhl2024, { size: "wide", look: "road" });
  assert.ok(Math.max(...radii(road, "tb-edge")) > Math.max(...radii(classic, "tb-ring")), "the marks are larger");
  const scoreSizes = (svg: string) => new Set(withClass(parseXml(svg), "tb-score").map((n) => n.attrs["font-size"]));
  assert.equal(scoreSizes(road).size, 1, "one size of score");
  assert.ok(Number([...scoreSizes(road)][0]) > Number([...scoreSizes(classic)][0]), "the score is larger");
  // The road look's rounds are on pills, its marks have a wide ring and a hairline, and the loser's score is quiet.
  assert.ok(count(road, 'class="tb-panel"') >= 5);
  assert.ok(road.includes("tb-ring tb-ring-r") && road.includes('class="tb-edge"'));
  assert.ok(road.includes(".tb-lost .tb-score"));
  assert.equal(road, T.drawBracket(nhl2024, { size: "wide", look: "road" }));
});

test("the road look keeps every option: names, scores off, seeds, no champion, the poster, marks alone, a third place, a language", () => {
  const options: DrawOptions[] = [
    { scores: false }, { seeds: true }, { champion: false }, { theme: "poster", detail: "mark", roundLabels: false }, { thirdPlace: "hide" }, { locale: "ja" }, { shape: "ltr" },
    { detail: "full" }, { detail: "compact" }, { markShape: "square" }, { markShape: "none" }, { theme: "none" }, { background: false }, { orientation: "vertical" }, { size: { width: 700, height: 500 } },
  ];
  for (const o of options) for (const ex of [wc2022, nhl2024]) {
    const svg = T.drawBracket(ex, { look: "road", ...o });
    assert.equal(wellFormed(svg), null, JSON.stringify(o));
    assert.ok(!/NaN|undefined|Infinity/.test(svg), JSON.stringify(o));
  }
  // Marks alone, asked for, are marks alone: no score under them.
  assert.equal(withClass(parseXml(T.drawBracket(wc2022, { look: "road", detail: "mark", size: "phone" })), "tb-score").length, 0);
  // A box of marks that was not asked for carries each score under its mark.
  assert.ok(withClass(parseXml(T.drawBracket(wc2022, { look: "road", size: "phone" })), "tb-score").length >= wc2022.matchups.length);
});

// ---------------------------------------------------------------------------------------------- links

test("`href` makes each tie's box a real link with an accessible name", () => {
  const asked: [string, number | undefined][] = [];
  const svg = T.drawBracket(wc2022, { href: (tie, side) => { asked.push([tie.id, side]); return `/match/${tie.id}?a=1&b=2`; } });
  assert.equal(wellFormed(svg), null);
  const links = walk(parseXml(svg)).filter((n) => n.name === "a");
  assert.equal(links.length, wc2022.matchups.length);
  for (const a of links) {
    assert.match(a.attrs.href, /^\/match\/[^?]+\?a=1&b=2$/);
    assert.equal(a.attrs.class, "tb-link");
    assert.ok(a.attrs["aria-label"].length > 10, "a name that says the tie");
  }
  assert.ok(svg.includes("?a=1&amp;b=2"), "the address is escaped in the markup");
  // The final's link says who played and who won.
  const final = links.find((a) => a.attrs.href.endsWith(`/match/${wc2022.matchups.at(-2)!.id ?? ""}?a=1&b=2`)) ?? links[links.length - 1];
  assert.ok(links.some((a) => a.attrs["aria-label"].includes("Argentina 3, France 3") && a.attrs["aria-label"].includes("Winner: Argentina")));
  assert.ok(final);
  // A box-wide link is asked with the tie alone, and then no side is asked.
  assert.ok(asked.every(([, side]) => side === undefined));
  // No link inside another, and the box's title stays.
  for (const a of links) assert.equal(walk(a).filter((n) => n.name === "a").length, 1);
  assert.equal(count(svg, "<title>"), wc2022.matchups.length);
  // The stylesheet has the hover and focus rules only when there is a link.
  assert.ok(svg.includes(".tb-link:focus-visible"));
  assert.ok(!T.drawBracket(wc2022).includes("tb-link"));
});

test("with no address for the box, each team's row can link on its own", () => {
  const seen: [string, number | undefined][] = [];
  const svg = T.drawBracket(wc2022, { href: (tie, side) => { seen.push([tie.id, side]); return side === undefined ? undefined : `/team/${tie.sides[side]!.id}`; } });
  const links = walk(parseXml(svg)).filter((n) => n.name === "a");
  assert.equal(links.length, wc2022.matchups.length * 2);
  assert.ok(links.every((a) => a.attrs.href.startsWith("/team/")));
  assert.ok(links.some((a) => a.attrs["aria-label"].startsWith("Argentina: Argentina 3, France 3")));
  assert.ok(seen.some(([, side]) => side === undefined) && seen.some(([, side]) => side === 0) && seen.some(([, side]) => side === 1));
  // Each row link holds that row and a hit area, never the whole box.
  for (const a of links) assert.ok(withClass(a, "tb-hit").length === 1 && withClass(a, "tb-box").length === 0);
  // A team that is not known yet has no link.
  const open = T.singleElimination(Array.from({ length: 4 }, (_, i) => ({ id: `T${i + 1}`, name: `T${i + 1}` })));
  const partial = T.drawBracket(open, { href: (tie, side) => (side === undefined ? undefined : `/t/${tie.id}/${side}`) });
  assert.equal(walk(parseXml(partial)).filter((n) => n.name === "a").length, 4);
  // Only some ties link: the rest are plain.
  const some = T.drawBracket(wc2022, { href: (tie: Tie) => (tie.round === 4 && !tie.third ? "/final" : undefined) });
  assert.equal(walk(parseXml(some)).filter((n) => n.name === "a").length, 1);
});

test("an address that could run, or leave the page unexpectedly, is not made a link", () => {
  for (const bad of ["javascript:alert(1)", " JaVaScRiPt:alert(1)", "data:text/html,<script>1</script>", "vbscript:x", "//evil.example/x", "ftp://example.com", "java\nscript:alert(1)", "", "   "]) {
    const svg = T.drawBracket(wc2022, { href: () => bad });
    assert.equal(count(svg, "<a "), 0, JSON.stringify(bad));
    assert.ok(!svg.includes("javascript:") && !svg.includes("evil.example"), JSON.stringify(bad));
  }
  for (const good of ["https://example.com/a?b=1", "http://example.com", "/games/1", "games/1", "../1", "#tie-1", "?tie=1"]) {
    assert.equal(count(T.drawBracket(wc2022, { href: () => good }), "<a "), wc2022.matchups.length, good);
  }
  assert.equal(T.safeHref("javascript:alert(1)"), false);
  assert.equal(T.safeHref("/x"), true);
  // A hostile address and a hostile name cannot break out of the attribute.
  const quoted = T.drawBracket(wc2022, { href: () => '/x"><script>alert(1)</script>' });
  assert.ok(!quoted.includes("<script"));
  assert.equal(wellFormed(quoted), null);
});

test("links work in the road look, on a phone and in every language", () => {
  for (const o of [{ look: "road" }, { size: "phone" }, { size: "card", look: "road" }, { locale: "ja" }, { locale: "de", look: "road", size: "phone" }] as DrawOptions[]) {
    const svg = T.drawBracket(wc2022, { ...o, href: (tie) => `/m/${tie.id}` });
    assert.equal(wellFormed(svg), null);
    assert.equal(count(svg, "<a "), wc2022.matchups.length);
  }
  const ja = T.drawBracket(wc2022, { locale: "ja", href: (tie) => `/m/${tie.id}` });
  assert.ok(walk(parseXml(ja)).some((n) => n.name === "a" && n.attrs["aria-label"].includes("勝者")));
});

// ---------------------------------------------------------------------------------------------- the path of a team

test("one team's path to the final is a dotted line, and the other ties are quieter", () => {
  for (const look of ["classic", "road"] as const) for (const size of ["wide", "phone"] as const) {
    const svg = T.drawBracket(wc2022, { look, size, highlightPath: idOf("Argentina") });
    const doc = parseXml(svg);
    assert.ok(doc.attrs.class.split(" ").includes("tb-follow"));
    // Argentina played the round of 16, the quarter-final, the semi-final and the final: three lines join them.
    assert.equal(withClass(doc, "tb-path").length, 3);
    assert.equal(withClass(doc, "tb-on-path").length, 4);
    assert.ok(svg.includes("stroke-dasharray:.1 9"));
    // The path is drawn last, over the other lines.
    const lines = walk(doc).filter((n) => n.name === "path" && (n.attrs.class ?? "").includes("tb-line"));
    assert.deepEqual(lines.map((n) => n.attrs.class.includes("tb-path")), [...lines.map((n) => n.attrs.class.includes("tb-path"))].sort());
    assert.equal(wellFormed(svg), null);
  }
  // A team that lost on the way has a path that ends where it lost; the third-place match is never on a path.
  const croatia = parseXml(T.drawBracket(wc2022, { highlightPath: idOf("Croatia") }));
  assert.equal(withClass(croatia, "tb-on-path").length, 3, "the round of 16, the quarter-final and the semi-final");
  assert.equal(withClass(croatia, "tb-path").length, 2);
});

test("a path that is not a team of the bracket changes nothing", () => {
  const plain = T.drawBracket(wc2022, { id: "p" });
  assert.equal(T.drawBracket(wc2022, { id: "p", highlightPath: "nobody" }), plain);
  assert.ok(!plain.includes("tb-follow"));
});

// ---------------------------------------------------------------------------------------------- flags

const squares = (code: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#${code.length === 2 ? "c60" : "06c"}"/><title>${code}</title></svg>`;

test("a team's `flag` code is drawn by the `flags` renderer, once for each flag and size, and framed round", () => {
  const asked: string[] = [];
  const flags: FlagRenderer = (code, request) => {
    asked.push(`${code}:${request.shape}:${request.size}:${request.theme}`);
    return squares(code);
  };
  const teams: Team[] = wc2022.teams.map((t) => ({ ...t, flag: t.region }));
  const svg = T.drawBracket({ ...wc2022, teams }, { flags, theme: "dark", look: "road" });
  assert.equal(wellFormed(svg), null);
  assert.ok(svg.includes("<symbol"));
  assert.ok(asked.length > 0 && asked.every((a) => /^[A-Z-]+:round:\d+:dark$/.test(a)));
  assert.equal(new Set(asked).size, asked.length);
  assert.ok(asked.some((a) => a.startsWith("AR:")));
  const square = T.drawBracket({ ...wc2022, teams }, { flags: (code, r) => { asked.push(`${r.shape}`); return squares(code); }, markShape: "square" });
  assert.ok(asked.includes("square"));
  assert.ok(square.includes("<symbol"));
  // `auto` and `none` ask for an inherited ink; light asks for light.
  const themes = new Set<string>();
  T.drawBracket({ ...wc2022, teams }, { flags: (code, r) => { themes.add(r.theme); return squares(code); } });
  T.drawBracket({ ...wc2022, teams }, { flags: (code, r) => { themes.add(r.theme); return squares(code); }, theme: "light" });
  assert.deepEqual([...themes].sort(), ["inherit", "light"]);
});

test("with no renderer, or one with no flag for the code, the team's mark or its initials are drawn, and nothing throws", () => {
  const marked: Team[] = [{ id: "a", name: "Aurora", flag: "xx", mark: '<svg viewBox="0 0 4 4"><circle r="2" cx="2" cy="2" fill="#f00"/></svg>' }, { id: "b", name: "Harbour", flag: "yy" }];
  const matchups = [{ sides: ["a", "b"], score: [2, 1] }] as never;
  const none = T.drawBracket({ teams: marked, matchups });
  assert.ok(none.includes("<symbol") && none.includes("HAR"), "the mark of a, the initials of b");
  for (const flags of [() => null, () => undefined, () => { throw new Error("no"); }, () => "<div>not an svg</div>", () => 42 as never] as FlagRenderer[]) {
    const svg = T.drawBracket({ teams: marked, matchups }, { flags });
    assert.equal(wellFormed(svg), null);
    assert.ok(svg.includes("HAR"));
  }
  // A flag SVG is cleaned like any inline mark: no script, no event handler.
  const evil = T.drawBracket({ teams: marked, matchups }, { flags: () => '<svg viewBox="0 0 4 4"><script>alert(1)</script><rect width="4" height="4" onclick="x()"/></svg>' });
  assert.ok(!evil.includes("<script") && !evil.includes("onclick"));
});

// ---------------------------------------------------------------------------------------------- no dependencies

test("the package has no runtime dependencies, and its source imports only itself and Node", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { dependencies?: object; peerDependencies?: Record<string, string>; peerDependenciesMeta?: Record<string, { optional?: boolean }> };
  assert.equal(pkg.dependencies, undefined);
  for (const name of Object.keys(pkg.peerDependencies ?? {})) assert.equal(pkg.peerDependenciesMeta?.[name]?.optional, true, `${name} is an optional peer`);
  const dir = new URL("../src/", import.meta.url);
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
    const text = readFileSync(new URL(file, dir), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of text.matchAll(/(?:from|import\()\s*["']([^"']+)["']/g)) assert.ok(m[1].startsWith("./") || m[1].startsWith("node:"), `${file} imports ${m[1]}`);
  }
});
