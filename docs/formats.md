# Formats by era

`playoffFormat(league, year)` returns the entry for the season, or `null` when the league had no playoff, or this package does not cover it. This page is written from the data in `src/presets.ts` by `scripts/make-formats-doc.mjs`; do not edit it by hand.

Each era was checked on 2026-10-13 against the English Wikipedia articles named in its last column, read through the MediaWiki API one request at a time, a second or more apart, with a User-Agent that names this project. Wikipedia's text is under CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/); only facts (years, round names, series lengths, numbers of teams, byes) are taken, no sentence or table. Where a season did something of its own (a strike, a pandemic) it has its own entry. The year is the year the playoffs are played in (the NHL's and the NBA's 2024 are the 2024 playoffs, of the 2023-24 season), except for the NFL, whose year is its season's: 2024 is the season whose playoffs were played in January and February 2025. A later edition or season is not covered until its entry is checked.

```js
import { playoffFormat } from "@johnmorrisdotca/taisen-brackets";

const format = playoffFormat("mlb", 2022);
console.log(format.rounds.map((round) => `${round.name} (${round.bestOf})`).join(", ")); // Wild Card Series (3), Division Series (5), League Championship Series (7), World Series (7)
console.log(format.byes); // 2
```

A round's `bestOf` is the length of the series, 1 for a single game. `byes` is the number of teams of each half that skip the first round. `groups` names the two halves, left first, or is `null` where the bracket is not split in two. Pass the format itself as `roundNames` to `drawBracket`.

## NHL (Stanley Cup playoffs)

| Years | Teams | Byes | Halves | Rounds (series length) | Note | Checked against |
| --- | --- | --- | --- | --- | --- | --- |
| 1975–1979 | 12 | 2 | none | Preliminary Round (3), Quarterfinals (7), Semifinals (7), Stanley Cup Final (7) | 12 teams, a best-of-three preliminary round. Division winners had a bye; the second and third placed teams played a preliminary round. | [1977 Stanley Cup playoffs](https://en.wikipedia.org/wiki/1977_Stanley_Cup_playoffs), [Stanley Cup playoffs](https://en.wikipedia.org/wiki/Stanley_Cup_playoffs) |
| 1980–1981 | 16 | 0 | none | Preliminary Round (5), Quarterfinals (7), Semifinals (7), Stanley Cup Final (7) | 16 teams, a best-of-five preliminary round | [1981 Stanley Cup playoffs](https://en.wikipedia.org/wiki/1981_Stanley_Cup_playoffs) |
| 1982–1986 | 16 | 0 | Campbell Conference / Wales Conference | Division Semifinals (5), Division Finals (7), Conference Finals (7), Stanley Cup Final (7) | 16 teams by division, a best-of-five first round | [1984 Stanley Cup playoffs](https://en.wikipedia.org/wiki/1984_Stanley_Cup_playoffs), [Clarence Campbell Conference](https://en.wikipedia.org/wiki/Clarence_Campbell_Conference), [Prince of Wales Conference](https://en.wikipedia.org/wiki/Prince_of_Wales_Conference) |
| 1987–1993 | 16 | 0 | Campbell Conference / Wales Conference | Division Semifinals (7), Division Finals (7), Conference Finals (7), Stanley Cup Final (7) | 16 teams by division | [1990 Stanley Cup playoffs](https://en.wikipedia.org/wiki/1990_Stanley_Cup_playoffs), [Clarence Campbell Conference](https://en.wikipedia.org/wiki/Clarence_Campbell_Conference), [Prince of Wales Conference](https://en.wikipedia.org/wiki/Prince_of_Wales_Conference) |
| 1994–2013 | 16 | 0 | Western / Eastern | Conference Quarterfinals (7), Conference Semifinals (7), Conference Finals (7), Stanley Cup Final (7) | 16 teams, eight a conference, conference rounds. No playoffs in 2005 (the 2004-05 season was not played). | [1996 Stanley Cup playoffs](https://en.wikipedia.org/wiki/1996_Stanley_Cup_playoffs), [2013 Stanley Cup playoffs](https://en.wikipedia.org/wiki/2013_Stanley_Cup_playoffs) |
| 2014 on | 16 | 0 | Western / Eastern | First Round (7), Second Round (7), Conference Finals (7), Stanley Cup Final (7) | 16 teams, eight a conference, division rounds first. The first two rounds are played within divisions. | [2014 Stanley Cup playoffs](https://en.wikipedia.org/wiki/2014_Stanley_Cup_playoffs) |
| 2020 | 24 | 0 | Western / Eastern | Qualifying Round (5), First Round (7), Second Round (7), Conference Finals (7), Stanley Cup Final (7) | 24 teams: a qualifying round, then 16. The top four teams of each conference played a round robin for seeding instead of the qualifying round. | [2020 Stanley Cup playoffs](https://en.wikipedia.org/wiki/2020_Stanley_Cup_playoffs) |
| 2021 | 16 | 0 | none | First Round (7), Second Round (7), Stanley Cup Semifinals (7), Stanley Cup Final (7) | 16 teams in four divisions. Four temporary divisions: the semifinals were between division winners, not conferences. | [2021 Stanley Cup playoffs](https://en.wikipedia.org/wiki/2021_Stanley_Cup_playoffs) |

## NBA

| Years | Teams | Byes | Halves | Rounds (series length) | Note | Checked against |
| --- | --- | --- | --- | --- | --- | --- |
| 1977–1983 | 12 | 2 | Western / Eastern | First Round (3), Conference Semifinals (7), Conference Finals (7), NBA Finals (7) | 12 teams, a best-of-three first round. Division winners had a bye. | [NBA playoffs](https://en.wikipedia.org/wiki/NBA_playoffs) |
| 1984–2002 | 16 | 0 | Western / Eastern | First Round (5), Conference Semifinals (7), Conference Finals (7), NBA Finals (7) | 16 teams, a best-of-five first round | [NBA playoffs](https://en.wikipedia.org/wiki/NBA_playoffs) |
| 2003 on | 16 | 0 | Western / Eastern | First Round (7), Conference Semifinals (7), Conference Finals (7), NBA Finals (7) | 16 teams, best-of-seven throughout. Since 2021 a play-in tournament decides the seventh and eighth seeds of each conference. | [NBA playoffs](https://en.wikipedia.org/wiki/NBA_playoffs) |

## MLB

| Years | Teams | Byes | Halves | Rounds (series length) | Note | Checked against |
| --- | --- | --- | --- | --- | --- | --- |
| 1969–1984 | 4 | 0 | American League / National League | League Championship Series (5), World Series (7) | two rounds, a best-of-five league championship series | [Major League Baseball postseason](https://en.wikipedia.org/wiki/Major_League_Baseball_postseason) |
| 1981 | 8 | 0 | American League / National League | Division Series (5), League Championship Series (5), World Series (7) | a split season: a division series first | [Major League Baseball postseason](https://en.wikipedia.org/wiki/Major_League_Baseball_postseason) |
| 1985–1993 | 4 | 0 | American League / National League | League Championship Series (7), World Series (7) | two rounds, a best-of-seven league championship series | [Major League Baseball postseason](https://en.wikipedia.org/wiki/Major_League_Baseball_postseason) |
| 1995–2011 | 8 | 0 | American League / National League | Division Series (5), League Championship Series (7), World Series (7) | 8 teams, division series. No postseason in 1994: the season ended on 11 August with the players' strike. | [Major League Baseball postseason](https://en.wikipedia.org/wiki/Major_League_Baseball_postseason), [1994 Major League Baseball season](https://en.wikipedia.org/wiki/1994_Major_League_Baseball_season) |
| 2012–2019 | 10 | 3 | American League / National League | Wild Card Game (1), Division Series (5), League Championship Series (7), World Series (7) | 10 teams, a wild card game. The three division winners of each league skip the wild card game. | [Major League Baseball postseason](https://en.wikipedia.org/wiki/Major_League_Baseball_postseason) |
| 2020 | 16 | 0 | American League / National League | Wild Card Series (3), Division Series (5), League Championship Series (7), World Series (7) | 16 teams, a best-of-three wild card series | [Major League Baseball postseason](https://en.wikipedia.org/wiki/Major_League_Baseball_postseason) |
| 2021 | 10 | 3 | American League / National League | Wild Card Game (1), Division Series (5), League Championship Series (7), World Series (7) | 10 teams, a wild card game | [Major League Baseball postseason](https://en.wikipedia.org/wiki/Major_League_Baseball_postseason) |
| 2022 on | 12 | 2 | American League / National League | Wild Card Series (3), Division Series (5), League Championship Series (7), World Series (7) | 12 teams, the top two seeds of each league have a bye | [Major League Baseball postseason](https://en.wikipedia.org/wiki/Major_League_Baseball_postseason) |

## NFL

| Years | Teams | Byes | Halves | Rounds (series length) | Note | Checked against |
| --- | --- | --- | --- | --- | --- | --- |
| 1970–1977 | 8 | 0 | AFC / NFC | Divisional Playoffs (1), Conference Championships (1), Super Bowl (1) | 8 teams | [NFL playoffs](https://en.wikipedia.org/wiki/NFL_playoffs), [1975–76 NFL playoffs](https://en.wikipedia.org/wiki/1975–76_NFL_playoffs) |
| 1978–1989 | 10 | 3 | AFC / NFC | Wild Card (1), Divisional (1), Conference Championship (1), Super Bowl (1) | 10 teams, the division winners have a bye | [NFL playoffs](https://en.wikipedia.org/wiki/NFL_playoffs), [1983–84 NFL playoffs](https://en.wikipedia.org/wiki/1983–84_NFL_playoffs) |
| 1982 | 16 | 0 | AFC / NFC | First Round (1), Second Round (1), Conference Championship (1), Super Bowl (1) | 16 teams after the players' strike | [NFL playoffs](https://en.wikipedia.org/wiki/NFL_playoffs), [1982–83 NFL playoffs](https://en.wikipedia.org/wiki/1982–83_NFL_playoffs) |
| 1990–2019 | 12 | 2 | AFC / NFC | Wild Card (1), Divisional (1), Conference Championship (1), Super Bowl (1) | 12 teams, the top two seeds have a bye | [NFL playoffs](https://en.wikipedia.org/wiki/NFL_playoffs) |
| 2020 on | 14 | 1 | AFC / NFC | Wild Card (1), Divisional (1), Conference Championship (1), Super Bowl (1) | 14 teams, the top seed has a bye | [NFL playoffs](https://en.wikipedia.org/wiki/NFL_playoffs) |

## CFL

| Years | Teams | Byes | Halves | Rounds (series length) | Note | Checked against |
| --- | --- | --- | --- | --- | --- | --- |
| 1996–2026 | 6 | 1 | West / East | Division Semi-Final (1), Division Final (1), Grey Cup (1) | division semi-finals and finals, with a crossover. Three teams of each division qualify and the first-placed team has a bye. A fourth-placed team with a better record than the third-placed team of the other division takes that place (the crossover, since 1996). The league has announced an eight-team format from 2027. | [1996 CFL season](https://en.wikipedia.org/wiki/1996_CFL_season), [2012 CFL season](https://en.wikipedia.org/wiki/2012_CFL_season), [2019 CFL season](https://en.wikipedia.org/wiki/2019_CFL_season), [CFL playoffs](https://en.wikipedia.org/wiki/CFL_playoffs) |

## FIFA World Cup

| Years | Teams | Byes | Halves | Rounds (series length) | Note | Checked against |
| --- | --- | --- | --- | --- | --- | --- |
| 1930 | 4 | 0 | none | Semi-finals (1), Final (1) | four group winners, straight to the semi-finals | [1930 FIFA World Cup](https://en.wikipedia.org/wiki/1930_FIFA_World_Cup) |
| 1934–1938 | 16 | 0 | none | Round of 16 (1), Quarter-finals (1), Semi-finals (1), Final (1) | 16 teams, straight knockout, drawn matches replayed. A match still level after extra time was replayed (1934, 1938). There was a third-place match in both. In 1938 Austria withdrew, so 15 teams played. | [1934 FIFA World Cup](https://en.wikipedia.org/wiki/1934_FIFA_World_Cup), [FIFA World Cup](https://en.wikipedia.org/wiki/FIFA_World_Cup) |
| 1954–1970 | 8 | 0 | none | Quarter-finals (1), Semi-finals (1), Final (1) | knockout from the quarter-finals. With a third-place match. | [1954 FIFA World Cup](https://en.wikipedia.org/wiki/1954_FIFA_World_Cup), [FIFA World Cup](https://en.wikipedia.org/wiki/FIFA_World_Cup) |
| 1974–1978 | 4 | 0 | none | Final (1) | a second group stage, then the final. No semi-finals: the winners of the two second-round groups played the final, the runners-up the third-place match. | [1974 FIFA World Cup](https://en.wikipedia.org/wiki/1974_FIFA_World_Cup), [1978 FIFA World Cup](https://en.wikipedia.org/wiki/1978_FIFA_World_Cup) |
| 1982 | 4 | 0 | none | Semi-finals (1), Final (1) | a second group stage, then semi-finals | [1982 FIFA World Cup](https://en.wikipedia.org/wiki/1982_FIFA_World_Cup) |
| 1986–2022 | 16 | 0 | none | Round of 16 (1), Quarter-finals (1), Semi-finals (1), Final (1) | 16 teams in the knockout. With a third-place match. | [1986 FIFA World Cup](https://en.wikipedia.org/wiki/1986_FIFA_World_Cup), [FIFA World Cup](https://en.wikipedia.org/wiki/FIFA_World_Cup) |
| 2026 on | 32 | 0 | none | Round of 32 (1), Round of 16 (1), Quarter-finals (1), Semi-finals (1), Final (1) | 48 teams, a round of 32. With a third-place match. Later editions are not covered until checked. | [FIFA World Cup](https://en.wikipedia.org/wiki/FIFA_World_Cup) |
