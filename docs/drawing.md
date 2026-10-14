# Drawing

`drawBracket(input, options?)` returns one SVG string. `input` is a list of matchups, `{ matchups, teams }`, or a layout from `layoutBracket`.

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const svg = drawBracket(
  [{ sides: ["A", "B"], score: [2, 1], date: "1" }, { sides: ["C", "D"], score: [0, 3], date: "1" }, { sides: ["A", "D"], score: [1, 2], date: "2" }],
  { title: "Four teams", subtitle: "A to D", size: "square" },
);
console.log(svg.includes("Four teams")); // true
console.log(svg.includes('viewBox="0 0 1080 1080"')); // true
```

## Options

| Option | Values | Default |
| --- | --- | --- |
| `size` | `wide` (1200 by 675), `square` (1080 by 1080), `phone` (390 wide, as tall as it needs), `{ width, height }` | `wide` |
| `orientation` | `horizontal` (rounds are columns), `vertical` (rows) | horizontal; vertical for `phone` and a tall size |
| `shape` | `auto` (halves meeting at the final when two ties feed it), `halves`, `ltr` | `auto` |
| `detail` | `full` (names, marks, scores), `compact` (abbreviations), `mark` (only marks), `auto` | `auto` |
| `theme` | `auto`, `light`, `dark`, `poster`, `none` | `auto` |
| `background` | draw a background rectangle | `true` |
| `title`, `subtitle` | text over the bracket | none (the `<title>` says "Knockout bracket") |
| `roundNames` | a list of names (first round first, or just the last ones), or a `playoffFormat` | Final, Semi-finals, Quarter-finals, Round of 16… |
| `roundLabels` | the names over the columns | `true` |
| `scores`, `seeds` | show the scores, show seeds before names | `true`, `false` |
| `markShape` | `round`, `square`, `none` | `round` |
| `champion`, `trophy` | the champion in the centre, and your trophy (inline SVG, an address, or an emblem id such as `"trophy:hockey-cup"` with `emblems`) | `true`, none |
| `emblems` | the function that draws an emblem id: `(id, { style, size, tint, theme }) => svg`, such as `renderEmblem` of `@johnmorrisdotca/dougu-sports/emblems`; with none, an emblem id draws nothing | none |
| `emblemStyle`, `emblemTint` | the emblem's style (`metal`, `line`, `color`) and the colour of its main part | `metal`, none |
| `thirdPlace` | `below`, `hide` | `below` |
| `winnerHighlight` | bold the winner and ring its mark, quiet the loser | `true` |
| `words` | replace any of the package's words (`WORDS`) | English |
| `id`, `className` | the prefix of the drawing's ids and classes, extra classes on the root | a hash of the input |

## Sizes

A size is a canvas. The boxes grow to fill it (within limits, and they stay readable) and the drawing grows past the height you give when the boxes would not fit. A bracket with few rows is centred. A tie that is not part of the tree is drawn below, with a heading.

On a phone the rounds are rows: the first round at the top and, mirrored, at the bottom, the final in the middle, the champion at the top (so that no line runs through it) and the third-place match at the foot. Eight ties in a row on 390 pixels is only possible with marks, so a box on a phone shows its abbreviation or only its marks, whichever fits.

## Detail

`auto` takes `full` when the longest team name fits beside its mark and a score, `compact` when the box is at least 76 wide, else `mark`. In `mark` the two marks sit side by side or one over the other, the winner ringed in the look's highlight and the loser quiet. With `markShape: "none"` the smallest box is `compact`.

## Marks

A team's `mark` is an image address or inline SVG. An inline mark is cleaned (`cleanSvg`) and written once as a `<symbol>`, then used wherever the team appears: a World Cup of 32 round flags carries one copy of each flag and a short `<use>` wherever a team appears. An address must be http(s), relative or `data:image/` (`safeUrl`). A team with no mark, or whose mark is refused, is its initials on its `color` (or the look's plain colour).

## Trophies and emblems

`trophy` is inline SVG (cleaned, drawn with the look's gold), an image address, or an emblem id. An emblem id is a `group:name` string such as `"trophy:hockey-cup"` or `"medal:gold/line"` (`isEmblemId`); the drawing hands it to the `emblems` function with `{ style, size, tint, theme }` and draws the SVG it returns, cleaned like an inline mark and with its `<title>` removed, in a nested `<svg class="tb-emblem">` that takes its ink from `--tb-ink`. `theme` is `light` or `dark` in those looks (`dark` for `poster`) and `inherit` otherwise. Taisen never imports an emblem package: `@johnmorrisdotca/dougu-sports` is an optional peer, and `renderEmblem` from its `/emblems` entry is the function to pass. With no `emblems`, or one that throws or returns something that is not an `<svg>`, an emblem id draws no trophy. `LEAGUE_EMBLEMS` (and `playoffFormat(league, year).emblem`) names each league's default.

## Looks and custom properties

The drawing writes a `<style>` scoped to its own class, in which every colour is `var(--tb-<name>, <the look's colour>)`:

| Property | What it colours | `light` | `dark` | `poster` |
| --- | --- | --- | --- | --- |
| `--tb-bg` | the background | `#f4efe4` | `#141614` | `#0a1130` |
| `--tb-ink` | names, scores, titles | `#1f2320` | `#ece8dc` | `#f6f1e3` |
| `--tb-muted` | round names, notes | `#62665f` | `#9aa095` | `#a9b2d3` |
| `--tb-line` | the lines between ties | `#8d9087` | `#6c7168` | `#d9b24c` |
| `--tb-box` | a tie's box | `#fbf8f1` | `#1e211d` | `#111b47` |
| `--tb-edge` | a box's edge | `#cfc7b3` | `#3b403a` | `#8e7632` |
| `--tb-win` | the final's edge, a winner's ring | `#b5452c` | `#e0705a` | `#f0c64a` |
| `--tb-gold` | the champion's ring and word | `#845f06` | `#e0b43b` | `#f0c64a` |
| `--tb-plain` | a mark's disc when it has no picture | `#d9d3c2` | `#3b403a` | `#26336b` |
| `--tb-font` | the font | system sans | system sans | system sans |

`auto` is the light look, and under `prefers-color-scheme: dark` or `<html data-theme="dark">` (unless `data-theme="light"`) the dark one. `theme: "none"` writes no `<style>`: the drawing falls back to `currentColor`, and your CSS can use the classes (`tb-box`, `tb-line`, `tb-name`, `tb-score`, `tb-won`, `tb-lost`, `tb-round`, `tb-champ`).

## Ids and determinism

There is no clock, random number or counter: the same input and options give the same string. The ids (`<title>`, clip paths, symbols) start with a prefix made from a hash of the bracket and the options, or the `id` you give, so two brackets on one page do not share ids.

## The table

`bracketTable(input, { caption, roundNames, words, className })` is the same bracket as a `<table>`, round by round, for a screen reader, a search engine or print. `describeBracket` is the one sentence the drawing's `<desc>` holds.
