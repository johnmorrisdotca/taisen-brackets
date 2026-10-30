// The demo's brackets, as the data a caller would pass to drawBracket. The results are real, read from spxn.com's public API by
// scripts/fetch-demo-data.mjs into demo/data/ (their sources and terms are in NOTICE.md); this file only turns those rows into teams and matchups.
// Two examples are made up and say so: the two-legged ties (the clubs do not exist) and the 32-team field.
import { CFL_2024 } from "./data/cfl-2024.js";
import { JUDO_SAMPLE } from "./data/judo-sample.js";
import { MLB_2022 } from "./data/mlb-2022.js";
import { MLB_2025 } from "./data/mlb-2025.js";
import { MLS_2024 } from "./data/mls-2024.js";
import { NBA_2024 } from "./data/nba-2024.js";
import { NBA_2024_PLAYIN } from "./data/nba-2024-playin.js";
import { NFL_2024 } from "./data/nfl-2024.js";
import { NHL_1984 } from "./data/nhl-1984.js";
import { NHL_2024 } from "./data/nhl-2024.js";
import { WORLD_CUPS } from "./data/worldcup-1938-2022.js";
import { WORLD_CUP_2026 } from "./data/worldcup-2026.js";

/** The three-letter codes of the nations the demo draws (FIFA's), by the name spxn.com gives them. */
export const CODE = {
  Netherlands: "NED", "United States": "USA", Argentina: "ARG", Australia: "AUS", France: "FRA", Poland: "POL", England: "ENG", Senegal: "SEN", Japan: "JPN", Croatia: "CRO",
  Brazil: "BRA", "South Korea": "KOR", Morocco: "MAR", Spain: "ESP", Portugal: "POR", Switzerland: "SUI", Germany: "GER", Paraguay: "PAR", "South Africa": "RSA", Canada: "CAN",
  Sweden: "SWE", "Ivory Coast": "CIV", Norway: "NOR", Mexico: "MEX", Ecuador: "ECU", "DR Congo": "COD", "Bosnia and Herzegovina": "BIH", Belgium: "BEL", Austria: "AUT",
  Algeria: "ALG", Egypt: "EGY", "Cape Verde": "CPV", Colombia: "COL", Ghana: "GHA", Italy: "ITA", Cuba: "CUB", Romania: "ROU", Hungary: "HUN", "Dutch East Indies": "DEI", Czechoslovakia: "TCH",
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
  // NBA
  "Cleveland Cavaliers": ["CLE", "#860038"], "Orlando Magic": ["ORL", "#0077c0"], "Denver Nuggets": ["DEN", "#0e2240"], "Los Angeles Lakers": ["LAL", "#552583"],
  "Minnesota Timberwolves": ["MIN", "#0c2340"], "Phoenix Suns": ["PHX", "#1d1160"], "New York Knicks": ["NYK", "#006bb6"], "Philadelphia 76ers": ["PHI", "#006bb6"],
  "Boston Celtics": ["BOS", "#007a33"], "Miami Heat": ["MIA", "#98002e"], "Dallas Mavericks": ["DAL", "#00538c"], "Los Angeles Clippers": ["LAC", "#c8102e"],
  "Indiana Pacers": ["IND", "#002d62"], "Milwaukee Bucks": ["MIL", "#00471b"], "New Orleans Pelicans": ["NOP", "#0c2340"], "Oklahoma City Thunder": ["OKC", "#007ac1"],
  // NFL
  "Pittsburgh Steelers": ["PIT", "#101820"], "Baltimore Ravens": ["BAL", "#241773"], "Houston Texans": ["HOU", "#03202f"], "Los Angeles Chargers": ["LAC", "#0080c6"],
  "Buffalo Bills": ["BUF", "#00338d"], "Denver Broncos": ["DEN", "#fb4f14"], "Washington Commanders": ["WAS", "#5a1414"], "Tampa Bay Buccaneers": ["TB", "#d50a0a"],
  "Philadelphia Eagles": ["PHI", "#004c54"], "Green Bay Packers": ["GB", "#203731"], "Minnesota Vikings": ["MIN", "#4f2683"], "Los Angeles Rams": ["LAR", "#003594"],
  "Kansas City Chiefs": ["KC", "#e31837"], "Detroit Lions": ["DET", "#0076b6"],
  // CFL
  "Saskatchewan Roughriders": ["SSK", "#1b7340"], "BC Lions": ["BC", "#ff6600"], "Toronto Argonauts": ["TOR", "#00467f"], "Ottawa Redblacks": ["OTT", "#c8102e"],
  "Montreal Alouettes": ["MTL", "#0b3a6b"], "Winnipeg Blue Bombers": ["WPG", "#002b5c"],
  // NHL, 1984
  "Montréal Canadiens": ["MTL", "#af1e2d"], "Buffalo Sabres": ["BUF", "#002654"], "Quebec Nordiques": ["QUE", "#6cace4"], "Calgary Flames": ["CGY", "#c8102e"],
  "Chicago Blackhawks": ["CHI", "#cf0a2c"], "Minnesota North Stars": ["MNS", "#154734"], "Detroit Red Wings": ["DET", "#ce1126"], "St. Louis Blues": ["STL", "#002f87"],
  "Philadelphia Flyers": ["PHI", "#f74902"],
  // MLS, 2024
  "Atlanta United FC": ["ATL", "#80000a"], "Charlotte FC": ["CLT", "#1a85c8"], "FC Cincinnati": ["CIN", "#f05323"], "Columbus Crew": ["CLB", "#fedd00"],
  "CF Montréal": ["MTL", "#0050a4"], "Inter Miami CF": ["MIA", "#f7b5cd"], "New York City FC": ["NYC", "#6cace4"], "New York Red Bulls": ["NYRB", "#ed1e36"],
  "Orlando City SC": ["ORL", "#633492"], "Colorado Rapids": ["COL", "#862633"], "Houston Dynamo FC": ["HOU", "#ff6b00"], "LA Galaxy": ["LAG", "#00245d"],
  "Los Angeles FC": ["LAFC", "#c39e6d"], "Minnesota United FC": ["MIN", "#8cd2f4"], "Portland Timbers": ["POR", "#004812"], "Real Salt Lake": ["RSL", "#b30838"],
  "Seattle Sounders FC": ["SEA", "#5d9732"], "Vancouver Whitecaps FC": ["VAN", "#00245e"],
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
          teams.set(id, { id, name: row[side], abbr: CODE[row[side]], ...(region ? { region } : {}), ...(HISTORIC[row[side]] ? { names: HISTORIC[row[side]] } : {}), ...(flagged && flags[region] ? { flag: region } : {}) });
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

  // ----- MLS: a wild card match, a best-of-three round one, then single matches. The clubs carry their conference as the halves' group.
  const mls2024 = (() => {
    const conference = new Map(MLS_2024.teams.map((t) => [t.team_id, t.conference]));
    const made = soccer(MLS_2024.matches, { stages: ["wild_card", "round_one", "conference_semi", "conference_final", "final"], series: { round_one: 3 } }, false);
    const teams = made.teams.map((t) => ({ ...t, abbr: CLUB[t.name]?.[0], color: CLUB[t.name]?.[1], group: conference.get(t.id) }));
    return { teams, matchups: made.matchups };
  })();

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
  // How the 2024 field was seeded, as the NHL names it: a division's place (A1 to A3 and M1 to M3 in the East, C1 to C3 and P1 to P3 in the West) or the wild card (WC1, WC2). They are `Team.tag`s, drawn as seed tags.
  const SEEDS_2024 = {
    "Florida Panthers": "A1", "Boston Bruins": "A2", "Toronto Maple Leafs": "A3", "New York Rangers": "M1", "Carolina Hurricanes": "M2", "New York Islanders": "M3", "Tampa Bay Lightning": "WC1", "Washington Capitals": "WC2",
    "Dallas Stars": "C1", "Winnipeg Jets": "C2", "Colorado Avalanche": "C3", "Vancouver Canucks": "P1", "Edmonton Oilers": "P2", "Los Angeles Kings": "P3", "Vegas Golden Knights": "WC1", "Nashville Predators": "WC2",
  };
  nhl2024.teams = nhl2024.teams.map((t) => (SEEDS_2024[t.name] ? { ...t, tag: SEEDS_2024[t.name] } : t));
  const mlb2022 = playoff(MLB_2022, { 2: 3, 3: 5, 4: 7 });
  // 2025: the series as they ended, with each club's seed in its league (a seed is drawn on the club's tile in the postseason picture).
  const mlb2025 = { teams: MLB_2025.teams, matchups: MLB_2025.series };
  const nba2024 = playoff(NBA_2024, { 4: 7 });
  // The NFL's and the CFL's rounds are single games: no `bestOf`, so a tie is a game and its score is drawn.
  const nfl2024 = playoff(NFL_2024, {});
  const cfl2024 = playoff(CFL_2024, {});
  // 1984: the first round was best of five (three wins), the others best of seven.
  const nhl1984 = playoff(NHL_1984, { 3: 5, 4: 7 });

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
  // ----- The NBA's 2024 playoffs with its play-in: the six play-in games are kept outside the rounds (`stage: "play-in"`), the 7/8 game's loser goes on to the decider with the 9/10 game's winner,
  // and the first-round ties of the four teams that came through name the game they came from. Seeds are the playoff seeds.
  const nba2024playin = (() => {
    const seedOf = (id) => NBA_2024_PLAYIN.finalSeeds[id];
    const teams = [...nba2024.teams, ...NBA_2024_PLAYIN.teams].map((t) => ({ ...t, ...(seedOf(t.id) !== undefined ? { seed: seedOf(t.id) } : {}) }));
    const game = (row) => {
      const base = { id: row.id, stage: "play-in", sides: row.sides, games: [g(row.score[0], row.score[1])], ...(row.seeds ? { seeds: row.seeds } : {}) };
      return row.after ? { ...base, feeds: [{ tie: row.after[0], result: "loser" }, { tie: row.after[1], result: "winner" }] } : base;
    };
    const playIn = NBA_2024_PLAYIN.games.map(game);
    // The tie each seed went on to: the 7th seed's from the 7/8 game, the 8th's from the decider.
    const came = { 1450: "east-78", 1444: "east-8", 1443: "west-78", 1433: "west-8" };
    const matchups = nba2024.matchups.map((m) => {
      const k = m.sides.findIndex((id) => came[id] !== undefined);
      if (k < 0 || m.games.length === 0) return m;
      const feeds = [null, null];
      feeds[k] = { tie: came[m.sides[k]], result: "winner" };
      return { ...m, feeds };
    });
    return { teams, matchups: [...matchups, ...playIn] };
  })();

  // ----- Made up: the group stage of two cups of clubs that do not exist. The results come from a fixed recipe, so they are the same every time.
  const lcg = (seed) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const groupCup = (groups, score, seed) => {
    const next = lcg(seed);
    const teams = [];
    const matchups = [];
    groups.forEach((names, gi) => {
      const letter = String.fromCharCode(65 + gi);
      const ids = names.map((n, i) => `${letter}${i + 1}`);
      names.forEach((name, i) => teams.push({ id: ids[i], name, abbr: name.slice(0, 3).toUpperCase(), group: letter, seed: i + 1, color: ["#1b6ca8", "#b3261e", "#2a7f3f", "#8a5a00", "#6b3fa0", "#00796b", "#c2185b", "#37474f"][(gi * 4 + i) % 8] }));
      for (let i = 0; i < ids.length; i += 1) for (let j = i + 1; j < ids.length; j += 1) matchups.push({ id: `${letter}-${i + 1}${j + 1}`, round: 0, sides: [ids[i], ids[j]], score: score(next, i, j) });
    });
    return { teams, matchups };
  };
  // Football: low scores, draws allowed; the first-named club is a little the stronger.
  const goals = (next, i, j) => { const a = Math.floor(next() * 3.4 - i * 0.2); const b = Math.floor(next() * 3 - j * 0.15 + 0.2); return [Math.max(a, 0), Math.max(b, 0)]; };
  // Softball: runs, and no draws.
  const runs = (next) => { const a = 1 + Math.floor(next() * 9); let b = Math.floor(next() * 9); if (b === a) b += 1; return [a, b]; };
  const cupGroups = groupCup([["Northgate United", "Redcliff Rovers", "Bayport City", "Highmoor FC"], ["Ashford Athletic", "Seaview Town", "Ironvale SC", "Maplewood FC"], ["Stonebridge FC", "Lakeside Wanderers", "Fairhaven Albion", "Oakridge Rangers"], ["Crestfield Town", "Pinehurst FC", "Riverbend United", "Summerton City"]], goals, 2026);
  const softballGroups = groupCup([["Kestrel Bay", "Granite Coast", "Maple Ridge", "Harbour Point"], ["Cedar Falls", "Prairie Gold", "Lakeview", "Iron Hills"], ["Silver Creek", "Sunfield", "Westmont", "Northshore"]], runs, 77);
  // ----- Made up: a judo weight category of 16 athletes with the IJF's quarter-final repechage, every contest fought with the scores the rules allow (demo/data/judo-sample.js).
  const judo66 = (() => {
    const teams = JUDO_SAMPLE.athletes.map((a, i) => ({ ...a, abbr: a.name.split(" ").at(-1).slice(0, 3).toUpperCase(), seed: i + 1, ...(flags[a.flag] ? {} : { flag: undefined }) }));
    let matchups = T.judoBracket(teams, { prefix: "J" }).matchups;
    for (const [id, winner, won, lost, rest] of JUDO_SAMPLE.fights) {
      matchups = T.advanceWinners(matchups);
      const at = matchups.findIndex((m) => m.id === id);
      const sides = matchups[at].sides.map((x) => (typeof x === "object" && x ? x.id : x));
      const k = sides.indexOf(winner);
      if (k < 0) throw new Error(`demo judo: ${winner} is not in ${id} (${sides.join(", ")})`);
      const judo = { sides: k === 0 ? [won, lost] : [lost, won], ...rest };
      matchups = matchups.map((m, i) => (i === at ? { ...m, judo, ...(rest.method === "fusen-gachi" || rest.method === "kiken-gachi" ? { winner } : {}) } : m));
    }
    return { teams, matchups: T.advanceWinners(matchups) };
  })();
  return { judo66, nhl2024, nba2024, nba2024playin, mlb2022, mlb2025, nfl2024, cfl2024, mls2024, nhl1984, wc2022, wc2026, wc1938, twoLegs, cupGroups, softballGroups };
}
