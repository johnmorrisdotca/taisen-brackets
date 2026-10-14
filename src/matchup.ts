import type { Game, Matchup, MatchupKind, Result, SideId, Team, Tie, Words } from "./types.ts";
import { abbreviate } from "./text.ts";
import { fill } from "./words.ts";

/** A bracket's teams: the list given, plus a team made from every id that a matchup names and the list does not. */
export function collectTeams(matchups: readonly Matchup[], given: readonly Team[] = []): Map<SideId, Team> {
  const teams = new Map<SideId, Team>();
  for (const team of given) {
    if (teams.has(team.id)) throw new Error(`taisen-brackets: two teams have the id ${JSON.stringify(team.id)}`);
    teams.set(team.id, team);
  }
  for (const m of matchups) {
    for (const side of m.sides) {
      if (side === null || side === undefined) continue;
      if (typeof side === "object") {
        if (!teams.has(side.id)) teams.set(side.id, side);
      } else if (!teams.has(side)) teams.set(side, { id: side, name: String(side) });
    }
  }
  return teams;
}

const sideId = (side: SideId | Team | null | undefined): SideId | null => (side === null || side === undefined ? null : typeof side === "object" ? side.id : side);

/** What the games of a tie come to. `winner` is the side the games settle (0 or 1), or null. */
function settle(m: Matchup, kind: MatchupKind): { result: Result; winner: 0 | 1 | null } {
  const listed = m.games ?? m.legs ?? [];
  const lone: Game | null = listed.length === 0 && m.score && kind !== "series" && kind !== "aggregate" ? { score: m.score, extraTime: m.extraTime, pens: m.pens } : null;
  const games: readonly Game[] = lone ? [lone] : listed;
  const bestOf = m.bestOf ?? null;
  const base = { kind, bestOf, extraTime: false, replays: 0, pens: null as Result["pens"], games: games.map((g) => g.score) };
  const byScore = (a: number, b: number): 0 | 1 | null => (a > b ? 0 : b > a ? 1 : null);
  const byPens = (pens: Result["pens"]): 0 | 1 | null => (pens ? byScore(pens[0], pens[1]) : null);

  if (kind === "series") {
    let wins: readonly [number, number] | null = null;
    if (games.length) wins = [games.filter((g) => g.score[0] > g.score[1]).length, games.filter((g) => g.score[1] > g.score[0]).length];
    else if (m.score) wins = m.score;
    const need = bestOf ? Math.ceil(bestOf / 2) : null;
    const winner = wins && need ? (wins[0] >= need ? 0 : wins[1] >= need ? 1 : null) : null;
    return { result: { ...base, score: wins, played: games.length || (wins ? wins[0] + wins[1] : 0), decided: winner !== null }, winner };
  }
  if (kind === "aggregate") {
    const last = games.at(-1);
    const total: readonly [number, number] | null = games.length ? [games.reduce((s, g) => s + g.score[0], 0), games.reduce((s, g) => s + g.score[1], 0)] : m.score ?? null;
    const pens = last?.pens ?? m.pens ?? null;
    const winner = total ? byScore(total[0], total[1]) ?? byPens(pens) : null;
    return { result: { ...base, score: total, played: games.length, pens, extraTime: games.some((g) => g.extraTime) || !!m.extraTime, decided: winner !== null }, winner };
  }
  // A game, or a replay: the last game decides.
  const last = games.at(-1);
  if (!last) return { result: { ...base, score: null, played: 0, decided: false }, winner: null };
  const winner = byScore(last.score[0], last.score[1]) ?? byPens(last.pens ?? null);
  const replays = kind === "replay" ? games.filter((g) => g.replay).length || Math.max(games.length - 1, 0) : 0;
  return { result: { ...base, score: last.score, played: games.length, pens: last.pens ?? null, extraTime: !!last.extraTime, replays, decided: winner !== null }, winner };
}

/** The kind of tie, read from the fields when `kind` is not given. */
function kindOf(m: Matchup): MatchupKind {
  if (m.kind) return m.kind;
  if (m.legs?.length) return "aggregate";
  if ((m.games ?? []).some((g) => g.replay)) return "replay";
  if (m.bestOf || (m.games?.length ?? 0) > 1) return "series";
  return "game";
}

/** One matchup as a tie: sides resolved to teams, the winner and the result worked out. The round is set by the layout. */
export function resolveMatchup(m: Matchup, index: number, teams: ReadonlyMap<SideId, Team>): Tie {
  const ids = [sideId(m.sides[0]), sideId(m.sides[1])] as const;
  if (ids[0] !== null && ids[0] === ids[1]) throw new Error(`taisen-brackets: matchup ${index} has ${JSON.stringify(ids[0])} on both sides`);
  const kind = kindOf(m);
  const { result, winner: settled } = settle(m, kind);
  let winner: 0 | 1 | null = settled;
  if (m.winner !== undefined) {
    if (m.winner === null) winner = null;
    else if (ids[0] === m.winner) winner = 0;
    else if (ids[1] === m.winner) winner = 1;
    else throw new Error(`taisen-brackets: matchup ${index}'s winner ${JSON.stringify(m.winner)} is not one of its sides`);
  }
  const sides = ids.map((id) => (id === null ? null : teams.get(id) ?? null)) as unknown as readonly [Team | null, Team | null];
  return {
    index,
    id: m.id ?? `m${index + 1}`,
    round: m.round ?? -1,
    sides,
    winner,
    result: { ...result, decided: winner !== null },
    date: m.date ?? m.games?.[0]?.date ?? m.legs?.[0]?.date ?? "",
    no: m.no ?? null,
    third: !!m.third,
    note: m.note ?? null,
  };
}

/** The short name of a team for a small box. */
export const abbrOf = (team: Team | null, words: Words): string => (team ? team.abbr ?? abbreviate(team.name) : words.tbd);

/** The pieces of a note under a tie's score: "a.e.t.", "pens", "in 7", "agg.". */
export function noteParts(tie: Tie, words: Words): string[] {
  const r = tie.result;
  const out: string[] = [];
  if (r.kind === "series") {
    if (r.decided && r.played > 0) out.push(fill(words.inGames, { n: r.played }));
    else if (r.bestOf) out.push(fill(words.bestOf, { n: r.bestOf }));
  } else {
    if (r.kind === "aggregate") out.push(words.aggregate);
    if (r.kind === "replay") out.push(words.replay);
    if (r.extraTime) out.push(words.aet);
    if (r.pens) out.push(words.pens);
  }
  if (tie.note) out.push(tie.note);
  return out;
}

/** A tie in a sentence, for a tooltip, a table and a description: "Argentina 3, France 3 (a.e.t., pens 4-2). Winner: Argentina". */
export function describeTie(tie: Tie, words: Words): string {
  const name = (t: Team | null) => (t ? t.name : words.tbd);
  const [a, b] = tie.sides;
  const r = tie.result;
  let text: string;
  if (!r.score) text = `${name(a)} ${words.versus} ${name(b)}`;
  else {
    text = `${name(a)} ${r.score[0]}, ${name(b)} ${r.score[1]}`;
    const extra = noteParts(tie, words).map((part) => (part === words.pens && r.pens ? `${words.pens} ${r.pens[0]}-${r.pens[1]}` : part));
    if (extra.length) text += ` (${extra.join(", ")})`;
  }
  if (tie.winner !== null) text += `. ${words.winner}: ${name(tie.sides[tie.winner])}`;
  return text;
}
