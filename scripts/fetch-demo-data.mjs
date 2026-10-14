// Writes demo/data/*.js: the results the demo draws, read from spxn.com's public API (a PostgREST service whose `api` schema is
// readable with a publishable key; the key is public, but it is not kept in this repository). One request at a time, a second apart.
//
//   SPXN_PUBLISHABLE_KEY=<the key spxn.com's pages use> node scripts/fetch-demo-data.mjs
//
// What each file holds, and under what terms, is in NOTICE.md: the World Cup results of 1938 and 2022 are from the Fjelstul World Cup
// Database (CC BY-SA 4.0), the 2026 ones from openfootball (CC0), the NHL's from the NHL, the MLB's from Retrosheet.
import { writeFileSync } from "node:fs";
import process from "node:process";

const key = process.env.SPXN_PUBLISHABLE_KEY;
if (!key) { console.error("Set SPXN_PUBLISHABLE_KEY to the publishable key spxn.com uses."); process.exit(1); }
const BASE = "https://njpvfrceahkvnrduerkk.supabase.co/rest/v1";
const retrieved = new Date().toISOString().slice(0, 10);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function get(path) {
  const response = await fetch(`${BASE}/${path}`, { headers: { apikey: key, "Accept-Profile": "api", "User-Agent": "taisen-brackets-demo-data (https://github.com/johnmorrisdotca/taisen-brackets)" } });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  const rows = await response.json();
  await wait(1100);
  return rows;
}

const pick = (row, names) => Object.fromEntries(names.map((name) => [name, row[name] ?? null]));
const SOCCER = ["match_number", "match_date", "kickoff_local", "stage_key", "home_team_id", "home", "home_flag", "home_goals", "away_team_id", "away", "away_flag", "away_goals", "extra_time", "shootout", "home_penalties", "away_penalties", "winner_team_id", "is_replay", "source"];
const GAME = ["game_date", "home", "home_f", "home_score", "away", "away_f", "away_score", "overtime", "source"];
const ALIGN = ["team", "franchise_id", "conference", "conference_short"];

/** An object with one row of each list per line, so that a diff of the data reads. */
const format = (value) => `{\n${Object.entries(value).map(([name, item]) => ` ${JSON.stringify(name)}: ${Array.isArray(item) ? `[\n${item.map((row) => `  ${JSON.stringify(row)}`).join(",\n")}\n ]` : JSON.stringify(item)}`).join(",\n")}\n}`;
const file = (name, header, exportName, value) => {
  writeFileSync(new URL(`../demo/data/${name}.js`, import.meta.url), `${header}\nexport const ${exportName} = ${format(value)};\n`);
  console.log(`demo/data/${name}.js`);
};
const soccer = async (id) => (await get(`soccer_matches?tournament_id=eq.${id}&stage_order=gte.4&order=match_date.asc,match_id.asc`)).map((row) => pick(row, SOCCER));

const w1938 = await soccer("wc1938");
const w2022 = await soccer("wc2022");
file("worldcup-1938-2022", `// Made by scripts/fetch-demo-data.mjs from spxn.com's public API (soccer_matches), retrieved ${retrieved}; do not edit.
// The knockout matches of the men's World Cups of 1938 and 2022, from The Fjelstul World Cup Database, https://github.com/jfjelstul/worldcup,
// © 2023 Joshua C. Fjelstul, Ph.D., under CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/legalcode). This file is an adaptation
// of that database (a selection of its fields) and is shared under the same licence; the rest of this repository is MIT.`, "WORLD_CUPS", { retrieved, wc1938: w1938, wc2022: w2022 });

const w2026 = await soccer("wc2026");
file("worldcup-2026", `// Made by scripts/fetch-demo-data.mjs from spxn.com's public API (soccer_matches), retrieved ${retrieved}; do not edit.
// The knockout matches of the men's World Cup of 2026, from openfootball/worldcup, https://github.com/openfootball/worldcup, under CC0.`, "WORLD_CUP_2026", { retrieved, matches: w2026 });

const nhl = (await get("games?league=eq.nhl&year=eq.2023&phase=eq.playoffs&select=*&order=game_date,game_id")).map((row) => pick(row, GAME));
const nhlAlign = (await get("alignment?league=eq.nhl&year=eq.2023&select=*")).map((row) => pick(row, ALIGN));
file("nhl-2024", `// Made by scripts/fetch-demo-data.mjs from spxn.com's public API (games, alignment), retrieved ${retrieved}; do not edit.
// Every game of the 2024 Stanley Cup playoffs (the 2023-24 season, which spxn.com calls 2023), with each team's conference. Source: the NHL
// (credited "NHL", as spxn.com credits it).`, "NHL_2024", { retrieved, games: nhl, alignment: nhlAlign });

const mlb = (await get("games?league=eq.mlb&year=eq.2022&phase=eq.playoffs&select=*&order=game_date,game_id")).map((row) => pick(row, GAME));
const mlbAlign = (await get("alignment?league=eq.mlb&year=eq.2022&select=*")).map((row) => pick(row, ALIGN));
file("mlb-2022", `// Made by scripts/fetch-demo-data.mjs from spxn.com's public API (games, alignment), retrieved ${retrieved}; do not edit.
// Every game of the 2022 MLB postseason, with each team's league. The information was obtained free of charge from and is copyrighted by
// Retrosheet (www.retrosheet.org).`, "MLB_2022", { retrieved, games: mlb, alignment: mlbAlign });

// ----- The other sports, one example each: games from spxn.com's `games` view, each team's conference or division from `alignment`.
const nba = (await get("games?league=eq.nba&year=eq.2023&phase=eq.playoffs&select=*&order=game_date,game_id")).map((row) => pick(row, GAME));
const nbaAlign = (await get("alignment?league=eq.nba&year=eq.2023&select=*")).map((row) => pick(row, ALIGN));
file("nba-2024", `// Made by scripts/fetch-demo-data.mjs from spxn.com's public API (games, alignment), retrieved ${retrieved}; do not edit.
// Every game of the 2024 NBA playoffs (the 2023-24 season, which spxn.com calls 2023), with each team's conference. The games come from
// English Wikipedia (https://en.wikipedia.org/wiki/2024_NBA_playoffs), under CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/legalcode).
// This file is an adaptation of that and is shared under the same licence; the rest of this repository is MIT.`, "NBA_2024", { retrieved, games: nba, alignment: nbaAlign });

const nfl = (await get("games?league=eq.nfl&year=eq.2024&phase=eq.playoffs&select=*&order=game_date,game_id")).map((row) => pick(row, GAME));
const nflAlign = (await get("alignment?league=eq.nfl&year=eq.2024&select=*")).map((row) => pick(row, ALIGN));
file("nfl-2024", `// Made by scripts/fetch-demo-data.mjs from spxn.com's public API (games, alignment), retrieved ${retrieved}; do not edit.
// Every game of the playoffs of the 2024 NFL season (played January and February 2025), with each team's conference. The games come
// from nflverse (https://github.com/nflverse/nflverse-data), under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).`, "NFL_2024", { retrieved, games: nfl, alignment: nflAlign });

const cfl = (await get("games?league=eq.cfl&year=eq.2024&phase=eq.playoffs&select=*&order=game_date,game_id")).map((row) => pick(row, GAME));
const cflAlign = (await get("alignment?league=eq.cfl&year=eq.2024&select=*")).map((row) => pick(row, ALIGN));
file("cfl-2024", `// Made by scripts/fetch-demo-data.mjs from spxn.com's public API (games, alignment), retrieved ${retrieved}; do not edit.
// Every game of the 2024 CFL playoffs, with each team's division. The games come from English Wikipedia (https://en.wikipedia.org/wiki/2024_CFL_season),
// under CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/legalcode). This file is an adaptation of that and is shared under the same
// licence; the rest of this repository is MIT.`, "CFL_2024", { retrieved, games: cfl, alignment: cflAlign });

const nhl1984 = (await get("games?league=eq.nhl&year=eq.1983&phase=eq.playoffs&select=*&order=game_date,game_id")).map((row) => pick(row, GAME));
const nhl1984Align = (await get("alignment?league=eq.nhl&year=eq.1983&select=*")).map((row) => pick(row, ALIGN));
file("nhl-1984", `// Made by scripts/fetch-demo-data.mjs from spxn.com's public API (games, alignment), retrieved ${retrieved}; do not edit.
// Every game of the 1984 Stanley Cup playoffs (the 1983-84 season, which spxn.com calls 1983), with each team's conference (the Campbell and
// Wales conferences). Source: the NHL (credited "NHL", as spxn.com credits it).`, "NHL_1984", { retrieved, games: nhl1984, alignment: nhl1984Align });
