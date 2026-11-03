---
title: The road to the final
section: how-to
order: 16
description: A bracket shows the whole tournament.
---

A bracket shows the whole tournament. A road-to-the-final chart shows only two stories: how each finalist got there. It is the picture for a social post on the day of the final: two large round marks at the top, the rounds down the middle with the last at the top, and each finalist's matches on its side with the score between the two teams' marks. This guide draws one from a tournament you already have, from two teams' paths you write by hand, and as a table.

## From a tournament

`roadToFinal(input, options?)` takes what `drawBracket` takes. The two sides of its final are the finalists, and each one's played ties are its road. It returns `{ options, title, summary, totals, draw(extra?), table(options?) }`: the options it was made with, an accessible name, a caption, the numbers behind the picture, the SVG string, and an HTML table.

```js
import { roadToFinal } from "@johnmorrisdotca/taisen-brackets";

const teams = [
  { id: "NED", name: "Netherlands" }, { id: "ARG", name: "Argentina" },
  { id: "CRO", name: "Croatia" }, { id: "BRA", name: "Brazil" },
];
const matchups = [
  { sides: ["NED", "ARG"], score: [2, 2], extraTime: true, pens: [3, 4], date: "2022-12-09" },
  { sides: ["CRO", "BRA"], score: [1, 1], extraTime: true, pens: [4, 2], date: "2022-12-09" },
  { sides: ["ARG", "CRO"], score: [3, 0], date: "2022-12-13" },
];

const road = roadToFinal({ teams, matchups }, { title: "Qatar 2022", size: "wide" });
console.log(road.totals.champion); // Argentina
console.log(road.summary); // Matches played before the final: Argentina (1) and Croatia (1). The final: Argentina 3–0 Croatia (FT). Argentina won the final.
console.log(roadToFinal({ teams, matchups }, { team: "CRO" }).totals.finalists[0].name); // Croatia
console.log(road.draw({ size: "phone" }).startsWith("<svg")); // true
```

`team` puts one finalist on the left (by id); a team that is not a side of the final has no road to it, and is refused. A tournament whose final is not decided yet still draws: each finalist's road so far, and "v" in the middle. A round-robin game (`round: 0`) is the group stage.

## From two paths you write

When you do not have a whole bracket, give the two finalists and their paths.

```js
import { roadToFinal } from "@johnmorrisdotca/taisen-brackets";

const owls = { name: "Northern Owls", abbr: "NOW", color: "#3a2d6b", path: [
  { round: "quarter-final", opponent: { name: "Coastal Pines", abbr: "CPN" }, score: [2, 0] },
  { round: "semi-final", opponent: { name: "Valley Stars", abbr: "VAL" }, score: [1, 1], decidedBy: "pens", pens: [4, 3] },
] };
const gulls = { name: "Harbour City Gulls", abbr: "HCG", color: "#1d4f91", path: [
  { round: "quarter-final", opponent: { name: "Summit Peaks", abbr: "SMT" }, score: [3, 1] },
  { round: "semi-final", opponent: { name: "Metro Bolts", abbr: "MTB" }, score: [2, 1], decidedBy: "aet" },
] };

const chart = roadToFinal([owls, gulls], { title: "Northern Cup 2030", final: { score: [1, 2] }, size: "square" });
console.log(chart.totals.rounds.join(" "), chart.totals.champion); // quarter-final semi-final Harbour City Gulls
console.log(chart.table().includes("<td>Semi-final</td>")); // true
```

`decidedBy` is `aet` or `pens`, and the chart writes FT, AET or the shoot-out under the score.

## Sizes and words

`size` is `wide`, `square`, `card` or `phone`, as for a bracket. `roundNames` names the rounds as a bracket's does (a list, or a format from `playoffFormat`), and `locale` writes the words and the round names in English, French, Japanese, Spanish or German. `labels` replaces any word.

```js
import { ROAD_THEMES, roadToFinal } from "@johnmorrisdotca/taisen-brackets";

const finalists = [
  { name: "A", path: [{ round: "semi-final", opponent: { name: "C" }, score: [1, 0] }] },
  { name: "B", path: [{ round: "semi-final", opponent: { name: "D" }, score: [2, 0] }] },
];
const fr = roadToFinal(finalists, { locale: "fr", size: "phone" });
console.log(Object.keys(ROAD_THEMES).length > 0, fr.summary.length > 0);
```

## The same look in a bracket

The chart and `drawBracket(..., { look: "road" })` share their look: the same marks, scores and pills. `highlightPath: "ARG"` draws one team's way through the bracket as a dotted line in the bracket itself; the third-place match is never on a path, and a team that lost has a path that ends where it lost. See [layouts and looks](layouts-and-looks.md#the-road-look).

For the fields of a match and every option, [the road to the final](../road.md).
