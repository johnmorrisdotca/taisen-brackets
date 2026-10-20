# Broadcast boards

Boards in the manner of a results graphic on a television broadcast, for a screen or to place over a picture: a title band with an icon square, a light sub bar, and a row for each athlete with its rank, country code, a 4:3 flag, the name, a record badge (`OR`, `WR`, `NR`) and one or more columns of scores or times at the sport's own precision. Each board is **one standalone SVG** of a width you choose and a height that follows from its rows, with nothing outside the panel, so it can be put over a video frame, a photograph or a surface drawn by another package, and scaled as one picture. Nothing of any games, federation, sponsor or broadcaster is drawn: no rings, no pictograms, no emblems, no timing company's name. The icon square holds a medal or a stopwatch drawn by this package, or a mark of your own.

<p align="center"><picture>
<img alt="A results board in the blue look: a title band with a gold square holding a medal and the title Apparatus final women, a light sub bar reading Vault with the column headings Vault 1, Vault 2 and Score, and eight rows, each with a red rank box, a three-letter country code, a rectangular flag, the name and three scores to three decimals." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/results-apparatus-blue.webp" width="720">
</picture><br><em>A gymnastics apparatus final: two vaults and the average (invented athletes and scores).</em></p>

## The results board

```js
import { resultsBoard, resultsBoardSize } from "@johnmorrisdotca/taisen-brackets";

const source = {
  title: "Men's 100m butterfly",
  phase: "Results · Final",
  columns: [{ precision: 2 }],
  rows: [
    { code: "USA", flag: "US", name: "Michael Phillips", values: [50.58], record: "OR" },
    { code: "HUN", flag: "HU", name: "Laszlo Czigany", values: [50.59] },
    { code: "AUS", flag: "AU", name: "Andrew Lauterman", values: [51.12] },
  ],
};
const svg = resultsBoard(source, { width: 960 });
console.log(svg.includes("MEN'S 100M BUTTERFLY"), svg.includes("50.58"), svg.includes("OR")); // true true true
console.log(JSON.stringify(resultsBoardSize(source.rows.length, { width: 960 }))); // {"width":960,"height":212}
```

The source is `{ title, phase?, columns?, rows }`. `title` is the event, written in capitals in the band; `phase` is the sub bar's text (default the language's "Result"); `columns` are `{ label?, precision? }`, left to right (default: one column for each value of the longest row, with no heading). A row is only a `name` and whatever else you have:

| Field | What it is |
| --- | --- |
| `name` | The name as it is to be written (`A. SACRAMONE`, `Michael Phillips`), or `{ surname, given }`, written by `nameStyle` |
| `rank` | A number, or a text (`=3`, `DQ`). Left out, the place in the list; equal values share one (`ties`) |
| `code`, `flag`, `mark` | The country's three letters, a code for the `flags` function (drawn 4:3: ask Hata for `"4:3"`), or a mark of your own in place of a flag |
| `values` | One for each column: a number (written to the column's `precision` decimals, then the board's), a text (`1:08.34`, written as it is) or `null` |
| `record` | A badge or several before the values: `"OR"`, `["WR", "NR"]` |
| `note` | Written in place of the values: `DNS`, `DNF`, `DQ` |

At most 24 rows, because a board is a screen graphic: for more, draw a [ranking list](./rankings.md).

## Size, for placing it over something

`resultsBoardSize(rowCount, { width })` gives the size of a board before it is drawn: the width given (1280 by default, 720 to 4000) and a height of `64 + 36 + 20 + 54 × rows`, in units of the width over 1280, so a board of 8 rows is 1280 by 552, and 960 wide it is 960 by 414. The SVG carries the same numbers as its `width`, `height` and `viewBox`, and scales as a picture (`max-width: 100%; height: auto`), so a program that overlays it on another picture, such as a player or a surface drawn by kyogijo-stadiums, reads the size, places the SVG and scales it. Everything is inside the panel: nothing is drawn outside the rounded rectangle, and the corners are transparent.

## Looks, rank boxes, icons

- `look`: `blue` (the default: a broadcast's deep blue with a bright band), `night` (near black with a cyan band) and `paper` (white, with the blue band). A board does not follow the page's light or dark: it is a graphic, drawn in the look you choose. Every colour is a custom property with the look's value as its fallback (`--bc-title-a`, `--bc-title-b`, `--bc-row-a`, `--bc-row-b`, `--bc-rank`, `--bc-badge` and the rest, see the stylesheet in the drawing).
- `rankStyle`: `box` (the default, a red square), `medal` (gold, silver and bronze squares for the first three) or `plain` (a white numeral).
- `icon`: `medal`, `stopwatch` or `none`, or `iconMark` (inline SVG or an image address) for a mark of your own. The package draws no mark of any games: a mark of yours is yours to have the right to.
- `nameCase: "upper"` writes the names in capitals; `nameStyle` is as for a ranking list.

<p align="center"><picture>
<img alt="A results board in the paper look: a blue title band reading Men's 100m butterfly, a sub bar reading Results, Final, and eight white and pale blue rows with a red rank box, the country code, a flag, the name and a time, the winner with an orange OR record badge before the time." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/results-swimming-paper.webp" width="640">
</picture><br><em>A swimming final on the paper look, with a record badge.</em></p>

<p align="center"><picture>
<img alt="A results board in the night look: a dark title band with a cyan stopwatch square reading Men's 100m, a sub bar reading Final, wind plus 0.3 with the headings React and Time, and rows with gold, silver and bronze rank boxes for the first three, cyan boxes for the rest, a reaction time and a time, orange OR and NR badges, and a disqualified athlete at the foot." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/results-athletics-night.webp" width="640">
</picture><br><em>Athletics on the night look: two columns, medal boxes, two kinds of record badge and a disqualification.</em></p>

## Type

The text is set in a condensed sans stack of free fonts, none of them shipped with the package: `"Roboto Condensed", "Liberation Sans Narrow", "Archivo Narrow"`, then the system's sans. Set `--bc-font` to use your own (a licensed font you own is yours to load). The widths are measured with the package's own estimate for a regular sans, so a narrower font only leaves more room: a name that is too long is set smaller to a floor and then cut with an ellipsis, never squeezed, and a test holds every text of every row inside its row at every width and look.

`describeResultsBoard(source, options)` is the sentence the drawing's description carries (`Men's 100m. Result. 1, A. Runner, USA, 9.80, NR. …`). A board with no title or no rows, more than 24 rows, a row with no name, a value that is not a number, a text or `null`, a precision that is not a whole number from 0 to 6, an unknown option value or a width outside 720 to 4000 is a `RangeError` that names it.

## Not drawn yet

The bout presentation board (the two athletes, the referee and the judges) and the broadcast-style medal table are the next steps ([roadmap](./roadmap.md)).
