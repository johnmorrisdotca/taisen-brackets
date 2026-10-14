// Writes docs/formats.md from the formats in the built package, so that the page and the data cannot disagree.
//   node scripts/make-formats-doc.mjs           write the page
//   node scripts/make-formats-doc.mjs --check   exit 1 when the page is not the one the data makes
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { LEAGUES, playoffEras } from "../dist/index.js";

const TITLE = { nhl: "NHL (Stanley Cup playoffs)", nba: "NBA", mlb: "MLB", nfl: "NFL", cfl: "CFL", worldcup: "FIFA World Cup" };

export function formatsPage() {
  const out = [
    "# Formats by era",
    "",
    "`playoffFormat(league, year)` returns the entry for the season, or `null` when the league had no playoff, or this package does not cover it. This page is written from the data in `src/presets.ts` by `scripts/make-formats-doc.mjs`; do not edit it by hand.",
    "",
    "Each era was checked on 2026-10-13 against the English Wikipedia articles named in its last column, read through the MediaWiki API one request at a time, a second or more apart, with a User-Agent that names this project. Wikipedia's text is under CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/); only facts (years, round names, series lengths, numbers of teams, byes) are taken, no sentence or table. Where a season did something of its own (a strike, a pandemic) it has its own entry. The year is the year the playoffs are played in (the NHL's and the NBA's 2024 are the 2024 playoffs, of the 2023-24 season), except for the NFL, whose year is its season's: 2024 is the season whose playoffs were played in January and February 2025. A later edition or season is not covered until its entry is checked.",
    "",
    "```js",
    'import { playoffFormat } from "@johnmorrisdotca/taisen-brackets";',
    "",
    'const format = playoffFormat("mlb", 2022);',
    "console.log(format.rounds.map((round) => `${round.name} (${round.bestOf})`).join(\", \")); // Wild Card Series (3), Division Series (5), League Championship Series (7), World Series (7)",
    "console.log(format.byes); // 2",
    "```",
    "",
    "A round's `bestOf` is the length of the series, 1 for a single game. `byes` is the number of teams of each half that skip the first round. `groups` names the two halves, left first, or is `null` where the bracket is not split in two. Pass the format itself as `roundNames` to `drawBracket`.",
    "",
  ];
  for (const league of LEAGUES) {
    out.push(`## ${TITLE[league]}`, "", "| Years | Teams | Byes | Halves | Rounds (series length) | Note | Checked against |", "| --- | --- | --- | --- | --- | --- | --- |");
    for (const era of playoffEras(league)) {
      const years = era.to === null ? `${era.from} on` : era.to === era.from ? `${era.from}` : `${era.from}–${era.to}`;
      const rounds = era.rounds.map((r) => (r.bestOf === null ? r.name : `${r.name} (${r.bestOf})`)).join(", ");
      out.push(`| ${years} | ${era.teams ?? "varies"} | ${era.byes} | ${era.groups ? era.groups.join(" / ") : "none"} | ${rounds} | ${[era.label, era.note].filter(Boolean).join(". ")} | ${era.sources.map((url) => `[${decodeURIComponent(url.split("/wiki/")[1]).replace(/_/g, " ")}](${url})`).join(", ")} |`);
    }
    out.push("");
  }
  return `${out.join("\n").trimEnd()}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = new URL("../docs/formats.md", import.meta.url);
  if (process.argv.includes("--check")) {
    if (readFileSync(path, "utf8") !== formatsPage()) { console.error("docs/formats.md is not what the data makes: run node scripts/make-formats-doc.mjs"); process.exit(1); }
    console.log("ok   docs/formats.md matches the data");
  } else writeFileSync(path, formatsPage());
}
