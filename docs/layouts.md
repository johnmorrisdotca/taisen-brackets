# Layouts

`layout` is the way the ties are drawn. The same input, the same `background`, `look`, `size`, `locale`, `href`, `flags`, seeds and codes work with every one; the tree is the default and is drawn as it always was.

| `layout` | What it draws | Best on | Needs |
| --- | --- | --- | --- |
| `tree` | The halves meeting at the final (the default). | Any | Ties |
| `rows` | Each team a row: its name on the left, its mark on the right, a slot for the result at the end that faces the centre, a seed tag at the outer corner. | NHL, NBA | Ties |
| `shields` | Marks in shield shapes with "vs" between the two of a tie; the matchups on both sides of the trophy; no lines. | World Cup, soccer | Ties |
| `update` | A compact score-update card: abbreviation, seed and series score a side; the rounds to come empty. | Playoffs mid-way | Ties (the sides of a later round may be `null`) |
| `columns` | Tall slots that grow toward the centre, the two halves in two colours, "VS" (or "AT") on a tag, big seed numbers, the final as two tall slots. | NFL, CFL | Ties; `Team.seed` for the numbers |
| `playin` | The play-in games with their winners' and losers' arrows, the seeds they earn, and the seeds that need no game as tiles. | NBA | Ties with `stage: "play-in"` and `feeds` with a `result` |
| `series` | A tall card of one line a series, the first half above and the second below. | NBA, NHL | Ties; a card (1080 by 1350) unless a `size` is asked for |
| `groups` | One card a group with its table. | World Cup, softball | Round-robin ties (`round: 0`) or teams with a `group` |

An unknown name throws a `RangeError` that lists them (`LAYOUTS` is the list), and so does `playin` over a bracket with no play-in game and `groups` over one with no group.

## The layouts of the tree: rows, shields, update, columns, series

They take the places, the lines and the names of the rounds from the tree, so a bracket that works in the tree works in all five, and the `size`, `orientation`, `shape`, `thirdPlace` and `champion` options mean what they do there. What they draw in a box is their own:

- A box that is too small for everything leaves out what does not fit, in this order: the seed tag, then the length of the names (names, then abbreviations, then none), then the score's slot. A box of marks alone, 40 wide, is two marks stacked with their scores.
- `seeds` is on by default in `rows`, `update`, `series` and `columns` (it writes nothing for a team with no seed or tag) and off in `shields`.
- In `columns` a tie's two sides are two slots with a tag between them. `at: true` writes the word `at` of the language (`AT`, `À`, `EN`, `BEI`, `@`) in place of `vs`; the second side is the one at home, or the side `Matchup.home` (`0` or `1`) names, which is then drawn second.
- The first half of the tree (the left, or the top on a tall page) is drawn in `--tb-conf-a` and the second in `--tb-conf-b` (`CONFERENCE_COLORS` has their fallbacks, each 5 to 1 or better against white letters). In `series` the east is above the west unless `groupOrder` says otherwise.
- `headers: true` puts a big title tile with each half's group name over it, in the colour of the half, in any layout that has halves with names (the tree too).

```js
import { drawBracket, CONFERENCE_COLORS } from "@johnmorrisdotca/taisen-brackets";

const teams = [
  { id: "BOS", name: "Boston", group: "East", seed: 1 }, { id: "MIA", name: "Miami", group: "East", seed: 8 },
  { id: "NYK", name: "New York", group: "East", seed: 2 }, { id: "IND", name: "Indiana", group: "East", seed: 7 },
  { id: "DEN", name: "Denver", group: "West", seed: 1 }, { id: "LAL", name: "Los Angeles", group: "West", seed: 8 },
  { id: "MIN", name: "Minnesota", group: "West", seed: 2 }, { id: "PHX", name: "Phoenix", group: "West", seed: 7 },
];
const matchups = [
  { id: "e1", sides: ["BOS", "MIA"], round: 1, bestOf: 7, score: [4, 1] }, { id: "e2", sides: ["NYK", "IND"], round: 1, bestOf: 7, score: [3, 4] },
  { id: "w1", sides: ["DEN", "LAL"], round: 1, bestOf: 7, score: [4, 0] }, { id: "w2", sides: ["MIN", "PHX"], round: 1, bestOf: 7, score: [4, 2] },
  { id: "ec", sides: ["BOS", "IND"], round: 2, bestOf: 7, score: [4, 2] }, { id: "wc", sides: ["DEN", "MIN"], round: 2, bestOf: 7, score: [3, 4] },
  { id: "f", sides: ["BOS", "MIN"], round: 3, bestOf: 7, score: [4, 1] },
];
const card = drawBracket({ teams, matchups }, { layout: "series", headers: true });
console.log(card.includes(">4–1<"), card.includes('viewBox="0 0 1080 1350"')); // true true
console.log(CONFERENCE_COLORS.length); // 2
```

## Loser edges, and the play-in

`Matchup.feeds` names the ties whose **winners** take the two sides of a tie. Each entry can now also be `{ tie, result: "winner" | "loser" }`, so that a loser can go on:

```js
import { layoutBracket } from "@johnmorrisdotca/taisen-brackets";

const layout = layoutBracket({ matchups: [
  { id: "g78", stage: "play-in", sides: ["T7", "T8"], score: [105, 104] },
  { id: "g910", stage: "play-in", sides: ["T9", "T10"], score: [131, 116] },
  { id: "decider", stage: "play-in", sides: ["T8", "T9"], score: [112, 91], feeds: [{ tie: "g78", result: "loser" }, "g910"] },
] });
console.log(JSON.stringify(layout.ties[2].from)); // [{"tie":0,"result":"loser"},{"tie":1,"result":"winner"}]
console.log(layout.playIn.length, layout.parent.join(",")); // 3 -1,-1,-1
```

- `Tie.from` is `[Source | null, Source | null]`, `Source = { tie: number, result: "winner" | "loser" }`: where each side comes from. A tie has it only when its matchup's `feeds` use a `result` or name a play-in game (or it is one), so a bracket with no such edge has no `from` anywhere and is drawn exactly as before. The `parent` the tree keeps is winners only.
- `stage: "play-in"` keeps a game out of the tree: `layout.playIn` lists them, the table calls them "Play-in" and says where a side comes from ("Loser of A v B"), and every layout but `playin` draws them in the block of ties apart, below the tree.
- A tie that feeds itself, or a circle of feeds, throws an `Error` that names the ties; so does a feed that names no matchup or whose `result` is neither word. `advanceWinners` fills a side from a loser as it does from a winner.
- `playin` draws each half (the games joined by `from`, grouped by the teams' `group`) as: tiles for the seeds that need no game (a team with a numeric `seed` that is in no play-in game), the games in columns by how many games they wait for, and the seeds earned (the tie that takes a play-in winner, its `seeds` or the team's `seed` naming the slot). A side not known yet reads "Winner 9/10" or "Loser 7/8" from the seeds of the game it waits on. Winners' arrows are solid, losers' dashed.

## The group tables

`groups` and `groupStandings` read the round-robin games (`round: 0`). A team's group is its `group`; a team with none takes the group of the teams it played, and a group no team names is lettered A, B, C. Rows are in order of points (3 for a win, 1 for a draw), then goal difference, then goals scored, then name; with `standings: "record"` wins, then fewest losses.

```js
import { groupStandings, groupsTable } from "@johnmorrisdotca/taisen-brackets";

const input = { matchups: [
  { sides: ["A", "B"], round: 0, score: [2, 2] }, { sides: ["A", "C"], round: 0, score: [1, 0] }, { sides: ["B", "C"], round: 0, score: [3, 0] },
] };
const [group] = groupStandings(input);
console.log(group.name, group.rows.map((r) => `${r.team.id} ${r.points} ${r.diff}`).join(", ")); // Group A B 4 3, A 4 1, C 0 -4
console.log(groupsTable(input, { locale: "fr" }).includes("<caption>Groupe A</caption>")); // true
```

Teams that have a `group` and no games are drawn as rows of zeros, so a draw can be shown before a ball is kicked. `qualify` marks the top rows of each group; `standings` is `"points"` or `"record"`. `groupsTable` is the same tables as HTML, for a reader the drawing does not serve.

## A lone final

A tournament whose tree is a final alone (the World Cups of 1974 and 1978 ended with a second group stage, a final and a third-place match) is drawn with the final centred, the champion over it and the third place under it, in every layout and size, not off to one side.

## One stylesheet for several drawings

A page that draws a bracket twice (a desk's size and a phone's) would carry the rules twice. Give every drawing the same `styleScope` (a class of letters, digits, `-` and `_` that carries the rules in place of the drawing's own), write the rules once, and leave them out of the others with `style: false`; the ids (clips, symbols, the background) stay apart, because the `id` prefix still comes from the input and the size. `bracketStyle(options)` returns the rules a drawing with those options writes, for a page that puts them in its own stylesheet; it needs the options that decide which rules there are (`theme`, `look`, `background`, `layout`, `headers`, and an `href` or `highlightPath`).

```js
import { bracketStyle, drawBracket } from "@johnmorrisdotca/taisen-brackets";

const ties = [{ sides: ["A", "B"], round: 1, score: [2, 1] }];
const options = { styleScope: "bracket", look: "road", background: "ice", theme: "dark" };
const css = bracketStyle(options);
const desk = drawBracket(ties, { ...options, size: "wide" });
const phone = drawBracket(ties, { ...options, size: "phone", style: false });
console.log(css.startsWith(".bracket "), desk.includes(css), phone.includes("<style>")); // true true false
```
