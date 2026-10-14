# Formats by era

`playoffFormat(league, year)` returns the entry for the season, or `null` when the league had no playoff, or this package does not cover it. This page is written from the data in `src/presets.ts` by `scripts/make-formats-doc.mjs`; do not edit it by hand.

The eras were written from the leagues' published histories. Where a season did something of its own (a strike, a pandemic) it has its own entry. Check the rules of the season you print against your own source.

```js
import { playoffFormat } from "@johnmorrisdotca/taisen-brackets";

const format = playoffFormat("mlb", 2022);
console.log(format.rounds.map((round) => `${round.name} (${round.bestOf})`).join(", ")); // Wild Card Series (3), Division Series (5), League Championship Series (7), World Series (7)
console.log(format.byes); // 2
```

A round's `bestOf` is the length of the series, 1 for a single game. `byes` is the number of teams of each half that skip the first round. `groups` names the two halves, left first, or is `null` where the bracket is not split in two. Pass the format itself as `roundNames` to `drawBracket`.

## NHL (Stanley Cup playoffs)

| Years | Teams | Byes | Halves | Rounds (series length) | Note |
| --- | --- | --- | --- | --- | --- |
| 1975–1979 | 12 | 2 | none | Preliminary Round (3), Quarterfinals (7), Semifinals (7), Stanley Cup Final (7) | 12 teams, a best-of-three preliminary round. Division winners had a bye; the second and third placed teams played a preliminary round. |
| 1980–1981 | 16 | 0 | none | Preliminary Round (5), Quarterfinals (7), Semifinals (7), Stanley Cup Final (7) | 16 teams, a best-of-five preliminary round |
| 1982–1986 | 16 | 0 | Campbell / Wales | Division Semifinals (5), Division Finals (7), Conference Finals (7), Stanley Cup Final (7) | 16 teams by division, a best-of-five first round |
| 1987–1993 | 16 | 0 | Campbell / Wales | Division Semifinals (7), Division Finals (7), Conference Finals (7), Stanley Cup Final (7) | 16 teams by division |
| 1994 on | 16 | 0 | Western / Eastern | First Round (7), Second Round (7), Conference Finals (7), Stanley Cup Final (7) | 16 teams, eight a conference. The 1994 to 1998 rounds were called the conference quarterfinals and semifinals; 2014 on, the first two rounds are played within divisions. |
| 2020 | 24 | 0 | Western / Eastern | Qualifying Round (5), First Round (7), Second Round (7), Conference Finals (7), Stanley Cup Final (7) | 24 teams: a qualifying round, then 16. The top four teams of each conference played a round robin for seeding instead of the qualifying round. |
| 2021 | 16 | 0 | none | First Round (7), Second Round (7), Semifinals (7), Stanley Cup Final (7) | 16 teams in four divisions. Four temporary divisions: the semifinals were between division winners, not conferences. |

## NBA

| Years | Teams | Byes | Halves | Rounds (series length) | Note |
| --- | --- | --- | --- | --- | --- |
| 1977–1983 | 12 | 2 | Western / Eastern | First Round (3), Conference Semifinals (7), Conference Finals (7), NBA Finals (7) | 12 teams, a best-of-three first round. Division winners had a bye. |
| 1984–2002 | 16 | 0 | Western / Eastern | First Round (5), Conference Semifinals (7), Conference Finals (7), NBA Finals (7) | 16 teams, a best-of-five first round |
| 2003 on | 16 | 0 | Western / Eastern | First Round (7), Conference Semifinals (7), Conference Finals (7), NBA Finals (7) | 16 teams, best-of-seven throughout. Since 2021 a play-in tournament decides the seventh and eighth seeds of each conference. |

## MLB

| Years | Teams | Byes | Halves | Rounds (series length) | Note |
| --- | --- | --- | --- | --- | --- |
| 1969–1984 | 4 | 0 | American League / National League | League Championship Series (5), World Series (7) | two rounds, a best-of-five league championship series |
| 1981 | 8 | 0 | American League / National League | Division Series (5), League Championship Series (5), World Series (7) | a split season: a division series first |
| 1985–1993 | 4 | 0 | American League / National League | League Championship Series (7), World Series (7) | two rounds, a best-of-seven league championship series |
| 1995–2011 | 8 | 0 | American League / National League | Division Series (5), League Championship Series (7), World Series (7) | 8 teams, division series |
| 2012–2019 | 10 | 3 | American League / National League | Wild Card Game (1), Division Series (5), League Championship Series (7), World Series (7) | 10 teams, a wild card game. The three division winners of each league skip the wild card game. |
| 2020 | 16 | 0 | American League / National League | Wild Card Series (3), Division Series (5), League Championship Series (7), World Series (7) | 16 teams, a best-of-three wild card series |
| 2021 | 10 | 3 | American League / National League | Wild Card Game (1), Division Series (5), League Championship Series (7), World Series (7) | 10 teams, a wild card game |
| 2022 on | 12 | 2 | American League / National League | Wild Card Series (3), Division Series (5), League Championship Series (7), World Series (7) | 12 teams, the top two seeds of each league have a bye |

## NFL

| Years | Teams | Byes | Halves | Rounds (series length) | Note |
| --- | --- | --- | --- | --- | --- |
| 1970–1977 | 8 | 0 | AFC / NFC | Divisional Playoffs (1), Conference Championships (1), Super Bowl (1) | 8 teams |
| 1978–1989 | 10 | 3 | AFC / NFC | Wild Card (1), Divisional (1), Conference Championship (1), Super Bowl (1) | 10 teams, the division winners have a bye |
| 1982 | 16 | 0 | AFC / NFC | First Round (1), Second Round (1), Conference Championship (1), Super Bowl (1) | 16 teams after the players' strike |
| 1990–2019 | 12 | 2 | AFC / NFC | Wild Card (1), Divisional (1), Conference Championship (1), Super Bowl (1) | 12 teams, the top two seeds have a bye |
| 2020 on | 14 | 1 | AFC / NFC | Wild Card (1), Divisional (1), Conference Championship (1), Super Bowl (1) | 14 teams, the top seed has a bye |

## CFL

| Years | Teams | Byes | Halves | Rounds (series length) | Note |
| --- | --- | --- | --- | --- | --- |
| 1996–2026 | 6 | 1 | West / East | Division Semi-Final (1), Division Final (1), Grey Cup (1) | division semi-finals and finals, with a crossover. A fourth-placed team with a better record than the third-placed team of the other division takes that place (the crossover). The league has announced an eight-team format from 2027. |

## FIFA World Cup

| Years | Teams | Byes | Halves | Rounds (series length) | Note |
| --- | --- | --- | --- | --- | --- |
| 1930 | 4 | 0 | none | Semi-finals (1), Final (1) | four group winners, straight to the semi-finals |
| 1934–1938 | 16 | 0 | none | Round of 16 (1), Quarter-finals (1), Semi-finals (1), Final (1) | 16 teams, straight knockout, drawn matches replayed. A drawn match was replayed (1934, 1938). There was a third-place match in 1934 and 1938. |
| 1954–1970 | 8 | 0 | none | Quarter-finals (1), Semi-finals (1), Final (1) | knockout from the quarter-finals. With a third-place match. |
| 1974–1978 | 4 | 0 | none | Final (1) | a second group stage, then the final. No semi-finals: the winners of the two second-round groups played the final, the runners-up the third-place match. |
| 1982 | 4 | 0 | none | Semi-finals (1), Final (1) | a second group stage, then semi-finals |
| 1986–2022 | 16 | 0 | none | Round of 16 (1), Quarter-finals (1), Semi-finals (1), Final (1) | 16 teams in the knockout. With a third-place match. |
| 2026 on | 32 | 0 | none | Round of 32 (1), Round of 16 (1), Quarter-finals (1), Semi-finals (1), Final (1) | 48 teams, a round of 32. With a third-place match. |
