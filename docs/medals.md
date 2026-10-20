# Medal table

`medalTable` draws a medal table for any sport and event: an Olympic Games, a world championship, a club tournament. The rows are ranked gold first (as the Olympic table is) or by the total of medals, equal rows share a rank (`5, 5, 7`), and each country or team has its flag or, where there is none, a badge. `tallyMedals` adds up a list of medals, filtered to one sport, one weight class or one Games, so the same list gives the table of an event, of a sport and of all time. The package ships no results: the medals are yours.

<p align="center"><picture>
<img alt="A medal table on a TV, in the dark: the title Medal table and a pill reading Judo and wrestling, all Games; fifteen countries in two columns, each row with its rank, a round flag or a badge with the country's code, the name, a gold, a silver and a bronze count in tinted cells and the total; the first three ranks have a gold, silver or bronze bar, and the former countries (Soviet Union, West Germany, Czechoslovakia, Yugoslavia, Unified Team) are badges with the years they existed under the name." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/medal-table-tv-dark.webp" width="720">
</picture><br><em>All the Games of a made-up judo and wrestling history, in two columns (invented results).</em></p>

## A table

```js
import { medalTable } from "@johnmorrisdotca/taisen-brackets";

const svg = medalTable({
  subtitle: "Men's judo +100 kg",
  rows: [
    { name: "France", flag: "FR", gold: 6, silver: 1, bronze: 3 },
    { name: "Japan", flag: "JP", gold: 5, silver: 3, bronze: 2 },
    { name: "Soviet Union", code: "URS", note: "1922–1991", gold: 1, bronze: 4 },
  ],
}, { size: "portrait" });
console.log(svg.includes("Soviet Union"), svg.includes("1922–1991"), svg.includes("URS")); // true true true
```

The source is `{ title?, subtitle?, date?, source?, rows }`: the heading (default the language's "Medal table"), the sport or event as a pill under it, the date or edition at the right, and where the numbers come from at the foot. A row is `{ name, flag?, mark?, code?, gold?, silver?, bronze?, note? }`, the counts whole numbers from 0 and left out for 0. `flag` is a code for the `flags` function (as for every board), `mark` your own picture; a row with neither is a badge with its `code` (or its initials). `note` is a small line under the name: the years a former country existed, or what a team is.

## Ranking

`sort: "gold"` (the default) ranks by gold, then silver, then bronze, which is how the Olympic Games rank countries; `sort: "total"` by the total of medals, then gold, then silver; `sort: "given"` keeps the order given and ranks it by the gold rule. Rows with the same counts share a rank and the next rank skips (`1, 2, 3, 3, 5`); `ties: false` numbers every row. `rankStyle: "hash"` writes `#5`. `medalRanks(rows, options)` gives the ranks as data. The first three ranks have a bar in gold, silver and bronze (`highlight: false` leaves it out). Which tie-break a competition uses is its own rule: if it ranks by total, say `sort: "total"`; if it uses another, sort the rows yourself and pass `sort: "given"`.

```js
import { medalRanks } from "@johnmorrisdotca/taisen-brackets";

const rows = [{ name: "A", gold: 1 }, { name: "B", gold: 1 }, { name: "C", silver: 3 }, { name: "D", silver: 1 }];
console.log(medalRanks(rows).join(" ")); // 1 1 3 4
console.log(medalRanks(rows, { sort: "total" }).join(" ")); // 1 2 2 4
```

## One list, many tables

```js
import { medalTable, tallyMedals } from "@johnmorrisdotca/taisen-brackets";

const awards = [
  { name: "France", flag: "FR", medal: "gold", sport: "judo", category: "+100 kg", games: 2024 },
  { name: "Japan", flag: "JP", medal: "silver", sport: "judo", category: "+100 kg", games: 2024 },
  { name: "France", medal: "bronze", sport: "judo", category: "-66 kg", games: 2020 },
  { name: "Japan", medal: "gold", sport: "wrestling", category: "-65 kg", games: 2020 },
];
const judo = tallyMedals(awards, { sport: "judo" });
console.log(judo.map((r) => `${r.name} ${r.gold}-${r.silver}-${r.bronze}`).join(", ")); // France 1-0-1, Japan 0-1-0
const all = tallyMedals(awards, { games: [2020, 2024] });
console.log(all.length, medalTable({ rows: judo }).includes("France")); // 2 true
```

`tallyMedals(awards, filter?)` adds up the medals of a list by name, keeping the first `flag`, `mark`, `code` and `note` given for a name. The filter keeps the medals equal to every field it gives: `sport`, `category` (a weight class or an age group) and `games` (a Games, an edition or a year), each a value or a list of values; a field left out is not filtered. A medal is `{ name, medal: "gold" | "silver" | "bronze", sport?, category?, games?, flag?, mark?, code?, note? }`: the competitions with two bronze medals give two medals. The demo's filter buttons are exactly this call.

## Former countries

A former country is a row like any other, with its own name and years: the table of all time has a Soviet Union row, a West Germany row and a Unified Team row, not one that adds them to Russia or Germany. Hata has no flag for a country that no longer exists (a ticket is filed), so give such a row a `code` and it is a badge with the code (`URS`, `FRG`, `TCH`, `YUG`), or a `mark` of your own. Nothing here draws an Olympic or a federation's emblem: the Unified Team is a badge with `EUN`.

## Size, look, columns and rows

`size` is `tv`, `tablet`, `tablet-tall`, `phone`, `square` (1080) or `portrait` (4:5, 1080 by 1350), or `{ width, height }`; `theme` is `auto`, `light` or `dark`; `locale` one of the five languages (the letters over the medal columns are the language's: G, S, B; O, A, B in French; the kanji in Japanese). `columns: 2` puts the table in two columns, the first running down first, and a wide board with more than ten rows does so by itself. `top` keeps the first N rows after sorting, `skipEmpty` drops the rows with no medal, and `rows` and `page` page a long table, with the header saying which rows are shown (`1–10 of 37`). Where there is no room for every row at a readable size, as many are drawn as fit and the header says so. The `--rk-*` custom properties restyle it, and the text is measured, never stretched: a name that is too long is set smaller and then cut with an ellipsis.

<p align="center"><picture>
<img alt="A medal table on a 4:5 card, in the light: the title Medal table and a pill reading Judo, plus 100 kilograms, all Games; ten rows with rank, flag or badge, name, gold, silver and bronze counts in tinted cells and the total; France first." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/medal-table-portrait-light.webp" width="420">
</picture><br><em>One event on a 4:5 card (invented results).</em></p>

`describeMedalTable` is the sentence the drawing's description carries (`1, France, 6 gold, 1 silver, 3 bronze, 10 total`). A row with no name, a count that is not a whole number from 0, an unknown option value or a bad size or theme is a `RangeError` that names it; so is a medal that is not gold, silver or bronze in `tallyMedals`.
