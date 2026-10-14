/**
 * The types of Taisen: what goes in (teams and matchups), what the layout works out (ties, rounds, halves) and what
 * the drawing takes as options. Nothing here runs; the functions are in `matchup.ts`, `layout.ts` and `render.ts`.
 */

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
  /**
   * The team's mark: a logo or a flag. Either the address of an image (`https://`, `data:image/…`, or a relative
   * path) or inline SVG markup (`<svg …>`; a round flag from `@johnmorrisdotca/hata` goes here as it is).
   */
  mark?: string;
  /** The half this team belongs to when the halves are named: a conference, a region, a group. */
  group?: string;
  /** A colour for the team's initials when it has no mark, any CSS colour. */
  color?: string;
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
  feeds?: readonly [string | null, string | null];
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
  /** This is the third-place match: it leads nowhere and is drawn apart. */
  third?: boolean;
  note?: string;
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
  note: string | null;
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

/** The words a drawing and a table use. Every one can be replaced (`words`). */
export interface Words {
  tbd: string;
  bye: string;
  champion: string;
  thirdPlace: string;
  /** The heading over ties that lead nowhere near the final. */
  other: string;
  final: string;
  aet: string;
  pens: string;
  aggregate: string;
  replay: string;
  /** `{n}` is the number of games: "in 7". */
  inGames: string;
  /** `{n}`: "Best of 7". */
  bestOf: string;
  /** `{n}`: "Round 3" for a round with no name. */
  round: string;
  winner: string;
  versus: string;
  /** The table's column titles. */
  columnRound: string;
  columnTie: string;
  columnResult: string;
  columnNote: string;
  /** `{n}` teams, `{r}` rounds. */
  summary: string;
  title: string;
}

export type ThemeName = "auto" | "light" | "dark" | "poster" | "none";

export type SizeName = "wide" | "square" | "phone";

export interface Size {
  /** The width of the drawing, in pixels. */
  width: number;
  /** Its height. `null` is as tall as the bracket needs (a phone's). */
  height: number | null;
}

/** How much a box shows: both names and scores, an abbreviation and the score, or only the marks. */
export type Detail = "auto" | "full" | "compact" | "mark";

export interface DrawOptions extends LayoutOptions {
  /** `wide` 1200 by 675, `square` 1080 by 1080, `phone` 390 wide and as tall as it needs; or a size of your own. Default `wide`. */
  size?: SizeName | { width: number; height?: number | null };
  /** `horizontal`: the rounds are columns. `vertical`: the rounds are rows, for a tall page. Default horizontal; the phone's is vertical. */
  orientation?: "auto" | "horizontal" | "vertical";
  detail?: Detail;
  /** `auto` follows the page's light or dark; `poster` is dark with gold lines; `none` writes no style, for your own CSS. Default `auto`. */
  theme?: ThemeName;
  /** Draw a background. Default true; false for a transparent drawing. */
  background?: boolean;
  title?: string;
  subtitle?: string;
  /** Names of the rounds, first round first (or just the last ones). Default: Final, Semi-finals, Quarter-finals, Round of 16… */
  roundNames?: readonly string[] | { rounds: readonly { name: string }[] };
  /** Show the round names over the columns. Default true; false in the flag-only look. */
  roundLabels?: boolean;
  /** Show the scores. Default true. */
  scores?: boolean;
  /** Show seeds before names. Default false. */
  seeds?: boolean;
  /** `round` (the default), `square`, or `none` (names only). */
  markShape?: "round" | "square" | "none";
  /** Show the champion in the centre once the final is played. Default true. */
  champion?: boolean;
  /** A trophy for the centre: inline SVG or an image address. Drawn above the champion. */
  trophy?: string;
  /** Where the third-place match goes: `below` the final (the default) or `hide`. */
  thirdPlace?: "below" | "hide";
  /** Highlight the side that went through. Default true. */
  winnerHighlight?: boolean;
  /** The words, in another language or your own. */
  words?: Partial<Words>;
  /** Prefix for the drawing's ids. Default: a hash of the bracket and the options. */
  id?: string;
  /** Extra class names for the root `<svg>`. */
  className?: string;
}
