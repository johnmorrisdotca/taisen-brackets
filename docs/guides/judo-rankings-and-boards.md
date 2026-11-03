---
title: Judo, rankings, medals and broadcast boards
section: how-to
order: 18
description: The package began with knockout brackets, and the same drawing kit now makes the other graphics around a tournament: a judo bracket with its repechage, a scoreboard for one contest, a rankin
---

The package began with knockout brackets, and the same drawing kit now makes the other graphics around a tournament: a judo bracket with its repechage, a scoreboard for one contest, a ranking list, a medal table and a television-style results board. They share the sizes, the five languages, the flags plug-in and the rule that a drawing is one standalone SVG. This guide gives each a short working example; the pages linked from each heading have every option.

## A judo contest and its bracket

A judo contest is a tie with a `judo` result: ippon, waza-ari, yuko and shido as the IJF's current rules score them, golden score and the contest time. `judoOutcome` checks it against the rules and says who won and how; the box writes the marks, the shido as cards and a note under the two rows. `judoBracket` makes a weight category's bracket with the repechage and two bronze medal contests. [Judo](../judo.md).

```js
import { drawBracket, judoOutcome } from "@johnmorrisdotca/taisen-brackets";

const o = judoOutcome({ sides: [{ yuko: 2 }, { wazaAri: 1, shido: 1 }], time: "4:00" });
console.log(o.winner, o.method, o.points.join(" ")); // 1 score 2 10

const svg = drawBracket([
  { id: "a", round: 1, sides: ["Haru", "Marc"], judo: { sides: [{ ippon: true }, { shido: 1 }], time: "1:12" } },
  { id: "b", round: 1, sides: ["Levan", "Owen"], judo: { sides: [{ wazaAri: 1 }, { yuko: 1 }], goldenScore: true, time: "5:40" } },
  { id: "f", round: 2, sides: ["Haru", "Levan"], judo: { sides: [{ wazaAri: 1, yuko: 1 }, { wazaAri: 1 }], goldenScore: true, time: "7:02" } },
], { title: "Men -66 kg" });
console.log(svg.includes("tb-sh-y"), svg.includes("GS · 7:02")); // true true
```

`judoScoreboard` draws one contest for a given state, as a board or as table-top flip cards, in three sizes; live updating is yours. `judoContestCard` and `judoMatQueue` are the screens for the hall: the category and round, and, for each mat, a big number and colour with the contests to come in order.

## A ranking list

`rankingList` draws a ranking for any ranked sport from your own data, text first with no photo slot to leave empty: the rank, a flag (a country's or a Canadian province's, `CA-BC`), the name, the club and the points, with the movement since the last list. `rankingRanks` gives the ranks as data, equal points sharing a rank. [Rankings](../rankings.md).

```js
import { rankingCategoryLabel, rankingList, rankingRanks } from "@johnmorrisdotca/taisen-brackets";

const svg = rankingList({
  category: rankingCategoryLabel({ age: "U18", sex: "men", weight: "-60" }),
  date: "October 2026",
  entries: [
    { name: { surname: "Nakamura", given: "Kenji" }, club: "Coastal Pine Judo", flag: "CA-BC", points: 412.5, change: 1 },
    { name: { surname: "Brar", given: "Harpreet" }, club: "Salmonberry Judo Club", flag: "CA-BC", points: 398, change: -1 },
  ],
}, { precision: 2, size: "portrait" });
console.log(svg.includes("U18 · Men -60 kg"), svg.includes("412.50")); // true true
console.log(rankingRanks([{ name: "A", points: 9 }, { name: "B", points: 9 }, { name: "C", points: 7 }]).join(" ")); // 1 1 3
```

A long list is paged (`rows`, `page`), and `rankingNumberOnes`, `rankingEntryList` and `rankingMatchup` draw the number one of each category, an event's entry list and a head-to-head card.

## A medal table

`medalTable` ranks countries or teams gold first, or by the total; equal rows share a rank (5, 5, 7), a former country is a row of its own, and `tallyMedals` adds up a list of awards filtered by sport, weight class or Games. [Medal table](../medals.md).

```js
import { medalRanks, medalTable, tallyMedals } from "@johnmorrisdotca/taisen-brackets";

const svg = medalTable({ subtitle: "Men's judo +100 kg", rows: [
  { name: "France", flag: "FR", gold: 6, silver: 1, bronze: 3 },
  { name: "Soviet Union", code: "URS", note: "1922–1991", gold: 1, bronze: 4 },
] }, { size: "portrait" });
console.log(svg.includes("Soviet Union"), svg.includes("URS")); // true true

const rows = [{ name: "A", gold: 1 }, { name: "B", gold: 1 }, { name: "C", silver: 3 }, { name: "D", silver: 1 }];
console.log(medalRanks(rows).join(" "), "|", medalRanks(rows, { sort: "total" }).join(" ")); // 1 1 3 4 | 1 2 2 4
console.log(typeof tallyMedals);
```

## Broadcast boards

`resultsBoard` draws a results graphic: a title band, a rank in a box, the country code, a 4:3 flag, the name, a record badge (`OR`, `WR`, `NR`) and columns of scores or times at the sport's own precision. `boutBoard` draws the bout presentation, and `broadcastMedalTable` the medal table, each as a standalone SVG to place over a picture, in three looks and with no mark of any games. Their size follows from their rows. [Broadcast boards](../broadcast.md).

```js
import { resultsBoard, resultsBoardSize } from "@johnmorrisdotca/taisen-brackets";

const source = {
  title: "Men's 100m butterfly",
  phase: "Results · Final",
  columns: [{ precision: 2 }],
  rows: [
    { code: "USA", flag: "US", name: "Michael Phillips", values: [50.58], record: "OR" },
    { code: "HUN", flag: "HU", name: "Laszlo Czigany", values: [50.59] },
  ],
};
console.log(resultsBoard(source, { width: 960 }).includes("50.58"), JSON.stringify(resultsBoardSize(source.rows.length, { width: 960 })));
```

Flags in all of these are the same plug-in as in a bracket: pass `flags` and the code of each row is drawn. None of them depends on a particular games or federation.
