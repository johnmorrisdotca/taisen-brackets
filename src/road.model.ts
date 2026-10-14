// The road chart's data, read and checked: the scores split into the two sides, who won each match, the words under each score, the rounds in the order played, and
// the sentences and the table that say the same in words. A tournament (`layoutBracket`'s input) is turned into the two finalists' roads here. Nothing here draws.
import { layoutBracket } from "./layout.ts";
import { fill, voiceOf, type Voice } from "./locales.ts";
import { noteParts } from "./matchup.ts";
import { localizedLayout } from "./render.ts";
import { roundLabel } from "./rounds.ts";
import { abbreviate, esc } from "./text.ts";
import type { RoadDecided, RoadFinal, RoadFinalist, RoadGroupMatch, RoadInput, RoadMatch, RoadOptions, RoadRecord, RoadScore, RoadTeam, RoadTotals } from "./road.types.ts";
import type { BracketLayout, Team, Tie, Words } from "./types.ts";

/** Who won a match, from the finalist's side. `unknown` when the score is not a pair of numbers. */
export type Result = "win" | "loss" | "draw" | "unknown";

/** A match as it is drawn: the two scores written, who won, and how it was decided. */
export interface MatchView {
  /** The round's key; empty for a match of the group stage. */
  round: string;
  opponent: Team;
  /** The finalist's score and the opponent's, written. For a score that is one text that could not be split, `whole` is that text and the two are empty. */
  mine: string;
  theirs: string;
  whole?: string;
  result: Result;
  decided: RoadDecided;
  pens?: [string, string];
  /** The words that replace the usual ones under the score, or undefined. */
  note?: string;
  /** Whether the usual words (FT, AET, the shoot-out) are written: always for a knockout match, only when asked for a group match. */
  says: boolean;
  homeFirst?: boolean;
}

/** The chart's data, ready to draw. */
export interface Model {
  voice: Voice;
  words: Words;
  finalists: [Team, Team];
  /** The matches of the group stage, for each finalist. */
  group: [MatchView[], MatchView[]];
  /** The knockout matches for each finalist, by round key. */
  path: [Map<string, MatchView>, Map<string, MatchView>];
  /** The rounds, the earliest first. */
  rounds: string[];
  /** The final, if played: the scores of the first finalist and the second. */
  final?: MatchView;
  label(key: string): string;
  groupLabel: string;
  title: string;
  subtitle: string | undefined;
}

const own = (object: object | undefined, key: string): boolean => object !== undefined && Object.prototype.hasOwnProperty.call(object, key);

/** A number from a number or from text that is one, else undefined. */
export function numeric(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && /^\s*-?\d+(?:\.\d+)?\s*$/.test(value)) return Number(value);
  return undefined;
}

const written = (value: unknown): string => (value === undefined || value === null ? "" : String(value).trim());

/** The two sides of a score. */
function split(score: RoadScore): { mine: string; theirs: string; whole?: string } {
  if (Array.isArray(score) && score.length === 2) return { mine: written(score[0]), theirs: written(score[1]) };
  const text = written(score);
  const parts = /^(\S+?)\s*[-–—:]\s*(\S+)$/.exec(text);
  if (parts !== null) return { mine: parts[1], theirs: parts[2] };
  return { mine: "", theirs: "", whole: text };
}

function resultOf(mine: string, theirs: string, pens: [string, string] | undefined): Result {
  const a = numeric(mine);
  const b = numeric(theirs);
  if (a === undefined || b === undefined) return "unknown";
  if (a !== b) return a > b ? "win" : "loss";
  const p = pens === undefined ? undefined : [numeric(pens[0]), numeric(pens[1])];
  if (p !== undefined && p[0] !== undefined && p[1] !== undefined && p[0] !== p[1]) return p[0] > p[1] ? "win" : "loss";
  return "draw";
}

function pensOf(value: unknown): [string, string] | undefined {
  return Array.isArray(value) && value.length === 2 && written(value[0]) !== "" && written(value[1]) !== "" ? [written(value[0]), written(value[1])] : undefined;
}

function viewOf(m: RoadMatch | RoadGroupMatch | RoadFinal, opponent: Team, round: string, knockout: boolean): MatchView {
  const { mine, theirs, whole } = split(m.score);
  const pens = pensOf(m.pens);
  const decided: RoadDecided = m.decidedBy === "aet" || m.decidedBy === "pens" || m.decidedBy === "ft" ? m.decidedBy : pens !== undefined ? "pens" : "ft";
  const note = typeof m.note === "string" ? m.note.trim() : undefined;
  return {
    round,
    opponent,
    mine,
    theirs,
    ...(whole === undefined ? {} : { whole }),
    result: resultOf(mine, theirs, pens),
    decided,
    ...(pens === undefined ? {} : { pens }),
    ...(note === undefined ? {} : { note }),
    says: knockout || m.decidedBy !== undefined || pens !== undefined,
    ...("homeFirst" in m && typeof m.homeFirst === "boolean" ? { homeFirst: m.homeFirst } : {}),
  };
}

/** The rounds of two paths, the earliest first: a round both have is once, and a round only one has stays after the round before it. */
export function mergeRounds(paths: readonly (readonly string[])[]): string[] {
  const out: string[] = [];
  for (const path of paths) {
    let at = 0;
    for (const key of path) {
      const found = out.indexOf(key);
      if (found >= 0) at = found + 1;
      else {
        out.splice(at, 0, key);
        at += 1;
      }
    }
  }
  return out;
}

const isTeam = (value: unknown): value is RoadTeam => typeof value === "object" && value !== null && !Array.isArray(value) && typeof (value as RoadTeam).name === "string";

/** A road chart's team as a `Team`, named in the language: `logo` is the mark, and a team with no id is its name. */
function teamOf(t: RoadTeam, voice: Voice): Team {
  const team: Team = { id: t.id ?? t.name, name: t.name };
  for (const key of ["abbr", "seed", "color", "names", "region", "flag"] as const) if (t[key] !== undefined) Object.assign(team, { [key]: t[key] });
  const mark = t.mark ?? t.logo;
  if (mark !== undefined) team.mark = mark;
  return { ...team, name: voice.team(team) };
}

/** What a tournament gives a road chart: the two finalists with the matches they played, the final if it was played, and the names of the rounds. */
function fromTournament(input: Exclude<RoadInput, readonly [RoadFinalist, RoadFinalist]>, options: RoadOptions, voice: Voice): { finalists: [RoadFinalist, RoadFinalist]; final?: RoadFinal; labels: Record<string, string> } {
  const layout: BracketLayout = localizedLayout("ties" in input && "rounds" in input && "sides" in input ? (input as BracketLayout) : layoutBracket(input as Parameters<typeof layoutBracket>[0]), voice);
  const fi = layout.finalIndex;
  if (fi === null) throw new TypeError("roadToFinal: the tournament has no final to draw the road to");
  const finalTie = layout.ties[fi];
  let order: [0 | 1, 0 | 1] = [0, 1];
  if (options.team !== undefined) {
    const at = finalTie.sides.findIndex((s) => s !== null && String(s.id) === String(options.team));
    if (at < 0) throw new RangeError(`roadToFinal: ${JSON.stringify(options.team)} is not a side of the final, so its road does not lead there`);
    if (at === 1) order = [1, 0];
  }
  const labels: Record<string, string> = { final: roundLabel(layout, layout.rounds, options.roundNames, voice) };
  const matchOf = (team: Team, tie: Tie): RoadMatch | null => {
    const at = tie.sides[0]?.id === team.id ? 0 : 1;
    const other = tie.sides[at === 0 ? 1 : 0];
    const r = tie.result;
    if (other === null || r.score === null) return null;
    const note = r.kind === "game" ? undefined : noteParts(tie, voice).join(" · ");
    const key = String(tie.round);
    if (tie.round > 0) labels[key] = roundLabel(layout, tie.round, options.roundNames, voice);
    return {
      round: key,
      opponent: other,
      score: [r.score[at], r.score[at === 0 ? 1 : 0]],
      ...(r.pens ? { pens: [r.pens[at], r.pens[at === 0 ? 1 : 0]] as const } : {}),
      decidedBy: r.pens ? "pens" : r.extraTime ? "aet" : "ft",
      ...(note !== undefined ? { note } : {}),
    };
  };
  const finalist = (k: 0 | 1): RoadFinalist => {
    const team = finalTie.sides[k] ?? { id: "tbd", name: voice.words.tbd };
    const mine = finalTie.sides[k] === null ? [] : layout.ties.filter((t) => t.index !== fi && !t.third && t.sides.some((s) => s !== null && s.id === team.id));
    const sorted = [...mine].sort((a, b) => a.round - b.round || (a.date < b.date ? -1 : a.date > b.date ? 1 : a.index - b.index));
    const matches = sorted.map((t) => ({ tie: t, match: matchOf(team, t) })).filter((m): m is { tie: Tie; match: RoadMatch } => m.match !== null);
    return {
      ...team,
      path: matches.filter((m) => m.tie.round > 0).map((m) => m.match),
      group: matches.filter((m) => m.tie.round <= 0).map(({ match }) => ({ ...match, round: undefined })) as RoadGroupMatch[],
    };
  };
  const first = order[0];
  const finalists: [RoadFinalist, RoadFinalist] = [finalist(first), finalist(order[1])];
  let final: RoadFinal | undefined;
  const fr = finalTie.result;
  if (fr.score !== null) {
    const second = first === 0 ? 1 : 0;
    final = {
      score: [fr.score[first], fr.score[second]],
      ...(fr.pens ? { pens: [fr.pens[first], fr.pens[second]] as const } : {}),
      decidedBy: fr.pens ? "pens" : fr.extraTime ? "aet" : "ft",
      ...(fr.kind === "game" ? {} : { note: noteParts(finalTie, voice).join(" · ") }),
    };
  }
  return { finalists, final, labels };
}

/** Read and check what `roadToFinal` was given. */
export function readModel(input: RoadInput, options: RoadOptions): Model {
  const voice = voiceOf(options);
  const w = voice.words;
  let given: readonly RoadFinalist[];
  let derived: Record<string, string> = {};
  let tournamentFinal: RoadFinal | undefined;
  // A list of teams (nothing with `sides`, which every matchup has) is the finalists; a list of matchups, `{ matchups, teams }` or a layout is a tournament.
  const teamsOnly = Array.isArray(input) && input.length > 0 && input.every((f) => typeof f === "object" && f !== null && !("sides" in f));
  if (teamsOnly && input.length !== 2) throw new TypeError("roadToFinal takes the two finalists as a list of two teams, each with a path");
  else if (teamsOnly) given = input as readonly RoadFinalist[];
  else if (typeof input === "object" && input !== null) {
    const made = fromTournament(input as Exclude<RoadInput, readonly [RoadFinalist, RoadFinalist]>, options, voice);
    given = made.finalists;
    derived = made.labels;
    tournamentFinal = made.final;
  } else throw new TypeError("roadToFinal takes the two finalists as a list of two teams, each with a path, or a tournament");
  const teams = given as readonly [RoadFinalist, RoadFinalist];
  for (const [i, f] of teams.entries()) {
    if (!isTeam(f)) throw new TypeError(`Finalist ${i + 1} is a team with a name`);
    if (!Array.isArray(f.path)) throw new TypeError(`Finalist ${i + 1} (${f.name}) needs a path: the list of its matches before the final`);
    if (f.group !== undefined && !Array.isArray(f.group)) throw new TypeError(`The group of ${f.name} is a list of matches`);
    for (const m of [...f.path, ...(f.group ?? [])]) {
      if (typeof m !== "object" || m === null || !isTeam(m.opponent) || m.score === undefined || m.score === null) throw new TypeError(`Every match of ${f.name} has an opponent (a team with a name) and a score`);
    }
    for (const m of f.path) if (typeof m.round !== "string" || m.round.trim() === "") throw new TypeError(`Every match of the path of ${f.name} has a round`);
  }
  const finalists = teams.map((f) => teamOf(f, voice)) as [Team, Team];
  const path = teams.map((f) => {
    const map = new Map<string, MatchView>();
    for (const m of f.path) map.set(m.round.trim(), viewOf(m, teamOf(m.opponent, voice), m.round.trim(), true));
    return map;
  }) as Model["path"];
  const group = teams.map((f) => (f.group ?? []).map((m) => viewOf(m, teamOf(m.opponent, voice), "", false))) as Model["group"];
  const rounds = mergeRounds(teams.map((f) => f.path.map((m) => m.round.trim())));
  const labels = options.labels;
  const known: Record<string, string> = {
    "round-of-32": voice.round("Round of 32"),
    "round-of-16": voice.round("Round of 16"),
    "quarter-final": w.roadQuarterFinal,
    "semi-final": w.roadSemiFinal,
    final: voice.round("Final"),
  };
  const model: Model = {
    voice,
    words: w,
    finalists,
    group,
    path,
    rounds,
    label: (key) => (own(labels, key) && typeof labels?.[key] === "string" ? (labels[key] as string) : own(derived, key) ? derived[key] : own(known, key) ? known[key] : key),
    groupLabel: typeof options.groupLabel === "string" && options.groupLabel.trim() !== "" ? options.groupLabel.trim() : w.roadGroup,
    title: typeof options.title === "string" && options.title.trim() !== "" ? options.title.trim() : w.roadTitle,
    subtitle: typeof options.subtitle === "string" && options.subtitle.trim() !== "" ? options.subtitle.trim() : typeof options.title === "string" && options.title.trim() !== "" ? w.roadTitle : undefined,
  };
  const final = options.final ?? tournamentFinal;
  if (final !== undefined) {
    if (typeof final !== "object" || final === null || final.score === undefined || final.score === null) throw new TypeError("The final is { score }: the first finalist's score first");
    model.final = viewOf(final, finalists[1], "final", true);
  }
  return model;
}

/** The words under a score: FT, AET or the shoot-out (the first side's numbers first), a note in their place, or nothing. */
export function decidedWords(view: MatchView, w: Words, mineFirst: boolean): string {
  if (view.note !== undefined) return view.note;
  if (!view.says) return "";
  if (view.decided === "aet") return w.roadAet;
  if (view.decided === "pens" && view.pens !== undefined) return fill(w.roadPens, mineFirst ? { a: view.pens[0], b: view.pens[1] } : { a: view.pens[1], b: view.pens[0] });
  return view.decided === "pens" ? w.roadAet : w.roadFt;
}

/** The score of a match as one text, the first side's first. */
export function scoreText(view: MatchView, w: Words, mineFirst = true): string {
  if (view.whole !== undefined) return view.whole;
  return fill(w.scoreText, mineFirst ? { a: view.mine, b: view.theirs } : { a: view.theirs, b: view.mine });
}

/** The abbreviation written under a mark: the team's own, else made from its name. */
export function codeOf(team: Team): string {
  return (typeof team.abbr === "string" && team.abbr.trim() !== "" ? team.abbr.trim() : abbreviate(String(team.name ?? ""))).slice(0, 5).toLocaleUpperCase("en");
}

function record(name: string, group: MatchView[], path: Map<string, MatchView>): RoadRecord {
  const all = [...group, ...path.values()];
  let scored = 0;
  let conceded = 0;
  for (const v of all) {
    const a = numeric(v.mine);
    const b = numeric(v.theirs);
    if (a !== undefined && b !== undefined) {
      scored += a;
      conceded += b;
    }
  }
  return { name, matches: all.length, won: all.filter((v) => v.result === "win").length, drawn: all.filter((v) => v.result === "draw").length, lost: all.filter((v) => v.result === "loss").length, scored, conceded };
}

/** The numbers behind the chart. */
export function totalsOf(model: Model): RoadTotals {
  const [a, b] = model.finalists;
  const final = model.final;
  const champion = final === undefined || final.result === "unknown" || final.result === "draw" ? null : final.result === "win" ? a.name : b.name;
  return { finalists: [record(a.name, model.group[0], model.path[0]), record(b.name, model.group[1], model.path[1])], rounds: [...model.rounds], played: final !== undefined, champion };
}

/** The chart's accessible name. */
export function nameOf(model: Model): string {
  const heading = [model.title, model.subtitle].filter((part) => part !== undefined).join(", ");
  return fill(model.words.roadName, { a: model.finalists[0].name, b: model.finalists[1].name, title: heading });
}

/** What the chart shows, in a sentence or two. */
export function summaryOf(model: Model): string {
  const w = model.words;
  const [a, b] = model.finalists;
  const t = totalsOf(model);
  const parts = [fill(w.roadSummary, { a: a.name, b: b.name, an: model.voice.number(t.finalists[0].matches), bn: model.voice.number(t.finalists[1].matches) })];
  const final = model.final;
  if (final === undefined) parts.push(w.roadToPlay);
  else {
    parts.push(fill(w.roadFinal, { a: a.name, b: b.name, score: scoreText(final, w), how: decidedWords(final, w, true) || w.roadFt }));
    if (t.champion !== null) parts.push(fill(w.roadChampion, { name: t.champion }));
  }
  return parts.join(" ");
}

/** One HTML table with a row for every match: the group stage, the knockout rounds in order, and the final. */
export function tableOf(model: Model, options: { className?: string } = {}): string {
  const w = model.words;
  const cls = options.className === undefined || options.className.trim() === "" ? "tb-table" : options.className.trim();
  const [a, b] = model.finalists;
  const result = (r: Result): string => (r === "win" ? w.roadWon : r === "loss" ? w.roadLost : r === "draw" ? w.roadDrew : "");
  const row = (team: Team, round: string, v: MatchView): string =>
    `<tr><th scope="row">${esc(team.name)}</th><td>${esc(round)}</td><td>${esc(v.opponent.name)}</td><td>${esc(scoreText(v, w))}</td><td>${esc(decidedWords(v, w, true))}</td><td>${esc(result(v.result))}</td></tr>`;
  const rows: string[] = [];
  for (const [i, team] of [a, b].entries()) {
    for (const v of model.group[i]) rows.push(row(team, model.groupLabel, v));
    for (const key of model.rounds) {
      const v = model.path[i].get(key);
      if (v !== undefined) rows.push(row(team, model.label(key), v));
    }
  }
  if (model.final !== undefined) rows.push(row(a, model.label("final"), { ...model.final, opponent: b }));
  const head = [w.roadTableTeam, w.columnRound, w.roadTableOpponent, w.roadTableScore, w.roadTableDecided, w.roadTableResult].map((name) => `<th scope="col">${esc(name)}</th>`).join("");
  return `<table class="${esc(cls)}" lang="${esc(model.voice.locale.code)}" data-kind="road"><caption>${esc(fill(w.roadCaption, { a: a.name, b: b.name }))}</caption><thead><tr>${head}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
}
