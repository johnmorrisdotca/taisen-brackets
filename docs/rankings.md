# Ranking lists

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

## Not drawn yet

Number-one cards, an entry list with world rankings, and the head-to-head card are the next steps ([roadmap](./roadmap.md)).
