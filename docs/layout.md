# Layout

`layoutBracket(input, options?)` turns a list of ties into the shape of a knockout. It has no drawing in it and no DOM, so it can run anywhere, and `drawBracket` and `bracketTable` both start from it.

## The input

A bracket is `{ matchups, teams? }`, or just the list of matchups.

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
console.log(layout.ties.map((tie) => `${tie.id}:${tie.round}`).join(" ")); // sf1:1 sf2:1 final:2
console.log(layout.champion.name); // Delta
```

A **team** is `{ id, name }` and, if you like, `abbr`, `seed`, `mark`, `group` and `color`. A **matchup** has two `sides` (ids, whole teams, or `null` for a side not known yet) and everything else is optional: the result, a `date`, an `id`, a `round`, a `no`, `feeds`, `third`, `note`.

## How a tie is read

| You give | It is | Score drawn | Winner |
| --- | --- | --- | --- |
| `score: [a, b]` | a game | goals | the higher score, else the shoot-out `pens`, else none |
| `bestOf: 7, score: [4, 2]` | a series | games won | the side with most of the `bestOf` games, else none |
| `bestOf: 7, games: [...]` | a series | games won, counted | the same |
| `kind: "aggregate", legs: [...]` | two legs | the totals | the higher total, else the last leg's `pens`, else none |
| `games: [{...}, { replay: true, ... }]` | a replayed game | the replay's score | the last game |
| `winner: "A"` on any | as above | as above | the one named, whatever the games say |

A score is in the order of `sides`. A tie nobody has won is drawn without a winner.

## Which tie feeds which

A winner goes on to the next tie its team plays. Rounds are `round` where given; else a tie is one round after the latest earlier tie that feeds it (earlier by `date`, then by position). Where the layout cannot tell (a bracket with no results yet, or byes that put two teams in a round without a feeder) name the tree: `feeds: [idOfTheTieForSide0, idOfTheTieForSide1]`, or `round`. The ties of a round that feed one tie are ordered by `no`, then `date`, then the team's id; with `feeds` the order is yours.

## What comes out

```js
import { layoutBracket } from "@johnmorrisdotca/taisen-brackets/layout";

const layout = layoutBracket([
  { sides: ["A", "B"], winner: "A", date: "1" }, { sides: ["C", "D"], winner: "C", date: "1" },
  { sides: ["E", "F"], winner: "E", date: "1" }, { sides: ["G", "H"], winner: "H", date: "1" },
  { sides: ["A", "C"], winner: "A", date: "2" }, { sides: ["E", "H"], winner: "E", date: "2" },
  { sides: ["A", "E"], winner: "E", date: "3" },
]);
console.log(layout.shape, layout.rounds, layout.rows); // halves 3 2
console.log(layout.columns.join(",")); // 1,2
console.log(layout.sides.map((side) => side.boxes.length).join(",")); // 3,3
console.log(layout.final.y); // 0.5
```

- `shape`: `halves` (two halves meeting at the final), `ltr` (one tree) or `forest` (several trees, no single final).
- `sides`: for `halves`, the left and the right (the top and the bottom on a phone). Each has `boxes`, one for each tie: its `round`, its row `y` (fractional where a tie sits halfway between two), the row `to` of the tie it feeds, whether it is `fed`, which side is on `order` top, and which side had a `bye`.
- `final`: where the halves meet. `finalIndex` is the final tie in any shape.
- `columns` and `rounds`; `rows`; `parent` (the tie each tie feeds, by index); `place` (`l`, `r`, `f` or `o` for each tie); `champion`; `teams`.
- `third`: the third-place match, when a matchup has `third: true`. It is not part of the tree; nor is a round-robin game (`round: 0`, kept in `robin`) or a tie that leads nowhere (`other`).

## Halves and groups

The halves are named when the teams' `group` splits them cleanly: at most one team of a half from another group and fewer than half. The group that sorts first goes on the left: a name with "west" before one with "east", else by name, or the order you give as `groupOrder`. With no groups, or a mixed half, the halves are plain.

## Shapes

`shape: "ltr"` lays out one tree left to right whatever the number of feeders, and is the shape a bracket has when the last round holds more than one tie (a forest).

## Bye

A tie in a later round with only one tie feeding it has a bye on the other side: `box.bye` is that side's index. `singleElimination` makes them for any number of teams: the top seeds skip the first round.

## Errors

A duplicate `id`, a `winner` that is not one of the sides, a team against itself, a `feeds` that names nothing, and a tie that feeds two ties each throw an error that says which matchup.
