# The road to the final

`roadToFinal(input, options?)` draws the two finalists of a tournament and the way each came: the two large round marks at the top with their names; down the middle the rounds, the last at the top; on each finalist's side its matches, each as the round mark of both teams with the score between them in large type and FT, AET or the shoot-out under it; and the group stage as a compact row of small marks, three-letter codes and scores at the foot. The same drawing is made for any sport: a World Cup, a play-off series, a cup.

It gives back `{ options, title, summary, totals, draw(extra?), table(options?) }`: the options it was made with, an accessible name, a sentence or two for a caption, the numbers behind the drawing, the SVG string, and an HTML table of every match for a reader the picture does not serve.

## From a tournament

`input` is what `drawBracket` takes: a list of matchups, `{ matchups, teams }` or a layout. The two sides of its final are the finalists. Each one's played ties are its road: the knockout ties, earliest round first, and its round-robin games (`round: 0`) as the group stage. The score of a tie is written from the finalist's side, a shoot-out or extra time is FT, AET or the shoot-out under it, and for a series, two legs or a replay the tie's note ("in 7", "agg.") is written there instead. The final's own score is written between the two large marks; a final that has no score yet says "v".

```js
import { roadToFinal } from "@johnmorrisdotca/taisen-brackets";

const matchups = [
  { sides: ["A", "B"], score: [1, 0], date: "1" },
  { sides: ["C", "D"], score: [0, 2], date: "1" },
  { sides: ["A", "D"], date: "2" },
];

const chart = roadToFinal(matchups);
console.log(chart.totals.played); // false
console.log(chart.summary); // Matches played before the final: A (1) and D (1). The final is still to be played.
```

- `team` puts one finalist on the left (by id): `roadToFinal(tournament, { team: "FRA" })`. A team that is not a side of the final has no road to it, and is refused.
- `roundNames` names the rounds as the bracket's `roundNames` does (a list, or a format from `playoffFormat`), and the language of `locale` writes the words and the round names.
- A tournament whose final is not decided yet still draws: each finalist's road so far, and "v" in the middle.

## From two finalists

Or give the two finalists yourself, each a team with a `path`, its matches before the final, the earliest first, and optionally a `group`. A match is `{ round, opponent, score, decidedBy, pens }`:

| Field | What it is |
| --- | --- |
| `round` | A key. `round-of-32`, `round-of-16`, `quarter-final` and `semi-final` have words in every language; any other key is written as it is, or as `options.labels` names it (`{ "first-round": "First round" }`), so a play-off series reads as well as a knockout. |
| `opponent` | A team: its name, three letters, colour, and `mark` (or `logo`) or `flag`. |
| `score` | The finalist's first: `[2, 1]`, or text, `"4-2"` for the games of a series, split at its dash. A text that has no dash (`walkover`) is written whole. |
| `decidedBy`, `pens` | `ft` (the default), `aet` or `pens`, with the shoot-out `[4, 3]`, the finalist's first. FT, AET or the shoot-out is written under the score, in the order the two marks stand. |
| `homeFirst` | `true` puts the finalist's mark first (on the left) of the pair, `false` its opponent's. By default the finalist is at the outer edge of its side, so that the two paths mirror each other. |
| `note` | Words under the score in place of FT, AET or the shoot-out: `Game 6`. An empty text writes nothing. |

A group match is the same without `round`; its words under the score are left out unless `decidedBy` or `note` asks for them. A round only one finalist played (a bye) is an empty place on the other's side.

## Options

| Option | What it does |
| --- | --- |
| `title`, `subtitle` | The tournament, set large at the top, and the line under it (the language's "Road to the final" once a title is given). |
| `final` | `{ score, decidedBy, pens, note }`: the final's score, the first finalist's first. A tournament's own final is used when this is left out. |
| `labels`, `groupLabel` | The names of the rounds by key, and of the group stage, over the language's own words. |
| `size` | `card` (1080 by 1350, a tall post: the default), `square` (1080 by 1080), `wide` (1200 by 675, the finalists at the two ends) or `phone` (390 wide, as tall as the rounds need, each round's name over its row). |
| `winner` | `auto` (the default): the side that won each match is brighter and the other's mark and number are quiet; the winner of a shoot-out wins. `none` draws both alike. |
| `codes` | Write the opponent's three letters under its mark. On by default. |
| `endnote` | A line at the foot: a source, a credit, "Made-up results". |
| `locale`, `words`, `teamName` | The language (`en`, `fr`, `ja`, `es`, `de` or a `defineLocale`), any word replaced, and a team's name in the language, as for `drawBracket`. |
| `theme`, `background`, `id`, `className` | The look (`auto`, `light`, `dark`, `poster`, `none`), a transparent drawing, the prefix of the ids, extra classes; as for `drawBracket`. |
| `flags`, `markShape` | The renderer for a team's `flag` code, and `round` or `square` marks; as for `drawBracket`. |

`draw(extra)` lays options over the chart's own, so one chart gives every size: `chart.draw({ size: "phone", locale: "ja" })`. Two to six rounds draw in every size, with or without a group row. A name too long for its place is set on two lines in a smaller size.

## Marks

Each team is a flag or a crest clipped to a circle with a wide ring and a hairline outside it: the same mark as the bracket's road look. Give a team a `flag` code and the `flags` renderer (Hata's round flags are one line, see the README), a `mark` (an image address or inline SVG, cleaned like any mark), or nothing: a team with no picture is its initials on its colour, and the chart never draws a hole. A flag that repeats down a side is written once, as a `<symbol>`.

## The numbers and the table

`chart.totals` is `{ finalists, rounds, played, champion }`: each finalist's name, matches, wins, draws, losses, goals for and against (over the matches whose score is a pair of numbers), the rounds' keys earliest first, whether the final has a score, and the champion's name. `chart.table()` is one HTML table with a row for every match (the group stage, each round in order and the final) with the team, the round, the opponent, the score (the first column's team first), how it was decided and the result. The drawing itself is `role="img"` with a title and a description that says who played and who won.

## Colours

The chart is drawn with the same custom properties as the bracket (`--tb-bg`, `--tb-ink`, `--tb-muted`, `--tb-gold` and the rest, see [Drawing](./drawing.md)) and the road look's `--tb-mark-ring`, `--tb-mark-edge`, `--tb-panel` (the pill behind a round's name) and `--tb-spine` (the dotted road).
