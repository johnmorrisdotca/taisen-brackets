import type { Matchup, SideId, Team } from "./types.ts";
import { collectTeams, resolveMatchup } from "./matchup.ts";

/**
 * The seeds in the order a standard bracket lists them, so that 1 meets 2 only in the final and the top seeds meet the
 * bottom ones first: `standardSeeds(8)` is `[1, 8, 4, 5, 2, 7, 3, 6]`. `size` is rounded up to a power of two.
 */
export function standardSeeds(size: number): number[] {
  if (!Number.isInteger(size) || size < 1) throw new Error(`taisen-brackets: standardSeeds needs a whole number of 1 or more, not ${size}`);
  let seeds = [1];
  while (seeds.length < size) {
    const total = seeds.length * 2;
    seeds = seeds.flatMap((s) => [s, total + 1 - s]);
  }
  return seeds;
}

export interface SingleEliminationOptions {
  /** Add a third-place match between the losing semi-finalists. Default false. */
  thirdPlace?: boolean;
  /** The ids of the ties are `${prefix}1-1`, `${prefix}1-2`… (round, then place in the round). Default "R". */
  prefix?: string;
}

/**
 * The matchups of a single-elimination bracket for any number of teams, seeded in the standard way: the top seeds meet
 * the lowest first, and when the number is not a power of two the top seeds have byes. The teams are in seed order
 * (or carry a `seed`). No tie has a result yet; fill the results in and call `advanceWinners` to carry them forward.
 */
export function singleElimination(teams: readonly Team[], options: SingleEliminationOptions = {}): { teams: Team[]; matchups: Matchup[] } {
  const count = teams.length;
  if (count < 2) throw new Error("taisen-brackets: a bracket needs at least two teams");
  const bySeed = teams.every((t) => t.seed !== undefined) ? [...teams].sort((a, b) => a.seed! - b.seed!) : [...teams];
  const seeded = bySeed.map((t, i) => ({ ...t, seed: t.seed ?? i + 1 }));
  const slots = standardSeeds(count);
  const size = slots.length;
  const rounds = Math.log2(size);
  const prefix = options.prefix ?? "R";
  const teamAt = (seed: number): Team | null => seeded.find((t) => t.seed === seed) ?? null;
  const matchups: Matchup[] = [];
  type Node = { team: Team } | { tie: string };
  const node = (round: number, k: number): Node => {
    if (round === 1) {
      const a = teamAt(slots[2 * k]), b = teamAt(slots[2 * k + 1]);
      if (a && !b) return { team: a };
      if (b && !a) return { team: b };
      const id = `${prefix}1-${k + 1}`;
      matchups.push({ id, round: 1, sides: [a!.id, b!.id] });
      return { tie: id };
    }
    const left = node(round - 1, 2 * k), right = node(round - 1, 2 * k + 1);
    const id = `${prefix}${round}-${k + 1}`;
    const side = (n: Node) => ("team" in n ? n.team.id : null);
    const feed = (n: Node) => ("tie" in n ? n.tie : null);
    matchups.push({ id, round, sides: [side(left), side(right)], feeds: [feed(left), feed(right)] });
    return { tie: id };
  };
  node(rounds, 0);
  if (options.thirdPlace && rounds >= 2) {
    const semis = matchups.filter((m) => m.round === rounds - 1).map((m) => m.id!);
    matchups.push({ id: `${prefix}3rd`, round: rounds, third: true, sides: [null, null], feeds: [semis[0] ?? null, semis[1] ?? null] });
  }
  return { teams: seeded, matchups };
}

/**
 * Fills the sides of every tie from the ties that feed it: a decided tie's winner takes its place in the next tie (the
 * loser, for a third-place match). Returns new matchups; the ones given are not changed. Ties are filled in the order of
 * the rounds, so a result for a later round is read against the sides this has just filled in.
 */
export function advanceWinners(matchups: readonly Matchup[]): Matchup[] {
  let current = matchups.map((m) => ({ ...m }));
  for (let pass = 0; pass < current.length; pass++) {
    const teams = collectTeams(current);
    // A tie whose winner is named before its sides are filled in cannot be read yet; it is undecided until they are.
    const at = new Map<string, ReturnType<typeof resolveMatchup>>();
    current.forEach((m, i) => { try { const t = resolveMatchup(m, i, teams); at.set(t.id, t); } catch { /* not yet */ } });
    let changed = false;
    current = current.map((m) => {
      if (!m.feeds) return m;
      let touched = false;
      const sides = [...m.sides] as [SideId | Team | null, SideId | Team | null];
      m.feeds.forEach((feed, k) => {
        if (feed == null) return;
        const child = at.get(typeof feed === "string" ? feed : feed.tie);
        if (!child || child.winner === null) return;
        // The loser goes on from a third-place match's feeders, and from a feed that asks for the loser (a play-in's).
        const takesLoser = m.third || (typeof feed !== "string" && feed.result === "loser");
        const team = child.sides[takesLoser ? ((1 - child.winner) as 0 | 1) : child.winner];
        const here = sides[k];
        if (team && (here !== null && typeof here === "object" ? here.id : here) !== team.id) { sides[k] = team.id; touched = true; changed = true; }
      });
      return touched ? { ...m, sides } : m;
    });
    if (!changed) break;
  }
  return current;
}

/** One played game, in the flat shape that most data sources give. */
export interface PlayedGame {
  /** The stage it was played in: a key from `stages`, or the `third` one. */
  stage: string;
  home: SideId;
  away: SideId;
  homeScore: number;
  awayScore: number;
  date?: string;
  extraTime?: boolean;
  homePens?: number;
  awayPens?: number;
  /** A replay of a drawn game. */
  replay?: boolean;
  /** An order within the stage (a match number). */
  no?: number;
}

export interface GamesOptions {
  /** The knockout stages in order, first round first: `["round-of-16", "quarter-final", "semi-final", "final"]`. */
  stages: readonly string[];
  /** The stage of the third-place match, if the data has one. */
  third?: string;
  /** Stages played in two legs, added up. Several games of one pair in any other stage are a replay. */
  aggregate?: readonly string[];
  /** Stages played as a series, with their length: `{ final: 7 }`. */
  series?: Readonly<Record<string, number>>;
}

/**
 * Matchups from a flat list of games: the games of one pair in one stage become one tie (a replay, two legs or a series),
 * the stage orders the rounds, and the third-place stage becomes the third-place match. The sides of a tie are the home
 * and away of its first game; each game's score is turned to that order.
 */
export function matchupsFromGames(games: readonly PlayedGame[], options: GamesOptions): Matchup[] {
  const sorted = [...games].sort((a, b) => (a.date ?? "") < (b.date ?? "") ? -1 : (a.date ?? "") > (b.date ?? "") ? 1 : 0);
  const groups = new Map<string, PlayedGame[]>();
  for (const g of sorted) {
    if (g.stage !== options.third && !options.stages.includes(g.stage)) throw new Error(`taisen-brackets: game stage ${JSON.stringify(g.stage)} is not in stages`);
    const pair = [String(g.home), String(g.away)].sort().join("|");
    const key = `${g.stage}|${pair}`;
    groups.set(key, [...(groups.get(key) ?? []), g]);
  }
  const out: Matchup[] = [];
  for (const list of groups.values()) {
    const head = list[0];
    const sides = [head.home, head.away] as const;
    const turned = list.map((g) => {
      const flip = g.home !== head.home;
      const pair = (a: number, b: number) => (flip ? [b, a] : [a, b]) as [number, number];
      const pens = g.homePens !== undefined && g.awayPens !== undefined ? pair(g.homePens, g.awayPens) : undefined;
      return { score: pair(g.homeScore, g.awayScore), date: g.date, extraTime: g.extraTime, pens, replay: g.replay };
    });
    const third = head.stage === options.third;
    const round = third ? options.stages.length : options.stages.indexOf(head.stage) + 1;
    const m: Matchup = { id: `${head.stage}-${out.length + 1}`, sides, round, games: turned, no: head.no, third };
    if (options.aggregate?.includes(head.stage)) m.kind = "aggregate";
    else if (options.series?.[head.stage]) { m.kind = "series"; m.bestOf = options.series[head.stage]; }
    else if (list.length > 1) turned.forEach((g, i) => { if (i > 0) g.replay = true; });
    out.push(m);
  }
  return out;
}
