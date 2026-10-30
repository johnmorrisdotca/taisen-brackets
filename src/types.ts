/**
 * The types of Taisen: what goes in (teams and matchups), what the layout works out (ties, rounds, halves) and what
 * the drawing takes as options. Nothing here runs; the functions are in `matchup.ts`, `layout.ts` and `render.ts`.
 */

import type { JudoOutcome, JudoResult } from "./judo-model.ts";

/** A side's key: a team code, a franchise id, anything that is unique within one bracket. */
export type SideId = string | number;

/** A side of a tie: a team, with the marks and labels a drawing needs. Only `id` and `name` are required. */
export interface Team {
  id: SideId;
  name: string;
  /** A short name for a small box (three letters is usual). Left out, one is made from the name. */
  abbr?: string;
  /** The seed, shown beside the name when `seeds` is on. */
  seed?: number;
  /** A tag for the road look's seed tags (`C1`, `WC2`, `M3`): written small beside the mark when `seeds` is on, in place of the number. A tie's `seeds` win over it. */
  tag?: string;
  /**
   * The team's mark: a logo or a flag. Either the address of an image (`https://`, `data:image/…`, or a relative
   * path) or inline SVG markup (`<svg …>`; a round flag from `@johnmorrisdotca/hata` goes here as it is).
   */
  mark?: string;
  /** The half this team belongs to when the halves are named: a conference, a region, a group. */
  group?: string;
  /** A colour for the team's initials when it has no mark, any CSS colour. */
  color?: string;
  /** The name in other languages, by locale code: `{ fr: "Allemagne", ja: "ドイツ" }`. The language of a drawing picks its own, else `name`. */
  names?: Readonly<Record<string, string>>;
  /** An ISO 3166 region code (`DE`), for `countryName` and a `teamName` that uses it. */
  region?: string;
  /**
   * A country code (`ca`, `GB-ENG`) for a round flag drawn by the `flags` option's renderer (`@johnmorrisdotca/hata` has one). With no
   * renderer, or one that has no flag for the code, the team's `mark` is drawn, or its initials: it never throws.
   */
  flag?: string;
  /** The three letters of the team's country (`JPN`), which the judo screens write beside the name (`judoWins`, `judoRoadPanel`). */
  code?: string;
}

/** One game of a tie: a match of a knockout, a game of a series, a leg of an aggregate, a replay. */
export interface Game {
  /** The score, in the order of the tie's `sides`. */
  score: readonly [number, number];
  date?: string;
  /** The game went to extra time (a.e.t.). */
  extraTime?: boolean;
  /** The penalty shoot-out's score, in the order of the tie's `sides`. */
  pens?: readonly [number, number];
  /** This game replays a drawn one (the World Cup of 1934 and 1938). */
  replay?: boolean;
  note?: string;
}

/** How a tie is contested. Left out, it is read from the other fields. */
export type MatchupKind =
  /** One game. */
  | "game"
  /** A best-of-N series: the first side to win most of N games goes on. */
  | "series"
  /** Two (or more) legs added up: the higher total goes on, a shoot-out settles a level one. */
  | "aggregate"
  /** A drawn game and the game replayed: the last one decides. */
  | "replay";

/** What takes a side of a tie: a tie's id (its winner, as `feeds` always meant) or `{ tie, result }`, which can name the tie's loser as well (a play-in's loser goes on to a decider). */
export type Feed = string | { tie: string; result: "winner" | "loser" };

/**
 * One tie: two sides and who went through. Everything but `sides` is optional, so that a bracket can be drawn from
 * what is known (the sides of a first round, a few results) and fill in as the games are played.
 */
export interface Matchup {
  /** Names the tie for `feeds` of another and for the table. Left out, `m1`, `m2`… by position. */
  id?: string;
  /** The two sides: a team's `id`, or a whole `Team`. `null` is a side that is not known yet (To be decided). */
  sides: readonly [SideId | Team | null, SideId | Team | null];
  /** The side that went through, by id. Left out, it is worked out from the games when they settle it. */
  winner?: SideId | null;
  /**
   * The round, from 1 (the first of the tree) to the final. `0` is a round-robin game, kept out of the tree.
   * Left out, a tie is one round after the latest tie that feeds it.
   */
  round?: number;
  /** A sortable date (`2022-12-18`, or with a time), which orders the ties of one round and tells which feeds which. */
  date?: string;
  /** A number that orders the ties of a round before the date does (a World Cup's match numbers). */
  no?: number;
  /**
   * Which ties feed this one: `feeds[0]` the one whose winner takes the first side, `feeds[1]` the second. Names the
   * tree outright, for a bracket whose sides are not known yet. Left out, a winner goes on to the next tie its team plays.
   */
  feeds?: readonly [Feed | null, Feed | null];
  /** How the tie is contested. Left out: replay if a game replays, series if there is a `bestOf` or several games, else game. */
  kind?: MatchupKind;
  /** The length of the series (7 for a best-of-seven). */
  bestOf?: number;
  /** The games, oldest first. */
  games?: readonly Game[];
  /** The legs of an aggregate tie: the same as `games`, with `kind` "aggregate". */
  legs?: readonly Game[];
  /**
   * The result, without the games: the score of a game, the games won of a series (`[4, 2]`), the total of an aggregate.
   */
  score?: readonly [number, number];
  /** The shoot-out of a game with no `games` list. */
  pens?: readonly [number, number];
  /** The game with no `games` list went to extra time. */
  extraTime?: boolean;
  /** The tie was settled without a game (a side withdrew): the note says so. */
  walkover?: boolean;
  /** This is the third-place match: it leads nowhere and is drawn apart. */
  third?: boolean;
  /**
   * `"play-in"`: a game of a play-in (the NBA's) that is outside the rounds of the tree: its winner (and loser, see `feeds`) goes on to a place the tree's ties name. Drawn by the `playin` layout and, apart, under the other layouts' trees.
   * `"repechage"` and `"bronze"`: a judo repechage contest and a bronze medal contest, fed by the losers of the tree's ties (`judoBracket` writes them); drawn apart under the tree.
   */
  stage?: "play-in" | "repechage" | "bronze";
  /** A judo contest's scores: ippon, waza-ari, yuko, shido, hansoku-make, golden score and time. The first side is white, the second blue. The score, the winner and the notes come from it; see `judoOutcome`. */
  judo?: JudoResult;
  /** The side playing at home (0 or 1), for the `at` wording of the `columns` layout: the home side is drawn second, after "AT". Left out, the second side. */
  home?: 0 | 1;
  note?: string;
  /** The seed tags of the two sides for this tie (`["C1", "WC2"]`), written beside the marks in the road look when `seeds` is on; a side's `Team.tag` is used where this has none. */
  seeds?: readonly [string | number | null, string | number | null];
}

/** What a tie came to, worked out from its games. */
export interface Result {
  kind: MatchupKind;
  /** The number drawn for each side: goals in a game, games won in a series, the total of an aggregate. `null` when nothing was played. */
  score: readonly [number, number] | null;
  /** The games played. */
  played: number;
  bestOf: number | null;
  pens: readonly [number, number] | null;
  extraTime: boolean;
  /** Replays played. */
  replays: number;
  /** The scores of the games, for a series or an aggregate, in the order of `sides`. */
  games: readonly (readonly [number, number])[];
  /** Whether one side has gone through. */
  decided: boolean;
}

/** A tie as the layout knows it. `index` is the position of its matchup in the list given. */
export interface Tie {
  index: number;
  id: string;
  /** The round (1 for the first round of the tree); the final round for a third-place match; 0 for a round-robin game. */
  round: number;
  /** The two sides; `null` where not known yet. */
  sides: readonly [Team | null, Team | null];
  /** 0 or 1: the side that went through, or `null`. */
  winner: 0 | 1 | null;
  result: Result;
  date: string;
  no: number | null;
  third: boolean;
  walkover: boolean;
  note: string | null;
  /** The seed tags given for the tie's sides (`Matchup.seeds`). */
  seeds?: readonly [string | number | null, string | number | null];
  /** Where each side comes from, when the matchup's `feeds` name it: another tie's winner or its loser. Left out for a tie that says nothing of the kind. */
  from?: readonly [Source | null, Source | null];
  /** The tie is a play-in game, a judo repechage contest or a bronze medal contest (`Matchup.stage`). */
  playIn?: boolean;
  /** The tie's `Matchup.stage`, when it has one. */
  stage?: "play-in" | "repechage" | "bronze";
  /** A judo contest's result, checked and worked out (`Matchup.judo`). */
  judo?: JudoOutcome;
  /** The side at home (`Matchup.home`), when given. */
  home?: 0 | 1;
}

/** Where a side of a tie comes from: the winner or the loser of the tie at `tie` (its index). */
export interface Source {
  tie: number;
  result: "winner" | "loser";
}

/** Where the layout put a tie. */
export type Place = "l" | "r" | "f" | "o";

/** A tie's place in the tree. */
export interface LayoutBox {
  /** The tie's index. */
  i: number;
  round: number;
  /** The row, 0 at the top; fractional where a tie sits between two. */
  y: number;
  /** The row of the tie this one feeds, or `null`. */
  to: number | null;
  /** Whether a tie feeds this one. */
  fed: boolean;
  /** Which side is drawn on top, then which below: `[0, 1]`, or `[1, 0]` when the top feeder's team is the second side. */
  order: readonly [0 | 1, 0 | 1];
  /** The side that had a bye (it came from no tie, though the other did), or `null`. */
  bye: 0 | 1 | null;
  /** Every side that skipped the earlier rounds: the `bye` side, and both sides of a tie of a later round that no tie feeds (MLS's round one, where seven teams of nine skip the wild card round). */
  byes: readonly (0 | 1)[];
}

export interface LayoutSide {
  /** `l` the left half (the top half on a phone), `r` the right. */
  key: "l" | "r";
  /** The group's name when the half is one group (a conference). */
  label: string | null;
  boxes: LayoutBox[];
  rows: number;
}

export interface BracketLayout {
  /** Every tie, in the order given. */
  ties: Tie[];
  /** How the tree is drawn: two halves that meet at the final, one tree left to right, or several (no single final). */
  shape: "halves" | "ltr" | "forest";
  sides: LayoutSide[];
  /** The final, when the halves meet at it: its row and the order of its sides (the first is the left half's). */
  final: { i: number; y: number; order: readonly [0 | 1, 0 | 1] } | null;
  /** The tie that is the final, when the last round holds one, in any shape. */
  finalIndex: number | null;
  /** The rounds drawn on the sides, in order (the final's own round is left out when the halves meet at it). */
  columns: number[];
  /** The number of rounds of the tree, the final's included. */
  rounds: number;
  rows: number;
  /** Ties that lead nowhere near the final, and round-robin games. */
  other: number[];
  robin: number[];
  /** The play-in games (`Matchup.stage`), kept out of the tree. */
  playIn: number[];
  /** The third-place match, when there is one. */
  third: number | null;
  /** Where each tie is: a half, the final, or elsewhere; by tie index. */
  place: Place[];
  /** The tie each tie feeds, by index; -1 for none. */
  parent: number[];
  /** The team that won the final, when it has been played. */
  champion: Team | null;
  /** Every team that appears, by id. */
  teams: Team[];
}

export interface BracketInput {
  matchups: readonly Matchup[];
  /** The teams: names, marks, groups. A side named by an id that is not here is a team of that name. */
  teams?: readonly Team[];
}

export interface LayoutOptions {
  /** `halves` (the default when two ties feed the final) draws two halves meeting at the final; `ltr` one tree left to right. */
  shape?: "auto" | "halves" | "ltr";
  /** The order of the halves' groups, first on the left: `["West", "East"]`. Left out, a name with "west" goes left and one with "east" right. */
  groupOrder?: readonly string[];
}

/** The words a drawing and a table use, in one language. Every one can be replaced (`words`), and a language can be added (`defineLocale`). Phrases take `{name}`-style holes. */
export interface Words {
  /** A side not known yet. */
  tbd: string;
  /** The word beside the score of a side that had a bye. */
  bye: string;
  /** A tie decided without a game (`Matchup.walkover`). */
  walkover: string;
  /** The label under the champion. */
  champion: string;
  thirdPlace: string;
  /** The heading over ties that lead nowhere near the final. */
  other: string;
  /** Short notes in a box: after extra time, penalties, aggregate, replay. */
  aet: string;
  pens: string;
  aggregate: string;
  replay: string;
  /** The same in a sentence (tooltip, table, description). */
  aetLong: string;
  /** `{a}`, `{b}`: the shoot-out's score. */
  pensScore: string;
  aggregateLong: string;
  /** `{n}`: "in 7" (games). */
  inGames: string;
  /** `{n}` games, `{w}` wins that settle it: "best of 7". */
  bestOf: string;
  /** `{n}`: a round with no name. */
  round: string;
  /** `{n}`: "Round of 64", for a round the language has no word of its own for. */
  roundOf: string;
  /** `{a}`, `{b}`: an undecided tie. */
  tieVs: string;
  /** `{a}`, `{b}` the names, `{sa}`, `{sb}` the scores. */
  tieScore: string;
  /** `{a}`, `{b}`: a score as written ("3–1"). */
  scoreText: string;
  /** `{team}`, `{score}`: the result beside a pair in the `picture` layout: "CLE wins 3–2". */
  pictureWins: string;
  /** `{name}`. */
  winnerIs: string;
  championIs: string;
  /** `{round}`, `{tie}`. */
  finalLine: string;
  /** `{n}` teams, `{r}` rounds. */
  summary: string;
  summaryOne: string;
  /** Joins the sentences of a description, and ends it. */
  sep: string;
  end: string;
  /** `{notes}`: the notes after a tie in a sentence; and what joins several notes. */
  note: string;
  noteJoin: string;
  columnRound: string;
  columnTie: string;
  columnNote: string;
  columnDate: string;
  /** The `<title>` of a drawing with no `title` option. */
  title: string;
  /** The road-to-the-final chart (`roadToFinal`): its title, the "v" between two finalists, the group stage, FT, AET, `{a}`, `{b}` the shoot-out, and the results. */
  roadTitle: string;
  roadVs: string;
  roadGroup: string;
  roadFt: string;
  roadAet: string;
  roadPens: string;
  roadWon: string;
  roadLost: string;
  roadDrew: string;
  /** The names of the two rounds a road names one match of (the other rounds come from the round names of the language). */
  roadQuarterFinal: string;
  roadSemiFinal: string;
  /** The road's table: the headings, the caption (`{a}`, `{b}`), the chart's name (`{a}`, `{b}`, `{title}`), the summary (`{a}`, `{b}`, `{an}`, `{bn}`) and its sentences. */
  roadTableTeam: string;
  roadTableOpponent: string;
  roadTableScore: string;
  roadTableDecided: string;
  roadTableResult: string;
  roadCaption: string;
  roadName: string;
  roadSummary: string;
  /** `{a}`, `{b}`, `{score}`, `{how}`. */
  roadFinal: string;
  /** `{name}`. */
  roadChampion: string;
  roadToPlay: string;
  /** "vs": the tag between two sides of a tie in the `columns` layout, and between the shields. */
  vs: string;
  /** The word between the two sides of a tie of the `columns` layout that names the home side (`at: true`): "AT". */
  at: string;
  /** `{n}`: a group's name, "Group A" (`n` is the letter). */
  groupName: string;
  /** The heads of a group table: played, won, drawn, lost, goal difference, points. */
  colPlayed: string;
  colWon: string;
  colDrawn: string;
  colLost: string;
  colDiff: string;
  colPoints: string;
  /** The heading over a bracket's play-in games. */
  playIn: string;
  /** `{a}`, `{b}`: the seeds of the two games a box takes the winner (or the loser) of: "Winner 9/10", "Loser 7/8". */
  playInWinner: string;
  playInLoser: string;
  /** `{n}`: a seed's place, "Seed 7". */
  seedSlot: string;
  /** `{name}`: a side that is the winner or loser of another tie, in a sentence or a table: "Loser of {name}". */
  winnerOf: string;
  loserOf: string;
  /** Judo. The marks of the scores on a box (ippon, waza-ari, yuko), the same written out, and how a contest was won. */
  judoIppon: string;
  judoWazaAri: string;
  judoYuko: string;
  judoIpponLong: string;
  judoWazaAriLong: string;
  judoYukoLong: string;
  judoMethodIppon: string;
  judoMethodAwasete: string;
  judoMethodScore: string;
  judoMethodHansoku: string;
  judoMethodFusen: string;
  judoMethodKiken: string;
  /** Golden score, short and in a sentence. */
  judoGolden: string;
  judoGoldenLong: string;
  /** `{t}`: the contest time ("3:42"). */
  judoTime: string;
  /** `{name}`, `{n}`: a side's shido ("Kenji Nakamura: 2 shido"). */
  judoShidoOf: string;
  /** `{a}`, `{b}`: the sides' shido in a short note. */
  judoShidoShort: string;
  /** The headings over the repechage contests and the bronze medal contests, alone and together; the sides' colours. */
  judoRepechage: string;
  judoBronze: string;
  judoRepechageBronze: string;
  judoWhite: string;
  judoBlue: string;
  /** `{sex}`, `{w}` (the number of kilograms, no sign): a weight category up to and including that weight ("Men -66 kg"), one over it ("Women +78 kg"), and the two sexes' words. */
  judoWeightClass: string;
  judoWeightOver: string;
  judoMen: string;
  judoWomen: string;
  /** The scoreboard of a contest: the osaekomi timer's label, the shido row's, a mat (`{n}`), a contest (`{n}`), the coach (`{name}`), and the drawing's default title. */
  judoOsaekomi: string;
  judoShido: string;
  judoMat: string;
  judoContest: string;
  judoCoach: string;
  judoBoardTitle: string;
  /** The default titles of the contest card and of the mat queue board. */
  judoCardTitle: string;
  judoQueueTitle: string;
  /** Ranking lists (`rankingList`): the heading, "points" and its short form, the champion's mark ("C") and its words, the interim champion's, newly ranked ("NR") and its words, the movement in a sentence (`{n}` places), no change, which entries are shown (`{a}`, `{b}`, `{n}`) and an empty list. */
  rankTitle: string;
  rankPoints: string;
  rankPointsShort: string;
  rankChampion: string;
  rankChampionLong: string;
  rankInterim: string;
  rankInterimLong: string;
  rankNew: string;
  rankNewLong: string;
  rankUp: string;
  rankDown: string;
  rankSame: string;
  rankRange: string;
  rankNone: string;
  /** What joins the pieces of one entry in the description ("1, NAKAMURA Kenji, 412.50 points"). */
  rankJoin: string;
  /** Number-one cards (`rankingNumberOnes`): the heading, and `{category}`: "#1 in -57 kg". The entry list (`rankingEntryList`): the heading, the column heading over the rankings, and the mark of an athlete with none. */
  rankNumberOnes: string;
  rankNumberOneIn: string;
  rankEntryTitle: string;
  rankColRanking: string;
  rankUnranked: string;
  /** The head-to-head card (`rankingMatchup`): the heading, the heading over the previous meetings, no meetings yet, and `{n}`: "+3 more". */
  rankMatchTitle: string;
  rankMeetings: string;
  rankNoMeetings: string;
  rankMore: string;
  /** The medal table (`medalTable`): the heading, no medals yet, the three medals and their one-letter marks, the total, and a row in a sentence (`{g}`, `{s}`, `{b}`, `{t}`). */
  medalTitle: string;
  medalNone: string;
  medalGold: string;
  medalSilver: string;
  medalBronze: string;
  medalGoldShort: string;
  medalSilverShort: string;
  medalBronzeShort: string;
  medalTotal: string;
  medalLine: string;
  /** A rank in the row sentence (`{n}`): "3", and "3位" in Japanese. */
  medalRank: string;
  /** The broadcast-style boards (`resultsBoard`, `boutBoard`, `broadcastMedalTable`): the sub bar\'s word for a result. */
  rbResult: string;
  /** The bout presentation board (`boutBoard`): the first bar, the bout's number (`{n}`), the second bar, the referee and a judge (`{n}`). */
  rbBoutPresentation: string;
  rbBout: string;
  rbOfficials: string;
  rbReferee: string;
  rbJudge: string;
}

/** A language: its words, the names of the rounds (by their English names), and the tag `Intl` formats numbers and dates for. */
export interface Locale {
  /** The code (`fr`) and the tag (`fr-CA`, `ja-JP`) used for numbers, dates and capitals. */
  code: string;
  tag: string;
  words: Words;
  /** Round names by their English name: `{ "Round of 16": "Huitièmes de finale" }`. A round with no entry keeps its name (or `roundOf`). */
  rounds: Readonly<Record<string, string>>;
}

export type { JudoMethod, JudoOutcome, JudoResult, JudoSide } from "./judo-model.ts";

export type ThemeName = "auto" | "light" | "dark" | "poster" | "none";

export type SizeName = "wide" | "square" | "phone" | "card";

export interface Size {
  /** The width of the drawing, in pixels. */
  width: number;
  /** Its height. `null` is as tall as the bracket needs (a phone's). */
  height: number | null;
}

/** How much a box shows: both names and scores, an abbreviation and the score, or only the marks. */
export type Detail = "auto" | "full" | "compact" | "mark";

/** How a flag is framed: `round` in a circle, `square`, or `rect` in its own proportions. */
export type FlagShape = "round" | "square" | "rect";

/** What a drawing asks a `flags` renderer for. */
export interface FlagRequest {
  shape: FlagShape;
  /** Width and height in pixels (the diameter, for a round flag). */
  size: number;
  /** `light` or `dark` for a drawing in that look (`poster` is dark); `inherit` for `auto` and `none`. */
  theme: "inherit" | "light" | "dark";
}

/**
 * A function from a country code and a request to an SVG string, or `null` or `undefined` for a code it has no flag for. It must be
 * synchronous: a drawing is a pure function of its options. `@johnmorrisdotca/hata`'s `flag()` is asynchronous, so load the flags first
 * (`await flag(code, { shape: "round" })` for each code) and pass `(code) => loaded[code]`.
 */
export type FlagRenderer = (code: string, request: FlagRequest) => string | null | undefined;

/** How a bracket is drawn: `classic` (the default) or `road`, with large round marks, big scores and a dotted path. */
export type Look = "classic" | "road";

/** How an emblem is drawn; the names are those of `@johnmorrisdotca/dougu-sports`. */
export type EmblemStyle = "metal" | "line" | "color";

/** What `drawBracket` asks an `emblems` renderer for. */
export interface EmblemRequest {
  style: EmblemStyle;
  /** Width and height in pixels. */
  size: number;
  /** The colour of the main part, when `emblemTint` is set. */
  tint?: string;
  /** `light` or `dark` for a bracket in that look (`poster` is dark); `inherit` for `auto` and `none`, where the drawing's stylesheet or the page sets the ink. */
  theme: "inherit" | "light" | "dark";
}

/** A function from an emblem id and a request to an SVG string; `renderEmblem` of `@johnmorrisdotca/dougu-sports/emblems` is one. */
export type EmblemRenderer = (id: string, options: EmblemRequest) => string;

/** A background preset's name. */
export type { BackgroundPresetName } from "./family-backgrounds.ts";
import type { BackgroundPresetName } from "./family-backgrounds.ts";

/** A preset, tuned: your own colours (hex or `rgb()`, the first two the ground), the gradient's angle, how strong the pattern is (0 to 1, default 0.6), a seed for the scattered parts, and which of its two variants. */
export interface BackgroundOptions {
  /** Default `midnight`. */
  preset?: BackgroundPresetName;
  colors?: readonly string[];
  angle?: number;
  intensity?: number;
  seed?: number;
  /** `light` or `dark`: the variant to draw. By default the one of the drawing's look. */
  theme?: "light" | "dark";
}

/** Your own picture as the background: an image address (http(s), relative or `data:image/…`; anything else is refused), laid under a veil so the text reads. */
export interface BackgroundImageOptions {
  image: string;
  /** `cover` (the default) fills the drawing; `contain` shows all of the picture. */
  fit?: "cover" | "contain";
  /** How dark (or, in a light look, how pale) the veil is, 0 to 1. Default 0.5. */
  dim?: number;
  theme?: "light" | "dark";
}

/** How the ties are drawn: `tree` (the default) is the bracket as ever; the others are other ways to draw the same ties. */
export type LayoutName = "tree" | "rows" | "shields" | "update" | "columns" | "playin" | "series" | "groups" | "picture";

export interface DrawOptions extends LayoutOptions {
  /**
   * `tree` (the default): the halves meeting at the final. `rows`: each team a row, its name on the left and its mark on the right, a slot for the result toward the centre. `shields`: marks in shields with "vs",
   * the matchups on both sides of the trophy. `update`: a compact score-update card. `columns`: tall slots that grow toward the centre, the conferences in two colours, "VS" (or "AT") on a tag, big seed numbers.
   * `playin`: the play-in games with their winners and losers going on. `series`: a tall card, one line a series ("BOS 4-0 MIA"), the first half above and the second below. `groups`: the group-stage tables.
   * `picture`: the postseason picture: the two halves mirrored toward the final, each club a logo tile with its seed, each series' result beside its pair ("CLE wins 3-2"), the round's name and its length ("Best of 5") under its column, the champion big in the middle.
   */
  layout?: LayoutName;
  /** Big title tiles (the halves' groups: West and East, AFC and NFC) over each half, in any layout: each half's `group` name in the colour of that half. Default false. */
  headers?: boolean;
  /** In the `columns` layout, write "AT" (the word `at` of the language) in place of "VS" between the two sides of a tie: the first side is the visitor and the second the home side (`Matchup.home` says otherwise). Default false. */
  at?: boolean;
  /** In the `groups` layout, the columns of a group's table: `points` (played, won, drawn, lost, goal difference, points) or `record` (won and lost, softball's). Default `points`. */
  standings?: "points" | "record";
  /** In the `groups` layout, how many teams of each group go through: their rows are marked. Default 0, none. */
  qualify?: number;
  /** For `bracketStyle`: include the judo rules (the white and blue side bars, the shido cards). `drawBracket` adds them by itself when a tie has judo scores. */
  judo?: boolean;
  /** Write the `<style>` into the drawing. Default true; false leaves it out, for a second drawing of a page that shares the first's (`styleScope`, `bracketStyle`). */
  style?: boolean;
  /** A class that carries this drawing's rules in place of its own: two drawings with the same `styleScope` take their colours from one `<style>`, and the second can leave it out (`style: false`). A word of letters, digits, `-` and `_`. */
  styleScope?: string;
  /** `wide` 1200 by 675, `square` 1080 by 1080, `card` 1080 by 1350 (a tall post), `phone` 390 wide and as tall as it needs; or a size of your own. Default `wide`. */
  size?: SizeName | { width: number; height?: number | null };
  /** `horizontal`: the rounds are columns. `vertical`: the rounds are rows, for a tall page. Default horizontal; the phone's is vertical. */
  orientation?: "auto" | "horizontal" | "vertical";
  detail?: Detail;
  /** `auto` follows the page's light or dark; `poster` is dark with gold lines; `none` writes no style, for your own CSS. Default `auto`. */
  theme?: ThemeName;
  /**
   * The background. `true` (the default) is the look's plain colour and `false` a transparent drawing. A preset's name (`"midnight"`, `"ice"`, see `BACKGROUND_PRESETS`) draws that
   * poster background in the look's light or dark variant (`auto` draws both and shows the one that fits the page), and the text, lines, boxes and marks take the colours that
   * read over it. An object tunes a preset (`{ preset, colors, angle, intensity, seed }`) or draws your own picture (`{ image, fit, dim }`).
   */
  background?: boolean | BackgroundPresetName | BackgroundOptions | BackgroundImageOptions;
  /** In the road look, write a small `vs` between the two marks of a box of marks alone. Default false. */
  vs?: boolean;
  /** In the road look, write each team's three-letter code under its mark in a box of marks alone. Default false for a bracket (a chart's `codes` is on by default). */
  codes?: boolean;
  title?: string;
  subtitle?: string;
  /** Names of the rounds, first round first (or just the last ones). Default: Final, Semi-finals, Quarter-finals, Round of 16… */
  roundNames?: readonly string[] | { rounds: readonly { name: string }[] };
  /** Show the round names over the columns. Default true; false in the flag-only look. */
  roundLabels?: boolean;
  /** Show the scores. Default true. */
  scores?: boolean;
  /** Show seeds: the number before the name in the classic look, and in the road look a small tag (`C1`, `WC2`: `Matchup.seeds`, else `Team.tag`, else `Team.seed`) beside each mark. Default false. */
  seeds?: boolean;
  /** `round` (the default), `square`, or `none` (names only). */
  markShape?: "round" | "square" | "none";
  /** Show the champion in the centre once the final is played. Default true. */
  champion?: boolean;
  /**
   * A trophy for the centre, drawn above the champion: inline SVG, an image address, or (with `emblems`) an emblem id such as
   * `"trophy:hockey-cup"`. An emblem id with no `emblems` renderer draws nothing and takes no room.
   */
  trophy?: string;
  /**
   * Draws the emblem a `trophy` id names: any function from an id and a request to an SVG string, such as `renderEmblem` from
   * `@johnmorrisdotca/dougu-sports/emblems`. Called once per champion, with the size the trophy has in the drawing. Its SVG is cleaned
   * like any inline SVG; a renderer that throws, or returns something that is not an `<svg>`, draws no trophy.
   */
  emblems?: EmblemRenderer;
  /** The style an emblem is drawn in: `metal` (the default), `line` or `color`. */
  emblemStyle?: EmblemStyle;
  /** A colour for the emblem's main part (a hex colour or `rgb()`), passed to the renderer as `tint`. */
  emblemTint?: string;
  /**
   * Draws the flag a team's `flag` code names: a synchronous function from a code and `{ shape, size, theme }` to an SVG string, such as one
   * made from `@johnmorrisdotca/hata`. With none, or when it returns nothing for a code, the team's `mark` or its initials are drawn.
   */
  flags?: FlagRenderer;
  /**
   * The address of the flag a team's `flag` code names, for a flag that is a picture to load (a file on your own server) and not SVG to inline, which can be 80 kB for one flag. Tried where `flags` gives
   * none; the address must be http(s), relative or `data:image/…`, and is written once as a symbol however many times the flag appears.
   */
  flagHref?: (code: string) => string | null | undefined;
  /**
   * A class for each tie's group, from the tie: `(tie) => tie.sides.some(inDivision) ? "mine" : "other"`. A word of letters, digits, `-` and `_` is added to the group's classes (anything else is left out),
   * so that a page's own style can highlight or dim ties: `.mine .tb-box { stroke: … }`. `undefined` or an empty text adds none.
   */
  tieClass?: (tie: Tie) => string | null | undefined;
  /**
   * `classic` (the default) or `road`: the look of the road-to-the-final chart, with large round marks, big bold scores, the loser quiet, the
   * rounds named on pills and a dotted path. Every other option works in both.
   */
  look?: Look;
  /**
   * A link for each tie's box, from the tie and, for a link on one team's row, its side (0 or 1). Called with the tie alone first: an address
   * makes the whole box a link; when that gives none, each side is asked, and a row with an address is a link of its own. Each is a real
   * `<a href>` in the SVG with an accessible name; an address that is not http(s), relative or a `#` fragment is refused. `undefined` is no link.
   */
  href?: (tie: Tie, side?: 0 | 1) => string | null | undefined;
  /** The id of a team whose path to the final is drawn as a dotted line in the look's highlight, the rest quieter. */
  highlightPath?: SideId;
  /** Where the third-place match goes: `below` the final (the default) or `hide`. */
  thirdPlace?: "below" | "hide";
  /** Highlight the side that went through. Default true. */
  winnerHighlight?: boolean;
  /** The language: `en` (the default), `fr`, `ja`, `es`, `de`, or a `Locale` you made with `defineLocale`. Sets the words, the round names, the number and date formats and the `lang` of the drawing. */
  locale?: string | Locale;
  /** Replace any of the language's words. */
  words?: Partial<Words>;
  /** The name to draw for a team in this language: `undefined` keeps `Team.names[locale]` or `Team.name`. `countryName(team.region, locale)` makes a country's name from Intl, with no list of your own. */
  teamName?: (team: Team, locale: Locale) => string | undefined;
  /** Prefix for the drawing's ids. Default: a hash of the bracket and the options. Only letters, digits, `_` and `-` are kept (any other character becomes `-`), and an id that does not start with a letter gets the drawing's own prefix in front. */
  id?: string;
  /** Extra class names for the root `<svg>`. */
  className?: string;
}
