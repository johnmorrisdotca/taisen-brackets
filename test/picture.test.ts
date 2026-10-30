// The postseason picture (`layout: "picture"`): each club a logo tile with its seed, the result beside each pair, the round's name and length under its column, the champion big in the middle.
// The geometry test of test/layouts.test.ts counts marks and slots; the tiles are the picture's own, so they are measured here: inside their box, apart from each other and from the text, and the lines lead to them.
import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "../demo/data.js";
import { FLAGS } from "../demo/flags-data.js";
import * as T from "../src/index.ts";
import type { BracketInput, DrawOptions, Matchup, SizeName, Team } from "../src/index.ts";
import { inside, overlap, rectOf, segments, textBox, type Box } from "./geometry.ts";
import { finished, wellFormed } from "./helpers.ts";
import { parseXml, walk, withClass, type Node } from "./xml.ts";

const data = build(T, FLAGS);
const flags = (code: string) => FLAGS[code];
const SIZES: SizeName[] = ["wide", "square", "card", "phone"];
const f = (b: Box) => `${b.x.toFixed(1)},${b.y.toFixed(1)} ${b.w.toFixed(1)}x${b.h.toFixed(1)}`;
const FAMILIES: [string, BracketInput][] = [["mlb2025", data.mlb2025], ["mlb2022", data.mlb2022], ["nhl2024", data.nhl2024], ["nfl2024", data.nfl2024], ["nba2024", data.nba2024], ["cfl2024", data.cfl2024], ["mls2024", data.mls2024], ["wc2022", data.wc2022], ["wc2026", data.wc2026]];

/** A bracket of `n` clubs in two conferences, every series decided, the better seed winning: the sizes of a side the picture draws (4, 6, 8 a side and more). */
function conferences(n: number, bestOf: number | undefined): { teams: Team[]; matchups: Matchup[] } {
  const made = finished(n);
  const teams = made.teams.map((t, i) => ({ ...t, group: i % 2 === 0 ? "East" : "West" }));
  // A series is won in games: the better seed wins `need` games to one.
  const series = (m: Matchup): Matchup => {
    if (bestOf === undefined || bestOf === 1 || m.score === undefined) return bestOf === undefined ? m : { ...m, bestOf };
    const need = Math.ceil(bestOf / 2);
    return { ...m, bestOf, score: m.score[0] > m.score[1] ? [need, 1] : [1, need] };
  };
  return { teams, matchups: made.matchups.map(series) };
}

/** The tiles of a drawing with the box of the tie each is in. */
function tiesOf(svg: string): { box: Box; tiles: Box[]; texts: { node: Node; b: Box }[]; badges: { b: Box; tile: Box | null }[] }[] {
  const root = parseXml(svg);
  return withClass(root, "tb-tie").map((tie) => {
    const nodes = walk(tie);
    const box = rectOf(nodes.find((n) => (n.attrs.class ?? "").split(/\s+/).includes("tb-box"))!);
    const tiles = nodes.filter((n) => n.name === "rect" && (n.attrs.class ?? "").split(/\s+/).includes("tb-ptile")).map(rectOf);
    const texts = nodes.filter((n) => n.name === "text" && !(n.attrs.class ?? "").includes("tb-initials") && n.text.trim() !== "").map((node) => ({ node, b: textBox(node) }));
    const badges = nodes.filter((n) => n.name === "rect" && (n.attrs.class ?? "").includes("tb-pbadge")).map(rectOf).map((b) => ({ b, tile: tiles.find((t) => inside(b, t, 0)) ?? null }));
    return { box, tiles, texts, badges };
  });
}

for (const look of ["classic", "road"] as const) {
  for (const size of SIZES) {
    test(`the picture, ${look} look, ${size}: every tile and text is inside its box, tiles do not meet, texts stay off the tiles`, () => {
      const bad: string[] = [];
      for (const [name, ex] of FAMILIES) {
        for (const [what, o] of [["", {}], [" (seeds off)", { seeds: false }], [" (scores off)", { scores: false }], [" (names)", { markShape: "none" as const }], [" (round)", { markShape: "round" as const }]] as [string, DrawOptions][]) {
          const svg = T.drawBracket(ex, { layout: "picture", look, size, flags, ...o });
          assert.equal(wellFormed(svg), null, `${name}${what}: well-formed`);
          ties: for (const [k, t] of tiesOf(svg).entries()) {
            for (const [i, tile] of t.tiles.entries()) {
              if (!inside(tile, t.box, 1)) { bad.push(`${name}${what} tie ${k}: a tile (${f(tile)}) is outside its box (${f(t.box)})`); continue ties; }
              for (const other of t.tiles.slice(i + 1)) if (overlap(tile, other, -0.5)) bad.push(`${name}${what} tie ${k}: two tiles meet (${f(tile)}, ${f(other)})`);
            }
            for (const x of t.texts) {
              if (!inside(x.b, t.box, 1)) bad.push(`${name}${what} tie ${k}: the text "${x.node.text}" (${f(x.b)}) is outside its box (${f(t.box)})`);
              const isSeed = (x.node.attrs.class ?? "").includes("tb-pseed");
              if (!isSeed) for (const tile of t.tiles) if (overlap({ x: x.b.x + 0.5, y: x.b.y + 2, w: x.b.w - 1, h: x.b.h - 4 }, tile, 0)) bad.push(`${name}${what} tie ${k}: the text "${x.node.text}" (${f(x.b)}) is on a tile (${f(tile)})`);
            }
            t.texts.forEach((x, i) => t.texts.slice(i + 1).forEach((y) => {
              if (overlap({ x: x.b.x + 0.5, y: x.b.y + 2, w: x.b.w - 1, h: x.b.h - 4 }, { x: y.b.x + 0.5, y: y.b.y + 2, w: y.b.w - 1, h: y.b.h - 4 })) bad.push(`${name}${what} tie ${k}: the texts "${x.node.text}" and "${y.node.text}" overlap`);
            }));
            for (const b of t.badges) if (b.tile === null) bad.push(`${name}${what} tie ${k}: a seed badge (${f(b.b)}) is not on a tile`);
          }
        }
      }
      assert.deepEqual(bad.slice(0, 12), [], `${bad.length} problems`);
    });
  }
}

test("the lines of the picture lead to the tile the winner takes the place of, and the final's tiles sit where its lines arrive", () => {
  for (const [name, ex] of [["mlb2025", data.mlb2025], ["nhl2024", data.nhl2024], ["nfl2024", data.nfl2024]] as [string, BracketInput][]) {
    for (const size of ["wide", "phone"] as const) {
      const svg = T.drawBracket(ex, { layout: "picture", size });
      const root = parseXml(svg);
      const tiles = tiesOf(svg).flatMap((t) => t.tiles);
      const lines = walk(root).filter((n) => n.name === "path" && n.attrs.class === "tb-line");
      assert.ok(lines.length > 0, `${name} ${size}: lines`);
      for (const line of lines) {
        const segs = segments(line.attrs.d);
        const end = segs.at(-1)!;
        // The last piece of a line ends at the box that takes the winner: horizontal on a desk, vertical on a phone; its other coordinate is a tile's centre.
        const wide = size !== "phone";
        const at = wide ? end.y1 : end.x1;
        const centres = tiles.map((t) => (wide ? t.y + t.h / 2 : t.x + t.w / 2));
        assert.ok(centres.some((c) => Math.abs(c - at) < 0.6), `${name} ${size}: a line ends at ${at.toFixed(1)}, which is no tile's centre`);
      }
    }
  }
});

test("the result is written beside the pair: who won and the score, on two lines where the box is narrow, one where it is wide", () => {
  const wide = T.drawBracket(data.mlb2025, { layout: "picture", size: { width: 1800, height: 900 } });
  assert.ok(wide.includes(">DET wins 2–1<") || wide.includes(">DET wins<"), "a wide box says it whole or on two lines");
  const desk = T.drawBracket(data.mlb2025, { layout: "picture" });
  assert.ok(desk.includes(">DET wins<") && desk.includes(">2–1<"), "the desk's box has two lines");
  assert.ok(desk.includes(">LAD wins 4–3<") || desk.includes(">LAD wins<"), "the final's result");
  // Nothing is said of a series not played yet.
  const toPlay = T.drawBracket({ teams: data.mlb2025.teams, matchups: data.mlb2025.matchups.map((m) => (m.id === "ws" ? { ...m, score: undefined } : m)) }, { layout: "picture" });
  const finalTie = tiesOf(toPlay).find((t) => t.box.w > 150 && t.tiles.length === 2 && t.texts.some((x) => x.node.text === "vs"));
  assert.ok(finalTie, "the final is a pair with vs between its tiles");
  assert.ok(!toPlay.includes(">LAD wins 4–3<"), "no result for the final");
  assert.ok(toPlay.includes(">vs<"), "the final says vs");
  assert.ok(!toPlay.includes("tb-champ\""), "and has no champion");
});

test("a shoot-out is told after the score, in smaller type", () => {
  const svg = T.drawBracket(data.wc2022, { layout: "picture", markShape: "round" });
  assert.ok(/ARG wins[^<]*(<tspan[^>]*>\(4–2\)<\/tspan>)?/.test(svg) && svg.includes(">(4–2)<"), "the final's penalties");
});

test("each round is named under its column with the length of its series, the final's under the centre", () => {
  const svg = T.drawBracket(data.mlb2025, { layout: "picture", roundNames: T.playoffFormat("mlb", 2025)! });
  const names = withClass(parseXml(svg), "tb-plabel").map((n) => n.text);
  assert.deepEqual(names, ["WILD CARD SERIES", "WILD CARD SERIES", "DIVISION SERIES", "DIVISION SERIES", "LEAGUE", "CHAMPIONSHIP SERIES", "LEAGUE", "CHAMPIONSHIP SERIES", "WORLD SERIES"]);
  const best = withClass(parseXml(svg), "tb-pbest").map((n) => n.text);
  assert.deepEqual(best, ["Best of 3", "Best of 3", "Best of 5", "Best of 5", "Best of 7", "Best of 7", "Best of 7"]);
  // They stand under the tree, and none is over a box.
  const boxes = tiesOf(svg).map((t) => t.box);
  for (const n of withClass(parseXml(svg), "tb-plabel")) for (const b of boxes) assert.ok(!overlap(textBox(n), b, 0), `"${n.text}" over a box`);
  // `roundLabels: false` leaves them out.
  assert.equal(withClass(parseXml(T.drawBracket(data.mlb2025, { layout: "picture", roundLabels: false })), "tb-plabel").length, 0);
});

test("a round of single games says best of 1 when it is given, and says nothing of length when it is not", () => {
  const one = conferences(8, 1);
  assert.ok(T.drawBracket(one, { layout: "picture" }).includes(">Best of 1<"));
  assert.ok(!T.drawBracket(conferences(8, undefined), { layout: "picture" }).includes("Best of"));
  assert.ok(T.drawBracket(conferences(8, 7), { layout: "picture", locale: "fr" }).includes(">Au meilleur des 7<"));
  assert.ok(T.drawBracket(conferences(8, 7), { layout: "picture", locale: "ja" }).includes(">7戦4勝制<"));
});

test("seeds are badges on the tiles, left out with seeds: false and for a club with none", () => {
  const svg = T.drawBracket(data.mlb2025, { layout: "picture" });
  const badges = withClass(parseXml(svg), "tb-pseed").map((n) => n.text);
  assert.ok(badges.length >= 12 && badges.every((x) => /^[1-6]$/.test(x)), `seed numbers: ${badges.join("")}`);
  assert.equal(withClass(parseXml(T.drawBracket(data.mlb2025, { layout: "picture", seeds: false })), "tb-pseed").length, 0);
  assert.equal(withClass(parseXml(T.drawBracket(data.nfl2024, { layout: "picture" })), "tb-pseed").length, 0, "the NFL's clubs carry no seed here");
});

test("a side that skipped the earlier rounds says bye, once for each pair with one such side", () => {
  const svg = T.drawBracket(data.mlb2025, { layout: "picture" });
  assert.equal(withClass(parseXml(svg), "tb-pbye").length, 4);
  assert.equal(withClass(parseXml(T.drawBracket(finished(8), { layout: "picture" })), "tb-pbye").length, 0);
});

test("4, 6, 8 and more clubs a side, with byes and a single game, are drawn with a champion in the middle", () => {
  for (const n of [4, 6, 8, 12, 14, 16, 3, 5]) for (const bestOf of [undefined, 1, 7]) for (const size of ["wide", "phone"] as const) {
    const input = conferences(n, bestOf);
    const svg = T.drawBracket(input, { layout: "picture", size });
    assert.equal(wellFormed(svg), null, `${n} clubs`);
    assert.equal(withClass(parseXml(svg), "tb-champ").length, 1, `${n} clubs ${size}: one champion`);
    assert.equal(withClass(parseXml(svg), "tb-final").length, 1, `${n} clubs ${size}: one final`);
    for (const t of tiesOf(svg)) for (const tile of t.tiles) assert.ok(inside(tile, t.box, 1), `${n} clubs ${size}: a tile inside its box`);
  }
  // A final alone.
  const lone = T.drawBracket([{ sides: ["A", "B"], round: 1, bestOf: 7, score: [4, 2] }], { layout: "picture" });
  assert.equal(wellFormed(lone), null);
  assert.ok(lone.includes(">A wins"));
  assert.equal(withClass(parseXml(lone), "tb-champ").length, 1);
});

test("a tile is the club's logo, flag or letters on its colour, and the champion is the same tile, large", () => {
  const teams: Team[] = [
    { id: "A", name: "Alpha", abbr: "ALP", color: "#2457c5", mark: '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>' },
    { id: "B", name: "Beta", abbr: "BET", color: "#b3261e" },
  ];
  const svg = T.drawBracket({ teams, matchups: [{ sides: ["A", "B"], round: 1, bestOf: 7, score: [4, 1] }] }, { layout: "picture" });
  assert.ok(svg.includes("<symbol"), "the logo is a symbol");
  assert.ok(svg.includes('style="fill:#b3261e"') && svg.includes(">BET<"), "a club with no picture is its letters on its colour");
  const tile = withClass(parseXml(svg), "tb-champ")[0];
  assert.ok(rectOf(withClass(tile, "tb-ptile")[0]).w >= 56, "the champion's tile is large");
  // `markShape: "none"` is letters on every tile.
  const letters = T.drawBracket({ teams, matchups: [{ sides: ["A", "B"], round: 1, bestOf: 7, score: [4, 1] }] }, { layout: "picture", markShape: "none" });
  assert.ok(!letters.includes("<symbol") && letters.includes(">ALP<"));
  // A mark that is an address is written once.
  const url = T.drawBracket({ teams: teams.map((t) => ({ ...t, mark: "https://example.com/logo.png" })), matchups: [{ sides: ["A", "B"], round: 1, score: [2, 1] }] }, { layout: "picture" });
  assert.equal(url.split("https://example.com/logo.png").length - 1, 1);
});

test("the picture is in every language and in light and dark; no script, no clock, and the same drawing every time", () => {
  for (const locale of T.LOCALE_CODES) {
    const svg = T.drawBracket(data.mlb2025, { layout: "picture", locale });
    assert.equal(wellFormed(svg), null, locale);
    assert.ok(svg.includes(T.drawBracket(data.mlb2025, { layout: "picture", locale })), locale);
  }
  const big: DrawOptions = { layout: "picture", size: { width: 2000, height: 1000 } };
  assert.ok(T.drawBracket(data.mlb2025, { ...big, locale: "fr" }).includes("TOR gagne"));
  assert.ok(T.drawBracket(data.mlb2025, { ...big, locale: "de" }).includes("TOR gewinnt"));
  assert.ok(T.drawBracket(data.mlb2025, { ...big, locale: "es" }).includes("TOR gana"));
  assert.ok(T.drawBracket(data.mlb2025, { ...big, locale: "ja" }).includes("TORが4–3で勝利"));
  const auto = T.drawBracket(data.mlb2025, { layout: "picture" });
  assert.ok(auto.includes("prefers-color-scheme: dark") && auto.includes(".tb-ptile"), "light and dark from the page");
  assert.ok(T.drawBracket(data.mlb2025, { layout: "picture", theme: "dark" }).includes(".tb-ptile"));
  assert.ok(!T.drawBracket(data.mlb2025, { layout: "picture", theme: "none" }).includes("<style>"));
  assert.ok(!/<script|javascript:/i.test(auto));
});

test("the style of a picture can be written once for two drawings, the desk's and the phone's", () => {
  const options: DrawOptions = { layout: "picture", styleScope: "pic", theme: "light" };
  const css = T.bracketStyle(options);
  assert.ok(css.includes(".pic .tb-ptile") && css.includes(".pic .tb-plabel"));
  const desk = T.drawBracket(data.mlb2025, { ...options, size: "wide" });
  const phone = T.drawBracket(data.mlb2025, { ...options, size: "phone", style: false });
  assert.ok(desk.includes(css) && !phone.includes("<style>"));
});

test("a team's name is escaped everywhere the picture writes it, and a link covers each side", () => {
  const teams: Team[] = [{ id: "A", name: '<img src=x onerror="1">', abbr: "A&B" }, { id: "B", name: "Beta", abbr: "BET" }];
  const svg = T.drawBracket({ teams, matchups: [{ sides: ["A", "B"], round: 1, bestOf: 5, score: [3, 0] }] }, { layout: "picture", href: (_tie, side) => (side === undefined ? null : `/team/${side}`) });
  assert.equal(wellFormed(svg), null);
  assert.ok(!svg.includes("<img") && svg.includes("A&amp;B wins"));
  assert.equal(withClass(parseXml(svg), "tb-link").length, 2);
});

test("on a tall page the pair is two tiles side by side with the result under them, and the half at the bottom faces the final", () => {
  const svg = T.drawBracket(data.nhl2024, { layout: "picture", size: "phone" });
  const ties = tiesOf(svg).filter((t) => t.tiles.length === 2);
  assert.ok(ties.length > 8);
  // In the first rounds the two tiles are in one row.
  for (const t of ties.slice(0, 8)) assert.ok(Math.abs(t.tiles[0].y - t.tiles[1].y) < 0.5, "one row");
  assert.ok(Math.max(...withClass(parseXml(svg), "tb-champ").map((n) => rectOf(withClass(n, "tb-ptile")[0]).w)) >= 60);
});
