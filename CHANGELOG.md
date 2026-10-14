# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/johnmorrisdotca/taisen-brackets/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/johnmorrisdotca/taisen-brackets/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/johnmorrisdotca/taisen-brackets/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/johnmorrisdotca/taisen-brackets/releases/tag/v0.1.0
