<h1 align="center">Taisen Brackets <sub>対戦</sub></h1>

<p align="center"><strong>Knockout brackets as SVG, from a list of ties.</strong><br>
Give it the games, series, two-legged ties or replays of a tournament and it works out the rounds, the halves, the byes and who feeds whom, then draws the bracket: two halves that meet at the final, or one tree left to right, wide, square or tall for a phone, in light, dark or a gold-on-navy poster look, with each team's logo or round flag, the champion in the centre, and a table for readers the drawing does not serve. NHL, NBA, MLB, NFL, CFL and World Cup formats by era. One function, no dependencies.</p>

<p align="center">
  <a href="https://github.com/johnmorrisdotca/taisen-brackets/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/johnmorrisdotca/taisen-brackets/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@johnmorrisdotca/taisen-brackets"><img alt="npm" src="https://img.shields.io/npm/v/@johnmorrisdotca/taisen-brackets?color=2f5d4a"></a>
  <a href="./LICENSE"><img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-2f5d4a"></a>
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-2f5d4a">
  <img alt="TypeScript" src="https://img.shields.io/badge/types-TypeScript-3178c6">
</p>

<p align="center"><a href="https://johnmorrisdotca.github.io/taisen-brackets/"><strong>Open the demo →</strong></a> · <a href="./docs/layout.md">Layout</a> · <a href="./docs/drawing.md">Drawing</a> · <a href="./docs/formats.md">Formats</a> · <a href="./docs/compare.md">How it compares</a></p>

<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/hero-desk-dark.png">
<img alt="The 2022 World Cup knockout: two halves of eight teams meeting at the final in the centre, with Argentina's round flag and the word Champion above it and the third-place match below. Each box has both teams' round flags, abbreviations and scores, with penalties in brackets." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/hero-desk-light.png" width="720">
</picture>
</p>

<table align="center">
<tr>
<td align="center" valign="top">
<img alt="The poster look: the 2026 World Cup knockout of 32 nations as round flags on dark navy joined by gold lines, Spain's flag in the centre above the word Champion." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/poster-desk.png" width="470"><br><em>The poster look: flags only, gold on navy (the 2026 World Cup).</em>
</td>
<td align="center" valign="top">
<img alt="The 2022 World Cup on a phone: the champion at the top, then the rounds as rows, the first round at the top and at the bottom, the final in the middle, and the third-place match at the foot." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/phone-light.png" width="190"><br><em>On a phone the rounds are rows.</em>
</td>
</tr>
</table>

## In 30 seconds

```sh
npm install @johnmorrisdotca/taisen-brackets
```

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const svg = drawBracket([
  { sides: ["Aurora", "Harbour"], score: [2, 1], date: "2026-06-01" },
  { sides: ["Cascade", "Delta"], score: [0, 1], date: "2026-06-01" },
  { sides: ["Aurora", "Delta"], score: [3, 3], extraTime: true, pens: [4, 2], date: "2026-06-08" },
]);

console.log(svg.startsWith("<svg")); // true
```

Put the string in a page (`element.innerHTML = svg`), write it to a file, or send it from a server: it is plain SVG, with no script and no network. A tie names its two sides and, when it has been played, its score; which tie feeds which, the rounds, the halves and the champion are worked out from who plays whom.

## Who it is for

- **Sports sites** that show a playoff or a World Cup from the results they already hold, on a server or in the browser.
- **Anyone with a poster or a social card to make**: the same data draws a wide, a square or a phone-shaped bracket, in a gold-on-navy look, with round flags.
- **Tournament organisers** who need a bracket for any number of teams, with byes, that fills in as the games are played.
- **Readers who need more than a picture**: every drawing has a title and a description, and `bracketTable` writes the same bracket as a plain HTML table.

## Features

- **Ties of every kind**: a single game (with extra time and a shoot-out), a best-of-N series (by games, or by games won), two or more legs added up, and a drawn game replayed. The winner is worked out from the games, or named.
- **The layout is worked out**: rounds (from who plays whom, or given), which tie feeds which, two halves meeting at the final (named for the conferences when the groups split them cleanly) or one tree left to right, byes, seeds, a third-place match placed apart, and ties that lead nowhere drawn below.
- **A bracket that is not played yet**: name the tree with `feeds`, or let `singleElimination` build it for any number of teams, seeded in the standard way, with byes; `advanceWinners` carries results forward.
- **Wide, square, phone**: 1200 by 675, 1080 by 1080, or 390 wide and as tall as it needs; the rounds are columns, or rows on a phone. Boxes show names and scores, abbreviations, or only the marks, whichever fits.
- **Light, dark, poster**: every colour is a CSS custom property with a fallback, so the drawing follows the page's `prefers-color-scheme` or `data-theme` and can be restyled from outside.
- **Team marks you supply**: a logo address or inline SVG, drawn round or square; a team with none is its initials on a colour. Round flags from [Hata](https://github.com/johnmorrisdotca/hata) go in as they are.
- **The champion in the centre**, with a slot for your trophy.
- **Accessible**: `role="img"` with a title and a description, a tooltip sentence on every tie, and `bracketTable`.
- **Formats by era**: NHL, NBA, MLB, NFL, CFL and FIFA World Cup round names, series lengths and byes.
- **Deterministic**: no clock, no random number, no counter; the same input gives the same string, and ids come from a hash of the input.
- **No dependencies**, ESM with types, about 40 kB packed.

## Use it in your project

### Install

```sh
npm install @johnmorrisdotca/taisen-brackets
# or: pnpm add @johnmorrisdotca/taisen-brackets
# or: yarn add @johnmorrisdotca/taisen-brackets
```

It is ESM, and `require` works on Node 22.12 and later. It needs no DOM: the functions return strings. Three entry points: `@johnmorrisdotca/taisen-brackets` (everything), `/layout` (the layout and the helpers, no drawing) and `/presets` (the formats).

## Examples

### A bracket from its ties

A matchup is two `sides` (a team's id, or a whole team) and, once played, the result. Teams can be listed once, with names, marks and groups; a side named by an id that is not listed is a team of that name.

```js
import { drawBracket, layoutBracket } from "@johnmorrisdotca/taisen-brackets";

const teams = [
  { id: "NED", name: "Netherlands" }, { id: "ARG", name: "Argentina" },
  { id: "CRO", name: "Croatia" }, { id: "BRA", name: "Brazil" },
];
const matchups = [
  { sides: ["NED", "ARG"], score: [2, 2], extraTime: true, pens: [3, 4], date: "2022-12-09" },
  { sides: ["CRO", "BRA"], score: [1, 1], extraTime: true, pens: [4, 2], date: "2022-12-09" },
  { sides: ["ARG", "CRO"], score: [3, 0], date: "2022-12-13" },
];

const layout = layoutBracket({ matchups, teams });
console.log(layout.rounds);        // 2
console.log(layout.champion.name); // Argentina
console.log(layout.shape);         // halves

const svg = drawBracket(layout, { title: "Semi-finals and final" });
```

`layoutBracket` is the sport-agnostic part: it gives the rounds, the halves, the rows, and for each tie its result. `drawBracket` takes the same input, or a layout you already have.

### A playoff series, and a format by era

A series is `bestOf` and the games won; or give the games and it counts them. `playoffFormat(league, season)` has the league's round names for the era, and the halves take the conferences' names when the teams' `group` splits them.

```js
import { drawBracket, playoffFormat } from "@johnmorrisdotca/taisen-brackets";

const format = playoffFormat("nhl", 2024);
console.log(format.rounds.map((round) => round.name).join(", ")); // First Round, Second Round, Conference Finals, Stanley Cup Final

const svg = drawBracket(
  {
    teams: [
      { id: "FLA", name: "Florida Panthers", abbr: "FLA", group: "Eastern" }, { id: "BOS", name: "Boston Bruins", abbr: "BOS", group: "Eastern" },
      { id: "EDM", name: "Edmonton Oilers", abbr: "EDM", group: "Western" }, { id: "DAL", name: "Dallas Stars", abbr: "DAL", group: "Western" },
    ],
    matchups: [
      { sides: ["FLA", "BOS"], bestOf: 7, score: [4, 2], date: "2024-05-06" },
      { sides: ["DAL", "EDM"], bestOf: 7, score: [2, 4], date: "2024-05-23" },
      { sides: ["FLA", "EDM"], bestOf: 7, score: [4, 3], date: "2024-06-08" },
    ],
  },
  { roundNames: format, title: "Stanley Cup playoffs 2024" },
);
console.log(svg.includes("Eastern")); // true
```

### Two legs, replays, a shoot-out

```js
import { layoutBracket } from "@johnmorrisdotca/taisen-brackets";

const layout = layoutBracket([
  { id: "a", sides: ["Aurora", "Harbour"], kind: "aggregate", legs: [{ score: [2, 0] }, { score: [0, 1] }] },
  { id: "b", sides: ["Cascade", "Delta"], games: [{ score: [1, 1] }, { score: [2, 0], replay: true }] },
  { id: "c", sides: ["Aurora", "Cascade"], score: [1, 1], extraTime: true, pens: [3, 5] },
]);

for (const tie of layout.ties) console.log(tie.result.kind, tie.result.score.join("-"), tie.sides[tie.winner].name);
// aggregate 2-1 Aurora
// replay 2-0 Cascade
// game 1-1 Cascade
```

A drawn game that was replayed is one tie, decided by the replay (the 1934 and 1938 World Cups). Level on aggregate, a shoot-out settles it, or name the `winner` yourself (away goals, a coin toss) and add a `note`.

### Byes, seeds, and a bracket for any number of teams

```js
import { advanceWinners, drawBracket, singleElimination } from "@johnmorrisdotca/taisen-brackets";

const teams = Array.from({ length: 6 }, (_, i) => ({ id: `T${i + 1}`, name: `Team ${i + 1}` }));
const { matchups } = singleElimination(teams, { thirdPlace: true });
// Two first-round ties (R1-2 and R1-4: the top two seeds have byes), two semi-finals, the final and the third-place match.
console.log(matchups.length); // 6

// Results as they come in, by the tie's id; the sides of later ties fill in from the winners.
const played = matchups.map((m) => (m.id === "R1-2" ? { ...m, score: [2, 1] } : m));
const next = advanceWinners(played);
console.log(next.find((m) => m.id === "R2-1").sides); // [ 'T1', 'T4' ]

const svg = drawBracket({ teams, matchups: next }, { seeds: true });
```

The top seeds skip the first round; the layout knows which side of a tie had the bye (`box.bye`), and a drawing with no result yet shows "TBD" where a side is not known.

### From a flat list of games

Most data sources give a flat list of games. `matchupsFromGames` groups them into ties by stage and pair: several games of one pair in a stage are a replay, unless the stage is two-legged (`aggregate`) or a series (`series`).

```js
import { drawBracket, matchupsFromGames } from "@johnmorrisdotca/taisen-brackets";

const matchups = matchupsFromGames(
  [
    { stage: "semi", home: "ARG", away: "CRO", homeScore: 3, awayScore: 0, date: "2022-12-13" },
    { stage: "semi", home: "FRA", away: "MAR", homeScore: 2, awayScore: 0, date: "2022-12-14" },
    { stage: "third", home: "CRO", away: "MAR", homeScore: 2, awayScore: 1, date: "2022-12-17" },
    { stage: "final", home: "ARG", away: "FRA", homeScore: 3, awayScore: 3, extraTime: true, homePens: 4, awayPens: 2, date: "2022-12-18" },
  ],
  { stages: ["semi", "final"], third: "third" },
);
console.log(matchups.length); // 4
const svg = drawBracket(matchups);
```

### Sizes, shapes and looks

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const bracket = [
  { sides: ["A", "B"], score: [1, 0], date: "1" }, { sides: ["C", "D"], score: [0, 2], date: "1" }, { sides: ["A", "D"], score: [2, 1], date: "2" },
];

drawBracket(bracket);                                   // wide: 1200 by 675
drawBracket(bracket, { size: "square" });               // 1080 by 1080
drawBracket(bracket, { size: "phone" });                // 390 wide, the rounds as rows
drawBracket(bracket, { size: { width: 800, height: 500 } });
drawBracket(bracket, { shape: "ltr" });                 // one tree, left to right, the champion at the end
drawBracket(bracket, { theme: "dark" });                // "auto" (the default) follows the page, "light", "dark", "poster"
drawBracket(bracket, { theme: "poster", detail: "mark", roundLabels: false, title: "Knockout stage" });
drawBracket(bracket, { background: false });            // transparent
drawBracket(bracket, { theme: "none" });                // no <style>: your CSS draws it, currentColor is the fallback
```

`detail` is `full` (names and scores), `compact` (abbreviations), `mark` (only the marks) or `auto`, which takes the fullest one that fits the box and the longest name.

### Team marks, and round flags

A team's `mark` is the address of an image (`https://`, `data:image/`, or a relative path) or inline SVG. It is drawn in a circle (`markShape: "round"`, the default), a square, or left out (`"none"`). A team with no mark is its initials on its `color`.

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";
import { flag } from "@johnmorrisdotca/hata/load";

// Hata draws a flag as an SVG string, already framed for a circle.
const teams = [
  { id: "ARG", name: "Argentina", mark: await flag("AR", { shape: "round" }) },
  { id: "FRA", name: "France", mark: await flag("FR", { shape: "round" }) },
  { id: "ENG", name: "England", mark: await flag("GB-ENG", { shape: "round" }) },
  { id: "BRA", name: "Brazil", mark: await flag("BR", { shape: "round" }) },
];
const matchups = [
  { sides: ["ARG", "BRA"], score: [1, 0], date: "1" }, { sides: ["FRA", "ENG"], score: [2, 1], date: "1" },
  { sides: ["ARG", "FRA"], score: [3, 3], extraTime: true, pens: [4, 2], date: "2" },
];

const poster = drawBracket({ teams, matchups }, { theme: "poster", detail: "mark", roundLabels: false });
// Each flag is written once, as a <symbol>, and used wherever the team appears.
console.log(poster.includes("<symbol")); // true
```

Hata is not a dependency of Taisen: you bring the marks. Inline SVG is cleaned as it goes in (scripts, event attributes, `<style>`, `<foreignObject>` and `javascript:` addresses are removed), and an image address must be http(s), relative or a `data:image/` one. Anything else draws the team's initials.

### The champion, and a trophy

Once the final is played the champion is in the centre with the word "Champion" (on a phone, at the top, so that no line runs through it). Pass your own trophy, inline SVG or an image address, as `trophy`, and it is drawn above. `champion: false` leaves it out.

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const trophy = '<svg viewBox="0 0 24 24"><path d="M6 3h12v5a6 6 0 0 1-12 0zM10 14h4v4h3v3H7v-3h3z" fill="currentColor"/></svg>';
const svg = drawBracket([{ sides: ["A", "B"], score: [2, 1] }], { trophy });
console.log(svg.includes('class="tb-gold"')); // true
```

### A table for readers the picture does not serve

```js
import { bracketTable, describeBracket } from "@johnmorrisdotca/taisen-brackets";

const bracket = [{ sides: ["Aurora", "Harbour"], score: [2, 1] }];
console.log(describeBracket(bracket)); // 2 teams, 1 round. Final: Aurora 2, Harbour 1. Winner: Aurora. Champion: Aurora.
console.log(bracketTable(bracket).startsWith("<table")); // true
```

`bracketTable` writes a plain `<table>` with a caption and header cells, a row for each tie, the winner in bold, and the note ("a.e.t.", "pens 4–2", "agg.", "in 7").

### Your own words

Every word the package writes is in `WORDS`; pass `words` to replace any: `{ champion: "Vainqueur", thirdPlace: "Match pour la 3e place", tbd: "À déterminer" }`. Round names come from `roundNames`: a list, or a format from `playoffFormat`.

### In React, Vue and the rest

The functions return strings, so any framework can use them:

```tsx no-check
// React
<div dangerouslySetInnerHTML={{ __html: drawBracket(bracket, { size: "phone" }) }} />
```

The string is built from your data, with every name escaped; do not put untrusted SVG in `mark` or `trophy` without knowing that it is cleaned (it is) and that an image address you pass is loaded by the visitor's browser.

## API

Everything is exported from `@johnmorrisdotca/taisen-brackets`; the layout part from `/layout`, the formats from `/presets`. The types are in the package; each function's doc comment has its details.

- `drawBracket(input, options?)`: the SVG string. `input` is a list of matchups, `{ matchups, teams }` or a layout. Options: `size`, `orientation`, `shape`, `detail`, `theme`, `background`, `title`, `subtitle`, `roundNames`, `roundLabels`, `scores`, `seeds`, `markShape`, `champion`, `trophy`, `thirdPlace`, `winnerHighlight`, `words`, `groupOrder`, `id`, `className`.
- `layoutBracket(input, options?)`: the rounds, halves, rows, byes and results, without drawing. `shape: "ltr"` and `groupOrder` are its options.
- `bracketTable(input, options?)`: the HTML table.
- `describeBracket(input, options?)`: the sentence a screen reader gets.
- `singleElimination(teams, options?)`, `advanceWinners(matchups)`, `standardSeeds(size)`: brackets for any number of teams.
- `matchupsFromGames(games, options)`: matchups from a flat list of games.
- `resolveMatchup`, `collectTeams`, `describeTie`, `noteParts`: one tie's result, the teams of a bracket, a tie in a sentence.
- `playoffFormat(league, year)`, `playoffEras(league)`, `LEAGUES`: the formats by era (`nhl`, `nba`, `mlb`, `nfl`, `cfl`, `worldcup`).
- `roundName(remaining)`, `roundNamesFor(count)`, `roundLabel(layout, round, names, words)`: round names.
- `SIZES`, `THEMES`, `WORDS`, `VERSION`: the sizes, the looks' colours, the words, the version.
- `cleanSvg(markup)`, `safeUrl(url)`, `abbreviate(name)`: the rules for marks, and the short name made from a name.

## Sports covered

`playoffFormat(league, year)` gives the round names, the length of each series, the number of teams and the byes; [docs/formats.md](./docs/formats.md) lists the eras.

| League | Covered | Rounds in the latest era |
| --- | --- | --- |
| NHL | 1975 on (no playoffs in 2005), with 1980–81, 1982–86, 1987–93, 1994–2013, 2014 on, 2020 and 2021 as their own eras | First Round, Second Round, Conference Finals, Stanley Cup Final |
| NBA | 1977 on | First Round, Conference Semifinals, Conference Finals, NBA Finals |
| MLB | 1969 on (no postseason in 1994) | Wild Card Series, Division Series, League Championship Series, World Series |
| NFL | 1970 on, with 1982 as its own | Wild Card, Divisional, Conference Championship, Super Bowl |
| CFL | 1996 on | Division Semi-Final, Division Final, Grey Cup |
| FIFA World Cup | every edition with a knockout, 1930 to 2026 (1950 had none) | Round of 32 (2026), Round of 16, Quarter-finals, Semi-finals, Final |
| Any other | single elimination for any number of teams | Round of N … Final |

Each era was checked against English Wikipedia (facts only; the articles are cited in [docs/formats.md](./docs/formats.md)). The year is the year the playoffs are played in: the NHL's 2024 is the 2023-24 season. A season did something of its own (a strike, a pandemic) has its own entry, and a later one is not covered until it is checked.

## Theming

Every colour is `var(--tb-<name>, <the look's value>)`, so a page restyles a drawing without touching it:

```css
.my-bracket { --tb-ink: #123; --tb-win: #c60; --tb-box: #fff; --tb-line: #99a; }
```

The names are `bg`, `ink`, `muted`, `line`, `box`, `edge`, `win`, `gold`, `plain` and `font`. `theme: "auto"` is the light look and, under `prefers-color-scheme: dark` or `<html data-theme="dark">`, the dark one (`data-theme="light"` keeps it light). See [docs/drawing.md](./docs/drawing.md).

## Limits

- A bracket is a tree: every tie feeds one tie. Double elimination and round-robin groups are not drawn (a round-robin game, `round: 0`, is kept out of the tree and drawn below).
- Text is measured by an estimate from character classes, not a font file, so that the string is the same on every machine; a long name is cut with an ellipsis a few percent early or late.
- A series with no `bestOf` and no winner is not decided, whatever the games won say.
- On a phone the champion is at the top and the third-place match at the foot; in a wide bracket of two halves they are in the centre.
- Names, round names and the words are English; pass `words` and `roundNames` for another language. Japanese words are on the roadmap.

## Accessibility

The `<svg>` is `role="img"`, labelled by a `<title>` and a `<desc>` that says how many teams and rounds, the final and the champion; each tie has a tooltip sentence ("Argentina 3, France 3 (a.e.t., pens 4-2). Winner: Argentina"); the winner is marked by weight and a ring, not by colour alone; text is at least 8 units. For the full bracket in a reader's own order, put `bracketTable` beside the picture. The contrast of the light and dark looks' text on their boxes is held to WCAG AA by a test.

## Browser and runtime support

Any current browser, and Node 22 or later. The package makes no network request and keeps nothing.

## Roadmap

- Double elimination, and round-robin groups beside a knockout.
- Japanese words.
- A custom element and a React helper, as in the other packages of the family.
- A PNG renderer (through an optional peer).

## The name

*Taisen* (対戦, たいせん) is Japanese for a matchup, a contest between two sides: 対 is "against" or "facing" and 戦 is "fight" or "match". On a fixture list the word is 対戦カード. A bracket is a tree of taisen.

## How it compares

Libraries that draw brackets exist for several frameworks. Taisen's difference is what it does with the data: it takes the games as they were played (series, legs, replays, shoot-outs), works out the tree, and draws one deterministic SVG string that needs no framework, no DOM and no script. [docs/compare.md](./docs/compare.md) has the table: brackets-viewer.js, react-tournament-brackets, react-brackets, bracketry and jquery-bracket, with each one's licence read from its repository and package. Only ideas are taken from them, no code.

## Where it comes from

The layout began as the playoff bracket of [spxn.com](https://spxn.com), the historical record of five leagues, where one layout draws a hockey playoff and a World Cup. [docs/migrating-from-spxn.md](./docs/migrating-from-spxn.md) is how that site would use the package.

## Development

```sh
pnpm install
pnpm check        # lint, type-check, tests, build, and the packed package installed and run
pnpm test:readme  # the README's and the docs' examples, run against the built package
pnpm dev          # the demo on http://127.0.0.1:7100/ (this package's block of ports is 7100 to 7199)
pnpm test:demo    # the demo, played in a real browser at a phone's and a desk's width
```

The tests use `node:test` on the TypeScript source (Node 22.18 or later runs it as it is).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and the [code of conduct](./CODE_OF_CONDUCT.md). Report a security problem as [SECURITY.md](./SECURITY.md) says.

## Changes

[CHANGELOG.md](./CHANGELOG.md).

## Credits

The demo's results are real and are credited in [NOTICE.md](./NOTICE.md), which is also where their terms are. The World Cups of 1938 and 2022 are from [The Fjelstul World Cup Database](https://github.com/jfjelstul/worldcup) (© 2023 Joshua C. Fjelstul, Ph.D., [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/legalcode); the demo's extract and the pictures of those two brackets carry the same licence). The World Cup of 2026 is from [openfootball](https://github.com/openfootball/worldcup) (CC0). The NHL playoffs are from the NHL. The information used for the MLB postseason was obtained free of charge from and is copyrighted by Retrosheet. Interested parties may contact Retrosheet at [www.retrosheet.org](https://www.retrosheet.org). All were read through [spxn.com](https://spxn.com). The round flags are drawn by [Hata](https://github.com/johnmorrisdotca/hata). The formats by era were checked against English Wikipedia (CC BY-SA 4.0; facts only; see [docs/formats.md](./docs/formats.md)).

## Licence

MIT, © John Morris. See [LICENSE](./LICENSE) and [NOTICE.md](./NOTICE.md).
