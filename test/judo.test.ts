// Judo: the scoring rules (IJF Sport and Organisation Rules, Refereeing Rules of 21 January 2026), the repechage bracket, and the drawing of a judo contest in a box.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as T from "../src/index.ts";
import type { JudoResult, Matchup, SizeName, Team } from "../src/index.ts";
import { problems } from "./geometry.ts";
import { parseXml, withClass } from "./xml.ts";
import { wellFormed } from "./helpers.ts";

const out = (r: JudoResult, w: 0 | 1 | null = null) => T.judoOutcome(r, w);

test("ippon wins at once, and so do two waza-ari (waza-ari-awasete-ippon, Article 16)", () => {
  assert.deepEqual([out({ sides: [{ ippon: true }, { wazaAri: 1, yuko: 3 }] }).winner, out({ sides: [{ ippon: true }, {}] }).method], [0, "ippon"]);
  const a = out({ sides: [{}, { wazaAri: 2 }] });
  assert.deepEqual([a.winner, a.method, a.points[1]], [1, "waza-ari-awasete-ippon", 100]);
});

test("yuko are counted and never add up to a waza-ari (Article 15)", () => {
  const o = out({ sides: [{ wazaAri: 1 }, { yuko: 9 }] });
  assert.deepEqual([o.winner, o.method], [0, "score"]);
  assert.equal(out({ sides: [{ yuko: 2 }, { yuko: 1 }] }).winner, 0);
  assert.equal(out({ sides: [{ wazaAri: 1, yuko: 1 }, { wazaAri: 1, yuko: 2 }] }).winner, 1);
  assert.deepEqual(out({ sides: [{ wazaAri: 1, yuko: 2 }, { yuko: 1 }] }).points, [12, 1]);
});

test("shido never decide a contest by themselves; the third is hansoku-make and the other side wins (Article 18)", () => {
  assert.deepEqual([out({ sides: [{ shido: 2 }, {}] }).winner, out({ sides: [{ shido: 2 }, {}] }).method], [null, null]);
  const o = out({ sides: [{ shido: 3 }, { yuko: 1 }] });
  assert.deepEqual([o.winner, o.method], [1, "hansoku-make"]);
  const both = out({ sides: [{ shido: 3 }, { shido: 3 }] });
  assert.deepEqual([both.winner, both.doubleHansokuMake], [null, true]);
  // A direct hansoku-make: the side given it loses whatever the scores.
  const d = out({ sides: [{ wazaAri: 1 }, {}], hansokuMake: 0 });
  assert.deepEqual([d.winner, d.method], [1, "hansoku-make"]);
});

test("a default needs the matchup's winner; a method the scores contradict is refused", () => {
  assert.throws(() => out({ sides: [{}, {}], method: "fusen-gachi" }), /needs the matchup's winner/);
  assert.deepEqual([out({ sides: [{}, {}], method: "kiken-gachi" }, 1).winner, out({ sides: [{}, {}], method: "fusen-gachi" }, 0).method], [1, "fusen-gachi"]);
  assert.throws(() => out({ sides: [{ ippon: true }, {}], method: "score" }), /does not fit/);
  assert.throws(() => out({ sides: [{}, {}], method: "ippon" }), /does not fit/);
});

test("impossible results are refused with a message that names the field", () => {
  assert.throws(() => out({ sides: [{ ippon: true }, { ippon: true }] }), /both sides/);
  assert.throws(() => out({ sides: [{ wazaAri: 3 }, {}] }), /waza-ari is a whole number from 0 to 2/);
  assert.throws(() => out({ sides: [{ yuko: -1 }, {}] }), /yuko/);
  assert.throws(() => out({ sides: [{}, { shido: 4 }] }), /blue side's shido/);
  assert.throws(() => out({ sides: [{ shido: 1.5 }, {}] }), /shido/);
  assert.throws(() => out({ sides: [{}, {}], time: "3:75" }), /m:ss/);
  assert.throws(() => out({ sides: [{}, {}], time: -4 }), /seconds/);
});

test("the contest time is seconds or m:ss", () => {
  assert.equal(out({ sides: [{}, {}], time: "3:42" }).seconds, 222);
  assert.equal(out({ sides: [{}, {}], time: 222 }).seconds, 222);
  assert.equal(T.judoClock(222), "3:42");
  assert.equal(T.judoClock(305), "5:05");
});

const judoTie = (judo: JudoResult, extra: Partial<Matchup> = {}): Matchup => ({ id: "x", sides: ["A", "B"], judo, ...extra });
const tieOf = (m: Matchup) => T.layoutBracket({ matchups: [m], teams: [{ id: "A", name: "Kenji Nakamura" }, { id: "B", name: "Antoine Lefèvre" }] }).ties[0];

test("a judo matchup has its winner, its scoreboard value and its notes worked out", () => {
  const t = tieOf(judoTie({ sides: [{ yuko: 1, shido: 1 }, { wazaAri: 1, shido: 2 }], goldenScore: true, time: "5:12" }));
  assert.equal(t.winner, 1);
  assert.deepEqual(t.result.score, [1, 10]);
  assert.equal(t.result.decided, true);
  const v = T.voiceOf({});
  assert.deepEqual(T.noteParts(t, v), ["decision", "GS", "5:12"]);
  assert.deepEqual(T.noteLong(t, v), ["decision", "golden score", "5:12", "Kenji Nakamura: 1 shido", "Antoine Lefèvre: 2 shido"]);
  assert.equal(T.describeTie(t, v), "Kenji Nakamura yuko, Antoine Lefèvre waza-ari (decision, golden score, 5:12, Kenji Nakamura: 1 shido, Antoine Lefèvre: 2 shido). Winner: Antoine Lefèvre");
});

test("a contest still to be fought has no score and no winner; a level one waits for golden score", () => {
  const none = tieOf(judoTie({ sides: [{}, {}] }));
  assert.deepEqual([none.winner, none.result.score, none.result.played], [null, null, 0]);
  const level = tieOf(judoTie({ sides: [{ yuko: 1 }, { yuko: 1 }] }));
  assert.deepEqual([level.winner, level.result.decided], [null, false]);
});

test("a winner named on the matchup must agree with the scores", () => {
  assert.throws(() => tieOf(judoTie({ sides: [{ ippon: true }, {}] }, { winner: "B" })), /winner is side 1|make side 0 the winner/);
  assert.equal(tieOf(judoTie({ sides: [{}, {}], method: "kiken-gachi" }, { winner: "A" })).winner, 0);
});

test("the words of a judo contest exist in all five languages", () => {
  const t = tieOf(judoTie({ sides: [{ wazaAri: 1 }, { yuko: 2, shido: 1 }], goldenScore: true, time: "4:30" }));
  for (const code of T.LOCALE_CODES) {
    const v = T.voiceOf({ locale: code });
    const notes = T.noteLong(t, v);
    assert.ok(notes.length >= 4 && notes.every((n) => n && !/undefined|\{/.test(n)), `${code}: ${notes.join("|")}`);
    assert.ok(!/undefined|\{/.test(T.describeTie(t, v)), code);
    assert.ok(!/undefined|\{/.test(T.judoCategoryLabel({ sex: "women", weight: "-48" }, code)), code);
  }
  assert.equal(T.judoCategoryLabel({ sex: "men", weight: "-66" }), "Men -66 kg");
  assert.equal(T.judoCategoryLabel({ sex: "women", weight: "+78" }, "fr"), "Femmes +78\u00a0kg");
  assert.equal(T.judoCategoryLabel({ sex: "men", weight: "-90" }, "ja"), "男子90kg級");
  assert.equal(T.judoCategoryLabel({ sex: "women", weight: "+78" }, "ja"), "女子78kg超級");
  assert.equal(T.judoCategoryLabel({ sex: "men", weight: "+100" }), "Men +100 kg");
  assert.throws(() => T.judoCategoryLabel({ sex: "men", weight: "66" }), /-66/);
});

test("the IJF weight classes", () => {
  assert.deepEqual(T.JUDO_WEIGHT_CLASSES.men, ["-60", "-66", "-73", "-81", "-90", "-100", "+100"]);
  assert.deepEqual(T.JUDO_WEIGHT_CLASSES.women, ["-48", "-52", "-57", "-63", "-70", "-78", "+78"]);
});

// ---- the bracket

const athletes = (n: number): Team[] => Array.from({ length: n }, (_, i) => ({ id: `A${i + 1}`, name: `Athlete ${i + 1}`, abbr: `A${String(i + 1).padStart(2, "0")}`, seed: i + 1 }));

test("a repechage bracket: the tree, two repechage contests and two bronze medal contests", () => {
  for (const [n, tree] of [[8, 7], [12, 11], [16, 15], [32, 31]] as const) {
    const { matchups } = T.judoBracket(athletes(n));
    assert.equal(matchups.length, tree + 4, `${n} athletes`);
    assert.equal(matchups.filter((m) => m.stage === "repechage").length, 2);
    assert.equal(matchups.filter((m) => m.stage === "bronze").length, 2);
  }
});

test("the repechage contests are fed by the quarter-final losers of a table, the bronze contests by the repechage winner and the other table's semi-final loser (2.5.2)", () => {
  const { matchups } = T.judoBracket(athletes(16));
  const byId = new Map(matchups.map((m) => [m.id, m]));
  const rep1 = byId.get("Jrep-1")!, rep2 = byId.get("Jrep-2")!;
  const semi1 = byId.get("J3-1")!, semi2 = byId.get("J3-2")!;
  assert.deepEqual(rep1.feeds, [{ tie: semi1.feeds![0], result: "loser" }, { tie: semi1.feeds![1], result: "loser" }]);
  assert.deepEqual(rep2.feeds, [{ tie: semi2.feeds![0], result: "loser" }, { tie: semi2.feeds![1], result: "loser" }]);
  assert.deepEqual(byId.get("Jbronze-1")!.feeds, ["Jrep-1", { tie: "J3-2", result: "loser" }]);
  assert.deepEqual(byId.get("Jbronze-2")!.feeds, ["Jrep-2", { tie: "J3-1", result: "loser" }]);
});

test("a direct knockout has no extra contests; a repechage needs eight athletes; fewer than four is refused", () => {
  assert.equal(T.judoBracket(athletes(6), { system: "direct" }).matchups.length, 5);
  assert.equal(T.judoBracket(athletes(6)).matchups.length, 5);
  assert.throws(() => T.judoBracket(athletes(6), { system: "repechage" }), /eight athletes/);
  assert.throws(() => T.judoBracket(athletes(3)), /four athletes/);
  assert.throws(() => T.judoBracket(athletes(8), { system: "double" as never }), /"repechage" or "direct"/);
});

/** Plays every contest: the better seed wins, in turn by ippon, waza-ari, a decision with yuko and shido, a golden score and a third shido. */
function playOut(n: number, system?: "direct"): { matchups: Matchup[]; teams: Team[] } {
  const made = T.judoBracket(athletes(n), { system });
  let m: Matchup[] = made.matchups;
  const seedOf = (x: unknown) => Number(String(typeof x === "object" && x ? (x as Team).id : x).slice(1));
  for (let pass = 0; pass < m.length + 2; pass++) {
    m = T.advanceWinners(m);
    const i = m.findIndex((x) => x.judo === undefined && x.sides[0] !== null && x.sides[1] !== null);
    if (i < 0) break;
    const x = m[i];
    const win = seedOf(x.sides[0]) < seedOf(x.sides[1]) ? 0 : 1;
    const kinds: JudoResult[] = [
      { sides: [{ ippon: true }, { shido: 1 }], time: "1:30" },
      { sides: [{ wazaAri: 1 }, { shido: 2 }], time: 240 },
      { sides: [{ yuko: 1 }, { yuko: 0, shido: 1 }], time: "4:00" },
      { sides: [{ wazaAri: 1 }, { wazaAri: 0 }], goldenScore: true, time: "6:15" },
      { sides: [{ wazaAri: 2 }, {}], time: "2:40" },
      { sides: [{}, { shido: 3 }], time: "3:33" },
    ];
    const kind = kinds[i % kinds.length];
    const sides = win === 0 ? kind.sides : ([kind.sides[1], kind.sides[0]] as const);
    // A result where the first side wins is turned round when the second does; the third shido goes to the loser either way.
    const fixed: JudoResult = i % kinds.length === 5 ? { ...kind, sides: win === 0 ? [{ yuko: 1 }, { shido: 3 }] : [{ shido: 3 }, { yuko: 1 }] } : { ...kind, sides };
    m = m.map((q, k) => (k === i ? { ...q, judo: fixed } : q));
  }
  return { matchups: m, teams: made.teams };
}

test("a played-out repechage bracket fills every contest and gives gold, silver and two bronze medals", () => {
  const { matchups, teams } = playOut(16);
  const layout = T.layoutBracket({ matchups, teams });
  assert.ok(layout.ties.every((t) => t.winner !== null), "every contest decided");
  assert.equal(layout.playIn.length, 4);
  const podium = T.judoPodium(layout);
  assert.equal(podium.gold?.id, "A1");
  assert.equal(podium.silver?.id, "A2");
  assert.equal(podium.bronze.length, 2);
  const losers = layout.ties.filter((t) => t.round === layout.rounds - 1 && t.stage === undefined).map((t) => t.sides[(1 - t.winner!) as 0 | 1]!.id);
  assert.equal(new Set([...podium.bronze.map((b) => b.id)]).size, 2);
  assert.ok(!podium.bronze.some((b) => b.id === podium.gold?.id || b.id === podium.silver?.id));
  assert.equal(losers.length, 2);
});

test("a direct knockout's bronze medallists are the two semi-final losers", () => {
  const { matchups, teams } = playOut(8, "direct");
  const podium = T.judoPodium({ matchups, teams });
  assert.deepEqual([podium.gold?.id, podium.silver?.id], ["A1", "A2"]);
  assert.deepEqual(podium.bronze.map((b) => b.id).sort(), ["A3", "A4"]);
});

test("the repechage contests of an unfinished bracket have empty sides and no winner", () => {
  const { matchups } = T.judoBracket(athletes(8));
  const layout = T.layoutBracket({ matchups });
  const rep = layout.ties.filter((t) => t.stage === "repechage");
  assert.deepEqual(rep.map((t) => t.sides), [[null, null], [null, null]]);
  assert.deepEqual(rep.map((t) => t.from?.map((s) => s?.result)), [["loser", "loser"], ["loser", "loser"]]);
});

// ---- the drawing

const SIZES: SizeName[] = ["wide", "square", "card", "phone"];
const full = playOut(16);
const bracket = { matchups: full.matchups, teams: full.teams.map((t, i) => ({ ...t, name: ["Kenji Nakamura", "Antoine Lefèvre", "Lukas Weber", "Diego Ramos"][i % 4] + ` ${i + 1}` })) };

test("a judo drawing writes the marks, the shido cards and the side bars, and its notes", () => {
  const svg = T.drawBracket(bracket, { size: "wide" });
  assert.equal(wellFormed(svg), null);
  const doc = parseXml(svg);
  assert.ok(withClass(doc, "tb-sh-y").length > 0, "a yellow card");
  assert.ok(withClass(doc, "tb-sh-r").length > 0, "a red card");
  assert.ok(withClass(doc, "tb-jw").length > 0 && withClass(doc, "tb-jb").length > 0, "white and blue bars");
  const scores = withClass(doc, "tb-score").map((t) => t.text);
  for (const mark of ["I", "W", "Y"]) assert.ok(scores.some((s) => s.startsWith(mark)), `a score of ${mark}`);
  assert.match(svg, /ippon · 1:30/);
  assert.match(svg, /hansoku-make · 3:33/);
  assert.match(svg, /decision · GS|waza-ari awasete ippon · 2:40/);
  assert.match(svg, /Repechage and bronze medal contests/i);
  assert.match(svg, /\.tb-sh-y\{/);
});

test("a bracket with no judo contest is drawn with no judo rules and no judo marks", () => {
  const svg = T.drawBracket({ matchups: [{ id: "a", sides: ["A", "B"], score: [3, 1] }] });
  assert.ok(!/tb-sh-|tb-jw|tb-jb|judo/.test(svg));
});

test("a judo drawing is a pure function of its input and options", () => {
  assert.equal(T.drawBracket(bracket, { size: "wide" }), T.drawBracket(bracket, { size: "wide" }));
  assert.notEqual(T.drawBracket(bracket, { size: "wide" }), T.drawBracket({ ...bracket, matchups: bracket.matchups.map((m, i) => (i === 0 ? { ...m, judo: { ...m.judo!, time: "0:12" } } : m)) }, { size: "wide" }));
});

test("judo marks stay inside their boxes in every size, both looks and every detail", () => {
  const bad: string[] = [];
  for (const look of ["classic", "road"] as const) for (const size of SIZES) for (const detail of ["auto", "full", "compact"] as const) {
    for (const p of problems(T.drawBracket(bracket, { look, size, detail }), { namesOverLines: size === "phone" })) bad.push(`${look} ${size} ${detail}: ${p}`);
  }
  assert.deepEqual(bad.slice(0, 12), [], `${bad.length} problems`);
});

test("a judo bracket draws in every layout without throwing, in every language", () => {
  for (const layout of ["tree", "rows", "shields", "update", "columns", "series"] as const) {
    const svg = T.drawBracket(bracket, { layout, size: "wide" });
    assert.equal(wellFormed(svg), null, layout);
  }
  for (const locale of T.LOCALE_CODES) assert.equal(wellFormed(T.drawBracket(bracket, { locale })), null, locale);
  assert.match(T.bracketTable(bracket), /Repechage/);
});

test("bracketStyle can carry the judo rules for a page that shares one stylesheet", () => {
  assert.ok(!T.bracketStyle({ styleScope: "j" }).includes(".tb-sh-y"));
  assert.ok(T.bracketStyle({ styleScope: "j", judo: true }).includes(".tb-sh-y"));
});
