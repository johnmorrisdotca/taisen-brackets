// The types of the road-to-the-final chart: what `roadToFinal` takes (a tournament, or the two finalists and the matches on their way) and what it gives back.
import type { BracketInput, BracketLayout, DrawOptions, Matchup, SideId, SizeName, Team } from "./types.ts";

/**
 * A team of a road chart: a `Team` whose `id` is optional (a standalone finalist needs only a name), with `logo` as another name for `mark`.
 *
 * @example
 * ```ts
 * import { roadToFinal, type RoadTeam } from "@johnmorrisdotca/taisen-brackets";
 *
 * const gulls: RoadTeam = { name: "Harbour City Gulls", abbr: "HCG", color: "#1d4f91" };
 * const owls: RoadTeam = { name: "Northern Owls", abbr: "NOW" };
 * const chart = roadToFinal([{ ...gulls, path: [] }, { ...owls, path: [] }]);
 * console.log(chart.totals.finalists.map((one) => one.name));
 * ```
 */
export type RoadTeam = Omit<Team, "id" | "group"> & {
  id?: SideId;
  /** The address or inline SVG of a flag or a crest: another name for `mark`. */
  logo?: string;
};

/**
 * A match's score from the finalist's side: `[for, against]` (numbers, or text such as a series' `4`), or one text, `"4-2"`, that is split at its dash.
 *
 * @example
 * ```ts
 * import { type RoadScore } from "@johnmorrisdotca/taisen-brackets";
 *
 * const game: RoadScore = [2, 1];
 * const series: RoadScore = "4-2";
 * console.log(game, series);
 * ```
 */
export type RoadScore = readonly [number | string, number | string] | string;

/**
 * How a match was decided: `ft` (full time, the default), `aet` (after extra time) or `pens` (a shoot-out after extra time).
 *
 * @example
 * ```ts
 * import { type RoadDecided } from "@johnmorrisdotca/taisen-brackets";
 *
 * const how: RoadDecided = "pens";
 * console.log(how);
 * ```
 */
export type RoadDecided = "ft" | "aet" | "pens";

/**
 * One match on a finalist's way.
 *
 * @example
 * ```ts
 * import { type RoadMatch } from "@johnmorrisdotca/taisen-brackets";
 *
 * const semi: RoadMatch = { round: "semi-final", opponent: { name: "Valley Stars", abbr: "VAL" }, score: [1, 1], decidedBy: "pens", pens: [4, 3] };
 * console.log(semi.round, semi.decidedBy);
 * ```
 */
export interface RoadMatch {
  /** The round, as a key. `round-of-32`, `round-of-16`, `quarter-final` and `semi-final` have words in every language; any other key is written as it is, or as `options.labels` names it. */
  round: string;
  /** The team it played: its name, abbreviation, `mark` or `flag`, and `color`. */
  opponent: RoadTeam;
  /** The score, the finalist's first: `[2, 1]` is a 2-1 win. */
  score: RoadScore;
  /** How it was decided: `ft` by default, or `pens` when `pens` is given. Written under the score: FT, AET, or the shoot-out. */
  decidedBy?: RoadDecided;
  /** The shoot-out, the finalist's first: `[4, 3]`. */
  pens?: readonly [number | string, number | string];
  /** The order of the pair, left to right: `true` the finalist first, `false` its opponent first. By default the finalist is at the outer edge of its side, so that the two paths mirror each other. */
  homeFirst?: boolean;
  /** Words to write under the score in place of FT, AET or the shoot-out (`Game 6`, `in 7`). An empty text writes nothing. */
  note?: string;
}

/**
 * One match of the group stage: as a knockout match, without a round.
 *
 * @example
 * ```ts
 * import { type RoadGroupMatch } from "@johnmorrisdotca/taisen-brackets";
 *
 * const opener: RoadGroupMatch = { opponent: { name: "Summit Peaks", abbr: "SMT" }, score: [0, 0] };
 * console.log(opener.score);
 * ```
 */
export type RoadGroupMatch = Omit<RoadMatch, "round"> & { round?: string };

/**
 * A finalist: a team and the matches it played on the way, the earliest first.
 *
 * @example
 * ```ts
 * import { roadToFinal, type RoadFinalist } from "@johnmorrisdotca/taisen-brackets";
 *
 * const owls: RoadFinalist = { name: "Northern Owls", abbr: "NOW", path: [{ round: "semi-final", opponent: { name: "Valley Stars" }, score: [2, 0] }] };
 * const gulls: RoadFinalist = { name: "Harbour City Gulls", abbr: "HCG", path: [{ round: "semi-final", opponent: { name: "Metro Bolts" }, score: [2, 1] }] };
 * console.log(roadToFinal([owls, gulls]).totals.rounds);
 * ```
 */
export interface RoadFinalist extends RoadTeam {
  /** The knockout matches before the final, the earliest first. */
  path: readonly RoadMatch[];
  /** The group stage, in the order played. A row of small marks, codes and scores at the foot. */
  group?: readonly RoadGroupMatch[];
}

/**
 * The final, when it has been played.
 *
 * @example
 * ```ts
 * import { roadToFinal, type RoadFinal } from "@johnmorrisdotca/taisen-brackets";
 *
 * const final: RoadFinal = { score: [1, 2], decidedBy: "aet" };
 * const chart = roadToFinal([{ name: "Owls", path: [] }, { name: "Gulls", path: [] }], { final });
 * console.log(chart.totals.champion);
 * ```
 */
export interface RoadFinal {
  /** The score, the first finalist's first. */
  score: RoadScore;
  decidedBy?: RoadDecided;
  /** The shoot-out, the first finalist's first. */
  pens?: readonly [number | string, number | string];
  note?: string;
}

/**
 * The sizes of the road chart are the bracket's: `card` (the default here), `square`, `wide` (the finalists at the two ends) and `phone`.
 *
 * @example
 * ```ts
 * import { roadToFinal, type RoadSize } from "@johnmorrisdotca/taisen-brackets";
 *
 * const size: RoadSize = "wide";
 * console.log(roadToFinal([{ name: "Owls", path: [] }, { name: "Gulls", path: [] }], { size }).draw().startsWith("<svg"));
 * ```
 */
export type RoadSize = SizeName;

/**
 * What `roadToFinal` takes besides the finalists or the tournament.
 *
 * @example
 * ```ts
 * import { roadToFinal, type RoadOptions } from "@johnmorrisdotca/taisen-brackets";
 *
 * const options: RoadOptions = { title: "Northern Cup 2030", size: "square", codes: true };
 * console.log(roadToFinal([{ name: "Owls", abbr: "NOW", path: [] }, { name: "Gulls", abbr: "HCG", path: [] }], options).title);
 * ```
 */
export interface RoadOptions extends Pick<DrawOptions, "locale" | "words" | "teamName" | "roundNames" | "markShape" | "flags" | "flagHref" | "theme" | "background" | "id" | "className"> {
  /** With a tournament: the finalist whose road is on the left (by team id); the other finalist is its opponent in the final. Left out, the first side of the final. */
  team?: SideId;
  /** The tournament, set large at the top. The language's "Road to the final" when missing. */
  title?: string;
  /** The line under it. "Road to the final" when a `title` is given. */
  subtitle?: string;
  /** The final, if it has been played: its score is written between the two big marks, the winner is brighter, and the table has a row for it. A tournament's own final is used when this is left out. */
  final?: RoadFinal;
  /** The names of the rounds, by key, over the language's own words: `{ "first-round": "First round" }`. */
  labels?: Readonly<Record<string, string>>;
  /** The group stage's name, over the language's own. */
  groupLabel?: string;
  /** `card` (the default), `square`, `wide` or `phone`. */
  size?: RoadSize;
  /** Who is brighter: `auto` (the default) the side that won each match, `none` nobody. */
  winner?: "auto" | "none";
  /** Write the opponent's three-letter code under its mark. On by default. */
  codes?: boolean;
  /** A line at the foot: a source, a credit, "Made-up results". */
  endnote?: string;
}

/**
 * One finalist's record on the way.
 *
 * @example
 * ```ts
 * import { roadToFinal, type RoadRecord } from "@johnmorrisdotca/taisen-brackets";
 *
 * const chart = roadToFinal([{ name: "Owls", path: [{ round: "semi-final", opponent: { name: "Stars" }, score: [2, 0] }] }, { name: "Gulls", path: [] }]);
 * const owls: RoadRecord = chart.totals.finalists[0];
 * console.log(owls.matches, owls.won, owls.scored);
 * ```
 */
export interface RoadRecord {
  name: string;
  /** Matches played in the group and the knockout rounds (not the final), and how many it won, drew and lost. */
  matches: number;
  won: number;
  drawn: number;
  lost: number;
  /** The goals it scored and let in over the matches whose score is a pair of numbers. */
  scored: number;
  conceded: number;
}

/**
 * The numbers behind a road chart.
 *
 * @example
 * ```ts
 * import { roadToFinal, type RoadTotals } from "@johnmorrisdotca/taisen-brackets";
 *
 * const totals: RoadTotals = roadToFinal([{ name: "Owls", path: [] }, { name: "Gulls", path: [] }]).totals;
 * console.log(totals.played, totals.champion);
 * ```
 */
export interface RoadTotals {
  finalists: [RoadRecord, RoadRecord];
  /** The rounds of the chart, the earliest first, as keys. */
  rounds: string[];
  /** The final has a score. */
  played: boolean;
  /** The winner of the final, or null when it has not been played or is level. */
  champion: string | null;
}

/**
 * What `roadToFinal` takes: the two finalists with their paths, or a tournament (a list of matchups, `{ matchups, teams }` or a layout) whose final has two sides.
 *
 * @example
 * ```ts
 * import { roadToFinal, type RoadInput } from "@johnmorrisdotca/taisen-brackets";
 *
 * const input: RoadInput = [{ sides: ["Aurora", "Harbour"], score: [2, 1] }, { sides: ["Cascade", "Delta"], score: [0, 1] }, { sides: ["Aurora", "Delta"], score: [3, 1] }];
 * console.log(roadToFinal(input).totals.champion);
 * ```
 */
export type RoadInput = readonly [RoadFinalist, RoadFinalist] | BracketLayout | readonly Matchup[] | BracketInput;

/**
 * What `roadToFinal` gives back.
 *
 * @example
 * ```ts
 * import { roadToFinal, type RoadChart } from "@johnmorrisdotca/taisen-brackets";
 *
 * const chart: RoadChart = roadToFinal([{ sides: ["Aurora", "Harbour"], score: [2, 1] }, { sides: ["Cascade", "Delta"], score: [0, 1] }, { sides: ["Aurora", "Delta"], score: [3, 1] }]);
 * console.log(chart.title, chart.draw().startsWith("<svg"), chart.table().startsWith("<table"));
 * ```
 */
export interface RoadChart {
  /** The options the chart was made with: pass changes to `draw`. */
  options: RoadOptions;
  /** The chart's accessible name, in the chart's language. */
  title: string;
  /** What the chart shows, in a sentence or two, for a caption. */
  summary: string;
  /** The numbers behind it. */
  totals: RoadTotals;
  /** The drawing as an SVG string. `extra` is laid over the options (`size`, `theme`, `locale`, `labels`, `final`…). */
  draw(extra?: Partial<RoadOptions>): string;
  /** One HTML table with a row for every match: the table that stands for the drawing for a screen reader. */
  table(options?: { className?: string; locale?: RoadOptions["locale"] }): string;
}
