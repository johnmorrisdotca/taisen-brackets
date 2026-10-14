import assert from "node:assert/strict";
import { test } from "node:test";
import * as T from "../src/index.ts";
import type { Matchup } from "../src/index.ts";
import { finished } from "./helpers.ts";

for (const n of [4, 8, 16, 32]) {
  test(`${n} teams: two halves that meet at the final, each tie halfway between the two that feed it`, () => {
    const { teams, matchups } = finished(n);
    const layout = T.layoutBracket({ matchups, teams });
    const rounds = Math.log2(n);
    assert.equal(layout.ties.length, n - 1);
    assert.equal(layout.rounds, rounds);
    assert.equal(layout.shape, "halves");
    assert.equal(layout.sides.length, 2);
    assert.deepEqual(layout.columns, Array.from({ length: rounds - 1 }, (_, i) => i + 1));
    assert.equal(layout.sides[0].boxes.length, n / 2 - 1);
    assert.equal(layout.sides[1].boxes.length, n / 2 - 1);
    assert.equal(layout.rows, n / 4);
    assert.equal(layout.final!.y, (layout.rows - 1) / 2);
    assert.equal(layout.champion!.id, "T1");
    assert.equal(layout.other.length, 0);
    assert.equal(layout.third, null);
    // Every box feeds the tie its winner plays next, and a tie sits halfway between the ones that feed it.
    for (const side of layout.sides) {
      const at = new Map(side.boxes.map((b) => [b.i, b]));
      for (const b of side.boxes) {
        const p = layout.parent[b.i];
        assert.notEqual(p, -1);
        assert.equal(b.to, p === layout.finalIndex ? layout.final!.y : at.get(p)!.y);
        const kids = side.boxes.filter((k) => layout.parent[k.i] === b.i);
        assert.equal(b.fed, kids.length > 0);
        if (kids.length === 2) assert.equal(b.y, (kids[0].y + kids[1].y) / 2);
        assert.equal(layout.ties[b.i].round, b.round);
      }
    }
    // The two finalists come from different halves: the first side of the final is the left half's.
    const finalTie = layout.ties[layout.finalIndex!];
    const left = new Set(layout.sides[0].boxes.flatMap((b) => layout.ties[b.i].sides.map((s) => s!.id)));
    assert.ok(left.has(finalTie.sides[layout.final!.order[0]]!.id));
    assert.equal(layout.place.filter((p) => p === "l").length, n / 2 - 1);
    assert.equal(layout.place.filter((p) => p === "r").length, n / 2 - 1);
    assert.equal(layout.place.filter((p) => p === "f").length, 1);
  });
}

test("a bracket can be given as a bare list of matchups, with the rounds worked out from who plays whom", () => {
  const list: Matchup[] = [
    { sides: ["A", "B"], winner: "A", date: "2026-01-01" },
    { sides: ["C", "D"], winner: "C", date: "2026-01-01" },
    { sides: ["A", "C"], winner: "C", date: "2026-01-08" },
  ];
  const layout = T.layoutBracket(list);
  assert.deepEqual(layout.ties.map((t) => t.round), [1, 1, 2]);
  assert.equal(layout.finalIndex, 2);
  assert.equal(layout.champion!.id, "C");
  assert.equal(layout.shape, "halves");
});

test("a team that came in at a later round has a bye, and the layout says which side", () => {
  const { teams, matchups } = finished(6);
  const layout = T.layoutBracket({ matchups, teams });
  assert.equal(layout.rounds, 3);
  const second = layout.sides.flatMap((s) => s.boxes).filter((b) => b.round === 2);
  assert.equal(second.length, 2);
  for (const b of second) {
    assert.notEqual(b.bye, null);
    const tie = layout.ties[b.i];
    assert.ok(["T1", "T2"].includes(String(tie.sides[b.bye!]!.id)), "the byes are the top two seeds");
  }
  assert.equal(layout.sides.flatMap((s) => s.boxes).filter((b) => b.round === 1 && b.bye !== null).length, 0);
});

test("two byes in one tie (a five-team bracket) still lay out, given the rounds", () => {
  const { teams, matchups } = finished(5);
  const layout = T.layoutBracket({ matchups, teams });
  assert.equal(layout.rounds, 3);
  assert.equal(layout.champion!.id, "T1");
  assert.equal(layout.other.length, 0);
});

test("the tree can be named outright, for a bracket whose sides are not known yet", () => {
  const { teams, matchups } = T.singleElimination(Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: `Seed ${i + 1}` })));
  const layout = T.layoutBracket({ matchups, teams });
  assert.equal(layout.shape, "halves");
  assert.equal(layout.champion, null);
  assert.equal(layout.ties[layout.finalIndex!].sides[0], null);
  assert.deepEqual(layout.columns, [1, 2]);
});

test("a third-place match is kept out of the tree, and a tie that leads nowhere is 'other'", () => {
  const { teams, matchups } = finished(8, { thirdPlace: true });
  const layout = T.layoutBracket({ matchups, teams });
  assert.notEqual(layout.third, null);
  assert.equal(layout.place[layout.third!], "o");
  assert.equal(layout.ties[layout.third!].round, layout.rounds);
  assert.equal(layout.sides[0].boxes.length + layout.sides[1].boxes.length, 6);
  assert.equal(layout.other.length, 0, "a third-place match is not 'other'");
  const stray: Matchup[] = [...matchups, { id: "friendly", sides: ["T8", "T7"], round: 1, winner: "T8", date: "2000-01-01" }];
  const strayLayout = T.layoutBracket({ matchups: stray, teams });
  assert.deepEqual(strayLayout.other.map((i) => strayLayout.ties[i].id), ["friendly"]);
});

test("round-robin games (round 0) are kept out of the tree", () => {
  const { teams, matchups } = finished(4);
  const layout = T.layoutBracket({ matchups: [...matchups, { sides: ["T1", "T4"], round: 0, score: [1, 1] }], teams });
  assert.equal(layout.robin.length, 1);
  assert.equal(layout.rounds, 2);
});

test("a series is decided when a side has won most of the games, and only then", () => {
  const done = T.resolveMatchup({ sides: ["A", "B"], bestOf: 7, score: [4, 2] }, 0, new Map());
  assert.equal(done.winner, 0);
  assert.equal(done.result.kind, "series");
  assert.equal(done.result.played, 6);
  const open = T.resolveMatchup({ sides: ["A", "B"], bestOf: 7, score: [3, 3] }, 0, new Map());
  assert.equal(open.winner, null);
  assert.equal(open.result.decided, false);
  const byGames = T.resolveMatchup({ sides: ["A", "B"], bestOf: 5, games: [{ score: [1, 0] }, { score: [0, 2] }, { score: [3, 1] }, { score: [2, 1] }] }, 0, new Map());
  assert.equal(byGames.winner, 0);
  assert.deepEqual(byGames.result.score, [3, 1]);
  assert.equal(byGames.result.played, 4);
});

test("a series counts a game level at the end of play as won by the side that won the shoot-out", () => {
  const tie = T.resolveMatchup({ sides: ["A", "B"], bestOf: 3, games: [{ score: [0, 0], pens: [5, 4] }, { score: [1, 1], pens: [3, 6] }, { score: [2, 1] }] }, 0, new Map());
  assert.deepEqual(tie.result.score, [2, 1]);
  assert.equal(tie.winner, 0);
});

test("two legs are added up, and a shoot-out settles a level aggregate", () => {
  const sum = T.resolveMatchup({ sides: ["A", "B"], kind: "aggregate", legs: [{ score: [2, 0] }, { score: [0, 1] }] }, 0, new Map());
  assert.deepEqual(sum.result.score, [2, 1]);
  assert.equal(sum.winner, 0);
  const level = T.resolveMatchup({ sides: ["A", "B"], kind: "aggregate", legs: [{ score: [1, 1] }, { score: [1, 1], extraTime: true, pens: [3, 4] }] }, 0, new Map());
  assert.deepEqual(level.result.score, [2, 2]);
  assert.equal(level.winner, 1);
  assert.equal(level.result.extraTime, true);
  const open = T.resolveMatchup({ sides: ["A", "B"], kind: "aggregate", legs: [{ score: [1, 1] }, { score: [0, 0] }] }, 0, new Map());
  assert.equal(open.winner, null);
});

test("a drawn game that was replayed is one tie, decided by the replay", () => {
  const tie = T.resolveMatchup({ sides: ["A", "B"], games: [{ score: [1, 1] }, { score: [0, 3], replay: true }] }, 0, new Map());
  assert.equal(tie.result.kind, "replay");
  assert.equal(tie.result.replays, 1);
  assert.deepEqual(tie.result.score, [0, 3]);
  assert.equal(tie.winner, 1);
});

test("a game goes to the penalties when the score is level, and an explicit winner wins over the arithmetic", () => {
  const pens = T.resolveMatchup({ sides: ["A", "B"], score: [2, 2], extraTime: true, pens: [5, 4] }, 0, new Map());
  assert.equal(pens.winner, 0);
  assert.equal(pens.result.extraTime, true);
  assert.deepEqual(pens.result.pens, [5, 4]);
  const away = T.resolveMatchup({ sides: ["A", "B"], score: [1, 1], winner: "B", note: "away goals" }, 0, new Map());
  assert.equal(away.winner, 1);
});

test("the halves take the groups' names when the groups split them cleanly, west on the left", () => {
  const teams = ["W1", "W2", "W3", "W4", "E1", "E2", "E3", "E4"].map((id) => ({ id, name: id, group: id.startsWith("W") ? "Western" : "Eastern" }));
  const matchups: Matchup[] = [
    { sides: ["E1", "E2"], winner: "E1", date: "1" }, { sides: ["E3", "E4"], winner: "E3", date: "1" },
    { sides: ["W1", "W2"], winner: "W1", date: "1" }, { sides: ["W3", "W4"], winner: "W3", date: "1" },
    { sides: ["E1", "E3"], winner: "E1", date: "2" }, { sides: ["W1", "W3"], winner: "W1", date: "2" },
    { sides: ["E1", "W1"], winner: "W1", date: "3" },
  ];
  const layout = T.layoutBracket({ matchups, teams });
  assert.deepEqual(layout.sides.map((s) => s.label), ["Western", "Eastern"]);
  assert.deepEqual(layout.final!.order, [1, 0], "the final's second side is the left half's");
  const flipped = T.layoutBracket({ matchups, teams }, { groupOrder: ["Eastern", "Western"] });
  assert.deepEqual(flipped.sides.map((s) => s.label), ["Eastern", "Western"]);
  const mixed = T.layoutBracket({ matchups, teams: teams.map((t) => ({ ...t, group: undefined })) });
  assert.deepEqual(mixed.sides.map((s) => s.label), [null, null]);
});

test("the shape can be one tree from left to right", () => {
  const { teams, matchups } = finished(8);
  const layout = T.layoutBracket({ matchups, teams }, { shape: "ltr" });
  assert.equal(layout.shape, "ltr");
  assert.equal(layout.sides.length, 1);
  assert.equal(layout.final, null);
  assert.deepEqual(layout.columns, [1, 2, 3]);
  assert.equal(layout.rows, 4);
  assert.equal(layout.champion!.id, "T1");
});

test("a bracket with no single final is a forest, each tree stacked", () => {
  const layout = T.layoutBracket([{ sides: ["A", "B"], winner: "A" }, { sides: ["C", "D"], winner: "D" }]);
  assert.equal(layout.shape, "forest");
  assert.equal(layout.finalIndex, null);
  assert.equal(layout.rows, 2);
});

test("bad input says what is wrong", () => {
  assert.throws(() => T.layoutBracket([{ id: "x", sides: ["A", "B"] }, { id: "x", sides: ["C", "D"] }]), /two matchups have the id "x"/);
  assert.throws(() => T.layoutBracket([{ sides: ["A", "B"], winner: "Z" }]), /winner "Z" is not one of its sides/);
  assert.throws(() => T.layoutBracket([{ sides: ["A", "A"] }]), /both sides/);
  assert.throws(() => T.layoutBracket([{ id: "a", sides: ["A", "B"], feeds: ["nope", null] }]), /not a matchup/);
  assert.throws(() => T.singleElimination([{ id: 1, name: "One" }]), /at least two/);
});

test("standard seeding keeps the top seeds apart until late", () => {
  assert.deepEqual(T.standardSeeds(4), [1, 4, 2, 3]);
  assert.deepEqual(T.standardSeeds(8), [1, 8, 4, 5, 2, 7, 3, 6]);
  assert.equal(T.standardSeeds(32).length, 32);
  assert.deepEqual(T.standardSeeds(5), T.standardSeeds(8));
});

test("advanceWinners carries a winner into the next tie and a loser into the third-place match", () => {
  const { teams, matchups } = T.singleElimination(Array.from({ length: 4 }, (_, i) => ({ id: `S${i + 1}`, name: `S${i + 1}` })), { thirdPlace: true });
  const played = matchups.map((m) => (m.round === 1 ? { ...m, score: [2, 0] as const } : m));
  const advanced = T.advanceWinners(played);
  const final = advanced.find((m) => m.id === "R2-1")!;
  assert.deepEqual(final.sides, ["S1", "S2"]);
  const third = advanced.find((m) => m.third)!;
  assert.deepEqual(third.sides, ["S4", "S3"]);
  assert.deepEqual(matchups.find((m) => m.id === "R2-1")!.sides, [null, null], "the matchups given are not changed");
  assert.ok(teams.length === 4);
});

test("games from a flat list become ties: replays, legs and the third-place match", () => {
  const games: T.PlayedGame[] = [
    { stage: "semi", home: "A", away: "B", homeScore: 1, awayScore: 1, date: "1" },
    { stage: "semi", home: "B", away: "A", homeScore: 0, awayScore: 2, date: "2", replay: true },
    { stage: "semi", home: "C", away: "D", homeScore: 3, awayScore: 0, date: "1" },
    { stage: "third", home: "B", away: "D", homeScore: 2, awayScore: 1, date: "3" },
    { stage: "final", home: "A", away: "C", homeScore: 1, awayScore: 1, homePens: 4, awayPens: 3, extraTime: true, date: "4" },
  ];
  const matchups = T.matchupsFromGames(games, { stages: ["semi", "final"], third: "third" });
  assert.equal(matchups.length, 4);
  const layout = T.layoutBracket(matchups);
  assert.equal(layout.rounds, 2);
  assert.notEqual(layout.third, null);
  const replay = layout.ties.find((t) => t.result.kind === "replay")!;
  assert.deepEqual(replay.result.score, [2, 0], "the replay's score is turned to the first game's order");
  assert.equal(replay.winner, 0);
  assert.equal(layout.champion!.id, "A");
  assert.throws(() => T.matchupsFromGames([{ stage: "x", home: 1, away: 2, homeScore: 0, awayScore: 0 }], { stages: ["a"] }), /not in stages/);
});
