# Rankings

`rankingList` draws a ranking for any ranked sport (judo, taekwondo, wrestling, boxing, a club ladder) from the data you give it: a province's or a club's feed, a federation's list. It is text first. A row is a rank, a flag, a name, a club and points, with the movement since the last list, so a list looks complete and tidy without a photo and there is no empty photo slot. The package ships no ranking data: the numbers are yours.

<p align="center"><picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/ranking-podium-tv-dark.webp">
<img alt="A ranking list on a TV: the title Provincial ranking, a pill reading U18 · Men -60 kg and the date October 2026; at the left three big rows tinted gold, silver and bronze for the first three, each with its rank, an arrow and the number of places moved, a round flag of British Columbia or Quebec, the name in capitals, the club and the points; at the right the ranks 4 to 15 as compact rows with the same columns, a New badge on a newly ranked athlete and a tie at 10." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/ranking-podium-tv-light.webp" width="720">
</picture><br><em>The podium style on a TV: the top three in a panel, the rest beside it (invented names, clubs and points).</em></p>

## A list

```js
import { rankingCategoryLabel, rankingList } from "@johnmorrisdotca/taisen-brackets";

const svg = rankingList({
  category: rankingCategoryLabel({ age: "U18", sex: "men", weight: "-60" }),
  date: "October 2026",
  entries: [
    { name: { surname: "Nakamura", given: "Kenji" }, club: "Coastal Pine Judo", flag: "CA-BC", points: 412.5, change: 1 },
    { name: { surname: "Brar", given: "Harpreet" }, club: "Salmonberry Judo Club", flag: "CA-BC", points: 398, change: -1 },
    { name: { surname: "Leclerc", given: "Mathieu" }, club: "Kestrel Valley Judo", flag: "CA-QC", points: 366.25, change: 4 },
    { name: { surname: "Moreau", given: "Jules" }, club: "Salmonberry Judo Club", flag: "CA-BC", points: 255, change: "new" },
  ],
}, { precision: 2, size: "portrait" });
console.log(svg.includes("U18 · Men -60 kg"), svg.includes("NAKAMURA Kenji"), svg.includes("412.50")); // true true true
```

The source is `{ title?, category?, date?, source?, entries }`: the heading (default the language's "Ranking"), the category as a pill under it, the date at the right, where the list comes from at the foot, and the entries in order. An entry is only a `name` and whatever else you have:

| Field | What it is |
| --- | --- |
| `name` | The name as a text, or `{ surname, given }`, written by `nameStyle`: `surname-first` (the default: `NAKAMURA Kenji`, as judo writes it), `given-first` (`Kenji NAKAMURA`) or `as-is` |
| `rank` | The rank. Left out, the place in the list, with equal points sharing a rank (see below) |
| `points` | A number (written to `precision` decimals: `91.60`, `50.00`) or a text, shown as it is |
| `club`, `country` | The line under the name; `club` if there is one, else `country`. `categories: true` adds the entry's own `category` for a list that mixes categories |
| `code` | The country's three letters, written in the compact rows |
| `flag` | A code for the `flags` function: a country (`JP`) or a Canadian province or territory (`CA-BC`) |
| `mark` | A club's emblem of your own (an image address or inline SVG) in place of a flag |
| `change` | The movement since the last list: whole places up (positive) or down (negative), `0` for none, `"new"` for newly ranked |
| `champion` | `true` for the division's champion, `"interim"` for an interim champion |

`rankingCategoryLabel({ age, sex, weight }, locale?)` writes a category as a heading: `U18 · Men -60 kg`, `Femmes +78 kg` in French, any part left out is left out, and a weight that is not `-60` or `+78` is written as it is.

## Styles

- **`podium`** (the default): the first three rows are big, tinted gold, silver and bronze, above the compact rest. On a wide board (3:2 or wider) the big rows stand in a panel on the left and the rest beside them; `split: false` stacks them.
- **`featured`**: one big row above the rest in two columns, the first column running down before the second starts.
- **`list`**: every row compact. `medals: true` still tints the top three.

`big` (0 to 3) sets how many rows are big, `columns` (1 or 2) the columns of the compact rows, and `medals` the tint. A list with a champion row has no medal tint unless you ask for it.

<p align="center"><picture>
<img alt="A ranking list on a square card, in the light: the title Ranking and a pill reading Women -57 kg; one big row for the champion, marked C, with the Coastal Pine Judo club and 520 points; below it nine rows in two columns, tinted green where the athlete moved up and red where she moved down, with arrows and the number of places, and a New badge on rank 8." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/ranking-featured-square-light.webp" width="540">
</picture><br><em>A champion row, then two columns with the movement as row colours and arrows (<code>style: "featured"</code>, <code>movement: "both"</code>).</em></p>

## Movement, ties, a champion, paging

- **Movement.** `movement: "arrow"` (the default) writes an arrow and the number of places, green up and red down, a dash for no change and an `NR` badge for `"new"`; `"row"` tints the row instead; `"both"` does both; `"none"` leaves it out. The colours are never the only signal: the arrow's direction and the number say the same.
- **Ties.** Equal numeric points share a rank, so ranks run `9, 10, 10, 12`; `ties: false` numbers every row, and an entry's own `rank` always wins. `rankStyle: "hash"` writes `#10`. `rankingRanks(entries, { ties })` gives the ranks as data.
- **A champion** is a gold row marked `C` above rank 1 (`IC` for an interim champion); the ranks under it start at 1.
- **Order.** The list is drawn in the order given; `sort: "points"` puts the most points first.
- **Paging.** `rows` is the most entries drawn and `page` the page (0 is the first); the header says which entries are shown (`6–10 of 15`). Without `rows`, as many entries are drawn as fit at a readable size. The big rows belong to the first page only.

```js
import { rankingList, rankingRanks } from "@johnmorrisdotca/taisen-brackets";

const entries = Array.from({ length: 15 }, (_, i) => ({ name: `Athlete ${i + 1}`, points: 100 - Math.floor(i / 2) * 3 }));
console.log(rankingRanks(entries.slice(0, 6)).join(" ")); // 1 1 3 3 5 5
const page2 = rankingList({ entries }, { rows: 5, page: 1 });
console.log(page2.includes("6–10 of 15"), page2.includes("Athlete 6")); // true true
```

## Flags, and no photo

Flags come from the `flags` function you pass, as for `drawBracket`: a country's code or a Canadian province's or territory's (`CA-BC`, `CA-AB`, `CA-ON`, `CA-QC` and the rest of Hata's thirteen). They are drawn once each and reused, round by default, `flagShape: "square"` for square ones; `flagHref` is the same for flags that are files. An entry with no flag or mark has none drawn, and a list where no entry has one has no flag column at all: `badge: true` draws the club's initials on a badge instead. A photo is not drawn at all: a list is text, and a club's emblem goes in `mark`.

```js no-run
import { flag } from "@johnmorrisdotca/hata/load";
import { rankingList } from "@johnmorrisdotca/taisen-brackets";

const codes = [...new Set(source.entries.map((e) => e.flag).filter(Boolean))];
const loaded = Object.fromEntries(await Promise.all(codes.map(async (code) => [code, await flag(code, { shape: "round" })])));
const svg = rankingList(source, { flags: (code) => loaded[code] });
```

## Sizes, looks and languages

`size` is `tv` (1920 by 1080), `tablet` (1280 by 800), `tablet-tall` (800 by 1280), `phone` (600 by 1300), `square` (1080) or `portrait` (4:5, 1080 by 1350) for a social card, or `{ width, height }` of 200 or more. `theme` is `auto` (follows the page's light or dark), `light` or `dark`. The language is `locale` (`en`, `fr`, `ja`, `es`, `de`); `words` replaces any word, and the numbers are written the language's way (`1.234,5` in German). The drawing is one SVG string that scales to its width, and it is the same string for the same input, so it can be returned as it is by a server, saved as a file or sized by whatever places it.

<p align="center"><picture>
<img alt="A ranking list on a phone, in the dark: a title and a category pill, three big rows tinted gold, silver and bronze, and the ranks 4 to 10 as compact rows tinted green or red by their movement, each with a flag, a name, a club and points." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/ranking-phone-dark.webp" width="300">
</picture><br><em>On a phone, in the dark, ten to a page.</em></p>

Every colour is a custom property with a fallback: `--rk-bg`, `--rk-ink`, `--rk-sub`, `--rk-accent`, `--rk-accent-ink`, `--rk-row`, `--rk-row-alt`, `--rk-edge`, `--rk-up`, `--rk-down`, `--rk-up-row`, `--rk-down-row`, `--rk-pill`, `--rk-pill-ink` and the font, `--rk-font`. The text is measured, not stretched: a name that is too long for its place is set smaller down to a floor and then cut with an ellipsis, never squeezed, and every text of a row stays inside the row (a test holds it for every size, style and several languages).

`describeRanking(source, options)` is the sentence the drawing's description carries, for a screen reader: `Provincial ranking. U18 · Men -60 kg. 1, NAKAMURA Kenji, Coastal Pine Judo, 412.50 points, up 1. …`. A missing name, a rank that is not a whole number from 1, a change that is not a whole number or `"new"`, an unknown option value, or a bad size or theme is a `RangeError` that names it.

## The number one of each category

`rankingNumberOnes` draws a card for the number one of each category (each weight class, each age group), or for the top of an overall list: a coloured panel with the 1, the flag, the name, the club or country, the points and a pill that reads `#1 in -57 kg`. No photo: the card is the name and the numbers.

<p align="center"><picture>
<img alt="Four number-one cards on a square card, in the light: a title Number ones and the date October 2026; each card has a coloured panel with a big 1 (orange, crimson, blue, teal), a round flag, the name in capitals with the club under it, the points and a pill reading number 1 in minus 60, 66, 73 or 81 kg." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/ranking-numbers-square-light.webp" width="540">
</picture><br><em>Number ones as cards (invented names, clubs and points).</em></p>

```js
import { rankingNumberOnes } from "@johnmorrisdotca/taisen-brackets";

const svg = rankingNumberOnes({
  date: "October 2026",
  cards: [
    { category: "-60 kg", entry: { name: { surname: "Nakamura", given: "Kenji" }, club: "Coastal Pine Judo", flag: "CA-BC", points: 1240 } },
    { category: "-66 kg", entry: { name: { surname: "Leclerc", given: "Mathieu" }, club: "Kestrel Valley Judo", flag: "CA-QC", points: 1175 } },
  ],
}, { size: "square" });
console.log(svg.includes("#1 in -66 kg"), svg.includes("LECLERC Mathieu")); // true true
```

The source is `{ title?, date?, source?, cards }`, a card `{ category, entry }` with the same entry as a ranking list (`name`, `club`, `country`, `flag`, `mark`, `points`). `columns` (1 to 4) sets the columns of cards; by default the number that lets the longest name be set biggest is chosen, so a few cards on a TV go two by two and many on a phone go one under the other. `colors` (hex codes, taken in turn; `NUMBER_ONE_COLORS` by default) colours the number panels, with white or near-black on each, whichever reads. `precision` and `nameStyle` are as for a list. `describeNumberOnes` is the description.

## An entry list with each athlete's ranking

`rankingEntryList` draws an event's entry list in the order of the draw (the seeding view): a numbered row for each athlete with the flag, the name, the club if there is one, the country's letters and the athlete's ranking at the right, `NR` for an athlete with none. An entry's `rank` is its ranking and `points` (optional) are written beside it.

<p align="center"><picture>
<img alt="An entry list on a 4:5 card, in the light: the title Entry list and a pill reading Men -66 kg; the sixteen athletes by ranking, each row with its place in the list, a round flag, the name in capitals, the country's three letters and the ranking in big type, the unranked athlete last with NR." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/ranking-entries-portrait-light.webp" width="480">
</picture><br><em>An entry list sorted by ranking (invented names).</em></p>

```js
import { rankingEntryList } from "@johnmorrisdotca/taisen-brackets";

const svg = rankingEntryList({
  category: "Men -66 kg",
  entries: [
    { name: { surname: "Hoshino", given: "Daiki" }, code: "JPN", flag: "JP", rank: 3 },
    { name: { surname: "Whitfield", given: "Marcus" }, code: "USA", flag: "US" },
  ],
}, { sort: "ranking" });
console.log(svg.includes("HOSHINO Daiki"), svg.includes("NR")); // true true
```

`sort: "ranking"` puts the best ranked first and the unranked last (default: the order given); `numbers: false` leaves out the row numbers; `columns` (1 to 3) sets the columns, by default two on a wide board and more only as the rows need; `rows` and `page` page a long list as for a ranking list, and the header says which entries are shown. `describeEntryList` is the description.

Both take the options every board takes: `size`, `theme`, `flags`, `flagHref`, `flagShape`, `locale`, `words`, `title`, `id` and `className`, and the same `--rk-*` custom properties. A missing category, name, a ranking that is not a whole number from 1, a colour that is not a hex code or a bad option is a `RangeError` that names it.

## Head to head

`rankingMatchup` draws the card for the contest about to be fought, to stand beside the bracket: the two athletes side by side (flag, name, club, ranking and points), a VS between them, and under them their previous meetings with the record. Each athlete has a colour (blue and orange by default, `--rk-side-a` and `--rk-side-b`) that marks the panel and, in the list, who won each meeting, so the card reads without the names.

<p align="center"><picture>
<img alt="A head-to-head card on a phone, in the light: the heading Head to head and the pill U18 Men minus 60 kg; two panels, the first with a blue bar, the flag of British Columbia, NAKAMURA Kenji, Coastal Pine Judo, ranking 1 and 412.50 points, the second with an orange bar for BRAR Harpreet, ranking 2 and 398.00 points, and a VS between them; under them Previous meetings 3 to 2 and six rows with the date, the event and round, the winner marked by a dot in his colour and the result." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/ranking-matchup-phone-light.webp" width="300">
</picture><br><em>The card on a phone (invented athletes, events and results).</em></p>

```js
import { matchupRecord, rankingMatchup } from "@johnmorrisdotca/taisen-brackets";

const meetings = [
  { date: "2026-09-13", event: "Fall Open", round: "Semi-final", winner: 0, result: "ippon · 2:11" },
  { date: "2026-05-17", event: "Spring Classic", round: "Final", winner: 1, result: "waza-ari · golden score" },
  { date: "2026-02-08", event: "Winter Cup", round: "Quarter-final", winner: 0, result: "yuko · 4:00" },
];
const svg = rankingMatchup({
  category: "U18 · Men -60 kg",
  a: { name: { surname: "Nakamura", given: "Kenji" }, club: "Coastal Pine Judo", flag: "CA-BC", rank: 1, points: 412.5 },
  b: { name: { surname: "Brar", given: "Harpreet" }, club: "Salmonberry Judo Club", flag: "CA-BC", rank: 2, points: 398 },
  meetings,
}, { precision: 2, size: "square" });
console.log(matchupRecord(meetings).join("–"), svg.includes("PREVIOUS MEETINGS")); // 2–1 true
```

The source is `{ title?, category?, date?, source?, a, b, meetings? }`. `a` and `b` are ranking entries (`rank` is the ranking, `NR` where there is none). A meeting is `{ date?, event?, round?, winner?, result? }`: `date` is an ISO date, written the language's way, or any text; `winner` is `0` for the first athlete, `1` for the second and `null` or left out for a draw or no result (a dash); `result` is written as it is, so a sport writes its own (`ippon · 2:11`, `7–2`). The meetings are drawn in the order given, the latest first as a broadcast does. `matchupRecord(meetings)` counts the wins, and the record in the card counts every meeting, also those that do not fit. `rows` cuts the list; by default as many are drawn as fit at a readable size and the rest are counted (`+2 more`). With no meetings the card says so. `nameStyle`, `rankStyle` and `precision` are as for a list, and `describeMatchup` is the description. A missing name, a ranking that is not a whole number from 1, a winner that is not 0, 1 or null, or a bad option is a `RangeError`.

## What the package does not do

It draws; it ships no ranking data and no photos. Where the numbers come from is the app's business, and so are the terms of that source: a federation's ranking, a province's, a club's.
