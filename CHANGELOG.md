# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/johnmorrisdotca/taisen-brackets/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/johnmorrisdotca/taisen-brackets/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/johnmorrisdotca/taisen-brackets/releases/tag/v0.1.0
