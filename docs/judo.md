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

## Not drawn yet

- **Double repechage and full repechage** (2.5.3, 2.5.4): their pools are laid out in the rules' Appendix G charts, which are pictures; `judoBracket` refuses them rather than guess.
- **Team events**, round robins and kata scoring.
- **A contest scoreboard, a contest card and a mat queue board, and the road to the final** are planned for the next releases ([roadmap](./roadmap.md)).
