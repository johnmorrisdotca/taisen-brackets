// The demo's brackets, as the data a caller would pass to drawBracket. The results are real, read from spxn.com's public API by
// scripts/fetch-demo-data.mjs into demo/data/ (their sources and terms are in NOTICE.md); this file only turns those rows into teams and matchups.
// Two examples are made up and say so: the two-legged ties (the clubs do not exist) and the 32-team field.
import { MLB_2022 } from "./data/mlb-2022.js";
import { NHL_2024 } from "./data/nhl-2024.js";
import { WORLD_CUPS } from "./data/worldcup-1938-2022.js";
import { WORLD_CUP_2026 } from "./data/worldcup-2026.js";

/** The three-letter codes of the nations the demo draws (FIFA's), by the name spxn.com gives them. */
const CODE = {
  Netherlands: "NED", "United States": "USA", Argentina: "ARG", Australia: "AUS", France: "FRA", Poland: "POL", England: "ENG", Senegal: "SEN", Japan: "JPN", Croatia: "CRO",
  Brazil: "BRA", "South Korea": "KOR", Morocco: "MAR", Spain: "ESP", Portugal: "POR", Switzerland: "SUI", Germany: "GER", Paraguay: "PAR", "South Africa": "RSA", Canada: "CAN",
  Sweden: "SWE", "Ivory Coast": "CIV", Norway: "NOR", Mexico: "MEX", Ecuador: "ECU", "DR Congo": "COD", "Bosnia and Herzegovina": "BIH", Belgium: "BEL", Austria: "AUT",
  Algeria: "ALG", "Cape Verde": "CPV", Colombia: "COL", Ghana: "GHA", Italy: "ITA", Cuba: "CUB", Romania: "ROU", Hungary: "HUN", "Dutch East Indies": "DEI", Czechoslovakia: "TCH",
};

/** States that no longer exist have no region code, so their names in other languages are written here. */
const HISTORIC = {
  Czechoslovakia: { fr: "Tchécoslovaquie", ja: "チェコスロバキア", es: "Checoslovaquia", de: "Tschechoslowakei" },
  "Dutch East Indies": { fr: "Indes orientales néerlandaises", ja: "オランダ領東インド", es: "Indias Orientales Neerlandesas", de: "Niederländisch-Indien" },
};

/** The clubs' short names and colours (a colour is only for the initials of a team with no logo). */
const CLUB = {
  "Florida Panthers": ["FLA", "#c8102e"], "Tampa Bay Lightning": ["TBL", "#00205b"], "Boston Bruins": ["BOS", "#fcb514"], "Toronto Maple Leafs": ["TOR", "#00205b"],
  "New York Rangers": ["NYR", "#0038a8"], "Washington Capitals": ["WSH", "#c8102e"], "Carolina Hurricanes": ["CAR", "#cc0000"], "New York Islanders": ["NYI", "#00539b"],
  "Dallas Stars": ["DAL", "#006847"], "Vegas Golden Knights": ["VGK", "#b4975a"], "Winnipeg Jets": ["WPG", "#041e42"], "Colorado Avalanche": ["COL", "#6f263d"],
  "Vancouver Canucks": ["VAN", "#00843d"], "Nashville Predators": ["NSH", "#ffb81c"], "Edmonton Oilers": ["EDM", "#fa4616"], "Los Angeles Kings": ["LAK", "#a2aaad"],
  "Houston Astros": ["HOU", "#eb6e1f"], "New York Yankees": ["NYY", "#0c2340"], "Cleveland Guardians": ["CLE", "#e31937"], "Seattle Mariners": ["SEA", "#005c5c"],
  "Toronto Blue Jays": ["TOR", "#134a8e"], "Tampa Bay Rays": ["TBR", "#092c5c"], "Los Angeles Dodgers": ["LAD", "#005a9c"], "Atlanta Braves": ["ATL", "#ce1141"],
  "St. Louis Cardinals": ["STL", "#c41e3a"], "San Diego Padres": ["SDP", "#2f241d"], "New York Mets": ["NYM", "#ff5910"], "Philadelphia Phillies": ["PHI", "#e81828"],
};

const g = (a, b, extra = {}) => ({ score: [a, b], ...extra });

/** Every example the demo and the tests use, built with the package `T` (its `matchupsFromGames`) and the round flags `flags` by ISO code. */
export function build(T, flags = {}) {
  // ----- The World Cup knockouts: rows of soccer_matches become played games, and then ties.
  const soccer = (rows, options, flagged) => {
    const teams = new Map();
    for (const row of rows) {
      for (const side of ["home", "away"]) {
        const id = row[`${side}_team_id`];
        if (!teams.has(id)) {
          const region = row[`${side}_flag`];
          // Names in other languages come from Intl by the region code (`countryName`); a state with no code today is named here.
          teams.set(id, { id, name: row[side], abbr: CODE[row[side]], ...(region ? { region } : {}), ...(HISTORIC[row[side]] ? { names: HISTORIC[row[side]] } : {}), ...(flagged && flags[region] ? { mark: flags[region] } : {}) });
        }
      }
    }
    const games = rows.map((row) => ({
      stage: row.stage_key, home: row.home_team_id, away: row.away_team_id, homeScore: row.home_goals, awayScore: row.away_goals,
      date: row.kickoff_local ? `${row.match_date}T${row.kickoff_local}` : row.match_date, extraTime: row.extra_time,
      ...(row.shootout ? { homePens: row.home_penalties, awayPens: row.away_penalties } : {}), replay: row.is_replay, ...(row.match_number ? { no: row.match_number } : {}),
    }));
    return { teams: [...teams.values()], matchups: T.matchupsFromGames(games, options) };
  };
  const wc2022 = soccer(WORLD_CUPS.wc2022, { stages: ["round_of_16", "quarter", "semi", "final"], third: "third_place" }, true);
  // 1938 had no flags that are today's (Germany's, Czechoslovakia's, the Dutch East Indies'), so its teams are initials.
  const wc1938 = soccer(WORLD_CUPS.wc1938, { stages: ["round_of_16", "quarter", "semi", "final"], third: "third_place" }, false);
  const wc2026 = soccer(WORLD_CUP_2026.matches, { stages: ["round_of_32", "round_of_16", "quarter", "semi", "final"], third: "third_place" }, true);

  // ----- A playoff: games become series (the games won of each pair), with the conference of each team.
  const playoff = (data, bestOfByWins) => {
    const group = new Map(data.alignment.map((a) => [a.franchise_id, a.conference]));
    const teams = new Map();
    const series = new Map();
    for (const game of data.games) {
      for (const side of ["home", "away"]) {
        const f = game[`${side}_f`];
        if (!teams.has(f)) teams.set(f, { id: f, name: game[side], abbr: CLUB[game[side]]?.[0], color: CLUB[game[side]]?.[1], group: group.get(f) });
      }
      const key = [game.home_f, game.away_f].sort((a, b) => a - b).join("-");
      if (!series.has(key)) series.set(key, { id: `s${series.size + 1}`, sides: [game.home_f, game.away_f], games: [] });
      const s = series.get(key);
      const flip = game.home_f !== s.sides[0];
      s.games.push(g(flip ? game.away_score : game.home_score, flip ? game.home_score : game.away_score, { date: game.game_date, extraTime: game.overtime }));
    }
    const matchups = [...series.values()].map((s) => {
      const wins = Math.max(s.games.filter((x) => x.score[0] > x.score[1]).length, s.games.filter((x) => x.score[1] > x.score[0]).length);
      return { ...s, bestOf: bestOfByWins[wins], date: s.games[0].date };
    });
    return { teams: [...teams.values()], matchups };
  };
  const nhl2024 = playoff(NHL_2024, { 4: 7 });
  const mlb2022 = playoff(MLB_2022, { 2: 3, 3: 5, 4: 7 });

  // ----- Made up: two-legged ties between clubs that do not exist.
  const clubs = ["Aurora", "Borealis", "Cascade", "Delta", "Ember", "Fjord", "Glacier", "Harbour"].map((name, i) => ({ id: name.slice(0, 3).toUpperCase(), name: `${name} FC`, abbr: name.slice(0, 3).toUpperCase(), seed: i + 1 }));
  const leg = (a, b, date, extra = {}) => ({ score: [a, b], date, ...extra });
  const twoLegs = {
    teams: clubs,
    matchups: [
      { id: "QF1", no: 1, kind: "aggregate", sides: ["AUR", "HAR"], legs: [leg(2, 0, "2026-03-04"), leg(1, 1, "2026-03-11")] },
      { id: "QF2", no: 2, kind: "aggregate", sides: ["DEL", "EMB"], legs: [leg(1, 1, "2026-03-04"), leg(2, 2, "2026-03-11")], winner: "EMB", note: "away goals" },
      { id: "QF3", no: 3, kind: "aggregate", sides: ["CAS", "FJO"], legs: [leg(0, 1, "2026-03-05"), leg(2, 0, "2026-03-12")] },
      { id: "QF4", no: 4, kind: "aggregate", sides: ["BOR", "GLA"], legs: [leg(3, 3, "2026-03-05"), leg(1, 1, "2026-03-12", { pens: [5, 4] })] },
      { id: "SF1", no: 1, kind: "aggregate", sides: ["AUR", "EMB"], legs: [leg(1, 0, "2026-04-08"), leg(2, 2, "2026-04-15")] },
      { id: "SF2", no: 2, kind: "aggregate", sides: ["CAS", "BOR"], legs: [leg(1, 1, "2026-04-09"), leg(0, 0, "2026-04-16", { extraTime: true, pens: [3, 2] })] },
      { id: "F", sides: ["AUR", "CAS"], games: [g(2, 1, { date: "2026-05-30" })] },
    ],
  };
  return { nhl2024, wc2022, wc2026, mlb2022, wc1938, twoLegs };
}
