/**
 * Playoff formats by era: the round names, the length of each round's series and who has a bye, for the five North
 * American leagues and the FIFA World Cup. Data only; nothing here draws. Each era was checked against the English
 * Wikipedia articles in its `sources` (2026-10-13); where a season did something of its own (a strike, a pandemic) it has
 * its own entry. The year is the year the playoffs are played in: the NHL's 2024 is the 2023-24 season.
 */

export type League = "nhl" | "nba" | "mlb" | "nfl" | "cfl" | "worldcup";

export interface PlayoffRound {
  /** The round's name as the league calls it. */
  name: string;
  /** The length of the series, or 1 for a single game; null when the round is two legs or a group stage. */
  bestOf: number | null;
}

export interface PlayoffFormat {
  league: League;
  /** The season (or edition) this was asked for. */
  year: number;
  /** The first and last year of the era this entry covers; `to` is null while it is current. */
  from: number;
  to: number | null;
  /** The era in a few words. */
  label: string;
  /** The rounds, first round first. */
  rounds: PlayoffRound[];
  /** How many teams start the bracket, or null where it varies. */
  teams: number | null;
  /** The number of teams of each half that skip the first round. */
  byes: number;
  /** The names of the two halves, left first, or null where the bracket is not split in two. */
  groups: readonly [string, string] | null;
  note?: string;
  /** The English Wikipedia articles this entry was checked against (CC BY-SA 4.0; only facts are used). */
  sources: readonly string[];
}

interface Era extends Omit<PlayoffFormat, "year" | "to"> { to: number | null; years?: readonly number[]; except?: readonly number[] }

/** The address of English Wikipedia articles, by title. */
const wiki = (...titles: string[]) => titles.map((t) => `https://en.wikipedia.org/wiki/${t.replace(/ /g, "_")}`);
const r = (name: string, bestOf: number | null = 7): PlayoffRound => ({ name, bestOf });
const sevens = (...names: string[]) => names.map((n) => r(n, 7));

const WEST_EAST = ["Western", "Eastern"] as const;
const AL_NL = ["American League", "National League"] as const;
const AFC_NFC = ["AFC", "NFC"] as const;
const ERAS: Record<League, readonly Era[]> = {
  nhl: [
    { league: "nhl", from: 1975, to: 1979, label: "12 teams, a best-of-three preliminary round", teams: 12, byes: 2, groups: null, rounds: [r("Preliminary Round", 3), ...sevens("Quarterfinals", "Semifinals", "Stanley Cup Final")], note: "Division winners had a bye; the second and third placed teams played a preliminary round.", sources: wiki("1977 Stanley Cup playoffs", "Stanley Cup playoffs") },
    { league: "nhl", from: 1980, to: 1981, label: "16 teams, a best-of-five preliminary round", teams: 16, byes: 0, groups: null, rounds: [r("Preliminary Round", 5), ...sevens("Quarterfinals", "Semifinals", "Stanley Cup Final")], sources: wiki("1981 Stanley Cup playoffs") },
    { league: "nhl", from: 1982, to: 1986, label: "16 teams by division, a best-of-five first round", teams: 16, byes: 0, groups: ["Campbell Conference", "Wales Conference"], rounds: [r("Division Semifinals", 5), ...sevens("Division Finals", "Conference Finals", "Stanley Cup Final")], sources: wiki("1984 Stanley Cup playoffs", "Clarence Campbell Conference", "Prince of Wales Conference") },
    { league: "nhl", from: 1987, to: 1993, label: "16 teams by division", teams: 16, byes: 0, groups: ["Campbell Conference", "Wales Conference"], rounds: sevens("Division Semifinals", "Division Finals", "Conference Finals", "Stanley Cup Final"), sources: wiki("1990 Stanley Cup playoffs", "Clarence Campbell Conference", "Prince of Wales Conference") },
    { league: "nhl", from: 1994, to: 2013, label: "16 teams, eight a conference, conference rounds", teams: 16, byes: 0, groups: WEST_EAST, rounds: sevens("Conference Quarterfinals", "Conference Semifinals", "Conference Finals", "Stanley Cup Final"), except: [2005], note: "No playoffs in 2005 (the 2004-05 season was not played).", sources: wiki("1996 Stanley Cup playoffs", "2013 Stanley Cup playoffs") },
    { league: "nhl", from: 2014, to: null, label: "16 teams, eight a conference, division rounds first", teams: 16, byes: 0, groups: WEST_EAST, rounds: sevens("First Round", "Second Round", "Conference Finals", "Stanley Cup Final"), except: [2020, 2021], note: "The first two rounds are played within divisions.", sources: wiki("2014 Stanley Cup playoffs") },
    { league: "nhl", from: 2020, to: 2020, label: "24 teams: a qualifying round, then 16", teams: 24, byes: 0, groups: WEST_EAST, rounds: [r("Qualifying Round", 5), ...sevens("First Round", "Second Round", "Conference Finals", "Stanley Cup Final")], note: "The top four teams of each conference played a round robin for seeding instead of the qualifying round.", sources: wiki("2020 Stanley Cup playoffs") },
    { league: "nhl", from: 2021, to: 2021, label: "16 teams in four divisions", teams: 16, byes: 0, groups: null, rounds: sevens("First Round", "Second Round", "Stanley Cup Semifinals", "Stanley Cup Final"), note: "Four temporary divisions: the semifinals were between division winners, not conferences.", sources: wiki("2021 Stanley Cup playoffs") },
  ],
  nba: [
    { league: "nba", from: 1977, to: 1983, label: "12 teams, a best-of-three first round", teams: 12, byes: 2, groups: WEST_EAST, rounds: [r("First Round", 3), ...sevens("Conference Semifinals", "Conference Finals", "NBA Finals")], note: "Division winners had a bye.", sources: wiki("NBA playoffs") },
    { league: "nba", from: 1984, to: 2002, label: "16 teams, a best-of-five first round", teams: 16, byes: 0, groups: WEST_EAST, rounds: [r("First Round", 5), ...sevens("Conference Semifinals", "Conference Finals", "NBA Finals")], sources: wiki("NBA playoffs") },
    { league: "nba", from: 2003, to: null, label: "16 teams, best-of-seven throughout", teams: 16, byes: 0, groups: WEST_EAST, rounds: sevens("First Round", "Conference Semifinals", "Conference Finals", "NBA Finals"), note: "Since 2021 a play-in tournament decides the seventh and eighth seeds of each conference.", sources: wiki("NBA playoffs") },
  ],
  mlb: [
    { league: "mlb", from: 1969, to: 1984, label: "two rounds, a best-of-five league championship series", teams: 4, byes: 0, groups: AL_NL, rounds: [r("League Championship Series", 5), r("World Series", 7)], except: [1981], sources: wiki("Major League Baseball postseason") },
    { league: "mlb", from: 1981, to: 1981, label: "a split season: a division series first", teams: 8, byes: 0, groups: AL_NL, rounds: [r("Division Series", 5), r("League Championship Series", 5), r("World Series", 7)], sources: wiki("Major League Baseball postseason") },
    { league: "mlb", from: 1985, to: 1993, label: "two rounds, a best-of-seven league championship series", teams: 4, byes: 0, groups: AL_NL, rounds: [r("League Championship Series", 7), r("World Series", 7)], sources: wiki("Major League Baseball postseason") },
    { league: "mlb", from: 1995, to: 2011, label: "8 teams, division series", teams: 8, byes: 0, groups: AL_NL, rounds: [r("Division Series", 5), r("League Championship Series", 7), r("World Series", 7)], note: "No postseason in 1994: the season ended on 11 August with the players' strike.", sources: wiki("Major League Baseball postseason", "1994 Major League Baseball season") },
    { league: "mlb", from: 2012, to: 2019, label: "10 teams, a wild card game", teams: 10, byes: 3, groups: AL_NL, rounds: [r("Wild Card Game", 1), r("Division Series", 5), r("League Championship Series", 7), r("World Series", 7)], note: "The three division winners of each league skip the wild card game.", except: [2020], sources: wiki("Major League Baseball postseason") },
    { league: "mlb", from: 2020, to: 2020, label: "16 teams, a best-of-three wild card series", teams: 16, byes: 0, groups: AL_NL, rounds: [r("Wild Card Series", 3), r("Division Series", 5), r("League Championship Series", 7), r("World Series", 7)], sources: wiki("Major League Baseball postseason") },
    { league: "mlb", from: 2021, to: 2021, label: "10 teams, a wild card game", teams: 10, byes: 3, groups: AL_NL, rounds: [r("Wild Card Game", 1), r("Division Series", 5), r("League Championship Series", 7), r("World Series", 7)], sources: wiki("Major League Baseball postseason") },
    { league: "mlb", from: 2022, to: null, label: "12 teams, the top two seeds of each league have a bye", teams: 12, byes: 2, groups: AL_NL, rounds: [r("Wild Card Series", 3), r("Division Series", 5), r("League Championship Series", 7), r("World Series", 7)], sources: wiki("Major League Baseball postseason") },
  ],
  nfl: [
    { league: "nfl", from: 1970, to: 1977, label: "8 teams", teams: 8, byes: 0, groups: AFC_NFC, rounds: [r("Divisional Playoffs", 1), r("Conference Championships", 1), r("Super Bowl", 1)], sources: wiki("NFL playoffs", "1975–76 NFL playoffs") },
    { league: "nfl", from: 1978, to: 1989, label: "10 teams, the division winners have a bye", teams: 10, byes: 3, groups: AFC_NFC, rounds: [r("Wild Card", 1), r("Divisional", 1), r("Conference Championship", 1), r("Super Bowl", 1)], except: [1982], sources: wiki("NFL playoffs", "1983–84 NFL playoffs") },
    { league: "nfl", from: 1982, to: 1982, label: "16 teams after the players' strike", teams: 16, byes: 0, groups: AFC_NFC, rounds: [r("First Round", 1), r("Second Round", 1), r("Conference Championship", 1), r("Super Bowl", 1)], sources: wiki("NFL playoffs", "1982–83 NFL playoffs") },
    { league: "nfl", from: 1990, to: 2019, label: "12 teams, the top two seeds have a bye", teams: 12, byes: 2, groups: AFC_NFC, rounds: [r("Wild Card", 1), r("Divisional", 1), r("Conference Championship", 1), r("Super Bowl", 1)], sources: wiki("NFL playoffs") },
    { league: "nfl", from: 2020, to: null, label: "14 teams, the top seed has a bye", teams: 14, byes: 1, groups: AFC_NFC, rounds: [r("Wild Card", 1), r("Divisional", 1), r("Conference Championship", 1), r("Super Bowl", 1)], sources: wiki("NFL playoffs") },
  ],
  cfl: [
    { league: "cfl", from: 1996, to: 2026, label: "division semi-finals and finals, with a crossover", teams: 6, byes: 1, groups: ["West", "East"], rounds: [r("Division Semi-Final", 1), r("Division Final", 1), r("Grey Cup", 1)], note: "Three teams of each division qualify and the first-placed team has a bye. A fourth-placed team with a better record than the third-placed team of the other division takes that place (the crossover, since 1996). The league has announced an eight-team format from 2027.", sources: wiki("1996 CFL season", "2012 CFL season", "2019 CFL season", "CFL playoffs") },
  ],
  worldcup: [
    { league: "worldcup", from: 1930, to: 1930, label: "four group winners, straight to the semi-finals", teams: 4, byes: 0, groups: null, rounds: [r("Semi-finals", 1), r("Final", 1)], years: [1930], sources: wiki("1930 FIFA World Cup") },
    { league: "worldcup", from: 1934, to: 1938, label: "16 teams, straight knockout, drawn matches replayed", teams: 16, byes: 0, groups: null, rounds: [r("Round of 16", 1), r("Quarter-finals", 1), r("Semi-finals", 1), r("Final", 1)], years: [1934, 1938], note: "A match still level after extra time was replayed (1934, 1938). There was a third-place match in both. In 1938 Austria withdrew, so 15 teams played.", sources: wiki("1934 FIFA World Cup", "FIFA World Cup") },
    { league: "worldcup", from: 1954, to: 1970, label: "knockout from the quarter-finals", teams: 8, byes: 0, groups: null, rounds: [r("Quarter-finals", 1), r("Semi-finals", 1), r("Final", 1)], years: [1954, 1958, 1962, 1966, 1970], note: "With a third-place match.", sources: wiki("1954 FIFA World Cup", "FIFA World Cup") },
    { league: "worldcup", from: 1974, to: 1978, label: "a second group stage, then the final", teams: 4, byes: 0, groups: null, rounds: [r("Final", 1)], years: [1974, 1978], note: "No semi-finals: the winners of the two second-round groups played the final, the runners-up the third-place match.", sources: wiki("1974 FIFA World Cup", "1978 FIFA World Cup") },
    { league: "worldcup", from: 1982, to: 1982, label: "a second group stage, then semi-finals", teams: 4, byes: 0, groups: null, rounds: [r("Semi-finals", 1), r("Final", 1)], years: [1982], sources: wiki("1982 FIFA World Cup") },
    { league: "worldcup", from: 1986, to: 2022, label: "16 teams in the knockout", teams: 16, byes: 0, groups: null, rounds: [r("Round of 16", 1), r("Quarter-finals", 1), r("Semi-finals", 1), r("Final", 1)], years: [1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022], note: "With a third-place match.", sources: wiki("1986 FIFA World Cup", "FIFA World Cup") },
    { league: "worldcup", from: 2026, to: null, label: "48 teams, a round of 32", teams: 32, byes: 0, groups: null, rounds: [r("Round of 32", 1), r("Round of 16", 1), r("Quarter-finals", 1), r("Semi-finals", 1), r("Final", 1)], years: [2026], note: "With a third-place match. Later editions are not covered until checked.", sources: wiki("FIFA World Cup") },
  ],
};

/** The leagues that have a format here. */
export const LEAGUES: readonly League[] = Object.freeze(Object.keys(ERAS) as League[]);

/**
 * The playoff format of a league in a season (or a World Cup in its year), or `null` when there was none or this
 * package does not cover it. The rounds' names go straight to `drawBracket`'s `roundNames`.
 */
export function playoffFormat(league: League, year: number): PlayoffFormat | null {
  const list = ERAS[league];
  if (!list) throw new Error(`taisen-brackets: no format for ${JSON.stringify(league)}; leagues are ${LEAGUES.join(", ")}`);
  const hit = list.find((e) => year >= e.from && (e.to === null || year <= e.to) && !(e.except ?? []).includes(year) && (!e.years || e.years.includes(year)));
  if (!hit) return null;
  const { years: _years, except: _except, ...rest } = hit;
  void _years; void _except;
  return { ...rest, year };
}

/** Every era of a league, oldest first. */
export function playoffEras(league: League): PlayoffFormat[] {
  return ERAS[league].map(({ years: _y, except: _e, ...rest }) => { void _y; void _e; return { ...rest, year: rest.from }; });
}
