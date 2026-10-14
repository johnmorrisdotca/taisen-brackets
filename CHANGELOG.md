# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.5.0] - 2026-10-14

### Added

- **`background`**: a poster background under a bracket or a road chart. A preset's name draws one of **twenty-five**, each drawn in code (gradients, radial glows, patterns, bezier bands, markings) in a dark and a light variant, deterministic and at most 6 kB: `midnight`, `crimson`, `royal`, `emerald`, `pitch`, `ice`, `hardwood`, `infield`, `turf`, `ball-panels`, `swirl`, `waves`, `glow`, `floodlights`, `confetti`, `carbon`, `aurora`, `sunburst`, `chevrons`, `halftone`, `argyle`, `contour`, `stardust`, `mesh` and `spotlight`. Five read as the sport's playing surface: soccer's mowing stripes and markings, hockey's scratched ice with its centre circle, lines and faceoff spots, basketball's planks and court, baseball's grass, dirt and base paths, football's turf, yard lines and end zones. The text, lines, boxes, marks and accent take the colours that read over each (4.5 to 1 against the background's dominant colours, a test over every preset, both variants and every size, and over colours of your own, with a veil where a mid-tone ground needs one). With `theme: "auto"` both variants are drawn and the stylesheet shows the one that fits the page. [docs/backgrounds.md](docs/backgrounds.md).
- **`background: { preset, colors, angle, intensity, seed, theme }`** tunes a preset, and **`background: { image, fit, dim, theme }`** draws a picture of your own as an `<image>` under a veil (`cover` or `contain`, 0 to 1 deep); the address must be http(s), relative or `data:image/…` (anything else throws), and is escaped. An unknown preset or a bad value throws a `RangeError` that names it. `roadToFinal` takes the same option. The default, the look's plain colour, is drawn exactly as before.
- **`src/family-backgrounds.ts`**, the drawing of the twenty-five as one dependency-free file that other packages of the family copy byte for byte: `backgroundSvg(preset, { width, height, theme, colors, angle, intensity, seed, id }) => { defs, body, ink }`, `BACKGROUND_PRESETS`, `contrastRatio`, `FAMILY_BACKGROUNDS_VERSION`. Its sha256 and version are held by `test/family-backgrounds.test.ts`; it is also the `/backgrounds` entry point. The copy rule is in docs/backgrounds.md.
- **Seed tags**: `seeds: true` in the road look writes a small tag (`C1`, `WC2`, `P3`) beside each mark, from the new `Matchup.seeds`, else the new `Team.tag`, else the number `Team.seed`; in a box of marks alone it sits above the mark.
- **`codes`** and **`vs`** for a bracket's road look: a team's three letters under its mark, and a "v" between the two marks of a box of marks alone.
- **A team with no flag or logo is a tile** in the road look: a rounded square with its abbreviation, filled with the team's `color` (white or near-black letters, whichever reads) or neutral.
- **`flagHref(code)`**: a flag as an address to load, for pages that cannot afford an inline flag of 80 kB twice; tried where `flags` gives none, written once as a symbol. **Every `mark` address** is now written once as a symbol and used wherever the team appears, instead of a long `<image href>` per use.
- **`tieClass(tie)`**: a class word for a tie's group, so that a page's own style can highlight or dim ties (a division); only words of letters, digits, `-` and `_` are kept.
- The demo has a background picker (all twenty-five as swatches, your own colours, an image read in the browser and never uploaded), a gallery of the twenty-five on the sports they suit, and opens every example on the background of its sport. NHL 2024 carries its seed tags.
- `pnpm images` redoes every picture of `docs/images` in one command, the two grids of the twenty-five included; `pnpm test:readme` checks that every picture the README and the docs name exists. [docs/roadmap.md](docs/roadmap.md) and [docs/references.md](docs/references.md): what is planned (new layouts and a group-stage table for 0.6.0) and the pictures that prompted it, as mood only.

### Fixed

- **Marks, text and round names stuck out of their boxes**, in every size and both looks: in a tall bracket's boxes of marks the score under the marks was not counted when the marks were sized, so the flags crossed the box's top and bottom (Croatia and Japan in the round of 16 on a phone); a shoot-out's score ("1 (3)") crowded the next team's, and now sits beside the score where it fits the column, or under it. A box of marks is laid out as a stack (tag, mark, letters, score, shoot-out) and the marks are made as large as the whole stack allows. Bold text was measured as regular; it is now measured bold, so a name no longer runs under a score or the word "bye".
- **The names of the rounds met the connector lines.** In a tall bracket the lines now turn at the edge of the box they leave and the names stand on their own strip between the rounds, each moved along it to a place the lines do not cross, set a little smaller and on a snugger pill where the room is tight. (On a phone a round of eight or more boxes across leaves no room: the name then stands over the lines on its own pill.)
- **Round names were cut with an ellipsis** in a wide column ("Conference Quarterfi…"): a name is set smaller, down to 8, and then on two lines, on a taller pill (road) or two lines of text (classic), and the strip over the boxes grows to hold them. A name is cut only as a last resort.
- `test/geometry.test.ts` measures every drawing's marks, text, pills and lines from the markup and asserts all of this for every example, size and look.

### Changed

- The demo's default view is the road look on the background that suits each sport. A bracket's classic look is unchanged apart from the fixes above.
- The README's pictures are regenerated (JPEG, to keep the repository small) with the new backgrounds and the fixed boxes.

## [0.4.0] - 2026-10-14

### Added

- **`roadToFinal(input, options?)`**, also the one export of the new `/road` entry point: the road to the final. The two finalists of a tournament are drawn as large round marks with their names, each one's matches on its side as both teams' round marks with the score between them in large type and FT, AET or the shoot-out under it, the rounds named down the middle on a dotted road, and the group stage as a compact row at the foot, on a `card`, `square`, `wide` or `phone`. It takes what `drawBracket` takes (a list of matchups, `{ matchups, teams }` or a layout), so one tournament draws the bracket and either finalist's road (`team` puts it on the left; a round-robin game, `round: 0`, is the group stage); or the two finalists given with their `path` and `group`, a `logo` being another name for `mark`. It gives `{ options, title, summary, totals, draw(extra?), table(options?) }`. [docs/road.md](docs/road.md) has the fields and the options.
- **`look: "road"`** for `drawBracket`: large round marks with a wide ring and a hairline, big bold scores in which the loser's is quiet, one size of mark and score in every box, the rounds named on pills, and boxes as high as their width lets the marks be. A box that cannot hold names is its abbreviations, and one that cannot hold those is two marks with each score under its mark. The classic look stays the default and is drawn as before; every option works in both. New custom properties `--tb-mark-ring`, `--tb-mark-edge`, `--tb-panel` and `--tb-spine`, and `ROAD_THEMES` for their fallbacks.
- **`size: "card"`**, 1080 by 1350, a tall post: the rounds are rows, and in the road look the boxes are made lower, or the room left over is shared between the rounds, until the card is exactly that high.
- **`highlightPath`**: a team's id; its path to the final is drawn as a dotted line in `--tb-win`, the ties on it ringed and the rest quieter.
- **`href: (tie, side?) => address`**: a link on each tie's box, or, where that gives none, on each known team's row. Each is a real `<a class="tb-link" href aria-label>` in the SVG with an accessible name, a hit area, and a hover and focus ring. An address must be http(s), relative or a `#` fragment (`safeHref`, new): `javascript:`, `data:` and the rest give no link.
- **`flags`** and `Team.flag`: a team's country code is drawn by a synchronous function you pass, `(code, { shape, size, theme }) => svg`, the same shape as `emblems`; `@johnmorrisdotca/hata`'s round flags are the one to use (load them first, since its `flag()` is asynchronous). It is an optional peer and a development dependency, never a runtime one. The flag is written once as a `<symbol>`; with no renderer, or one that returns nothing, throws or returns something that is not an `<svg>`, the team's `mark` or its initials are drawn. New types `FlagRenderer`, `FlagRequest`, `FlagShape`.
- Words for the road in all five languages (the keys starting `road`): the French and Japanese were read by native-language reviewers; the Spanish and German need one (docs/languages.md).
- The demo draws every sport in the road look with Hata's flags through `flags`, and has a size switcher with the card, a switch between the bracket and the road to the final, a Classic and Road style, the champion's path, and links on the boxes. The README's pictures show the road look.

### Changed

- The demo's flags are team `flag` codes drawn through the `flags` option, not marks baked into the data.

## [0.3.0] - 2026-10-14

### Added

- **Emblems for the trophy.** The `trophy` option also takes an emblem id such as `"trophy:hockey-cup"`, drawn by a function passed as the new `emblems` option: any `(id, { style, size, tint, theme }) => svg`, such as `renderEmblem` from `@johnmorrisdotca/dougu-sports/emblems`. The renderer is asked for the size the trophy has in the drawing and for `theme: "light"` or `"dark"` in those looks (`"dark"` for `poster`), else `"inherit"`; `emblemStyle` (`metal`, `line`, `color`) and `emblemTint` are passed on. What it returns is cleaned like any inline SVG, drawn in a nested `<svg class="tb-emblem">` that takes its ink from `--tb-ink`, and its English `<title>` is left out. With no renderer an emblem id draws nothing and takes no room; a renderer that throws or returns something that is not an `<svg>` draws no trophy.
- `LEAGUE_EMBLEMS` and `PlayoffFormat.emblem`: each league's default emblem (NHL `trophy:hockey-cup`, NBA `trophy:basketball`, MLB `trophy:baseball`, NFL `trophy:football`, CFL `trophy:canadian-bowl`, MLS `trophy:cup`, World Cup `trophy:soccer-globe`), used only when a renderer is plugged in; `isEmblemId(value)`; the types `EmblemRenderer`, `EmblemRequest` and `EmblemStyle`.
- `@johnmorrisdotca/dougu-sports` as an optional peer dependency (and a pinned development dependency, for the tests and the demo). The package still has no dependencies, imports nothing from it, and an inline SVG or an address given as `trophy` is drawn exactly as before.
- The demo draws each league's emblem for its champion, with a "Trophy" switch and a Metal, Line or Colour choice; the emblems are loaded one module each from the Dougu Sports files the Pages build copies beside the page.

### Changed

- Every drawing's stylesheet has one more rule, `.tb-emblem{color:var(--tb-ink, …)}`.

### Fixed

- `docs/formats.md` titled the MLS section "undefined".

## [0.2.1] - 2026-10-14

### Added

- **MLS**: `playoffFormat("mls", year)` for the format since 2023 (18 teams, nine a conference; a wild card match, a best-of-three round one, then single matches to the MLS Cup; seven teams of each conference skip the wild card match), checked against English Wikipedia, with the round names in all five languages. A demo example, the 2024 MLS Cup Playoffs, read from spxn.com's MLS data (openfootball, CC0, checked against English Wikipedia, CC BY-SA 4.0), with a test that pins its champion (LA Galaxy) and final (2–1) and a picture.
- `LayoutBox.byes`: every side that skipped the earlier rounds, which includes both sides of a later-round tie that no tie feeds (MLS's round one); each such side says "bye" beside its score.

### Fixed

- A series counts a game level at the end of play as won by the side that won the shoot-out (MLS's best-of-three round one), so its score and winner are right.

## [0.2.0] - 2026-10-14

### Added

- **Languages.** A `locale` option: `"en"` (the default), `"fr"`, `"ja"`, `"es"`, `"de"`, or a `Locale` made with `defineLocale`. Every text the SVG and the table write is in a table of words per language: the round names (the football terms of each language's Wikipedia article on the World Cup; the leagues' rounds as generic words, with a league's own name kept as the language uses it), the notes (after extra time, 4–2 on penalties, replay, aggregate, bye, walkover), the champion's label, the table's headers, the tooltips and the accessible description, and the numbers and dates through `Intl`. The `<svg>` and the `<table>` carry `lang`. `words` still replaces any string. Exported: `LOCALES`, `LOCALE_CODES`, `defineLocale`, `localeOf`, `voiceOf`, `localizedLayout`, `noteLong`, and the types `Locale` and `Voice`. The Spanish and German words were checked against Wikipedia only and need a native reader (docs/languages.md).
- **Team names in a language.** `Team.names` (by locale code), the `teamName(team, locale)` option, and `countryName(isoCode, locale)`, which asks `Intl.DisplayNames` (the home nations too), so a World Cup shows every country in the chosen language with no list written. `Team.region` carries the ISO code.
- A tie can be a `walkover`; a side that had a bye says so beside its score in the language.
- **A real example for every sport**, read from spxn.com like the others: the 2024 NBA playoffs, the playoffs of the 2024 NFL season (byes, the Super Bowl at the centre), the 2024 CFL playoffs (byes, the Grey Cup), and the 1984 Stanley Cup playoffs (the Campbell and Wales conferences, a best-of-five first round), beside the NHL 2024, MLB 2022 and the World Cups. Each has its source in NOTICE.md and the demo's footer, and a test that pins its champion and final score.
- **The demo** has a sport picker with its editions, a language switcher (EN, FR, 日本語, ES, DE) that drives every example, the poster included, remembered in `localStorage`, and the shared family header and footer (the family template of 2026-10-15b, `scripts/page.mjs`, the family block of the README).
- docs/languages.md: every term of every language, what it was checked against, and what still needs a native reader. The README has a "Languages" section and a gallery of the sports.

### Changed

- The year of a format is stated: the playoffs' year, except for the NFL, whose year is its season's.
- The champion's German label is "Turniersieger"; the football terms in Japanese, French, Spanish and German were reviewed (French and Japanese by native-language reviewers).

## [0.1.1] - 2026-10-14

- The title is now "Taisen Brackets 対戦" in the README, the demo and the package description, matching the package name.

## [0.1.0] - 2026-10-14

First version.

### Added

- **`layoutBracket`**: the rounds, halves, rows, byes and results of a knockout, worked out from its ties (who plays whom, or `feeds`), for ties that are one game (with extra time and a shoot-out), a best-of-N series, two or more legs added up, or a drawn game replayed. Two halves that meet at the final, named for the groups when they split cleanly, or one tree left to right; a third-place match placed apart; ties that lead nowhere kept in `other`.
- **`drawBracket`**: the bracket as one SVG string, wide (1200 by 675), square (1080 by 1080) or phone (390 wide, the rounds as rows), with full, compact or mark-only boxes, round or square team marks from a logo address or inline SVG (each written once as a `<symbol>`), the champion in the centre with a trophy slot, light, dark and a gold-on-navy poster look, every colour a `--tb-*` custom property, `role="img"` with a title and description, and ids from a hash of the input.
- **`bracketTable`** and **`describeBracket`**: the same bracket as an HTML table and as a sentence.
- **`singleElimination`**, **`advanceWinners`**, **`standardSeeds`** and **`matchupsFromGames`**: brackets for any number of teams, seeded in the standard way with byes, results carried forward, and matchups from a flat list of games.
- **`playoffFormat`** and **`playoffEras`**: round names, series lengths, byes and teams by era for the NHL, NBA, MLB, NFL, CFL and the FIFA World Cup.
- Entry points `/layout` and `/presets`; no dependencies.
- A demo with real results read from spxn.com (the NHL 2024 playoffs, the World Cups of 2022, 1938 and 2026, the MLB 2022 postseason; sources and terms in NOTICE.md), two made-up examples (two-legged ties, a 32-team field) and a flags-only poster of the 2026 World Cup, in a playground that changes the size, look and shape.
- Playoff formats checked against English Wikipedia, each era citing its articles (docs/formats.md). The year is the year the playoffs are played in.

[Unreleased]: https://github.com/johnmorrisdotca/taisen-brackets/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/johnmorrisdotca/taisen-brackets/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/johnmorrisdotca/taisen-brackets/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/johnmorrisdotca/taisen-brackets/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/johnmorrisdotca/taisen-brackets/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/johnmorrisdotca/taisen-brackets/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/johnmorrisdotca/taisen-brackets/releases/tag/v0.1.0
