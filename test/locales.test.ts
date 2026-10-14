import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "../demo/data.js";
import * as T from "../src/index.ts";
import type { Locale, Team } from "../src/index.ts";
import { wellFormed } from "./helpers.ts";

const { wc2022, wc1938, nhl2024 } = build(T);
const CODES = ["en", "fr", "ja", "es", "de"] as const;
const keysOf = (words: object) => Object.keys(words).sort();

test("the built-in languages are English, French, Japanese, Spanish and German", () => {
  assert.deepEqual([...T.LOCALE_CODES], ["en", "fr", "ja", "es", "de"]);
  assert.deepEqual(Object.keys(T.LOCALES).sort(), [...CODES].sort());
  for (const code of CODES) assert.equal(T.LOCALES[code].code, code);
});

test("every word exists in every language, and none is empty", () => {
  const english = keysOf(T.LOCALES.en.words);
  for (const code of CODES) {
    assert.deepEqual(keysOf(T.LOCALES[code].words), english, `${code} has the same words as English`);
    for (const [key, value] of Object.entries(T.LOCALES[code].words)) assert.ok(typeof value === "string" && value.length > 0 || key === "end", `${code}.${key} is empty`);
  }
});

test("every phrase keeps the holes of the English one (so nothing is dropped from a sentence)", () => {
  const holes = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
  const needs = ["pensScore", "inGames", "bestOf", "round", "roundOf", "tieVs", "tieScore", "scoreText", "winnerIs", "championIs", "finalLine", "summary", "summaryOne", "note"] as const;
  for (const code of CODES) {
    const words = T.LOCALES[code].words;
    for (const key of needs) {
      const wanted = holes(T.LOCALES.en.words[key]);
      const got = holes(words[key]);
      // A language may leave out a hole it has no use for ("best of {n}" has {w} in Japanese only), but never lack one English has.
      for (const hole of wanted.split(",").filter(Boolean)) assert.ok(got.split(",").includes(hole), `${code}.${key} lacks {${hole}}`);
    }
  }
});

test("every round name of every league and era has a name in every language, and none is missing", () => {
  const names = new Set<string>();
  for (const league of T.LEAGUES) for (const era of T.playoffEras(league)) for (const round of era.rounds) names.add(round.name);
  assert.ok(names.size >= 30);
  for (const code of CODES.filter((c) => c !== "en")) {
    const rounds = T.LOCALES[code].rounds;
    for (const name of names) assert.ok(typeof rounds[name] === "string" && rounds[name].length > 0, `${code} has no name for "${name}"`);
  }
  for (const name of ["Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "Final"]) assert.ok(names.has(name));
});

test("the football terms of each language are the ones of its Wikipedia articles on the World Cup", () => {
  const r = (code: (typeof CODES)[number]) => T.LOCALES[code].rounds;
  assert.deepEqual(["Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "Final"].map((n) => r("fr")[n]), ["Seizièmes de finale", "Huitièmes de finale", "Quarts de finale", "Demi-finales", "Finale"]);
  assert.deepEqual(["Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "Final"].map((n) => r("es")[n]), ["Dieciseisavos de final", "Octavos de final", "Cuartos de final", "Semifinales", "Final"]);
  assert.deepEqual(["Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "Final"].map((n) => r("de")[n]), ["Sechzehntelfinale", "Achtelfinale", "Viertelfinale", "Halbfinale", "Finale"]);
  assert.deepEqual(["Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "Final"].map((n) => r("ja")[n]), ["ラウンド32", "ラウンド16", "準々決勝", "準決勝", "決勝"]);
  assert.equal(T.LOCALES.fr.words.aetLong, "après prolongation");
  assert.equal(T.LOCALES.fr.words.pensScore, "{a}–{b} aux tirs au but");
  assert.equal(T.LOCALES.es.words.aetLong, "tras la prórroga");
  assert.equal(T.LOCALES.de.words.aetLong, "nach Verlängerung");
  assert.match(T.LOCALES.de.words.pensScore, /Elfmeterschießen/);
  assert.equal(T.LOCALES.ja.words.aetLong, "延長戦");
  assert.equal(T.LOCALES.ja.words.pens, "PK戦");
  assert.equal(T.LOCALES.de.words.thirdPlace, "Spiel um Platz 3");
  assert.equal(T.LOCALES.ja.words.thirdPlace, "3位決定戦");
});

test("a round the language has no word of its own for is 'round of N'", () => {
  const fr = T.voiceOf({ locale: "fr" });
  assert.equal(fr.round("Round of 64"), "Tour à 64 équipes");
  assert.equal(T.voiceOf({ locale: "ja" }).round("Round of 128"), "ラウンド128");
  assert.equal(T.voiceOf({ locale: "de" }).round("Qualifier"), "Qualifier", "a name that is not known is kept");
});

for (const code of CODES) {
  test(`the drawing, the table and the description are written in ${code}`, () => {
    const w = T.LOCALES[code].words;
    const viaIntl = (team: Team, locale: Locale) => (team.region ? T.countryName(team.region, locale) : undefined);
    const svg = T.drawBracket(wc2022, { locale: code, teamName: viaIntl });
    assert.equal(wellFormed(svg), null);
    assert.match(svg, new RegExp(`<svg [^>]*lang="${code}"`));
    const v = T.voiceOf({ locale: code, teamName: viaIntl });
    assert.ok(svg.includes(v.upper(v.round("Round of 16"))), `${code}: the round of 16`);
    assert.ok(svg.includes(v.upper(v.round("Quarter-finals"))));
    assert.ok(svg.includes(v.upper(w.champion)));
    assert.ok(svg.includes(v.upper(w.thirdPlace)));
    // The tooltip of the final, in full.
    const final = T.describeTie(T.localizedLayout(T.layoutBracket(wc2022), v).ties.find((t) => t.result.pens && t.round === 4 && !t.third)!, v);
    assert.ok(final.includes(w.aetLong) && final.includes(w.pensScore.replace("{a}", v.number(4)).replace("{b}", v.number(2))), final);
    assert.ok(svg.includes(final.replace(/&/g, "&amp;")), "the final's tooltip is in the drawing");
    const table = T.bracketTable(wc2022, { locale: code });
    assert.equal(wellFormed(table), null);
    assert.match(table, new RegExp(`<table [^>]*lang="${code}"`));
    assert.ok(table.includes(`<th scope="col">${w.columnRound}</th>`) && table.includes(`<th scope="col">${w.columnDate}</th>`) && table.includes(w.columnNote));
    assert.ok(table.includes(v.date("2022-12-18")!), "dates are written as the language writes them");
    assert.ok(table.includes(fillScore(w.scoreText, 3, 3, v)));
    const desc = T.describeBracket(wc2022, { locale: code });
    assert.ok(desc.endsWith(w.end) && desc.includes(w.sep));
    assert.ok(desc.includes(T.LOCALES[code].rounds["Final"] ?? "Final"));
    // Deterministic.
    assert.equal(svg, T.drawBracket(wc2022, { locale: code, teamName: viaIntl }));
  });
}

const fillScore = (template: string, a: number, b: number, v: T.Voice) => template.replace("{a}", v.number(a)).replace("{b}", v.number(b));

test("the same bracket in each language is a different drawing with the same shape", () => {
  const sizeOf = (svg: string) => /viewBox="([^"]+)"/.exec(svg)![1];
  const drawings = CODES.map((code) => T.drawBracket(wc2022, { locale: code }));
  assert.equal(new Set(drawings).size, 5);
  assert.equal(new Set(drawings.map(sizeOf)).size, 1);
  assert.equal(new Set(drawings.map((svg) => /class="taisen ([^ "]+)/.exec(svg)![1])).size, 5, "ids differ by language, so the five can share a page");
});

test("country names come from Intl by the ISO code, in every language, with no list", () => {
  assert.deepEqual(CODES.map((c) => T.countryName("DE", c)), ["Germany", "Allemagne", "ドイツ", "Alemania", "Deutschland"]);
  assert.deepEqual(CODES.map((c) => T.countryName("ES", c)), ["Spain", "Espagne", "スペイン", "España", "Spanien"]);
  assert.deepEqual(CODES.map((c) => T.countryName("GB-ENG", c)), ["England", "Angleterre", "イングランド", "Inglaterra", "England"]);
  assert.equal(T.countryName("ZZZ", "fr"), undefined);
  assert.equal(T.countryName("not a code", "ja"), undefined);
  const teams = T.layoutBracket(wc2022).teams;
  assert.ok(teams.every((t) => t.region), "every team of the demo has a region code");
  for (const code of CODES) for (const team of teams) assert.ok(T.countryName(team.region!, code), `${team.region} in ${code}`);
});

test("team names: a map on the team, or a function that gives one; clubs keep their names", () => {
  const teams: Team[] = [{ id: "a", name: "Germany", names: { fr: "Allemagne", ja: "ドイツ" } }, { id: "b", name: "Spain", region: "ES" }];
  const matchups = [{ sides: ["a", "b"] as const, score: [1, 0] as const }];
  assert.match(T.drawBracket({ matchups, teams }, { locale: "fr" }), /Allemagne 1, Spain 0/);
  assert.match(T.drawBracket({ matchups, teams }, { locale: "ja" }), /ドイツ 1–0 Spain/);
  assert.match(T.drawBracket({ matchups, teams }, { locale: "es" }), /Germany 1, Spain 0/);
  const viaIntl = { teamName: (team: Team, locale: Locale) => (team.region ? T.countryName(team.region, locale) : undefined) };
  assert.match(T.drawBracket({ matchups, teams }, { locale: "de", ...viaIntl }), /Germany 1, Spanien 0/);
  assert.match(T.bracketTable({ matchups, teams }, { locale: "fr", ...viaIntl }), /<strong>Allemagne<\/strong>.*Espagne/);
  const clubs = T.drawBracket(nhl2024, { locale: "fr", roundNames: T.playoffFormat("nhl", 2024)! });
  assert.ok(clubs.includes("Florida Panthers"), "club names are not translated");
  assert.ok(clubs.includes("FINALE DE LA COUPE STANLEY"), "a league's own name is kept in the form the language uses");
});

test("words still replace any string, in any language", () => {
  const svg = T.drawBracket(wc2022, { locale: "fr", words: { champion: "Vainqueur" } });
  assert.ok(svg.includes("VAINQUEUR") && !svg.includes("CHAMPION"));
  assert.match(T.drawBracket(wc2022, { locale: "ja", words: { thirdPlace: "三位決定戦" } }), /三位決定戦/);
});

test("a language of your own: defineLocale fills what is left out from English", () => {
  const nl = T.defineLocale("nl", { words: { champion: "Kampioen", thirdPlace: "Troostfinale" }, rounds: { "Quarter-finals": "Kwartfinales" } });
  const svg = T.drawBracket(wc2022, { locale: nl });
  assert.ok(svg.includes("KAMPIOEN") && svg.includes("TROOSTFINALE") && svg.includes("KWARTFINALES"));
  assert.match(svg, /lang="nl"/);
  assert.ok(svg.includes("SEMI-FINALS"), "a round it did not name keeps the English name");
  assert.equal(nl.words.aetLong, "after extra time");
  assert.throws(() => T.drawBracket(wc2022, { locale: "xx" }), /no language "xx"/);
  assert.equal(T.localeOf("fr-CA"), T.LOCALES.fr);
});

test("numbers and dates are written by Intl in the language's own way", () => {
  const dates = CODES.map((c) => T.voiceOf({ locale: c }).date("2022-12-18"));
  assert.deepEqual(dates, ["Dec 18, 2022", "18 déc. 2022", "2022/12/18", "18 dic 2022", "18.12.2022"]);
  assert.equal(T.voiceOf({ locale: "de" }).date("not a date"), null);
  assert.equal(T.voiceOf({ locale: "fr" }).number(1234567), new Intl.NumberFormat("fr").format(1234567));
  assert.equal(T.voiceOf({ locale: "en" }).number(7), "7");
});

test("a walkover is a note in the language, and a bye has its word", () => {
  const teams: Team[] = [{ id: "a", name: "A" }, { id: "b", name: "B" }];
  const withWalkover = { matchups: [{ sides: ["a", "b"] as const, winner: "a", walkover: true }], teams };
  for (const code of CODES) {
    const w = T.LOCALES[code].words;
    assert.ok(T.drawBracket(withWalkover, { locale: code }).includes(w.walkover), code);
    assert.ok(T.bracketTable(withWalkover, { locale: code }).includes(w.walkover));
  }
  assert.ok(T.drawBracket(build(T).mlb2022, { locale: "de", size: { width: 2400, height: 900 } }).includes(">Freilos</text>"));
});

test("each language writes a tie, a series and an aggregate in its own words", () => {
  for (const code of CODES) {
    const v = T.voiceOf({ locale: code });
    const series = T.layoutBracket(nhl2024).ties[0];
    const long = T.describeTie(series, v);
    assert.ok(long.includes(fillN(v.words.inGames, series.result.played, v)) || long.includes(v.number(series.result.played)), long);
    const agg = T.layoutBracket(build(T).twoLegs).ties.find((t) => t.result.kind === "aggregate")!;
    assert.ok(T.describeTie(agg, v).includes(v.words.aggregateLong), code);
  }
  void wc1938;
});

const fillN = (template: string, n: number, v: T.Voice) => template.replace("{n}", v.number(n));
