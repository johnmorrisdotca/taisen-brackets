# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.17.4] - 2026-10-21

The pictures are slower and no longer first; the demo waits for the pointer. No change to the package's code beyond its version.

### Changed

- **README: it opens on the still bracket again** (the 2022 World Cup knockout, as before 0.17.3). The moving pictures sit lower, one in its own section ("A bracket filling in, game by game", the judo scoreboard, the ranking list, the medal table), never stacked.
- **The moving pictures run at half the speed.** `pnpm animations` keeps each step twice as long (`SLOW=2`, `SLOW=1` for the old pace); the webp files are the same size.
- **Demo: the bracket opens whole and still.** The games come in while the mouse is over the bracket (from the first game, carrying on from where it stopped the next time) and stop when the pointer leaves; on a phone a tap on the bracket plays it and a second tap holds it. Play, Pause, Play again and the slider work as before, and Play keeps playing when the pointer leaves. A game now shows for 900 ms (`?gap=` still sets it). A reader who prefers reduced motion is never played to by the pointer. The addresses `game` and `play=0` work as before.

## [0.17.3] - 2026-10-20

The npm page and the demo open on the best of it, in motion. No change to the package's code beyond its version.

### Changed

- **README: the first thing is a bracket filling in.** The 2022 World Cup knockout fills in game by game (`docs/images/hero-fill-*.webp`), then "The best of it", a picture each: the judo scoreboard on flip cards from the first second to ippon, the mat queue, a provincial ranking list re-ordering with its movement arrows, the broadcast results board, a medal table changing from one Games to the next, and the road look. Every animation is an animated webp in a light and a dark twin, under 150 kB each. The README is shorter than before: "Every sport" moved to `docs/every-sport.md` and the per-layout pictures and examples to the end of `docs/layouts.md` (nothing removed).
- **The pictures are made by a script from the demo:** `pnpm animations` (`scripts/animations.mjs`) takes one frame per step with Playwright, from the demo's own data, and joins them with `img2webp`.
- **Demo: it opens on the World Cup bracket filling in game by game**, with its options beside it on a desk (the bracket and its play bar stay in view while the options scroll) and under it on a phone, where the bar is pinned at the top. Pause, Play again and a slider hold or replay any game; changing the sport's options, the look, the language or the layout while it plays leaves the games coming in; the stage keeps room for the finished bracket so nothing below moves. The address holds `game` and `play=0` once it is paused (an address that names a game opens paused at it); a reader who prefers reduced motion gets the finished bracket. A jump bar leads to the judo, ranking, medal and broadcast sections.

## [0.17.2] - 2026-10-20

Security fix.

### Fixed

- **The background's `id` option is made safe.** `backgroundSvg` (and the `background` option of the drawings that use it, which already passed a safe id) wrote the `id` it was given as it came into element ids and `url(#...)`, so a hostile `id` (`x"><script>…`) could break out of the attribute when `backgroundSvg` is called directly. It now keeps only letters, digits, `_` and `-` (every other character becomes `-`) and puts `bg-` in front of an id that does not start with a letter. An id that is already safe is unchanged. The shared module `family-backgrounds` is now version 1.0.1; `test/family-backgrounds.test.ts` draws every preset with eight hostile ids.

## [0.17.1] - 2026-10-20

Security fix.

### Fixed

- **The `id` option is made safe in every drawing that takes one.** The judo drawings (`judoScoreboard`, `judoContestCard`, `judoMatQueue`, `judoRoadPanel`, and `drawBracket` with judo ties; 0.7.0 to 0.17.0) wrote the caller's `id` as it came into the `<style>` text, a class name and element ids, so a hostile `id` (`x"><script>…`, or `a}</style>…`) could break out of the style block or the attribute and put markup into the SVG. `drawBracket` and `roadToFinal` did the same. They now keep only letters, digits, `_` and `-` (every other character becomes `-`) and put the drawing's own prefix in front of an id that does not start with a letter, as the 0.15.0 boards already did. An id made of letters, digits, `_` and `-` that starts with a letter is unchanged, so most pages see no difference. `test/hostile-id.test.ts` draws every drawing that takes an `id` with six hostile ids.

## [0.17.0] - 2026-10-20

Broadcast boards, step 3: the medal table.

### Added

- **`broadcastMedalTable({ title?, subtitle?, date?, source?, rows }, options)`**: the medal table in the manner of a television graphic, as one standalone SVG: a title band (the heading, with the date at its right), a sub bar with the three medal discs over their columns and the word total, and a row for each country or team with its rank, a 4:3 flag, its code or name (`labels`) and the gold, silver and bronze counts each beside its disc, and the total. The same source as `medalTable`, ranked and tied by the same rules (`sort`, `ties`, `top`, `skipEmpty`), so `tallyMedals` feeds it; `ranks: false`. Looks, icons, languages and `--bc-*` custom properties as for the other boards; up to 24 rows.
- **`broadcastMedalSize(rowCount, { width })`**: the size before it is drawn: the width (1280 by default, 720 to 4000) and a height of 64 + 36 + 10 + 48 a row + 10, scaled.
- The three boards now have a section on placing them over something: the size is read before drawing, nothing is drawn outside the panel, and the SVG scales as a picture. [docs/broadcast.md](docs/broadcast.md).
- The demo's Broadcast boards section has the medal table, with the look, icon and width in the address.

## [0.16.0] - 2026-10-20

Broadcast boards, step 2: the bout presentation board.

### Added

- **`boutBoard({ title, phase?, bout?, red, blue, officials? }, options)`**: the screen shown as two athletes are about to compete, as one standalone SVG: a title band (the event, with the phase at its right), a bar "Bout presentation" with the bout's number ("Bout: 142"), the two athletes in a red band and a blue one (code, 4:3 flag, name), a bar "Referee and judges", and a row for each official (code, flag, name, role). A role is `"referee"`, `"judge"` (numbered in the order given, in the language's words) or a text of your own. Looks, icons, `nameCase`, `nameStyle`, languages and `--bc-*` custom properties as for the results board; up to 12 officials. `describeBoutBoard`.
- **`boutBoardSize(officialCount, { width })`**: the size before it is drawn, for placing it: the width (1280 by default, 720 to 4000) and a height of 64 + 38 + 10 + 62 + 10 + 38 + 42 an official + 10, scaled.
- Words for the board in the five languages: the bout, the two bars, the referee and a judge (the French and Japanese were read by native-language reviewers; the Spanish and German were not).
- The demo's Broadcast boards section has the bout presentation (a made-up wrestling bout with a referee and five judges), in the three looks. [docs/broadcast.md](docs/broadcast.md).

## [0.15.0] - 2026-10-20

Broadcast boards, step 1: the results board.

### Added

- **`resultsBoard({ title, phase?, columns?, rows }, options)`**: a results board in the manner of a television results graphic, as one standalone SVG: a title band (the event in capitals, with an icon square), a light sub bar (the phase, and the heading of each score column), and a row for each athlete: a rank in a box (`rankStyle`: a red box, gold, silver and bronze boxes, or a plain numeral), the country code, a 4:3 flag, the name, a record badge (`record: "OR"`, `["WR", "NR"]`) and one or more columns of numbers at the sport's own precision (per column, then `precision`) or texts (`1:08.34`); `note` (`DNS`, `DQ`) in place of the values; equal results share a rank. Looks `blue`, `night` and `paper` (`BROADCAST_LOOKS`), icons `medal`, `stopwatch`, `none` or an `iconMark` of your own, `nameCase`, `nameStyle`, five languages, `--bc-*` custom properties, up to 24 rows. `describeResultsBoard`.
- **`resultsBoardSize(rowCount, { width })`**: the board's size before it is drawn, for placing it: the width (1280 by default, 720 to 4000) and a height of 64 + 36 + 20 + 54 a row, scaled. The SVG carries the same size, has nothing outside its panel and scales as a picture.
- **Flags drawn 4:3**: a board asks the `flags` function for the shape `rect` (Hata's `"4:3"`); a row with no flag is a rectangular badge with its code.
- Nothing of any games, federation, sponsor or broadcaster is drawn: no rings, pictograms, emblems or timing company's name; the type is a stack of free condensed fonts, none shipped.
- One word for the sub bar, in the five languages (Result, Résultat, `結果`, Resultado, Ergebnis: the plain word of each).
- The demo has a Broadcast boards section with five made-up finals (a gymnastics apparatus final, an all-around, a swimming final with a record badge, athletics 100 m and speed skating), the look, rank style, icon, width and capitals in the address, and the board's size shown. [docs/broadcast.md](docs/broadcast.md).

## [0.14.0] - 2026-10-20

A medal table for any sport.

### Added

- **`medalTable({ title?, subtitle?, date?, source?, rows }, options)`**: a medal table as an SVG for any sport and event. A row is `{ name, flag?, mark?, code?, gold?, silver?, bronze?, note? }`: rank, flag (or a badge with the code or the initials, for a country or team with no flag, such as a former country), name with an optional line under it (the years it existed), the gold, silver and bronze counts in tinted cells under a disc for each, and the total. `sort: "gold"` ranks as the Olympic Games do (gold, silver, bronze), `"total"` by the number of medals, `"given"` keeps the order; equal rows share a rank (5, 5, 7) unless `ties: false`; `rankStyle: "hash"`; the first three ranks have a gold, silver and bronze bar (`highlight`). `top`, `skipEmpty`, `rows` and `page` choose the rows (the header says which are shown); `columns: 2`, by default on a wide board with more than ten rows. `describeMedalTable`, `medalRanks(rows, options)`.
- **`tallyMedals(awards, filter?)`**: adds up a list of medals (`{ name, medal, sport?, category?, games?, flag?, mark?, code?, note? }`) into rows, filtered to one sport, one weight class or age group or one Games (or a list of each), so that one list gives the table of an event, of a sport and of all time.
- Words in the five languages: the heading, the letters over the medal columns, the total and a row in a sentence (the French and Japanese were read by native-language reviewers; the Spanish and German were not).
- The demo has a Medal table section with made-up medals of seven Games, two sports and five weight classes, the filters, the ranking rule, the number of rows, size and look in the address. [docs/medals.md](docs/medals.md).

## [0.13.0] - 2026-10-20

Rankings, step 3: the head-to-head card.

### Added

- **`rankingMatchup({ title?, category?, date?, source?, a, b, meetings? }, options)`**: the card for the contest about to be fought, for beside a bracket: the two athletes side by side (flag, name, club, ranking and points), a VS between them, and under them their previous meetings (date, event and round, who won, the result) with the record. Each athlete has a colour (`--rk-side-a`, `--rk-side-b`) that marks the panel and the winner of each meeting. `winner` is `0`, `1` or `null` (a draw: a dash); the date is written the language's way; `rows` cuts the list and the rest are counted (`+2 more`); with no meetings the card says so. `describeMatchup`, `matchupRecord(meetings)`.
- Words for the card in the five languages (the French and Japanese were read by native-language reviewers; the Spanish and German were not).
- The demo's Rankings section has it (`kview=matchup`), with the meetings on or off. [docs/rankings.md](docs/rankings.md).

## [0.12.0] - 2026-10-20

Rankings, step 2: the number ones and the entry list.

### Added

- **`rankingNumberOnes({ title?, date?, source?, cards }, options)`**: the number one of each category (each weight class, each age group) as a card in a grid: a coloured panel with the 1, the flag, the name, the club or country, the points and a pill that reads `#1 in -57 kg`. No photo. `columns` (1 to 4; by default the number that lets the longest name be set biggest), `colors` (hex codes taken in turn, white or near-black ink on each; `NUMBER_ONE_COLORS`), `precision`, `nameStyle`. `describeNumberOnes`.
- **`rankingEntryList({ title?, category?, date?, source?, entries }, options)`**: an event's entry list in the order of the draw: a numbered row for each athlete with the flag, the name, the club, the country's letters and the athlete's ranking at the right (`NR` for none), `points` optional. `sort: "ranking"`, `numbers`, `columns` (two on a wide board by default), `rows` and `page` (the header says which entries are shown), `badge`. `describeEntryList`.
- Both take the options every board takes (size, theme, flags, locale, words, `--rk-*` custom properties). Words in the five languages (the French and Japanese were read by native-language reviewers; the Spanish and German were not).
- The demo's Rankings section has both, with the view in the address (`kview`). [docs/rankings.md](docs/rankings.md).

## [0.11.0] - 2026-10-20

Rankings, step 1: the ranking list.

### Added

- **`rankingList(source, options)`**: a ranking for any ranked sport as an SVG, from the caller's data (a province's or a club's feed, a federation's list). Text first, with no photo slot: the rank, a flag (a country's or a Canadian province's or territory's, `CA-BC`), the name, the club and the points, with the movement since the last list. `source` is `{ title?, category?, date?, source?, entries }` and an entry `{ name, rank?, points?, club?, country?, code?, flag?, mark?, category?, change?, champion? }`. Styles: `podium` (the top three as big rows tinted gold, silver and bronze above the compact rest; on a wide board the big rows stand in a panel beside the others), `featured` (one big row above two columns) and `list`; `big`, `columns`, `split`, `medals`. Movement as arrows with the number of places, as green and red row colours, both, or none; `NR` for the newly ranked; a dash for no change. Tied ranks (equal points share a rank: 9, 10, 10, 12), an own `rank`, `rankStyle: "hash"` (`#10`). A champion row marked `C` (`IC` for an interim champion) above rank 1. `precision` writes points to the sport's own decimals (`91.60`, `50.00`), `nameStyle` writes `SURNAME Given`, `Given SURNAME` or the name as it is, `sort`, `categories`, `badge` (a club's initials where there is no flag), `rows` and `page` (the header says which entries are shown) and `flagShape`. Where the row is narrow the type steps down and then the text is cut with an ellipsis; nothing is stretched.
- **`rankingRanks(entries, { ties })`**, **`rankingCategoryLabel({ age, sex, weight }, locale)`** (`U18 · Men -60 kg`) and **`describeRanking(source, options)`**, the drawing's description.
- **`BOARD_SIZES`** and the options every board takes (`BoardOptions`): `tv`, `tablet`, `tablet-tall`, `phone` (600 by 1300), `square` and `portrait` (4:5) for a social card, or your own `{ width, height }`; light, dark or `auto`; five languages; custom properties `--rk-*`. The medal table and the results boards that follow share them.
- Words for ranking lists in the five languages (the French and Japanese were read by native-language reviewers; the Spanish and German were not). The Japanese marks the champion with `王者` and the interim champion with `暫定`.
- The demo has a Ranking lists section with a made-up provincial feed (U18 men -60 kg, and a senior women's list with a champion): style, size, look, movement, columns, name and rank style and paging, with the call that draws it; the state is in the address. [docs/rankings.md](docs/rankings.md).

### Changed

- The demo's flags come from Hata 1.6.2, which has all thirteen Canadian provinces and territories.

## [0.10.0] - 2026-10-20

Judo, step 4: the road to the final of one judoka.

### Added

- **`judoWins(bracket, athleteId, options)`**: the contests an athlete has won in a bracket, oldest first, as `{ round, opponent, how }`: the round (a repechage and a bronze medal contest named as such), the opponent as an athlete (`name`, `code`, `flag`, `mark` of the team, or what `athlete(team)` gives) and how it was won (a judo result's method, golden score and time, or the score). A bye is a row for each round a top seed skipped (`byes: false` leaves them out). A name that is not in the bracket is a `RangeError`. `Team.code`, the three letters of the country, is new.
- **`judoRoadPanel({ athlete, wins }, options)`**: the panel for a broadcast or a hall screen. The athlete's block (flag, name, code, coach) in the colour of a judogi (`side`), and a row for each win, most recent first (`order`): the round on a pill, the opponent's flag, code and name, and how it was won; a bye is a quiet row. A wide screen puts the block on the left and the rows on the right, an upright one the block on top and the result under each name. `size`, `theme`, `flags`, `flagHref`, `locale`, `words`, `title`, `weight`, `rows`, `coach`. `describeJudoRoad`. The title is the road chart's word in each language.
- The demo has a section for it: any of the 16 athletes of the Judo example (a bronze medallist's repechage and bronze medal contest included), size, look, the colour of the block and the order, with the call that draws it; the state is in the address. Tests hold every text inside the drawing and every opponent inside its row, in every size and several languages.

## [0.9.0] - 2026-10-20

Judo, step 3: the contest card and the mat queue board.

### Added

- **`judoContestCard(contest, options)`**: the card shown when the athletes enter. The weight class, the round, the mat and the contest number in a header, then the white athlete over the blue one as two wide bands with the flag, the name as big as the band allows (two lines at a space when that is clearly bigger) and the three-letter code. `describeJudoCard`.
- **`judoMatQueue(mats, options)`**: the board of the contests to come, per mat. A mat is `{ mat, color?, contests }` and a contest `{ number, white, blue }`; each mat is a tall strip in its colour with its number big (white or near-black, whichever reads on the colour) and a row for each contest in order: the contest number (green for the one on now, `current: false` turns that off), the white athlete (name, code, flag) and the blue (flag, code, name). One to eight mats, in columns on a wide board (as many as leave each mat room for its names) and stacked on an upright tablet; `rows` cuts a long queue; `colors` and `JUDO_MAT_COLORS` (red, green, yellow, purple, orange, teal). `describeJudoQueue`.
- Both take the scoreboard's `size` (`tv`, `tablet`, `tablet-tall`, your own), `theme`, `swap`, `flags`, `flagHref`, `locale`, `words`, `title`, `id` and `className`; a missing name, a mat with no number, a colour that is not a hex code, nine mats or a bad size are a `RangeError`. Words for the two titles in the five languages (the French and Japanese were read by native-language reviewers).
- The demo has a section for them: the screen (queue or card), one to six mats, size, look and blue first, with the call that draws it; the state is in the address. Tests hold every text inside the drawing, in every size and several languages, and every name inside its side of its row.

## [0.8.0] - 2026-10-20

Judo, step 2: the scoreboard of one contest.

### Added

- **`judoScoreboard(contest, options)`**: one judo contest's scoreboard as an SVG string for the state given. The two athletes (white and blue) with their flags and three-letter codes, the ippon, waza-ari and yuko counters, the shido cards (the third red), the contest clock, a golden score badge, the osaekomi timer (a bar to 20 seconds with ticks at 5, 10 and 20, the IJF's yuko, waza-ari and ippon times, filled from the holder's side), the weight class, the round, the mat and the contest number, and, when something has ended the contest, the winner and how at the foot. The state is checked like a bracket's judo result (`JudoContest`, `JudoAthlete`); a lead on the scores wins only once `finished`.
- **Sizes**: `tv` (1920 by 1080), `tablet` (1280 by 800), `tablet-tall` (800 by 1280) or your own `{ width, height }`; light, dark or `auto`; `swap` (blue first); `coaches`; `flags` and `flagHref` as for `drawBracket`; five languages. `JUDO_BOARD_SIZES`.
- **`style: "flip"`**: the same state as a table-top flip scoreboard, a row of ring-bound cards on a stand for each side, one card to a counter (ippon, waza-ari, yuko, shido, hansoku-make), the numeral on the upper flap and the label on the lower, white and blue cards.
- **`describeJudoContest(contest, options)`**: the state as a sentence, the drawing's description.
- Words for the scoreboard in the five languages (Osaekomi, Shido, Mat, Contest, Coach, the title); the French and Japanese were read by native-language reviewers (the Japanese osaekomi is written with the Kodokan's own character, not the everyday one), the Spanish and German were not.
- The demo has a Judo scoreboard section: counters with a plus and a minus, the clock, the osaekomi side and seconds, golden score, finished, blue first, style, size and look, and the call that draws it; the state is in the address and nowhere else. Geometry tests hold every text inside the drawing, and every name inside its panel, in every size, look and several languages.

## [0.7.0] - 2026-10-20

Judo, step 1: results in the bracket boxes, and the bracket of a weight category with the repechage and two bronze medals. Nothing changes for a bracket that has no judo result (every existing snapshot is unchanged).

### Added

- **`Matchup.judo`**: a judo contest's result, `{ sides: [white, blue], method?, hansokuMake?, goldenScore?, time? }`, each side `{ ippon, wazaAri, yuko, shido }`. The winner, the method and the score come from it under the IJF Sport and Organisation Rules, Refereeing Rules of 21 January 2026: ippon, two waza-ari are ippon (Article 16), yuko are counted and never add up to a waza-ari (Article 15; yuko is back since 2025, 5 to 9 seconds of osaekomi, Article 7), shido never decide a contest and the third is hansoku-make (Article 18), a direct hansoku-make (`hansokuMake`), golden score (Article 13), fusen-gachi and kiken-gachi (Article 19, the matchup names the `winner`). `Tie.result.score` is the scoreboard's 100, 10 and 1. [docs/judo.md](docs/judo.md) quotes each rule.
- **`judoOutcome(result, winner?)`** checks a result and works out the winner, the method, the scoreboard points and whether both sides were disqualified; a count out of range, two ippon, a method or winner the scores contradict, and a default with no winner are a `RangeError` that names the field. `judoSeconds`, `judoClock`.
- **The boxes**: the score in marks (`I`, `W`, `W2`, `Y`, `Y3`, `0`), a white or blue bar at the edge of each row, the shido as yellow and red cards beside the score, and under the rows how it was won, `GS` for golden score and the time. The tooltip, the description and `bracketTable` say the same in a sentence, with each side's shido. Works in the tree, `rows`, `shields`, `update`, `columns` and `series`, both looks, every size. CSS custom properties `--tb-judo-white`, `--tb-judo-blue`, `--tb-shido`, `--tb-hansoku`; `bracketStyle({ judo: true })`.
- **`judoBracket(athletes, { system, prefix })`**: a weight category for any number of athletes, with the IJF's quarter-final repechage (Sport and Organisation Rules 2.5.2: two repechage contests, two bronze medal contests) for eight athletes or more, or a direct knockout whose losing semi-finalists are the bronze medallists. `Matchup.stage` takes `"repechage"` and `"bronze"` (fed by the losers of the tree's ties, drawn together under the tree with their own heading); `Tie.stage`. `judoPodium(input)` gives gold, silver and the bronze medallists; `judoCategoryLabel({ sex, weight }, locale)` the heading ("Men -66 kg"); `JUDO_WEIGHT_CLASSES`.
- Words for judo in the five languages (the marks, the methods, golden score, the shido, the headings, the weight class). The French and Japanese were read by native-language reviewers; the Spanish and German need one (docs/languages.md).
- The demo has a Judo sport: a made-up men's -66 kg category of 16 athletes with every kind of ending, in the tree and in rows, with Hata's flags (Georgia, Uzbekistan, Cuba, Mongolia, Azerbaijan, Hungary, Italy added).

### Changed

- The note under a box is cut to fit with the same width estimate the names use, so that a long note never reaches past its box.
- The ties kept apart under the tree are 66 high in the road look when one of them has a note.

## [0.6.1] - 2026-10-19

No change to the package's code. The README's pictures were checked against 0.6.0's features and remade: they already show every layout, so none is added.

### Changed

- The demo's road to the final shows three real tournaments (the World Cups of 2022 and 2026 with Hata's round flags, and the 2024 Stanley Cup playoffs with each team's initials on its colour) in place of made-up nations.
- `CONTRIBUTING.md` has a release-checklist line for visual features: new visual feature? update the README images and add a showcase section if the examples do not show it well.
- Docs pages are single-language (`CONTRIBUTING.md`), held by a new test, `docs-language.test`, which lists each exception with its reason; two changelog entries that had Japanese in English prose are now in English.

## [0.6.0] - 2026-10-14

### Added

- **`layout`**: the same ties drawn eight ways. `"tree"` (the default) is the bracket as ever, drawn exactly as before; the rest take the tree's places, lines and round names or plan their own, and all work with `background`, both looks, the four sizes, the five languages, `href` links, seeds, codes, `flags` and `flagHref`, marks and tiles. [docs/layouts.md](docs/layouts.md).
  - **`rows`**: each team a row, its name left and its mark right, a seed tag at the outer corner and a result slot (empty until played) at the end facing the centre.
  - **`shields`**: marks in shield shapes with "vs" between, the matchups on both sides of the trophy, no lines.
  - **`update`**: a compact score-update card: abbreviation, seed and series score a side, the rounds to come empty.
  - **`columns`**: tall slots that grow toward the centre, the two halves in two colours (`--tb-conf-a`, `--tb-conf-b`, `CONFERENCE_COLORS`), "VS" tags, big seed numbers, the final as two tall slots. `at: true` writes "AT" in place of "VS" (a word in each language), the home side drawn second; `Matchup.home` names it.
  - **`playin`**: the NBA's play-in: tiles for the seeds that need no game, the games in columns, a solid arrow for a winner and a dashed one for a loser, "Winner 9/10" and "Loser 7/8" until they are played, the seeds earned at the end.
  - **`series`**: a tall card (1080 by 1350 unless a `size` is asked for) of one line a series, "BOS 4–0 MIA", the winner bold, the east above the west with the final between.
  - **`groups`**: one card a group, a title tile and a row a team with its mark, name and record or points, the places that go through marked (`qualify`). `standings: "points"` (played, won, drawn, lost, goal difference, points) or `"record"` (won, lost, softball's). New `groupStandings(input)` (the tables as data) and `groupsTable(input)` (as HTML).
  - A box too small for everything leaves out the seed tag, then the length of the names, then the score's slot; a geometry test over every layout, size and look holds that nothing sticks out.
- **Loser edges**: a `feeds` entry can be `{ tie, result: "winner" | "loser" }` (a string is still a winner), `Tie.from` says where each side comes from (`Source = { tie, result }`), and `Matchup.stage: "play-in"` keeps a game out of the tree (`layout.playIn`, `Tie.playIn`). A bracket with none of it is drawn exactly as before. A circle of feeds, or a tie that feeds itself, throws an error naming the ties. `advanceWinners` fills a side from a loser, `bracketTable` calls the games "Play-in" and says "Loser of A v B".
- **`headers: true`**: a big title tile over each half (West and East, AFC and NFC) in the colour of that half, in any layout.
- **A lone final is centred.** A tournament whose tree is a final alone with a third-place match (the World Cups of 1974 and 1978) is drawn with the final centred, the champion over it and the third place under it, in every layout, size and look, not off to one side.
- **One stylesheet for several drawings**: `styleScope` (a class that carries the rules in place of the drawing's own), `style: false` (leave the `<style>` out of a second drawing) and `bracketStyle(options)` (the rules, for a page that writes them once). The ids of the drawings stay apart.
- New words in the five languages: `vs`, `at`, `groupName`, `colPlayed` to `colPoints`, `playIn`, `playInWinner`, `playInLoser`, `seedSlot`, `winnerOf`, `loserOf`. The French and Japanese were read by native-language reviewers; the Spanish and German need one (docs/languages.md).
- The demo has a layout switcher on each sport (NHL rows and update, NFL columns, NBA play-in and series, World Cup shields, made-up groups, softball groups), "Headers" and "AT" chips, and a gallery of the layouts on their backgrounds. New demo data: the 2024 NBA play-in (typed from English Wikipedia, CC BY-SA 4.0) and two made-up group stages.

### Changed

- The README's pictures are **WebP**, made in the browser by `pnpm images` (no tool beyond Chromium), two to three times smaller than the JPEG they replaced at no visible loss; the repository's `docs/images` shrinks with them.
- The README, docs/roadmap.md and docs/references.md say what 0.6.0 built and what is left.

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
- **The demo** has a sport picker with its editions, a language switcher (EN, FR, JA, ES, DE) that drives every example, the poster included, remembered in `localStorage`, and the shared family header and footer (the family template of 2026-10-15b, `scripts/page.mjs`, the family block of the README).
- docs/languages.md: every term of every language, what it was checked against, and what still needs a native reader. The README has a "Languages" section and a gallery of the sports.

### Changed

- The year of a format is stated: the playoffs' year, except for the NFL, whose year is its season's.
- The champion's German label is "Turniersieger"; the football terms in Japanese, French, Spanish and German were reviewed (French and Japanese by native-language reviewers).

## [0.1.1] - 2026-10-14

- The title now carries the package name's Japanese form beside "Taisen Brackets" in the README, the demo and the package description, matching the package name.

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
