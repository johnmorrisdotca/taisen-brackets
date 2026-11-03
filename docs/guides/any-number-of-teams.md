---
title: A bracket for any number of teams
section: how-to
order: 11
description: Sometimes you have a bracket before you have a result: a tournament that is about to start, or one that is filling in as the games are played.
---

Sometimes you have a bracket before you have a result: a tournament that is about to start, or one that is filling in as the games are played. This guide builds the tree for any number of teams, seeds it in the standard way, gives the top seeds their byes and carries each winner forward.

## Build the tree

`singleElimination(teams, options?)` returns the matchups of a single-elimination bracket, with ids, the rounds and `feeds` that say which tie feeds which. Six teams are a first round of two ties, because the top two seeds have byes.

```js
import { drawBracket, singleElimination } from "@johnmorrisdotca/taisen-brackets";

const teams = Array.from({ length: 6 }, (_, i) => ({ id: `T${i + 1}`, name: `Team ${i + 1}` }));
const { matchups } = singleElimination(teams, { thirdPlace: true });
console.log(matchups.length); // 6
console.log(matchups.map((m) => m.id).join(" ")); // R1-2 R2-1 R1-4 R2-2 R3-1 R3rd
console.log(drawBracket({ teams, matchups }, { seeds: true }).includes("TBD")); // true
```

A side that is not known yet is drawn "TBD". The list of teams is taken in seed order. `standardSeeds(size)` returns the order of the first round if you want to place the teams yourself.

```js
import { standardSeeds } from "@johnmorrisdotca/taisen-brackets";

console.log(standardSeeds(8).join(" ")); // 1 8 4 5 2 7 3 6
```

## Carry results forward

When a game is played, set its `score` in the matchup list and call `advanceWinners`. The sides of later ties fill in from the winners, by the tie's id, and the result is a new list: the input is never changed.

```js
import { advanceWinners, singleElimination } from "@johnmorrisdotca/taisen-brackets";

const teams = Array.from({ length: 6 }, (_, i) => ({ id: `T${i + 1}`, name: `Team ${i + 1}` }));
const { matchups } = singleElimination(teams, { thirdPlace: true });
const played = matchups.map((m) => (m.id === "R1-2" ? { ...m, score: [2, 1] } : m));
const next = advanceWinners(played);
console.log(next.find((m) => m.id === "R2-1").sides); // [ 'T1', 'T4' ]
console.log(matchups.find((m) => m.id === "R2-1").sides); // [ 'T1', null ]
```

The top seeds skip the first round. The layout knows which side of a tie had the bye (`box.bye`), and the bracket shows it.

## Name the tree yourself

If the tree is not a plain knockout (a play-in, a bracket with a fixed draw), name it with `feeds` on each tie: the ids of the ties that feed it, or `{ tie, result: "loser" }` for a loser that goes on. Only the play-in layout draws the edge of a loser.

```js
import { layoutBracket } from "@johnmorrisdotca/taisen-brackets";

const layout = layoutBracket({ matchups: [
  { id: "g78", stage: "play-in", sides: ["T7", "T8"], score: [105, 104] },
  { id: "g910", stage: "play-in", sides: ["T9", "T10"], score: [131, 116] },
  { id: "decider", stage: "play-in", sides: ["T8", "T9"], score: [112, 91], feeds: [{ tie: "g78", result: "loser" }, "g910"] },
] });
console.log(JSON.stringify(layout.ties[2].from)); // [{"tie":0,"result":"loser"},{"tie":1,"result":"winner"}]
console.log(layout.playIn.length); // 3
```

## Layout without drawing

`layoutBracket` (also in the `/layout` entry, with no drawing code in it) gives the rounds, the halves, the rows, the byes and the results as data. Use it to draw the bracket yourself in a canvas or a framework, and keep the package for the part that is hard.

```js
import { layoutBracket } from "@johnmorrisdotca/taisen-brackets/layout";

const layout = layoutBracket({
  teams: [{ id: "A", name: "Aurora", seed: 1 }, { id: "B", name: "Borealis", seed: 4 }, { id: "C", name: "Cascade", seed: 2 }, { id: "D", name: "Delta", seed: 3 }],
  matchups: [
    { id: "sf1", sides: ["A", "B"], score: [2, 0], date: "2026-05-01" },
    { id: "sf2", sides: ["C", "D"], score: [1, 2], date: "2026-05-02" },
    { id: "final", sides: ["A", "D"], score: [0, 1], date: "2026-05-09" },
  ],
});
console.log(layout.rounds, layout.champion.name, layout.shape); // 2 Delta halves
```

For the options and the fields of a tie see [layout](../layout.md); for what the drawing does with them, [layouts and looks](layouts-and-looks.md).
