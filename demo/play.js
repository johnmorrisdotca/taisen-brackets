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
