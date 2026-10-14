// The demo's examples: each is the data a caller would pass to drawBracket, and the options it draws with by default.
import { mlb2022, nhl2024, twoLegs, wc1938, wc2022 } from "./data.js";
import { FLAGS, FLAG_OF } from "./flags-data.js";
import { playOut } from "./play.js";

/** A team with the round flag of its nation as its mark. */
const withFlag = (team) => (FLAG_OF[team.id] ? { ...team, mark: FLAGS[FLAG_OF[team.id]] } : team);

/** A made-up field, in the style of a poster: 32 nations by seed, the better seed through every time. Not the real draw and not real results. */
const POSTER_FIELD = ["ARG", "FRA", "ESP", "ENG", "BRA", "POR", "NED", "GER", "BEL", "CRO", "URU", "COL", "MAR", "USA", "MEX", "JPN", "SEN", "SUI", "KOR", "AUT", "NOR", "ECU", "CAN", "AUS", "IRN", "EGY", "ALG", "TUN", "PAR", "KSA", "QAT", "UZB"];
const NAMES = { ARG: "Argentina", FRA: "France", ESP: "Spain", ENG: "England", BRA: "Brazil", POR: "Portugal", NED: "Netherlands", GER: "Germany", BEL: "Belgium", CRO: "Croatia", URU: "Uruguay", COL: "Colombia", MAR: "Morocco", USA: "United States", MEX: "Mexico", JPN: "Japan", SEN: "Senegal", SUI: "Switzerland", KOR: "South Korea", AUT: "Austria", NOR: "Norway", ECU: "Ecuador", CAN: "Canada", AUS: "Australia", IRN: "Iran", EGY: "Egypt", ALG: "Algeria", TUN: "Tunisia", PAR: "Paraguay", KSA: "Saudi Arabia", QAT: "Qatar", UZB: "Uzbekistan" };

export function examples(T) {
  const posterTeams = POSTER_FIELD.map((id, i) => withFlag({ id, name: NAMES[id], abbr: id, seed: i + 1 }));
  const made = T.singleElimination(posterTeams, { thirdPlace: true });
  const poster = { teams: made.teams, matchups: playOut(T, made.matchups, made.teams) };

  const generic = Array.from({ length: 32 }, (_, i) => ({ id: `T${i + 1}`, name: `Team ${i + 1}`, abbr: `T${i + 1}`, seed: i + 1 }));
  const gmade = T.singleElimination(generic);
  const generic32 = { teams: gmade.teams, matchups: playOut(T, gmade.matchups, gmade.teams) };

  const wcTeams = wc2022.teams.map(withFlag);
  return [
    { key: "nhl2024", label: "NHL 2024", title: "Stanley Cup playoffs 2024", note: "Best-of-seven series, the halves named for the conferences, round names from playoffFormat('nhl', 2024). Teams have no logo here, so each is its initials on its colour.", data: nhl2024, options: { title: "Stanley Cup playoffs 2024", roundNames: T.playoffFormat("nhl", 2024), seeds: false }, roundNamesCode: "playoffFormat('nhl', 2024)" },
    { key: "wc2022", label: "World Cup 2022", title: "World Cup 2022", note: "Single matches with extra time and shoot-outs, a third-place match under the final, a round flag for each nation from @johnmorrisdotca/hata.", data: { teams: wcTeams, matchups: wc2022.matchups }, options: { title: "FIFA World Cup 2022", roundNames: T.playoffFormat("worldcup", 2022) }, roundNamesCode: "playoffFormat('worldcup', 2022)" },
    { key: "poster", label: "Poster, flags only", title: "Flags-only poster", note: "The poster look: dark navy, gold lines, a round flag for each nation and nothing else. A made-up field and made-up results, not the real tournament.", data: poster, options: { title: "Knockout stage", subtitle: "An illustrative field, not the real draw or results", theme: "poster", detail: "mark", roundLabels: false }, theme: "poster" },
    { key: "generic32", label: "32 teams", title: "32 teams, generic", note: "Any number of teams: singleElimination() seeds them and advanceWinners() carries results forward. Here the better seed always wins.", data: generic32, options: { title: "32-team single elimination" } },
    { key: "mlb2022", label: "MLB 2022, byes", title: "MLB postseason 2022", note: "The top two seeds of each league skipped the wild card series: the layout finds the byes and each division series box says which side had one.", data: mlb2022, options: { title: "MLB postseason 2022", roundNames: T.playoffFormat("mlb", 2022) } },
    { key: "wc1938", label: "1938, replays", title: "World Cup 1938", note: "Drawn matches were replayed (Switzerland and Germany, Cuba and Romania, Brazil and Czechoslovakia): one tie of two matches, decided by the replay. Austria withdrew, so Sweden went through without a game.", data: wc1938, options: { title: "FIFA World Cup 1938", roundNames: T.playoffFormat("worldcup", 1938) } },
    { key: "twoLegs", label: "Two legs", title: "Two legs, made-up clubs", note: "Aggregate ties: the legs are added up, away goals can be a note, and a shoot-out settles a level aggregate. Made-up clubs, so no name is real.", data: twoLegs, options: { title: "Two-legged knockout" } },
  ];
}
