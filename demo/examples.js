// The demo's examples: each is the data a caller would pass to drawBracket, and the options it draws with by default.
import { build } from "./data.js";
import { FLAGS } from "./flags-data.js";
import { playOut } from "./play.js";

/** The World Cup's name in each language, as each language's Wikipedia titles its article on the tournament of a year. */
const worldCup = (year) => ({ en: `FIFA World Cup ${year}`, fr: `Coupe du monde de football ${year}`, ja: `${year} FIFAワールドカップ`, es: `Copa Mundial de Fútbol ${year}`, de: `Fußball-Weltmeisterschaft ${year}` });

export function examples(T) {
  const data = build(T, FLAGS);

  // Made up: 32 teams by seed, the better seed through every time.
  const generic = Array.from({ length: 32 }, (_, i) => ({ id: `T${i + 1}`, name: `Team ${i + 1}`, abbr: `T${i + 1}`, seed: i + 1 }));
  const gmade = T.singleElimination(generic);
  const generic32 = { teams: gmade.teams, matchups: playOut(T, gmade.matchups, gmade.teams) };

  const nhl = (year) => ({ roundNames: T.playoffFormat("nhl", year), roundNamesCode: `playoffFormat('nhl', ${year})` });
  return [
    { key: "nhl2024", neutral: "NHL 2024", sport: "nhl", label: "2024", title: "Stanley Cup playoffs 2024", note: "Best-of-seven series, the halves named for the conferences, round names from playoffFormat('nhl', 2024). Every game of the playoffs, read from spxn.com. The teams have no logo here, so each is its initials on its colour.", data: data.nhl2024, options: { title: "Stanley Cup playoffs 2024", roundNames: T.playoffFormat("nhl", 2024) }, roundNamesCode: nhl(2024).roundNamesCode },
    { key: "nhl1984", neutral: "NHL 1984", sport: "nhl", label: "1984, Campbell and Wales", title: "Stanley Cup playoffs 1984", note: "An older era: in 1984 the first round was best of five and the halves were the Campbell and Wales conferences. playoffFormat('nhl', 1984) has the names and lengths of that era.", data: data.nhl1984, options: { title: "Stanley Cup playoffs 1984", roundNames: T.playoffFormat("nhl", 1984) }, roundNamesCode: nhl(1984).roundNamesCode },
    { key: "nba2024", neutral: "NBA 2024", sport: "nba", label: "2024", title: "NBA playoffs 2024", note: "Best-of-seven series in two conferences, 16 teams. Read from spxn.com (English Wikipedia).", data: data.nba2024, options: { title: "NBA playoffs 2024", roundNames: T.playoffFormat("nba", 2024) }, roundNamesCode: "playoffFormat('nba', 2024)" },
    { key: "mlb2022", neutral: "MLB 2022", sport: "mlb", label: "2022, byes", title: "MLB postseason 2022", note: "The top two seeds of each league skipped the wild card series: the layout finds the byes and each division series box says which side had one. Every game of the postseason, read from spxn.com (Retrosheet).", data: data.mlb2022, options: { title: "MLB postseason 2022", roundNames: T.playoffFormat("mlb", 2022) }, roundNamesCode: "playoffFormat('mlb', 2022)" },
    { key: "nfl2024", neutral: "NFL 2024", sport: "nfl", label: "2024 season", title: "NFL playoffs, 2024 season", note: "Single games, byes for the top seed of each conference, and the Super Bowl at the centre; the season's playoffs were played in January and February 2025. Read from spxn.com (nflverse).", data: data.nfl2024, options: { title: "NFL playoffs 2024", roundNames: T.playoffFormat("nfl", 2024) }, roundNamesCode: "playoffFormat('nfl', 2024)" },
    { key: "cfl2024", neutral: "CFL 2024", sport: "cfl", label: "2024", title: "CFL playoffs 2024", note: "Division semi-finals and finals, a bye for the first-placed team of each division, and the Grey Cup at the centre. Read from spxn.com (English Wikipedia).", data: data.cfl2024, options: { title: "CFL playoffs 2024", roundNames: T.playoffFormat("cfl", 2024) }, roundNamesCode: "playoffFormat('cfl', 2024)" },
    { key: "mls2024", neutral: "MLS 2024", sport: "mls", label: "2024", title: "MLS Cup Playoffs 2024", note: "Eighteen clubs, nine a conference: a wild card match, a best-of-three round one (a game level after play is settled by a shoot-out and counts as a win; seven clubs of each conference skip the wild card match, so both sides of those ties say bye), then single matches to the MLS Cup. Read from spxn.com (openfootball and English Wikipedia).", data: data.mls2024, options: { title: "MLS Cup Playoffs 2024", roundNames: T.playoffFormat("mls", 2024) }, roundNamesCode: "playoffFormat('mls', 2024)" },
    { key: "poster", sport: "wc", label: "2026 poster", title: "World Cup 2026 poster", note: "The poster look: dark navy, gold lines, a round flag for each nation and nothing else, for the 2026 World Cup, 32 teams to the final, with the champion in the centre. The matches are from openfootball (CC0). Choose a language above: the names of the countries come from Intl.DisplayNames, with no list.", data: data.wc2026, options: { title: "FIFA World Cup 2026", subtitle: "Round of 32 to the final", theme: "poster", detail: "mark", roundLabels: false }, titles: worldCup(2026), subtitles: { en: "Round of 32 to the final", fr: "Des seizièmes de finale à la finale", ja: "ラウンド32から決勝まで", es: "De los dieciseisavos a la final", de: "Vom Sechzehntelfinale bis zum Finale" }, theme: "poster" },
    { key: "wc2022", sport: "wc", label: "2022", title: "World Cup 2022", note: "Single matches with extra time and shoot-outs, a third-place match under the final, a round flag for each nation from @johnmorrisdotca/hata. The matches are from the Fjelstul World Cup Database. In another language the rounds, the notes and the names of the countries change; the clubs of the other sports keep their names.", data: data.wc2022, options: { title: "FIFA World Cup 2022", roundNames: T.playoffFormat("worldcup", 2022) }, titles: worldCup(2022), roundNamesCode: "playoffFormat('worldcup', 2022)" },
    { key: "wc1938", sport: "wc", label: "1938, replays", title: "World Cup 1938", note: "Drawn matches were replayed (Switzerland and Germany, Cuba and Romania, Brazil and Czechoslovakia): one tie of two matches, decided by the replay. Austria withdrew, so Sweden had no first-round match. The matches are from the Fjelstul World Cup Database. Czechoslovakia and the Dutch East Indies no longer exist, so their names in other languages are written in the demo's data (`Team.names`).", data: data.wc1938, options: { title: "FIFA World Cup 1938", roundNames: T.playoffFormat("worldcup", 1938) }, titles: worldCup(1938), roundNamesCode: "playoffFormat('worldcup', 1938)" },
    { key: "generic32", neutral: "32", sport: "made", label: "32 teams", title: "32 teams, generic", note: "Any number of teams: singleElimination() seeds them and advanceWinners() carries results forward. Made up: the better seed always wins.", data: generic32, options: { title: "32-team single elimination" } },
    { key: "twoLegs", neutral: "2 × 2", sport: "made", label: "Two legs", title: "Two legs, made-up clubs", note: "Aggregate ties: the legs are added up, away goals can be a note, and a shoot-out settles a level aggregate. Made-up clubs, so no name is real.", data: data.twoLegs, options: { title: "Two-legged knockout" } },
  ];
}

/** The sports, in the order of the picker. */
export const SPORTS = [
  { key: "nhl", label: "NHL" }, { key: "nba", label: "NBA" }, { key: "mlb", label: "MLB" }, { key: "nfl", label: "NFL" }, { key: "cfl", label: "CFL" },
  { key: "mls", label: "MLS" }, { key: "wc", label: "World Cup" }, { key: "made", label: "Made up" },
];
