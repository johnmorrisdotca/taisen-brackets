// The road-to-the-final chart: the two finalists of a tournament with the matches each played on the way, as round flags (or crests) of both teams with the score between
// them, the rounds named down the middle, and the group stage as a compact row at the foot. The idea is that of the "road to the final" graphics that sports sites post
// for a World Cup or a Stanley Cup; the arrangement, the type and the code are this package's own, and no one's artwork is used: the marks are the caller's flags and
// logos, or the team's initials on its colour.
import { SIZES } from "./render.ts";
import { drawRoad } from "./road.draw.ts";
import { nameOf, readModel, summaryOf, tableOf, totalsOf } from "./road.model.ts";
import type { RoadChart, RoadInput, RoadOptions } from "./road.types.ts";
import { hash, safeId } from "./text.ts";

export type { RoadChart, RoadDecided, RoadFinal, RoadFinalist, RoadGroupMatch, RoadInput, RoadMatch, RoadOptions, RoadRecord, RoadScore, RoadSize, RoadTeam, RoadTotals } from "./road.types.ts";

const check = (o: RoadOptions): void => {
  if (o.size !== undefined && !Object.prototype.hasOwnProperty.call(SIZES, o.size)) throw new RangeError(`Unknown size "${String(o.size)}": use one of ${Object.keys(SIZES).join(", ")}`);
};

/**
 * The road to the final: the two finalists as large round marks with their names at the top, each one's matches on its side (the round mark of both teams with the
 * score between them, and FT, AET or the shoot-out under it), the round names down the middle, and the group stage as a compact row of small marks, codes and scores.
 * `input` is a tournament, the same one `drawBracket` draws (a list of matchups, `{ matchups, teams }` or a layout): the two sides of its final are the finalists, each one's
 * played ties (round-robin games, `round: 0`, as the group stage) are its road, and `team` puts one finalist on the left. Or it is the two finalists, each a team (`name`,
 * `abbr`, `mark` or `logo` for the flag or crest, `flag` for a country code drawn by `flags`, `color`) with its `path`, the matches before the final, the earliest first,
 * and optionally its `group`; a match is `{ round, opponent, score: [for, against], decidedBy, pens }`, a round a key (`quarter-final`) with words in every language, or any
 * key you name in `labels`, so a series (`First round`, `4-2`) draws as well as a knockout. A team with no mark is its initials on its colour. The side that won each match
 * is brighter; the sizes are `card` (1080 by 1350, the default), `square`, `wide` (1200 by 675) and `phone` (390 wide). `table()` lists every match as text.
 * @example
 * ```ts
 * import { roadToFinal, type RoadFinalist } from "@johnmorrisdotca/taisen-brackets";
 * const owls: RoadFinalist = { name: "Northern Owls", abbr: "NOW", color: "#3a2d6b", path: [
 *   { round: "quarter-final", opponent: { name: "Coastal Pines", abbr: "CPN" }, score: [2, 0] },
 *   { round: "semi-final", opponent: { name: "Valley Stars", abbr: "VAL" }, score: [1, 1], decidedBy: "pens", pens: [4, 3] },
 * ] };
 * const gulls: RoadFinalist = { name: "Harbour City Gulls", abbr: "HCG", color: "#1d4f91", path: [
 *   { round: "quarter-final", opponent: { name: "Summit Peaks", abbr: "SMT" }, score: [3, 1] },
 *   { round: "semi-final", opponent: { name: "Metro Bolts", abbr: "MTB" }, score: [2, 1], decidedBy: "aet" },
 * ] };
 * const chart = roadToFinal([owls, gulls], { title: "Northern Cup 2030", size: "square" });
 * console.log(chart.totals.rounds.join(" "), chart.draw().startsWith("<svg"), chart.table().includes("Semi-final"));
 * // quarter-final semi-final true true
 * ```
 */
export function roadToFinal(input: RoadInput, options: RoadOptions = {}): RoadChart {
  if (typeof options !== "object" || options === null) throw new TypeError("options is an object");
  check(options);
  const model = readModel(input, options);
  const build = (extra: Partial<RoadOptions> = {}): string => {
    const merged: RoadOptions = { ...options, ...extra };
    check(merged);
    const m = readModel(input, merged);
    const prefix = safeId(merged.id, "tb") ?? `tb-${hash(JSON.stringify([m.voice.locale.code, m.finalists.map((t) => t.name), [...m.path[0].values()].map((v) => [v.round, v.mine, v.theirs]), [...m.path[1].values()].map((v) => [v.round, v.mine, v.theirs]), m.rounds, merged.size, merged.theme, merged.title, merged.subtitle, merged.final ?? null, merged.endnote, merged.winner, merged.codes, merged.markShape, ...(typeof merged.background === "string" || typeof merged.background === "object" ? [merged.background] : [])]))}`;
    return drawRoad(m, merged, prefix);
  };
  return {
    options: { ...options },
    title: nameOf(model),
    summary: summaryOf(model),
    totals: totalsOf(model),
    draw: build,
    table: (tableOptions = {}) => tableOf(tableOptions.locale === undefined ? model : readModel(input, { ...options, locale: tableOptions.locale }), tableOptions),
  };
}
