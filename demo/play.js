// Plays out a bracket from the seeds, so a demo can show a finished one: the better seed wins, by a score taken from the seeds.
export function playOut(T, matchups, teams) {
  const seedOf = (id) => teams.find((t) => t.id === id)?.seed ?? 99;
  let ms = matchups;
  for (let pass = 0; pass < 12; pass++) {
    ms = T.advanceWinners(ms).map((m) => {
      if (m.third || m.winner != null || m.score || m.games) return m;
      const [a, b] = m.sides;
      if (a == null || b == null) return m;
      const ids = [typeof a === "object" ? a.id : a, typeof b === "object" ? b.id : b];
      const swap = seedOf(ids[1]) < seedOf(ids[0]);
      const margin = 1 + ((seedOf(ids[0]) + seedOf(ids[1])) % 3);
      return { ...m, score: swap ? [margin - 1, margin] : [margin, margin - 1] };
    });
  }
  return T.advanceWinners(ms);
}

/**
 * The games of a tournament in the order they were played (round by round, then by date), for the demo's "Play the games": how many there are, and the same bracket as it stood after `played` of them.
 * A tie not played yet keeps the teams that reached it and no result; one that waits on an earlier tie is empty and says which tie feeds it (`feeds`), so the bracket fills in as the games come in.
 */
export function fillBracket(T, data, played) {
  const laid = T.layoutBracket(data);
  const byId = new Map(laid.ties.map((t) => [t.id, t]));
  const order = [...data.matchups].sort((a, b) => (a.round ?? 0) - (b.round ?? 0) || String(a.date ?? a.games?.[0]?.date ?? "").localeCompare(String(b.date ?? b.games?.[0]?.date ?? "")) || (a.no ?? 0) - (b.no ?? 0));
  const done = new Set(order.slice(0, played).map((m) => m.id));
  const idOf = (side) => (side && typeof side === "object" ? side.id : side);
  const tieWith = (team, before) => {
    let found = null;
    for (const m of order) if ((m.round ?? 0) < before && m.sides.some((s) => idOf(s) === team)) if (found === null || (m.round ?? 0) >= (found.round ?? 0)) found = m;
    return found;
  };
  const matchups = order.map((m) => {
    if (done.has(m.id)) return m;
    const feeds = m.sides.map((s) => {
      const from = tieWith(idOf(s), m.round ?? 0);
      if (!from) return null;
      const t = byId.get(from.id);
      const winner = t?.winner == null ? null : idOf(t.sides[t.winner]);
      return { tie: from.id, result: winner === idOf(s) ? "winner" : "loser" };
    });
    const waiting = feeds.some((f) => f !== null);
    const { games, score, legs, judo, winner, result, ...rest } = m;
    void games; void score; void legs; void judo; void winner; void result;
    if (!waiting) return rest;
    // The sides in the order of the ties that feed them (a tie earlier in the list on top), the order a finished bracket is drawn in, so that nothing moves when the games come in.
    const pairs = m.sides.map((side, i) => ({ side: feeds[i] ? null : side, feed: feeds[i], no: order.find((o) => o.id === feeds[i]?.tie)?.no ?? i }));
    if (pairs.every((p) => p.feed)) pairs.sort((a, b) => a.no - b.no);
    return { ...rest, sides: pairs.map((p) => p.side), feeds: pairs.map((p) => p.feed) };
  });
  return { total: order.length, data: { ...data, matchups: T.advanceWinners(matchups) } };
}
