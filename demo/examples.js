// The demo's examples: each is the data a caller would pass to drawBracket, and the options it draws with by default.
import { build } from "./data.js";
import { FLAGS } from "./flags-data.js";
import { playOut } from "./play.js";

export function examples(T) {
  const data = build(T, FLAGS);

  // Made up: 32 teams by seed, the better seed through every time.
  const generic = Array.from({ length: 32 }, (_, i) => ({ id: `T${i + 1}`, name: `Team ${i + 1}`, abbr: `T${i + 1}`, seed: i + 1 }));
  const gmade = T.singleElimination(generic);
  const generic32 = { teams: gmade.teams, matchups: playOut(T, gmade.matchups, gmade.teams) };

  return [
    { key: "nhl2024", label: "NHL 2024", title: "Stanley Cup playoffs 2024", note: "Best-of-seven series, the halves named for the conferences, round names from playoffFormat('nhl', 2024). Every game of the playoffs, read from spxn.com. The teams have no logo here, so each is its initials on its colour.", data: data.nhl2024, options: { title: "Stanley Cup playoffs 2024", roundNames: T.playoffFormat("nhl", 2024) }, roundNamesCode: "playoffFormat('nhl', 2024)" },
    { key: "wc2022", label: "World Cup 2022", title: "World Cup 2022", note: "Single matches with extra time and shoot-outs, a third-place match under the final, a round flag for each nation from @johnmorrisdotca/hata. The matches are from the Fjelstul World Cup Database.", data: data.wc2022, options: { title: "FIFA World Cup 2022", roundNames: T.playoffFormat("worldcup", 2022) }, roundNamesCode: "playoffFormat('worldcup', 2022)" },
    { key: "poster", label: "Poster, 2026", title: "World Cup 2026 poster", note: "The poster look: dark navy, gold lines, a round flag for each nation and nothing else, for the 2026 World Cup, 32 teams to the final, with the champion in the centre. The matches are from openfootball (CC0).", data: data.wc2026, options: { title: "FIFA World Cup 2026", subtitle: "Round of 32 to the final", theme: "poster", detail: "mark", roundLabels: false }, theme: "poster" },
    { key: "generic32", label: "32 teams", title: "32 teams, generic", note: "Any number of teams: singleElimination() seeds them and advanceWinners() carries results forward. Made up: the better seed always wins.", data: generic32, options: { title: "32-team single elimination" } },
    { key: "mlb2022", label: "MLB 2022, byes", title: "MLB postseason 2022", note: "The top two seeds of each league skipped the wild card series: the layout finds the byes. Every game of the postseason, read from spxn.com (Retrosheet).", data: data.mlb2022, options: { title: "MLB postseason 2022", roundNames: T.playoffFormat("mlb", 2022) } },
    { key: "wc1938", label: "1938, replays", title: "World Cup 1938", note: "Drawn matches were replayed (Switzerland and Germany, Cuba and Romania, Brazil and Czechoslovakia): one tie of two matches, decided by the replay. Austria withdrew, so Sweden had no first-round match. The matches are from the Fjelstul World Cup Database.", data: data.wc1938, options: { title: "FIFA World Cup 1938", roundNames: T.playoffFormat("worldcup", 1938) } },
    { key: "twoLegs", label: "Two legs", title: "Two legs, made-up clubs", note: "Aggregate ties: the legs are added up, away goals can be a note, and a shoot-out settles a level aggregate. Made-up clubs, so no name is real.", data: data.twoLegs, options: { title: "Two-legged knockout" } },
  ];
}
