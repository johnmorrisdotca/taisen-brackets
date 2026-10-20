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

## The bout presentation board

`boutBoard` draws the screen shown as two athletes are about to compete: a title band with the event and, at its right, the phase; a bar that says "Bout presentation" with the bout's number; the two athletes, a red band at the left and a blue one at the right, each with a code, a 4:3 flag and a name; and a bar that says "Referee and judges" over a row for each official, with the country code, the flag, the name and the role at the right.

<p align="center"><picture>
<img alt="A bout presentation board in the blue look: a title band reading Women's 57-60 kg with Preliminaries at its right; a cyan bar reading Bout presentation and Bout: 142; a red band with BRA, a Brazilian flag and TAVARES M., a dash, and a blue band with MAYER M., an American flag and USA; a cyan bar reading Referee and judges; and six rows, each with a country code, a flag, a name and the role Referee or Judge 1 to Judge 5." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/bout-board-blue.webp" width="720">
</picture><br><em>A wrestling bout (invented athletes and officials).</em></p>

```js
import { boutBoard, boutBoardSize } from "@johnmorrisdotca/taisen-brackets";

const source = {
  title: "Women's 57-60 kg",
  phase: "Preliminaries",
  bout: 142,
  red: { code: "BRA", flag: "BR", name: "TAVARES M." },
  blue: { code: "USA", flag: "US", name: "MAYER M." },
  officials: [
    { role: "referee", code: "MGL", flag: "MN", name: "KHISHIGEE Khas-Erdene" },
    { code: "POL", flag: "PL", name: "GORNY Mariusz" },
    { code: "KAZ", flag: "KZ", name: "RYSBAYEV Rakhymzhan" },
  ],
};
const svg = boutBoard(source, { width: 960 });
console.log(svg.includes("BOUT: 142"), svg.includes("JUDGE 2"), svg.includes("REFEREE AND JUDGES")); // true true true
console.log(JSON.stringify(boutBoardSize(source.officials.length, { width: 960 }))); // {"width":960,"height":269}
```

<p align="center"><picture>
<img alt="The bout presentation board in the night look, with no icon in the title band: the same two bars, the red and blue athlete bands and six official rows on a near black panel with a cyan bar." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/bout-board-night.webp" width="560">
</picture><br><em>The night look, with no icon.</em></p>

The source is `{ title, phase?, bout?, red, blue, officials? }`. An athlete is `{ name, code?, flag?, mark? }`; an official is the same with a `role`: `"referee"` (the language's word), `"judge"` (the default: numbered 1, 2, 3 in the order given, in the language's words) or any text of your own (`"Mat president"`), written as it is. `bout` is a number or a text (`142`, `"A-12"`), written "Bout: 142". `boutBoardSize(officialCount, { width })` is the size before it is drawn: the width (1280 by default) and a height of `64 + 38 + 10 + 62 + 10 + 38 + 42 × officials + 10`, in units of the width over 1280, so six officials make 1280 by 484: a standalone SVG to place over a picture, as for the results board. Looks, icons, `nameCase`, `nameStyle`, languages and custom properties are the results board's. At most 12 officials; a missing title or name, an unknown option or a width outside 720 to 4000 is a `RangeError`. `describeBoutBoard` is the description.

## The medal table

`broadcastMedalTable` is the medal table in the same manner: a title band with the heading and the date, a sub bar with the three medal discs over their columns and the word total, and a row for each country or team with its rank, a 4:3 flag, its code (or its name) and the gold, silver and bronze counts, each beside its disc, and the total. It takes the same source as [`medalTable`](./medals.md), and the rows are ranked and tied by the same rules (`sort`, `ties`, `top`, `skipEmpty`), so `tallyMedals` feeds it too.

<p align="center"><picture>
<img alt="A broadcast-style medal table in the blue look: a title band reading Medal table with Games at its right, a sub bar reading Day 16 with a gold, a silver and a bronze disc over their columns and the word Total, and ten rows, each with a rank, a flag, a three-letter country code, three counts each beside its disc, and the total in larger type." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/broadcast-medal-table-blue.webp" width="720">
</picture><br><em>The medal table after a made-up day 16 (invented numbers).</em></p>

```js
import { broadcastMedalSize, broadcastMedalTable } from "@johnmorrisdotca/taisen-brackets";

const rows = [
  { name: "United States", code: "USA", flag: "US", gold: 46, silver: 29, bronze: 29 },
  { name: "China", code: "CHN", flag: "CN", gold: 38, silver: 27, bronze: 22 },
  { name: "Great Britain", code: "GBR", flag: "GB", gold: 29, silver: 17, bronze: 19 },
];
const svg = broadcastMedalTable({ subtitle: "Day 16", date: "Games", rows }, { width: 960 });
console.log(svg.includes("104"), svg.includes("USA"), svg.includes("TOTAL")); // true true true
console.log(JSON.stringify(broadcastMedalSize(rows.length, { width: 960 }))); // {"width":960,"height":198}
```

`labels` is `code` (the default where every row has one) or `name`; `ranks: false` leaves the rank out. `broadcastMedalSize(rowCount, { width })` is the size before it is drawn: the width (1280 by default) and a height of `64 + 36 + 10 + 48 × rows + 10`, in units of the width over 1280, so ten rows make 1280 by 600. At most 24 rows (`top` cuts a longer table). A former country is a row of its own, as in the medal table, drawn as a badge with its code where there is no flag. The other options, the looks and the sizes are the results board's.

<p align="center"><picture>
<img alt="The broadcast-style medal table in the night look, with no icon in the title band: ten rows on a near black panel with a cyan sub bar and the three medal discs." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/broadcast-medal-table-night.webp" width="560">
</picture><br><em>The night look, with no icon.</em></p>

## Placing a board over something

Every board here is one standalone SVG with a size you can read before drawing it (`resultsBoardSize`, `boutBoardSize`, `broadcastMedalSize`) and nothing outside its panel, so another program can put it over a picture: read the size, place the SVG at the position you want, and scale it (it scales as a picture, `max-width: 100%; height: auto`). The kyogijo-stadiums package can do this over a surface it draws; this package only promises the size and the transparent corners.
