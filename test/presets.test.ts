import assert from "node:assert/strict";
import { test } from "node:test";
import * as T from "../src/index.ts";
import { build } from "../demo/data.js";

const { mlb2022, nhl2024, wc1938, wc2022, wc2026 } = build(T);

const names = (league: T.League, year: number) => T.playoffFormat(league, year)?.rounds.map((r) => r.name);
const lengths = (league: T.League, year: number) => T.playoffFormat(league, year)?.rounds.map((r) => r.bestOf);

test("the NHL's round names and lengths by era", () => {
  assert.deepEqual(names("nhl", 2024), ["First Round", "Second Round", "Conference Finals", "Stanley Cup Final"]);
  assert.deepEqual(lengths("nhl", 2024), [7, 7, 7, 7]);
  assert.deepEqual(names("nhl", 1990), ["Division Semifinals", "Division Finals", "Conference Finals", "Stanley Cup Final"]);
  assert.deepEqual(lengths("nhl", 1985), [5, 7, 7, 7]);
  assert.deepEqual(lengths("nhl", 1987), [7, 7, 7, 7]);
  assert.equal(T.playoffFormat("nhl", 2020)!.rounds[0].name, "Qualifying Round");
  assert.equal(T.playoffFormat("nhl", 2020)!.teams, 24);
  assert.equal(T.playoffFormat("nhl", 2021)!.groups, null);
  assert.equal(names("nhl", 1980)![0], "Preliminary Round");
  assert.deepEqual(names("nhl", 1996), ["Conference Quarterfinals", "Conference Semifinals", "Conference Finals", "Stanley Cup Final"]);
  assert.deepEqual(names("nhl", 2013), names("nhl", 1996));
  assert.deepEqual(T.playoffFormat("nhl", 1990)!.groups, ["Campbell Conference", "Wales Conference"]);
  assert.equal(names("nhl", 2021)![2], "Stanley Cup Semifinals");
  assert.equal(T.playoffFormat("nhl", 2005), null, "the 2004-05 season was not played");
  assert.equal(T.playoffFormat("nhl", 1950), null);
  assert.equal(T.playoffFormat("nhl", 2024)!.year, 2024);
});

test("the NBA, MLB, NFL and CFL by era", () => {
  assert.deepEqual(lengths("nba", 1990), [5, 7, 7, 7]);
  assert.deepEqual(lengths("nba", 2010), [7, 7, 7, 7]);
  assert.deepEqual(lengths("nba", 1980), [3, 7, 7, 7]);
  assert.equal(T.playoffFormat("nba", 1960), null);
  assert.deepEqual(names("mlb", 2022), ["Wild Card Series", "Division Series", "League Championship Series", "World Series"]);
  assert.equal(T.playoffFormat("mlb", 2022)!.byes, 2);
  assert.deepEqual(names("mlb", 2015), ["Wild Card Game", "Division Series", "League Championship Series", "World Series"]);
  assert.deepEqual(names("mlb", 2000), ["Division Series", "League Championship Series", "World Series"]);
  assert.deepEqual(names("mlb", 1990), ["League Championship Series", "World Series"]);
  assert.equal(T.playoffFormat("mlb", 1994), null, "no postseason in 1994");
  assert.equal(T.playoffFormat("mlb", 2020)!.teams, 16);
  assert.deepEqual(names("nfl", 2023), ["Wild Card", "Divisional", "Conference Championship", "Super Bowl"]);
  assert.deepEqual([1970, 1980, 1982, 1995, 2020].map((y) => T.playoffFormat("nfl", y)!.teams), [8, 10, 16, 12, 14]);
  assert.deepEqual([1970, 1980, 1995, 2020].map((y) => T.playoffFormat("nfl", y)!.byes), [0, 3, 2, 1]);
  assert.deepEqual(names("cfl", 2023), ["Division Semi-Final", "Division Final", "Grey Cup"]);
  assert.deepEqual([1996, 2012, 2019].map((y) => T.playoffFormat("cfl", y)!.teams), [6, 6, 6]);
  assert.throws(() => T.playoffFormat("xfl" as T.League, 2020), /no format/);
});

test("the World Cup's knockout by edition, and no format for a year with no tournament", () => {
  assert.deepEqual(names("worldcup", 2022), ["Round of 16", "Quarter-finals", "Semi-finals", "Final"]);
  assert.deepEqual(names("worldcup", 2026), ["Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "Final"]);
  assert.deepEqual(names("worldcup", 1938), ["Round of 16", "Quarter-finals", "Semi-finals", "Final"]);
  assert.deepEqual(names("worldcup", 1966), ["Quarter-finals", "Semi-finals", "Final"]);
  assert.deepEqual(names("worldcup", 1982), ["Semi-finals", "Final"]);
  assert.equal(T.playoffFormat("worldcup", 1950), null);
  assert.equal(T.playoffFormat("worldcup", 2023), null);
  assert.equal(T.playoffFormat("worldcup", 2022)!.teams, 16);
});

test("every era names every round and cites an English Wikipedia article", () => {
  for (const league of T.LEAGUES) {
    const eras = T.playoffEras(league);
    assert.ok(eras.length > 0);
    for (const era of eras) {
      assert.ok(era.rounds.length > 0 && era.rounds.every((r) => r.name.length > 0));
      assert.ok(era.sources.length > 0 && era.sources.every((url) => url.startsWith("https://en.wikipedia.org/wiki/")), `${league} ${era.from}`);
    }
  }
});

test("generic round names count back from the final", () => {
  assert.deepEqual(T.roundNamesFor(4), ["Round of 16", "Quarter-finals", "Semi-finals", "Final"]);
  assert.deepEqual(T.roundNamesFor(6), ["Round of 64", "Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "Final"]);
  assert.equal(T.roundName(2), "Final");
});

test("a format's names agree with the demo brackets' rounds", () => {
  for (const [league, year, ex] of [["nhl", 2024, nhl2024], ["mlb", 2022, mlb2022], ["worldcup", 2022, wc2022], ["worldcup", 2026, wc2026], ["worldcup", 1938, wc1938]] as const) {
    const format = T.playoffFormat(league, year)!;
    const layout = T.layoutBracket(ex);
    assert.equal(layout.rounds, format.rounds.length, `${league} ${year}`);
    assert.ok(layout.teams.length <= format.teams!, `${league} ${year}`);
  }
  assert.equal(T.layoutBracket(wc1938).teams.length, 15, "Austria withdrew, so 15 teams played");
  for (const [league, year, ex] of [["nhl", 2024, nhl2024], ["mlb", 2022, mlb2022], ["worldcup", 2022, wc2022], ["worldcup", 2026, wc2026]] as const) {
    assert.equal(T.layoutBracket(ex).teams.length, T.playoffFormat(league, year)!.teams, `${league} ${year}`);
  }
});

test("the demo brackets lay out as played", () => {
  const nhl = T.layoutBracket(nhl2024);
  assert.equal(nhl.champion!.name, "Florida Panthers");
  assert.deepEqual(nhl.sides.map((s) => s.label).sort(), ["Eastern Conference", "Western Conference"]);
  assert.equal(nhl.sides[0].label, "Western Conference", "west on the left");
  assert.equal(nhl.ties.length, 15);
  const final = nhl.ties[nhl.finalIndex!];
  assert.deepEqual(final.result.score, [4, 3]);
  const wc = T.layoutBracket(wc2022);
  assert.equal(wc.champion!.name, "Argentina");
  assert.notEqual(wc.third, null);
  assert.equal(wc.ties[wc.third!].sides[0]!.name, "Croatia");
  assert.equal(wc.ties.filter((t) => t.result.pens).length, 5);
  const mlb = T.layoutBracket(mlb2022);
  assert.equal(mlb.champion!.name, "Houston Astros");
  assert.equal(mlb.ties.length, 11);
  assert.equal(mlb.sides.flatMap((s) => s.boxes).filter((b) => b.bye !== null).length, 4, "four teams skipped the wild card series");
  const old = T.layoutBracket(wc1938);
  assert.equal(old.champion!.name, "Italy");
  assert.equal(old.ties.filter((t) => t.result.kind === "replay").length, 3);
  const next = T.layoutBracket(wc2026);
  assert.equal(next.champion!.name, "Spain");
  assert.equal(next.rounds, 5);
  assert.equal(next.teams.length, 32);
  assert.deepEqual(next.ties[next.finalIndex!].result.score, [1, 0]);
  assert.equal(next.ties[next.finalIndex!].result.extraTime, true);
  assert.notEqual(next.third, null);
});

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

test("the looks' text is held to WCAG AA on its boxes and its background", () => {
  for (const [name, p] of Object.entries(T.THEMES)) {
    assert.ok(contrast(p.ink, p.box) >= 4.5, `${name}: ink on box ${contrast(p.ink, p.box).toFixed(2)}`);
    assert.ok(contrast(p.muted, p.box) >= 4.5, `${name}: muted on box ${contrast(p.muted, p.box).toFixed(2)}`);
    assert.ok(contrast(p.ink, p.bg) >= 4.5, `${name}: ink on background ${contrast(p.ink, p.bg).toFixed(2)}`);
    assert.ok(contrast(p.muted, p.bg) >= 4.5, `${name}: muted on background ${contrast(p.muted, p.bg).toFixed(2)}`);
    assert.ok(contrast(p.gold, p.bg) >= 4.5, `${name}: gold on background ${contrast(p.gold, p.bg).toFixed(2)}`);
    assert.ok(contrast(p.win, p.box) >= 3, `${name}: highlight on box ${contrast(p.win, p.box).toFixed(2)}`);
  }
});

test("the version in the source is the version in package.json", async () => {
  const { readFileSync } = await import("node:fs");
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(T.VERSION, pkg.version);
});
