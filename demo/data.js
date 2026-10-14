// The demo's brackets, as the data a caller would pass: plain objects, no drawing.

const g = (a, b, extra = {}) => ({ score: [a, b], ...extra });

// ----- NHL 2024: best-of-seven series, the halves named for the conferences. Series results from the playoffs; no logos, so initials on a team colour.
const nhlTeams = [
  ["FLA", "Florida Panthers", "Eastern", "#c8102e"], ["TBL", "Tampa Bay Lightning", "Eastern", "#00205b"], ["BOS", "Boston Bruins", "Eastern", "#fcb514"], ["TOR", "Toronto Maple Leafs", "Eastern", "#00205b"],
  ["NYR", "New York Rangers", "Eastern", "#0038a8"], ["WSH", "Washington Capitals", "Eastern", "#c8102e"], ["CAR", "Carolina Hurricanes", "Eastern", "#cc0000"], ["NYI", "New York Islanders", "Eastern", "#00539b"],
  ["DAL", "Dallas Stars", "Western", "#006847"], ["VGK", "Vegas Golden Knights", "Western", "#b4975a"], ["WPG", "Winnipeg Jets", "Western", "#041e42"], ["COL", "Colorado Avalanche", "Western", "#6f263d"],
  ["VAN", "Vancouver Canucks", "Western", "#00843d"], ["NSH", "Nashville Predators", "Western", "#ffb81c"], ["EDM", "Edmonton Oilers", "Western", "#fa4616"], ["LAK", "Los Angeles Kings", "Western", "#a2aaad"],
].map(([id, name, group, color]) => ({ id, name, group, color, abbr: id }));

const s = (no, id, a, b, wa, wb, date) => ({ id, no, sides: [a, b], bestOf: 7, score: [wa, wb], date });
export const nhl2024 = {
  teams: nhlTeams,
  matchups: [
    s(1, "E1a", "FLA", "TBL", 4, 0, "2024-04-20"), s(2, "E1b", "BOS", "TOR", 4, 3, "2024-04-20"), s(3, "E1c", "NYR", "WSH", 4, 0, "2024-04-21"), s(4, "E1d", "CAR", "NYI", 4, 1, "2024-04-21"),
    s(1, "E2a", "FLA", "BOS", 4, 2, "2024-05-06"), s(2, "E2b", "NYR", "CAR", 4, 2, "2024-05-07"),
    s(1, "E3", "FLA", "NYR", 4, 2, "2024-05-22"),
    s(1, "W1a", "DAL", "VGK", 4, 3, "2024-04-22"), s(2, "W1b", "WPG", "COL", 1, 4, "2024-04-22"), s(3, "W1c", "VAN", "NSH", 4, 2, "2024-04-22"), s(4, "W1d", "EDM", "LAK", 4, 1, "2024-04-22"),
    s(1, "W2a", "DAL", "COL", 4, 2, "2024-05-07"), s(2, "W2b", "VAN", "EDM", 3, 4, "2024-05-08"),
    s(1, "W3", "DAL", "EDM", 2, 4, "2024-05-23"),
    s(1, "SCF", "FLA", "EDM", 4, 3, "2024-06-08"),
  ],
};

// ----- World Cup 2022: single matches, extra time and shoot-outs, a third-place match.
export const wc2022Teams = [
  ["NED", "Netherlands"], ["USA", "United States"], ["ARG", "Argentina"], ["AUS", "Australia"], ["JPN", "Japan"], ["CRO", "Croatia"], ["BRA", "Brazil"], ["KOR", "South Korea"],
  ["FRA", "France"], ["POL", "Poland"], ["ENG", "England"], ["SEN", "Senegal"], ["MAR", "Morocco"], ["ESP", "Spain"], ["POR", "Portugal"], ["SUI", "Switzerland"],
].map(([id, name]) => ({ id, name, abbr: id }));
const m = (no, id, a, b, sa, sb, date, extra = {}) => ({ id, no, sides: [a, b], round: undefined, date, games: [g(sa, sb, extra)] });
export const wc2022 = {
  teams: wc2022Teams,
  matchups: [
    m(1, "R16-1", "NED", "USA", 3, 1, "2022-12-03T15:00"), m(2, "R16-2", "ARG", "AUS", 2, 1, "2022-12-03T19:00"),
    m(3, "R16-3", "JPN", "CRO", 1, 1, "2022-12-05T15:00", { extraTime: true, pens: [1, 3] }), m(4, "R16-4", "BRA", "KOR", 4, 1, "2022-12-05T19:00"),
    m(5, "R16-5", "FRA", "POL", 3, 1, "2022-12-04T19:00"), m(6, "R16-6", "ENG", "SEN", 3, 0, "2022-12-04T15:00"),
    m(7, "R16-7", "MAR", "ESP", 0, 0, "2022-12-06T15:00", { extraTime: true, pens: [3, 0] }), m(8, "R16-8", "POR", "SUI", 6, 1, "2022-12-06T19:00"),
    m(1, "QF-1", "NED", "ARG", 2, 2, "2022-12-09T19:00", { extraTime: true, pens: [3, 4] }), m(2, "QF-2", "CRO", "BRA", 1, 1, "2022-12-09T15:00", { extraTime: true, pens: [4, 2] }),
    m(3, "QF-3", "ENG", "FRA", 1, 2, "2022-12-10T19:00"), m(4, "QF-4", "MAR", "POR", 1, 0, "2022-12-10T15:00"),
    m(1, "SF-1", "ARG", "CRO", 3, 0, "2022-12-13"), m(2, "SF-2", "FRA", "MAR", 2, 0, "2022-12-14"),
    { ...m(1, "3RD", "CRO", "MAR", 2, 1, "2022-12-17"), third: true },
    m(1, "F", "ARG", "FRA", 3, 3, "2022-12-18", { extraTime: true, pens: [4, 2] }),
  ],
};
// Left half top to bottom: NED-USA, ARG-AUS, JPN-CRO, BRA-KOR; right half: FRA-POL, ENG-SEN, MAR-ESP, POR-SUI. `no` orders the ties of a round that feed one tie.
for (const t of wc2022.matchups) {
  const order = { "R16-1": 1, "R16-2": 2, "R16-3": 3, "R16-4": 4, "R16-5": 5, "R16-6": 6, "R16-7": 7, "R16-8": 8, "QF-1": 1, "QF-2": 2, "QF-3": 3, "QF-4": 4, "SF-1": 1, "SF-2": 2 };
  if (order[t.id]) t.no = order[t.id];
}

// ----- MLB 2022: byes (the top two seeds of each league skipped the wild card series), series of three, five and seven.
const mlbTeams = [
  ["HOU", "Houston Astros", "American League"], ["NYY", "New York Yankees", "American League"], ["CLE", "Cleveland Guardians", "American League"], ["SEA", "Seattle Mariners", "American League"], ["TOR", "Toronto Blue Jays", "American League"], ["TBR", "Tampa Bay Rays", "American League"],
  ["LAD", "Los Angeles Dodgers", "National League"], ["ATL", "Atlanta Braves", "National League"], ["STL", "St. Louis Cardinals", "National League"], ["SDP", "San Diego Padres", "National League"], ["NYM", "New York Mets", "National League"], ["PHI", "Philadelphia Phillies", "National League"],
].map(([id, name, group]) => ({ id, name, group, abbr: id }));
const ser = (no, id, a, b, wa, wb, bestOf, date) => ({ id, no, sides: [a, b], bestOf, score: [wa, wb], date });
export const mlb2022 = {
  teams: mlbTeams,
  matchups: [
    ser(1, "AL-WC1", "CLE", "TBR", 2, 0, 3, "2022-10-07"), ser(2, "AL-WC2", "SEA", "TOR", 2, 0, 3, "2022-10-07"),
    ser(1, "AL-DS1", "NYY", "CLE", 3, 2, 5, "2022-10-11"), ser(2, "AL-DS2", "HOU", "SEA", 3, 0, 5, "2022-10-11"),
    ser(1, "AL-CS", "HOU", "NYY", 4, 0, 7, "2022-10-19"),
    ser(1, "NL-WC1", "STL", "PHI", 0, 2, 3, "2022-10-07"), ser(2, "NL-WC2", "NYM", "SDP", 1, 2, 3, "2022-10-07"),
    ser(1, "NL-DS1", "LAD", "SDP", 1, 3, 5, "2022-10-11"), ser(2, "NL-DS2", "ATL", "PHI", 1, 3, 5, "2022-10-11"),
    ser(1, "NL-CS", "SDP", "PHI", 1, 4, 7, "2022-10-18"),
    ser(1, "WS", "HOU", "PHI", 4, 2, 7, "2022-10-28"),
  ],
};
// Rounds: the wild card series are round 1, though the two top seeds of each league (HOU, NYY, LAD, ATL) are not in them.
for (const t of mlb2022.matchups) {
  t.round = t.id.includes("WC") ? 1 : t.id.includes("DS") ? 2 : t.id.endsWith("CS") ? 3 : 4;
}

// ----- World Cup 1938: drawn matches replayed (one tie of two matches).
export const wc1938 = {
  teams: [["SUI", "Switzerland"], ["GER", "Germany"], ["CUB", "Cuba"], ["ROU", "Romania"], ["HUN", "Hungary"], ["DEI", "Dutch East Indies"], ["SWE", "Sweden"], ["AUT", "Austria"],
    ["ITA", "Italy"], ["NOR", "Norway"], ["FRA", "France"], ["BEL", "Belgium"], ["TCH", "Czechoslovakia"], ["NED", "Netherlands"], ["BRA", "Brazil"], ["POL", "Poland"]].map(([id, name]) => ({ id, name, abbr: id })),
  matchups: [
    { id: "R16-1", no: 1, sides: ["SUI", "GER"], games: [g(1, 1, { date: "1938-06-04", extraTime: true }), g(4, 2, { date: "1938-06-09", replay: true })] },
    { id: "R16-2", no: 2, sides: ["CUB", "ROU"], games: [g(3, 3, { date: "1938-06-05", extraTime: true }), g(2, 1, { date: "1938-06-09", replay: true })] },
    { id: "R16-3", no: 3, sides: ["HUN", "DEI"], games: [g(6, 0, { date: "1938-06-05" })] },
    { id: "R16-4", no: 4, sides: ["SWE", "AUT"], winner: "SWE", note: "walkover", date: "1938-06-05" },
    { id: "R16-5", no: 5, sides: ["ITA", "NOR"], games: [g(2, 1, { date: "1938-06-05", extraTime: true })] },
    { id: "R16-6", no: 6, sides: ["FRA", "BEL"], games: [g(3, 1, { date: "1938-06-05" })] },
    { id: "R16-7", no: 7, sides: ["TCH", "NED"], games: [g(3, 0, { date: "1938-06-05", extraTime: true })] },
    { id: "R16-8", no: 8, sides: ["BRA", "POL"], games: [g(6, 5, { date: "1938-06-05", extraTime: true })] },
    { id: "QF-1", no: 1, sides: ["SUI", "HUN"], games: [g(0, 2, { date: "1938-06-12" })] },
    { id: "QF-2", no: 2, sides: ["CUB", "SWE"], games: [g(0, 8, { date: "1938-06-12" })] },
    { id: "QF-3", no: 3, sides: ["ITA", "FRA"], games: [g(3, 1, { date: "1938-06-12" })] },
    { id: "QF-4", no: 4, sides: ["BRA", "TCH"], games: [g(1, 1, { date: "1938-06-12", extraTime: true }), g(2, 1, { date: "1938-06-14", replay: true })] },
    { id: "SF-1", no: 1, sides: ["HUN", "SWE"], games: [g(5, 1, { date: "1938-06-16" })] },
    { id: "SF-2", no: 2, sides: ["ITA", "BRA"], games: [g(2, 1, { date: "1938-06-16" })] },
    { id: "3RD", third: true, sides: ["BRA", "SWE"], games: [g(4, 2, { date: "1938-06-19" })] },
    { id: "F", sides: ["ITA", "HUN"], games: [g(4, 2, { date: "1938-06-19" })] },
  ],
};

// ----- Two legs, added up: made-up clubs, so no name is real.
const clubs = ["Aurora", "Borealis", "Cascade", "Delta", "Ember", "Fjord", "Glacier", "Harbour"].map((name, i) => ({ id: name.slice(0, 3).toUpperCase(), name: `${name} FC`, abbr: name.slice(0, 3).toUpperCase(), seed: i + 1 }));
const leg = (a, b, date) => ({ score: [a, b], date });
export const twoLegs = {
  teams: clubs,
  matchups: [
    { id: "QF1", no: 1, kind: "aggregate", sides: ["AUR", "HAR"], legs: [leg(2, 0, "2026-03-04"), leg(1, 1, "2026-03-11")] },
    { id: "QF2", no: 2, kind: "aggregate", sides: ["DEL", "EMB"], legs: [leg(1, 1, "2026-03-04"), leg(2, 2, "2026-03-11")], winner: "EMB", note: "away goals" },
    { id: "QF3", no: 3, kind: "aggregate", sides: ["CAS", "FJO"], legs: [leg(0, 1, "2026-03-05"), leg(2, 0, "2026-03-12")] },
    { id: "QF4", no: 4, kind: "aggregate", sides: ["BOR", "GLA"], legs: [leg(3, 3, "2026-03-05"), leg(1, 1, "2026-03-12")] },
    { id: "SF1", no: 1, kind: "aggregate", sides: ["AUR", "EMB"], legs: [leg(1, 0, "2026-04-08"), leg(2, 2, "2026-04-15")] },
    { id: "SF2", no: 2, kind: "aggregate", sides: ["CAS", "BOR"], legs: [leg(1, 1, "2026-04-09"), leg(0, 0, "2026-04-16")] },
    { id: "F", sides: ["AUR", "CAS"], games: [g(2, 1, { date: "2026-05-30" })] },
  ],
};
// Level on aggregate, so a shoot-out on the second leg:
twoLegs.matchups[3].legs[1] = { score: [1, 1], date: "2026-03-12", pens: [5, 4] };
twoLegs.matchups[5].legs[1] = { score: [0, 0], date: "2026-04-16", extraTime: true, pens: [3, 2] };
