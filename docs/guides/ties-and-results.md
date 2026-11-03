---
title: Ties and results
section: how-to
order: 10
description: A bracket is made of ties, and a tie is whatever it took to decide who goes on: one game, a best-of-seven series, two legs added up, or a game replayed.
---

A bracket is made of ties, and a tie is whatever it took to decide who goes on: one game, a best-of-seven series, two legs added up, or a game replayed. This guide shows how each is written, how the winner is worked out and how to say so yourself when the rules are not in the data. The full table is in [layout](../layout.md).

## How a tie is read

| You give | It is | Winner |
| --- | --- | --- |
| `score: [a, b]` | a game | the higher score, else the shoot-out `pens`, else nobody yet |
| `bestOf: 7, score: [4, 2]` | a series | the side with most of the `bestOf` games |
| `bestOf: 7, games: [...]` | a series, counted from its games | the same |
| `kind: "aggregate", legs: [...]` | two legs | the higher total, else the last leg's `pens` |
| `games: [{...}, { replay: true, ... }]` | a replayed game | the replay |
| `winner: "A"` on any of these | as above | the side you name |

A score is in the order of `sides`. A tie nobody has won is drawn without a winner, and the next round shows "TBD" in its place.

## Two legs, a replay, a shoot-out

```js
import { layoutBracket } from "@johnmorrisdotca/taisen-brackets";

const layout = layoutBracket([
  { id: "a", sides: ["Aurora", "Harbour"], kind: "aggregate", legs: [{ score: [2, 0] }, { score: [0, 1] }] },
  { id: "b", sides: ["Cascade", "Delta"], games: [{ score: [1, 1] }, { score: [2, 0], replay: true }] },
  { id: "c", sides: ["Aurora", "Cascade"], score: [1, 1], extraTime: true, pens: [3, 5] },
]);

for (const tie of layout.ties) console.log(tie.result.kind, tie.result.score.join("-"), tie.sides[tie.winner].name);
// aggregate 2-1 Aurora
// replay 2-0 Cascade
// game 1-1 Cascade
```

A drawn game that was replayed is one tie, decided by the replay, as the World Cups of 1934 and 1938 were. Level on aggregate, a shoot-out settles it. For anything else (away goals, a coin toss) name the `winner` yourself and add a `note`, which the box shows.

## A series

```js
import { drawBracket, playoffFormat } from "@johnmorrisdotca/taisen-brackets";

const svg = drawBracket({
  teams: [
    { id: "FLA", name: "Florida Panthers", abbr: "FLA", group: "Eastern" }, { id: "BOS", name: "Boston Bruins", abbr: "BOS", group: "Eastern" },
    { id: "EDM", name: "Edmonton Oilers", abbr: "EDM", group: "Western" }, { id: "DAL", name: "Dallas Stars", abbr: "DAL", group: "Western" },
  ],
  matchups: [
    { sides: ["FLA", "BOS"], bestOf: 7, score: [4, 2], date: "2024-05-06" },
    { sides: ["DAL", "EDM"], bestOf: 7, score: [2, 4], date: "2024-05-23" },
    { sides: ["FLA", "EDM"], bestOf: 7, score: [4, 3], date: "2024-06-08" },
  ],
}, { roundNames: playoffFormat("nhl", 2024), title: "Stanley Cup playoffs 2024" });
console.log(svg.includes("Eastern"), svg.includes("Stanley Cup Final")); // true true
```

A series with no `bestOf` and no `winner` is not decided, whatever the games won say: the package does not guess the length of a series. When the teams carry a `group` that splits them cleanly, the two halves of the bracket are named for it.

## From a flat list of games

Most data sources give a flat list of games, one row each, with a stage. `matchupsFromGames` groups them into ties by stage and pair: several games of one pair in a stage are a replay, unless the stage is two-legged (`aggregate`) or a series (`series`).

```js
import { drawBracket, matchupsFromGames } from "@johnmorrisdotca/taisen-brackets";

const matchups = matchupsFromGames(
  [
    { stage: "semi", home: "ARG", away: "CRO", homeScore: 3, awayScore: 0, date: "2022-12-13" },
    { stage: "semi", home: "FRA", away: "MAR", homeScore: 2, awayScore: 0, date: "2022-12-14" },
    { stage: "third", home: "CRO", away: "MAR", homeScore: 2, awayScore: 1, date: "2022-12-17" },
    { stage: "final", home: "ARG", away: "FRA", homeScore: 3, awayScore: 3, extraTime: true, homePens: 4, awayPens: 2, date: "2022-12-18" },
  ],
  { stages: ["semi", "final"], third: "third" },
);
console.log(matchups.length, drawBracket(matchups).startsWith("<svg")); // 4 true
```

The third-place match is placed apart from the tree, and a tie that leads nowhere is drawn below it.

## Reading a tie yourself

The ties of `layoutBracket` carry their result as data (`kind`, `score`, `winner`), and `describeTie(tie, voice)` gives it as a sentence (the tooltip of the box), so a page can show the result of a tie it did not draw. `resolveMatchup` is the function underneath.

```js
import { describeTie, layoutBracket, voiceOf } from "@johnmorrisdotca/taisen-brackets";

const final = layoutBracket([{ sides: ["Argentina", "France"], score: [3, 3], extraTime: true, pens: [4, 2] }]).ties[0];
console.log(final.result.kind, final.result.score.join("-"), final.sides[final.winner].name); // game 3-3 Argentina
console.log(describeTie(final, voiceOf("en"))); // Argentina 3, France 3 (after extra time, 4–2 on penalties). Winner: Argentina
```

## Round-robin games

A game with `round: 0` is a group-stage game. The `groups` layout draws the tables, `groupStandings` returns them as data and `groupsTable` as HTML; see [layouts and looks](layouts-and-looks.md#nine-layouts).
