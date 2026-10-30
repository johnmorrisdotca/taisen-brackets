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
| `picture` | The postseason picture: two halves mirrored toward the final, each club a logo tile with its seed, the result beside each pair, each round's name and series length under its column, the champion big in the middle. | MLB, NHL, NBA, NFL, CFL, MLS | Ties; `Team.seed` (or `tag`) for the badges; `bestOf` for the lengths |

An unknown name throws a `RangeError` that lists them (`LAYOUTS` is the list), and so does `playin` over a bracket with no play-in game and `groups` over one with no group.

## The layouts of the tree: rows, shields, update, columns, series, picture

They take the places, the lines and the names of the rounds from the tree, so a bracket that works in the tree works in all six, and the `size`, `orientation`, `shape`, `thirdPlace` and `champion` options mean what they do there. What they draw in a box is their own:

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

## Each layout, with a picture and an example

### rows

Each team a row, its name on the left and its mark on the right, its seed tag at the outer corner, and a slot for the result at the end that faces the centre (empty until the tie is played): the NHL poster's style.

<p align="center"><img alt="The 2024 NHL playoffs as rows: each team's abbreviation and seed tag, its logo tile and a slot with the games won, on an ice background." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/layout-rows-nhl.webp" width="640"></p>

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const ties = [
  { id: "a", sides: ["BOS", "MIA"], round: 1, bestOf: 7, score: [4, 1] },
  { id: "b", sides: ["NYK", "IND"], round: 1, bestOf: 7, score: [4, 3] },
  { id: "c", sides: ["BOS", "NYK"], round: 2, bestOf: 7, score: [2, 1] },
];
const svg = drawBracket(ties, { layout: "rows", look: "road", seeds: true });
console.log(svg.includes("tb-slot")); // true
```

### shields

Marks in shield shapes with "vs" between the two of a tie, the matchups listed down both sides of the trophy; no connector lines.

<p align="center"><img alt="The 2022 World Cup as shields: each tie two round flags in shields with vs between them and the score under each, the final under the trophy." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/layout-shields-wc2022.webp" width="640"></p>

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const svg = drawBracket([{ sides: ["ARG", "FRA"], score: [3, 3], pens: [4, 2] }], { layout: "shields" });
console.log(svg.includes("tb-shield"), svg.includes(">vs<")); // true true
```

### update

A compact score-update card: each side's abbreviation, seed and series score, and empty cards for the rounds still to come, the final in the centre. Put the "as of" date in `subtitle`.

<p align="center"><img alt="A score-update card of the 2024 NHL playoffs: abbreviations with seeds and the games won in a cell on the right, on an aurora background." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/layout-update-nhl.webp" width="640"></p>

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const teams = [{ id: "A", name: "Alpha", abbr: "ALP", seed: 1 }, { id: "B", name: "Beta", abbr: "BET", seed: 8 }];
const svg = drawBracket({ teams, matchups: [{ sides: ["A", "B"], round: 1, bestOf: 7, score: [4, 2] }] }, { layout: "update", subtitle: "as of May 1" });
console.log(svg.includes(">ALP<"), svg.includes(">as of May 1<")); // true true
```

### columns

The NFL poster's style: each round a column of tall slots that get taller toward the centre, one conference in each of two colours, a "VS" tag between the two slots of a tie, a big seed number beside a team that has a `seed`, and the final as two tall slots side by side. `at: true` writes the language's "AT" in place of "VS", the second side being the one at home (or the side `Matchup.home` names). `headers: true` adds the conference tiles.

<p align="center"><img alt="The 2024 NFL playoffs as columns: tall slots growing toward the centre, the AFC in blue and the NFC in red, VS tags between the slots, the Super Bowl as two tall slots, with a title tile over each half." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/layout-columns-nfl.webp" width="640"></p>

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const ties = [{ sides: ["KC", "BUF"], round: 1, score: [27, 24], home: 0 }, { sides: ["PHI", "WAS"], round: 1, score: [28, 23] }];
const svg = drawBracket(ties, { layout: "columns", at: true });
console.log(svg.includes(">AT<"), svg.includes(">VS<")); // true false
```

### playin

The NBA's play-in: the games of each half (a `stage: "play-in"` tie), with a **winner's arrow solid and a loser's dashed**, into the game that takes it ("Winner 9/10", "Loser 7/8") or the seed it earns, and the seeds that need no game as tiles. A tie says where a side comes from with `feeds`, whose entries can now be `{ tie, result: "winner" | "loser" }`; `Tie.from` has it back.

<p align="center"><img alt="The 2024 NBA play-in: for each conference the 7 v 8 and 9 v 10 games, a dashed arrow for the 7 v 8 loser into the decider with the 9 v 10 winner, and a solid arrow into the 7th and 8th seed slots, beside tiles for seeds 1 to 6." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/layout-playin-nba.webp" width="640"></p>

```js
import { drawBracket, layoutBracket } from "@johnmorrisdotca/taisen-brackets";

const matchups = [
  { id: "p78", stage: "play-in", sides: ["T7", "T8"], score: [105, 104], seeds: [7, 8] },
  { id: "p910", stage: "play-in", sides: ["T9", "T10"], score: [131, 116], seeds: [9, 10] },
  { id: "dec", stage: "play-in", sides: ["T8", "T9"], score: [112, 91], feeds: [{ tie: "p78", result: "loser" }, { tie: "p910", result: "winner" }] },
];
console.log(JSON.stringify(layoutBracket({ matchups }).ties[2].from)); // [{"tie":0,"result":"loser"},{"tie":1,"result":"winner"}]
console.log(drawBracket({ matchups }, { layout: "playin" }).includes("tb-arrow-loser")); // true
```

### series

A tall card of one line a series, "BOS 4–0 MIA", the winner bold, the seeds at the line's ends, the east on top and the west below with the final in the middle. It is a card (1080 by 1350) unless a `size` is asked for.

<p align="center"><img alt="The 2024 NBA playoffs as a series card: the Eastern Conference on top, one line a series such as BOS 4-1 MIA, the final in the middle and the Western Conference below, on a carbon background." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/layout-series-nba.webp" width="360"></p>

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const svg = drawBracket([{ sides: ["BOS", "MIA"], round: 1, bestOf: 7, score: [4, 0] }], { layout: "series" });
console.log(svg.includes('viewBox="0 0 1080 1350"'), svg.includes(">4–0<")); // true true
```

### groups

The group stage as one card a group: a title tile ("Group A"), a row a team with its flag or mark, its name and its record, the places that go through marked. The standings are worked out from the round-robin games (`round: 0`); `standings: "record"` is wins and losses (softball's), and `"points"` (the default) played, won, drawn, lost, goal difference and points. `qualify: 2` marks the top two of each group.

<p align="center"><img alt="The group stage of a made-up cup: four cards, each with a title tile and four teams with their marks and played, won, drawn, lost, goal difference and points, the top two of each marked." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/layout-groups-cup.webp" width="640"></p>

<p align="center"><img alt="Softball pool play on a phone: three cards of four teams with their wins and losses, the top two of each marked, on a royal background." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/layout-groups-softball.webp" width="260"></p>

```js
import { drawBracket, groupStandings } from "@johnmorrisdotca/taisen-brackets";

const games = [
  { sides: ["A", "B"], round: 0, score: [2, 0] }, { sides: ["A", "C"], round: 0, score: [1, 1] }, { sides: ["B", "C"], round: 0, score: [0, 3] },
];
console.log(groupStandings({ matchups: games })[0].rows.map((r) => `${r.team.id} ${r.points}`).join(", ")); // C 4, A 4, B 0
console.log(drawBracket({ matchups: games }, { layout: "groups", qualify: 2 }).includes("Group A")); // true
```

### picture

The postseason picture: the two halves mirrored toward the final in the middle (a league's two conferences, named over each half), each club a logo tile with its seed on the tile's corner, the result of each series beside its pair ("CLE wins 3–2"; a single game says "BUF wins 27–21", a shoot-out follows the score in small type), the name of each round under its column with the length of its series under that ("Best of 5"), and the champion big in the middle over the final. It is drawn from the same planner as the tree, so the rounds, the halves and the byes are the tree's: a side that skipped the earlier rounds says `bye` beside its tile, and the line from each earlier series leads to the tile its winner takes the place of.

<p align="center"><img alt="The 2025 MLB postseason as a picture: the American League on the left and the National League on the right, each club a tile with its seed, the result beside each pair, the rounds named under their columns with the length of the series, the Dodgers big in the middle over the World Series." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/layout-picture-mlb.webp" width="640"></p>

- **Logos are yours.** A tile holds the club's `Team.mark` (inline SVG or an image address), its `flag`, or, for a club with none (or with `markShape: "none"`), its three letters on its `color`. The package ships no league marks and no sponsor marks. `markShape` is `"square"` here by default (a logo is not cut to a circle); pass `"round"` for flags.
- **Seeds** come from `Matchup.seeds`, else `Team.tag`, else `Team.seed`, as in the other layouts; `seeds: false` leaves the badges out, and a tile too small for one leaves it out. `headers` is on by default (the half's group name on a tile in its colour); `headers: false` leaves them out.
- **The length of a series** comes from each matchup's `bestOf` (the longest in the round): 3, 5 and 7 for baseball, 1 for a round of single games. A round whose ties give none says nothing under its name. `roundLabels: false` leaves the names out.
- **What a box says depends on its room**: "CLE wins" over "3–2", then the same smaller, then the score alone, then the tiles alone; the tiles never overlap the text. Sizes: 4, 6, 8 or more clubs a side, byes, a lone final, and the four sizes. On a tall page (`phone`, `card`) a pair is two tiles side by side with the result under them, and the half at the bottom faces the final.
- **Light and dark** follow the page, as in every look; `styleScope` and `bracketStyle` write the rules once for a desk's drawing and a phone's.
- The words are the language's: `pictureWins` (`{team} wins {score}`) and `bestOf`, in the five languages.

```js
import { drawBracket, playoffFormat } from "@johnmorrisdotca/taisen-brackets";

const teams = [
  { id: "TOR", name: "Toronto", abbr: "TOR", color: "#134a8e", group: "American League", seed: 1 },
  { id: "SEA", name: "Seattle", abbr: "SEA", color: "#005c5c", group: "American League", seed: 2 },
  { id: "DET", name: "Detroit", abbr: "DET", color: "#0c2340", group: "American League", seed: 6 },
  { id: "NYY", name: "New York", abbr: "NYY", color: "#0c2340", group: "American League", seed: 4 },
  { id: "MIL", name: "Milwaukee", abbr: "MIL", color: "#12284b", group: "National League", seed: 1 },
  { id: "PHI", name: "Philadelphia", abbr: "PHI", color: "#e81828", group: "National League", seed: 2 },
  { id: "LAD", name: "Los Angeles", abbr: "LAD", color: "#005a9c", group: "National League", seed: 3 },
  { id: "CHC", name: "Chicago", abbr: "CHC", color: "#0e3386", group: "National League", seed: 4 },
];
const series = [
  { id: "a", round: 1, bestOf: 5, sides: ["TOR", "NYY"], score: [3, 1] },
  { id: "b", round: 1, bestOf: 5, sides: ["SEA", "DET"], score: [3, 2] },
  { id: "c", round: 1, bestOf: 5, sides: ["MIL", "CHC"], score: [3, 2] },
  { id: "d", round: 1, bestOf: 5, sides: ["PHI", "LAD"], score: [1, 3] },
  { id: "e", round: 2, bestOf: 7, sides: ["TOR", "SEA"], score: [4, 3] },
  { id: "f", round: 2, bestOf: 7, sides: ["MIL", "LAD"], score: [0, 4] },
  { id: "g", round: 3, bestOf: 7, sides: ["TOR", "LAD"], score: [3, 4] },
];
const svg = drawBracket({ teams, matchups: series }, { layout: "picture", roundNames: playoffFormat("mlb", 2025)?.rounds.slice(1).map((r) => r.name) });
console.log(svg.includes("tb-ptile"), svg.includes(">Best of 5<"), svg.includes(">Best of 7<")); // true true true
console.log(svg.includes(">LAD wins<"), svg.includes(">4–3<")); // true true
```

On a phone the same drawing is the tall one:

<p align="center"><img alt="The 2025 MLB postseason on a phone: the champion at the top, then the rounds as rows with the first half's pairs as two tiles side by side and the result under them, the final in the middle with its two finalists at either end." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/layout-picture-phone.webp" width="240"></p>

<p align="center"><img alt="The 2024 NHL playoffs as a picture in the dark: the Western and Eastern Conferences with a tile for each club, its seed tag on the corner, Best of 7 under every round and the Panthers big in the middle." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/layout-picture-nhl-dark.webp" width="640"></p>

### Conference headers, a lone final, one stylesheet

`headers: true` puts a big title tile over each half (West and East, AFC and NFC) in the colour of that half, in any layout. A tournament that ended with a lone final and a third-place match (the World Cups of 1974 and 1978) is drawn with them centred, the champion over the final. And two sizes of the same bracket on one page can share one stylesheet: `styleScope` names the class that carries the rules, `style: false` leaves the `<style>` out of the second drawing, and `bracketStyle(options)` is the stylesheet for a page that writes it once itself.

<p align="center"><img alt="A lone final and a third-place match, centred: the champion above the final, the third place under it, on a pitch background." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/layout-lone-final.webp" width="560"></p>

```js
import { bracketStyle, drawBracket } from "@johnmorrisdotca/taisen-brackets";

const ties = [{ sides: ["A", "B"], round: 1, score: [2, 1] }];
const desk = drawBracket(ties, { styleScope: "mine", size: "wide" });
const phone = drawBracket(ties, { styleScope: "mine", size: "phone", style: false });
console.log(desk.includes("<style>"), phone.includes("<style>"), desk.includes(bracketStyle({ styleScope: "mine" }))); // true false true
```
