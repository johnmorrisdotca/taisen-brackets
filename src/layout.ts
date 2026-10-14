import type { BracketInput, BracketLayout, LayoutBox, LayoutOptions, LayoutSide, Matchup, Place, SideId, Team, Tie } from "./types.ts";
import { collectTeams, resolveMatchup } from "./matchup.ts";

/**
 * The shape of a knockout, worked out from its ties: which tie feeds which (a winner goes on to the next tie its team
 * plays, or the tie that `feeds` names), the rounds, which half each tie sits in, and which side has a bye. A tie is
 * a game, a series, two legs or a replayed game, so one layout draws a hockey playoff and a World Cup. Pure and
 * sport-agnostic: no DOM, no drawing.
 */
export function layoutBracket(input: readonly Matchup[] | BracketInput, options: LayoutOptions = {}): BracketLayout {
  const matchups = Array.isArray(input) ? (input as readonly Matchup[]) : (input as BracketInput).matchups;
  const given = Array.isArray(input) ? [] : (input as BracketInput).teams ?? [];
  const teamMap = collectTeams(matchups, given);
  const ties: Tie[] = matchups.map((m, i) => resolveMatchup(m, i, teamMap));
  const n = ties.length;

  const byId = new Map<string, number>();
  for (const t of ties) {
    if (byId.has(t.id)) throw new Error(`taisen-brackets: two matchups have the id ${JSON.stringify(t.id)}`);
    byId.set(t.id, t.index);
  }

  const thirds = ties.filter((t) => t.third).map((t) => t.index);
  const robin = ties.filter((t) => !t.third && matchups[t.index].round === 0).map((t) => t.index);
  const inTree = ties.filter((t) => !t.third && matchups[t.index].round !== 0).map((t) => t.index);
  const isTree = new Set(inTree);

  const winnerId = (i: number): SideId | null => (ties[i].winner === null ? null : ties[i].sides[ties[i].winner!]?.id ?? null);
  const sideIdOf = (i: number, k: 0 | 1): SideId | null => ties[i].sides[k]?.id ?? null;

  // Explicit feeds: the tie named for side k is a child of this one.
  const children = new Map<number, number[]>();
  const parent: number[] = new Array(n).fill(-1);
  const feedSide = new Map<number, 0 | 1>();
  const explicit = new Set<number>();
  for (const j of inTree) {
    const feeds = matchups[j].feeds;
    if (!feeds) continue;
    explicit.add(j);
    const list: number[] = [];
    feeds.forEach((id, k) => {
      if (id == null) return;
      const c = byId.get(id);
      if (c === undefined) throw new Error(`taisen-brackets: matchup ${JSON.stringify(ties[j].id)} is fed by ${JSON.stringify(id)}, which is not a matchup`);
      if (!isTree.has(c)) throw new Error(`taisen-brackets: matchup ${JSON.stringify(ties[j].id)} is fed by ${JSON.stringify(id)}, which is not part of the tree`);
      if (c === j || parent[c] !== -1) throw new Error(`taisen-brackets: ${JSON.stringify(id)} feeds more than one matchup, or itself`);
      parent[c] = j;
      feedSide.set(c, k as 0 | 1);
      list.push(c);
    });
    children.set(j, list);
  }

  // Rounds: given, or one more than the latest tie that feeds this one.
  const key = (i: number) => ties[i].date;
  const earlier = (a: number, b: number) => (key(a) < key(b) ? true : key(a) > key(b) ? false : a < b);
  const round: number[] = new Array(n).fill(-1);
  for (const i of inTree) if (matchups[i].round !== undefined && matchups[i].round! > 0) round[i] = matchups[i].round!;
  const memo = new Map<number, number>();
  const rounding = (j: number): number => {
    if (round[j] > 0) return round[j];
    const hit = memo.get(j);
    if (hit !== undefined) return hit;
    let feeders: number[];
    if (explicit.has(j)) feeders = children.get(j) ?? [];
    else {
      const here = [sideIdOf(j, 0), sideIdOf(j, 1)];
      feeders = inTree.filter((i) => i !== j && winnerId(i) !== null && here.includes(winnerId(i)) && earlier(i, j) && !(parent[i] !== -1 && parent[i] !== j));
    }
    const r = 1 + Math.max(0, ...feeders.map(rounding));
    memo.set(j, r);
    return r;
  };
  const raw = new Map<number, number>();
  for (const i of inTree) raw.set(i, rounding(i));
  const distinct = [...new Set(raw.values())].sort((a, b) => a - b);
  for (const i of inTree) round[i] = distinct.indexOf(raw.get(i)!) + 1;
  const rounds = distinct.length;

  // Derived feeding: a winner goes on to the nearest later tie its team plays, when no `feeds` names the tree.
  for (const i of inTree) {
    if (parent[i] !== -1 || winnerId(i) === null) continue;
    let best = -1;
    for (const j of inTree) {
      if (explicit.has(j) || round[j] <= round[i]) continue;
      if (sideIdOf(j, 0) !== winnerId(i) && sideIdOf(j, 1) !== winnerId(i)) continue;
      if (best < 0 || round[j] < round[best]) best = j;
    }
    if (best >= 0) {
      parent[i] = best;
      children.set(best, [...(children.get(best) ?? []), i]);
      feedSide.set(i, sideIdOf(best, 0) === winnerId(i) ? 0 : 1);
    }
  }
  const cmpId = (a: SideId | null, b: SideId | null) => (String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0);
  const first = (a: number, b: number) => {
    const na = ties[a].no ?? Infinity, nb = ties[b].no ?? Infinity;
    if (na !== nb) return na < nb ? -1 : 1;
    if (ties[a].date !== ties[b].date) return ties[a].date < ties[b].date ? -1 : 1;
    return cmpId(sideIdOf(a, 0), sideIdOf(b, 0));
  };
  for (const [p, list] of children) if (!explicit.has(p)) children.set(p, [...list].sort(first));

  const tops = inTree.filter((i) => round[i] === rounds);
  const fin = tops.length === 1 ? tops[0] : null;
  for (const i of thirds) ties[i] = { ...ties[i], round: rounds };
  for (const i of inTree) ties[i] = { ...ties[i], round: round[i] };
  for (const i of robin) ties[i] = { ...ties[i], round: 0 };

  const place: Place[] = new Array(n).fill("o");
  const subtree = (i: number): number[] => [i, ...(children.get(i) ?? []).flatMap(subtree)];
  const groupOf = (t: Team | null) => t?.group ?? null;

  const orderOf = (i: number): readonly [0 | 1, 0 | 1] => {
    const ch = children.get(i) ?? [];
    if (ch.length === 2 && feedSide.get(ch[0]) === 1) return [1, 0];
    return [0, 1];
  };
  const byeOf = (i: number): 0 | 1 | null => {
    const ch = children.get(i) ?? [];
    if (round[i] <= 1 || ch.length !== 1) return null;
    const fed = feedSide.get(ch[0]);
    if (fed === undefined) return null;
    const other = (1 - fed) as 0 | 1;
    return ties[i].sides[other] ? other : null;
  };

  /** Every side that skipped the rounds before this tie's: the bye side, or both sides of a later-round tie that nothing feeds. */
  const byesOf = (i: number): readonly (0 | 1)[] => {
    const one = byeOf(i);
    if (one !== null) return [one];
    const ch = children.get(i) ?? [];
    if (round[i] <= 1 || ch.length > 0) return [];
    return ([0, 1] as const).filter((k) => ties[i].sides[k] !== null);
  };

  /** Lays one tree out: leaves take the next rows, a tie sits at the middle of the ones that feed it. */
  const lay = (root: number, mark: "l" | "r"): { boxes: LayoutBox[]; rows: number } => {
    const boxes: LayoutBox[] = [];
    let next = 0;
    const go = (i: number): number => {
      const ch = children.get(i) ?? [];
      const ys = ch.map(go);
      const y = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : next++;
      boxes.push({ i, round: round[i], y, to: null, fed: ch.length > 0, order: orderOf(i), bye: byeOf(i), byes: byesOf(i) });
      place[i] = mark;
      return y;
    };
    go(root);
    return { boxes, rows: Math.max(next, 1) };
  };

  const wantLtr = options.shape === "ltr";
  let sides: LayoutSide[] = [];
  let final: BracketLayout["final"] = null;
  let shape: BracketLayout["shape"] = "forest";
  if (fin !== null && !wantLtr && (children.get(fin) ?? []).length > 0) {
    shape = "halves";
    place[fin] = "f";
    const ch = children.get(fin)!;
    let feeders: (number | null)[];
    if (explicit.has(fin)) feeders = [ch[0] ?? null, ch[1] ?? null];
    else feeders = ([0, 1] as const).map((k) => ch.find((c) => winnerId(c) === sideIdOf(fin, k)) ?? null);
    const spare = ch.filter((c) => !feeders.includes(c));
    feeders = feeders.map((f) => f ?? spare.shift() ?? null);
    if (feeders[0] === null && feeders[1] !== null) feeders = [feeders[1], null];

    // A half is a group when at most one team of it comes from another group and fewer than half do.
    const lead = feeders.map((c) => {
      if (c === null) return { name: null as string | null, clean: false };
      const ts = [...new Set(subtree(c).flatMap((i) => ties[i].sides.map((t) => t?.id).filter((id): id is SideId => id !== undefined && id !== null)))];
      const counts = new Map<string, number>();
      for (const id of ts) { const g = groupOf(teamMap.get(id) ?? null); if (g) counts.set(g, (counts.get(g) ?? 0) + 1); }
      const top = [...counts].sort((a, b) => b[1] - a[1] || cmpId(a[0], b[0]))[0];
      if (!top) return { name: null, clean: false };
      const out = ts.length - top[1];
      return { name: top[0], clean: out <= 1 && out * 2 < ts.length };
    });
    const differ = lead[0].name !== null && lead[1].name !== null && lead[0].name !== lead[1].name;
    const clean = differ && lead[0].clean && lead[1].clean;
    let order: [number, number] = [0, 1];
    if (differ) {
      const preset = options.groupOrder;
      const rank = (g: string) => {
        if (preset) { const at = preset.indexOf(g); return at < 0 ? preset.length : at; }
        return /west/i.test(g) ? 0 : /east/i.test(g) ? 2 : 1;
      };
      const ra = rank(lead[0].name!), rb = rank(lead[1].name!);
      if (ra > rb || (ra === rb && lead[0].name! > lead[1].name!)) order = [1, 0];
    }
    const built = order
      .map((k) => (feeders[k] === null ? null : { ...lay(feeders[k]!, "l"), root: feeders[k]!, label: clean ? lead[k].name : null }))
      .filter((x): x is NonNullable<typeof x> => x !== null);
    sides = built.map((x, k) => ({ key: k === 0 ? "l" : "r", label: x.label, boxes: x.boxes, rows: x.rows }));
    built.forEach((x, k) => { if (k === 1) for (const b of x.boxes) place[b.i] = "r"; });
    const rows = Math.max(1, ...sides.map((s) => s.rows));
    const y = (rows - 1) / 2;
    const leftFeeder = built[0]?.root;
    const finalOrder: readonly [0 | 1, 0 | 1] = leftFeeder !== undefined && feedSide.get(leftFeeder) === 1 ? [1, 0] : [0, 1];
    final = { i: fin, y, order: finalOrder };
    built.forEach((x, k) => { const b = sides[k].boxes.find((q) => q.i === x.root); if (b) b.to = y; });
  } else if (fin !== null && children.get(fin)?.length) {
    shape = "ltr";
    const l = lay(fin, "l");
    sides = [{ key: "l", label: null, boxes: l.boxes, rows: l.rows }];
  } else {
    const roots = inTree.filter((i) => parent[i] === -1).sort((a, b) => round[b] - round[a] || first(a, b));
    const boxes: LayoutBox[] = [];
    let rows = 0;
    for (const r of roots) { const l = lay(r, "l"); boxes.push(...l.boxes.map((b) => ({ ...b, y: b.y + rows }))); rows += l.rows; }
    if (boxes.length) sides = [{ key: "l", label: null, boxes, rows }];
    if (fin !== null) shape = "ltr";
  }
  for (const s of sides) {
    const ys = new Map(s.boxes.map((b) => [b.i, b.y]));
    for (const b of s.boxes) { const p = parent[b.i]; if (p !== -1 && ys.has(p)) b.to = ys.get(p)!; }
  }
  if (fin !== null && shape === "halves") place[fin] = "f";

  const columns = [...new Set(sides.flatMap((s) => s.boxes.map((b) => b.round)))].filter((r) => shape !== "halves" || fin === null || r !== round[fin]).sort((a, b) => a - b);
  const other = inTree.filter((i) => place[i] === "o");
  const champion = fin !== null && ties[fin].winner !== null ? ties[fin].sides[ties[fin].winner!] : null;
  return {
    ties, shape, sides, final, finalIndex: fin, columns, rounds,
    rows: Math.max(1, ...sides.map((s) => s.rows)),
    other, robin, third: thirds[0] ?? null, place, parent, champion,
    teams: [...teamMap.values()],
  };
}
