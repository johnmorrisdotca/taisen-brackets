# Judo

A judo contest is a tie with a `judo` result: what each side scored (ippon, waza-ari, yuko), its shido, how it ended, golden score and the contest time. The box writes the score in the marks the IJF's scoreboards use, the shido as yellow and red cards, and under them how the contest was won. `judoBracket` makes the bracket of a weight category with the IJF's repechage and its two bronze medal contests.

<p align="center"><picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/judo-desk-dark.webp">
<img alt="A made-up men's minus 66 kilogram judo tournament of 16 athletes: the tree of the round of 16, the quarter-finals, the semi-finals and the final with each athlete's round flag, the score as I, W and Y marks, yellow and red shido cards, how each contest was won and the contest time, and under the tree the two repechage contests and the two bronze medal contests." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/judo-desk-light.webp" width="720">
</picture><br><em>A made-up men's -66 kg category: the names are invented and the countries are only there for the flags.</em></p>

## The rules this follows

The scoring is read from the **IJF Sport and Organisation Rules, Refereeing Rules, version 21 January 2026** (the Olympic cycle to Los Angeles 2028), which the IJF publishes on ijf.org. The quotations are from that text.

| Rule | What it says | In the package |
| --- | --- | --- |
| Article 7, Osaekomi time | Ippon 20 seconds; waza-ari 10 seconds or more but less than 20 seconds (10-19); **yuko 5 seconds or more but less than 10 seconds (5-9)**. | The marks and the order below |
| Article 15, Waza-ari and Yuko | "Yuko scores are counted (1, 2, 3, etc.) but they do not add up to waza-ari." | A waza-ari beats any number of yuko; yuko are compared only when the waza-ari are level |
| Article 16, Waza-ari-awasete-ippon | "Should one athlete gain a second waza-ari in the contest, the referee shall announce waza-ari-awasete-ippon (two waza-ari score ippon)." | `wazaAri: 2` wins, method `waza-ari-awasete-ippon`, 100 on the scoreboard |
| Article 4, the gestures | Ippon is 100 points on the scoreboard, waza-ari 10, yuko 1. | `JudoOutcome.points` |
| Article 18, Prohibited acts and penalties | "Two shido can be awarded and the third will be hansoku-make." "A contest cannot be decided by single or accumulated shido, until hansoku-make is reached." | Three shido lose the contest; fewer decide nothing; `hansokuMake` is a direct one |
| Article 18.2 | A hansoku-make, indirect or direct: "the opponent wins the contest by ippon". | Method `hansoku-make`, the other side wins |
| Article 18.3.1, Double hansoku-make (Indirect) | Both athletes given three shido: "the contest result will be recorded as 0-0". | `JudoOutcome.doubleHansokuMake`, no winner |
| Article 13, End of the Contest | A level contest at the end of regular time (4 minutes, Article 6) goes to golden score, with "no time limit"; any score and shido of regular time are carried in; it ends at a yuko, waza-ari, ippon, hansoku-make or kiken-gachi; an osaekomi that starts in golden score is yuko after 5 seconds. | `goldenScore: true`, the `GS` note |
| Article 19, Default and withdrawal | **Fusen-gachi**: the opponent does not appear (the 30 seconds rule); **kiken-gachi**: the opponent withdraws during the contest. | Methods `fusen-gachi` and `kiken-gachi`; the matchup names the `winner` |

**Yuko came back in 2025.** It was dropped in 2017 (the IJF's December 2016 notice: "The value of waza-ari includes those given for yuko in the past"; "Two waza-ari are no longer the equivalent of ippon"). The IJF's December 2024 notice ("Judo presents the new rules") says: "Addition of a third score yuko, in ne-waza it will be given at 5 seconds", to be used from the Paris Grand Slam 2025 to the World Championships Seniors in Budapest (13-20 June 2025) and "then reviewed after the event". The version of 21 January 2026 keeps yuko in Articles 7 and 15 and has Article 16 (waza-ari-awasete-ippon) again, so that is what this package scores. If you score an older rule set, leave `yuko` out and give waza-ari only: a result with no yuko is scored the same under both.

## A result

```js
import { judoOutcome } from "@johnmorrisdotca/taisen-brackets";

const o = judoOutcome({ sides: [{ yuko: 2 }, { wazaAri: 1, shido: 1 }], time: "4:00" });
console.log(o.winner, o.method, o.points.join(" ")); // 1 score 2 10
```

`sides[0]` is the white side and `sides[1]` the blue, in the order of the matchup's `sides` (on the IJF's draw sheet "the athlete/team on top wears a white judogi and the one below wears a blue judogi", 2.5). A side is `{ ippon, wazaAri, yuko, shido }`, every one optional. `method` is worked out (`ippon`, `waza-ari-awasete-ippon`, `score` for a decision on the technical scores, `hansoku-make`) unless it is `fusen-gachi` or `kiken-gachi`, which no score can show: the matchup's `winner` says who. A result that cannot happen is a `RangeError` that names the field: two ippon, a third waza-ari, a fourth shido, a method the scores contradict, a winner the scores contradict. `time` is seconds or `"m:ss"`; regular time is 4 minutes and golden score runs past it.

Level scores with no one decided are a contest not yet won (golden score is next): the tie has no winner.

## In a bracket

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const matchups = [
  { id: "a", round: 1, sides: ["Haru", "Marc"], judo: { sides: [{ ippon: true }, { shido: 1 }], time: "1:12" } },
  { id: "b", round: 1, sides: ["Levan", "Owen"], judo: { sides: [{ wazaAri: 1 }, { yuko: 1 }], goldenScore: true, time: "5:40" } },
  { id: "f", round: 2, sides: ["Haru", "Levan"], judo: { sides: [{ wazaAri: 1, yuko: 1 }, { wazaAri: 1 }], goldenScore: true, time: "7:02" } },
];
const svg = drawBracket(matchups, { title: "Men -66 kg" });
console.log(svg.includes("tb-sh-y"), svg.includes("GS · 7:02")); // true true
```

A box shows, for each side:

- the score in marks: `I` ippon; `W` waza-ari (`W2` for two); `Y` yuko (`Y3` for three); `0` for none. The marks are the language's (`judoIppon`, `judoWazaAri`, `judoYuko`; Japanese has its own one-character marks);
- a bar at the row's edge in the colour of the side, white for the first and blue for the second (`--tb-judo-white`, `--tb-judo-blue`);
- the shido as cards beside the score: a yellow one each, and a red one for the third (hansoku-make) or for a direct hansoku-make (`--tb-shido`, `--tb-hansoku`);
- under the two rows, in one line, how it was won (`ippon`, `waza-ari awasete ippon`, `decision`, `hansoku-make`, `fusen-gachi`, `kiken-gachi`), `GS` for golden score and the contest time. The tooltip and `bracketTable` write the same in a sentence, with each side's shido.

It works in the tree, `rows`, `shields`, `update`, `columns` and `series`, in both looks, every size and every language. `scoreboard points` (`Tie.result.score`) are the IJF's 100, 10 and 1. Add `judo: true` to `bracketStyle` for a page that shares one stylesheet.

## The bracket of a weight category

```js
import { advanceWinners, judoBracket, judoCategoryLabel, judoPodium } from "@johnmorrisdotca/taisen-brackets";

const athletes = ["Haru", "Marc", "Levan", "Min", "Rafa", "Jasur", "Tom", "Joris"].map((name, i) => ({ id: name, name, seed: i + 1 }));
const { matchups } = judoBracket(athletes);
console.log(matchups.length, matchups.filter((m) => m.stage === "bronze").length); // 11 2
console.log(judoCategoryLabel({ sex: "women", weight: "-48" }, "es")); // Mujeres -48 kg
console.log(judoPodium(advanceWinners(matchups)).gold); // null
```

`judoBracket(athletes, { system })` seeds the athletes in the standard way (the top seeds have the byes when the number is not a power of two) and, with the default `repechage` for eight athletes or more, adds what the IJF's rules call the quarter-final repechage (2.5.2 of the Sport and Organisation Rules, the system of the Olympic Games):

> The athletes defeated in the quarter-final will compete in two (2) repechage contests. The winners of each of these two (2) repechage contests will compete in bronze medal contests against the loser of the semi-final contest of the respective opposite table. The winners (2) of those contests are placed third.

So there are two repechage contests (`stage: "repechage"`, fed by the losers of one table's quarter-finals) and two bronze medal contests (`stage: "bronze"`, fed by a repechage winner and the other table's semi-final loser), drawn together under the tree, with their own heading, and the table says "Loser of …". `advanceWinners` fills them as the results come in. With `system: "direct"` there are none: the two losing semi-finalists are the bronze medallists. `judoPodium(input)` gives `{ gold, silver, bronze }` (the bronze medallists of the contests that are decided) from either.

`judoCategoryLabel({ sex, weight }, locale)` is the heading: "Men -66 kg", "Mujeres -48 kg", and in Japanese the form that language writes. `JUDO_WEIGHT_CLASSES` lists the senior classes (men -60, -66, -73, -81, -90, -100, +100; women -48, -52, -57, -63, -70, -78, +78 kilograms, 2.2.1 of the Sport and Organisation Rules). The round names are the generic ones (Round of 32, Round of 16, Quarter-finals, Semi-finals, Final) in the five languages.

The competition systems were read in the Sport and Organisation Rules of March 2023 (2.5); the Refereeing Rules of January 2026 hold the scoring only.

## The scoreboard of a contest

`judoScoreboard(contest, options)` draws one contest's scoreboard for the state you give it, as an SVG string: the two athletes with their flags and codes, the ippon, waza-ari and yuko counters, the shido cards, the contest clock, the golden score badge, the osaekomi timer, and a header with the weight class, the round, the mat and the contest number. Live updating is yours: draw again when the state changes (the [demo](https://johnmorrisdotca.github.io/taisen-brackets/#board) does, with the state in the address).

<p align="center"><picture><img alt="A judo scoreboard on a TV, in the dark, in golden score: the white athlete Daiki Hoshino of Japan on a white panel and the blue athlete Mathis Roussel of France on a blue panel, each with the ippon, waza-ari and yuko counters as large tiles and three shido slots, a golden score badge over the clock showing 0:42, and the osaekomi timer at 14 seconds held by blue." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/judo-board-tv-dark.webp" width="720"></picture><br><em>A TV board in the dark, in golden score, with a hold running (invented names).</em></p>

```js
import { judoScoreboard } from "@johnmorrisdotca/taisen-brackets";

const svg = judoScoreboard({
  white: { name: "Daiki Hoshino", code: "JPN" },
  blue: { name: "Mathis Roussel", code: "FRA" },
  sides: [{ wazaAri: 1, shido: 1 }, { yuko: 2, shido: 2 }],
  clock: "2:14",
  osaekomi: { side: 0, seconds: 12 },
  weight: "Men -66 kg",
  round: "Final",
  mat: 1,
}, { size: "tablet", theme: "dark" });
console.log(svg.includes("OSAEKOMI"), svg.includes("2:14")); // true true
```

The state, `JudoContest`:

- `white` and `blue`: `{ name, code?, flag?, mark?, coach? }`. `code` is the country's three letters, written big under the name; `flag` is a country code the `flags` option draws (Hata's round flags are one line, as for `drawBracket`; with none, the flag is the code on a tile), `mark` a picture of your own. The first side of a matchup is white and the second blue, here as in the bracket.
- `sides`: what each side has scored, white first, the same `{ ippon, wazaAri, yuko, shido }` as a bracket's `judo` result and checked the same way.
- `clock`: the contest clock as shown, seconds or `"m:ss"`. `goldenScore: true` puts the badge over it and the clock in gold.
- `osaekomi`: `{ side, seconds }`, the side holding (0 white, 1 blue) and the seconds so far; a bar to 20 with a tick at 5 (Y), 10 (W) and 20 (I), the IJF's times for yuko, waza-ari and ippon (Article 7), filled from the holder's side.
- `weight`, `round`, `mat`, `contest`: the header. Use `judoCategoryLabel` and `roundName` for the first two.
- `finished: true` says the contest is over: a lead on the scores then wins by decision. An ippon, a second waza-ari, a third shido, `hansokuMake`, or a `method` of `fusen-gachi` or `kiken-gachi` (with `winner`) ends it by itself. The winner's panel gets a gold frame and the foot reads "Winner: name · how".

The options: `size` (`tv` 1920 by 1080, `tablet` 1280 by 800, `tablet-tall` 800 by 1280, or `{ width, height }`: a wider-than-tall one puts the athletes left and right, a taller one top and bottom), `style`, `theme` (`auto`, `light`, `dark`), `swap` (blue first), `coaches`, `flags`, `flagHref`, `locale`, `words`, `title`, `id`, `className`. Every colour is a custom property with a fallback (`--jb-bg`, `--jb-ink`, `--jb-white-panel`, `--jb-blue-panel`, `--jb-shido`, `--jb-hansoku` and others, see the stylesheet in the drawing). The panels are the colours of the two judogi in every theme; the text on each reads 6 to 1 or better.

**`style: "flip"`** draws the same state as a table-top flip scoreboard: for each side a row of ring-bound cards on a stand, one card to a counter (ippon, waza-ari, yuko, shido, hansoku-make), a big numeral on the upper flap and the counter's name printed on the lower one, white cards for white and blue for blue. The clock and the osaekomi timer stay in the middle.

<p align="center"><picture><img alt="A judo scoreboard as table-top flip cards: for the white athlete a plate with the name and flag over a row of five white cards, and for the blue athlete a row of five cards with blue lower flaps, each card showing a numeral over its label: ippon, waza-ari, yuko, shido and hansoku-make; the clock and the osaekomi timer between them." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/judo-board-flip-tablet-light.webp" width="560"></picture><br><em>The flip-card style on a tablet.</em></p>

<p align="center"><picture><img alt="A judo scoreboard on a tablet held upright, in the light, at the end of a contest: the white athlete over the clock strip over the blue athlete, the white athlete's panel framed in gold with one ippon, and the foot reading Winner, Daiki Hoshino, ippon." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/judo-board-tall-light.webp" width="300"></picture><br><em>A tablet held upright, at the end of a contest.</em></p>

A state that cannot happen (two ippon, a third waza-ari, a clock that is not `m:ss`, a bad size or style) is a `RangeError` that names it. `describeJudoContest(contest)` is the sentence the drawing's description carries. The words (Osaekomi, Shido, Mat 1, Contest G-24, the coach line, the title) are in the five languages.

## The contest card and the mat queue board

Two more screens for the hall. **`judoContestCard(contest, options)`** is the card shown when the two athletes enter: the weight class on the left of the header, the round on the right, the mat and contest number between them, then the white athlete over the blue one as two wide bands, each with the flag, the name as big as the band lets it be (on two lines at a space when that is clearly bigger) and the country code under it.

<p align="center"><picture><img alt="A judo contest card on a TV in the dark: the header says Men minus 66 kg on the left, Mat 1 Contest G-1 in the middle and Final on the right; the white athlete Daiki Hoshino of Japan on a wide white band with the Japanese flag and the code JPN, and under it the blue athlete Mathis Roussel of France on a blue band with the French flag and the code FRA." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/judo-card-tv-dark.webp" width="560"></picture><br><em>The contest card (invented names).</em></p>

**`judoMatQueue(mats, options)`** is the board of the contests to come, per mat. A mat is `{ mat, color?, contests }`; a contest is `{ number, white, blue }` with the number as the draw gives it (`"G-24"`). Each mat is a tall strip in its colour with its number big, and a row for each contest in the order they will be fought: the contest number, the white athlete (name, code, flag) and the blue athlete (flag, code, name). The first contest of a mat is the one on now, its number green (`current: false` turns that off).

<p align="center"><picture><img alt="A judo mat queue board on a TV in the dark with three mats: a red strip with a big 1, a green strip with a big 2 and a yellow strip with a big 3, each beside a list of eight or fewer contests with the contest number, the white athlete on a white cell with the name, the country code and a round flag, and the blue athlete on a blue cell with the flag, the code and the name; the first contest of each mat has a green number." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/judo-queue-tv-dark.webp" width="720"></picture><br><em>Three mats on a TV.</em></p>

<p align="center"><picture><img alt="A judo mat queue board on a tablet in the light with four mats in a grid of two by two: red 1, green 2, yellow 3 and purple 4, each with its contests in order." src="https://raw.githubusercontent.com/johnmorrisdotca/taisen-brackets/main/docs/images/judo-queue-tablet-light.webp" width="560"></picture><br><em>Four mats on a tablet.</em></p>

```js
import { judoMatQueue } from "@johnmorrisdotca/taisen-brackets";

const svg = judoMatQueue([
  { mat: 1, contests: [{ number: "G-1", white: { name: "Daiki Hoshino", code: "JPN" }, blue: { name: "Mathis Roussel", code: "FRA" } }] },
  { mat: 2, color: "#0b6fb8", contests: [{ number: "G-2", white: { name: "Levan Mtchedlishvili", code: "GEO" }, blue: { name: "Min-jae Seong", code: "KOR" } }] },
], { size: "tv", theme: "dark" });
console.log(svg.includes("G-2"), svg.includes("#0b6fb8")); // true true
```

The mats are in columns on a wide board, as many as leave each mat room for its names (about six tenths of the short side of the board), and stacked on an upright tablet; up to eight mats. A mat with more contests than fit is cut at `rows` (default: as many as fit at a readable size, up to 12). Mats with no colour take `JUDO_MAT_COLORS` in turn (red, green, yellow, purple, orange, teal), or `colors`, and the number is white or near-black, whichever reads on its colour. Both take `size`, `theme`, `swap` (blue first), `flags`, `flagHref`, `locale`, `words`, `title`, `id` and `className` as the scoreboard does; an athlete is the same `{ name, code, flag, mark }`. `describeJudoCard` and `describeJudoQueue` are the sentences the drawings' descriptions carry. A missing name, a mat with no number, a colour that is not a hex code or a bad size is a `RangeError`.

## Not drawn yet

- **Double repechage and full repechage** (2.5.3, 2.5.4): their pools are laid out in the rules' Appendix G charts, which are pictures; `judoBracket` refuses them rather than guess.
- **Team events**, round robins and kata scoring.
- **The road to the final of one judoka** is planned for the next release ([roadmap](./roadmap.md)).
