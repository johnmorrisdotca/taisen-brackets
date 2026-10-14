import assert from "node:assert/strict";
import { test } from "node:test";
import { flag } from "@johnmorrisdotca/hata/load";
import { build } from "../demo/data.js";
import { ROAD_FINAL, SERIES_LABELS, nation, roadFinalists, roadSeries } from "../demo/road-data.js";
import * as T from "../src/index.ts";
import type { FlagRenderer, RoadFinalist, RoadMatch, RoadSize } from "../src/index.ts";
import { mergeRounds, scoreText } from "../src/road.model.ts";
import { textWidth } from "../src/text.ts";
import { matchSnapshot } from "./snapshot.ts";
import { parseXml, structure, walk, withClass, type Node } from "./xml.ts";

const { wc2022, nhl2024 } = build(T);

/** Eight small emblems, one for each club of the demo's series. */
const EMBLEMS: Record<string, string> = Object.fromEntries(
  ["gull", "owl", "bolt", "peak", "star", "pine", "anchor", "bison"].map((key, i) => [key, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#fff"/><path d="M${10 + i * 5} 56Q32 18 50 50Q68 18 88 56Q68 46 50 72Q32 46 ${10 + i * 5} 56Z" fill="#1f5fa8"/></svg>`]),
);
const SIZES = Object.keys(T.SIZES) as RoadSize[];
const finalists = (): [RoadFinalist, RoadFinalist] => roadFinalists();
const parse = (svg: string): Node => parseXml(svg);
const textsOf = (svg: string, cls: string): string[] => withClass(parse(svg), cls).map((n) => n.text);
const markCount = (svg: string): number => withClass(parse(svg), "tb-mark").length;
const viewBox = (svg: string): number[] => parse(svg).attrs.viewBox.split(" ").map(Number);
const idsOf = (svg: string): string[] => walk(parse(svg)).flatMap((n) => (n.attrs.id === undefined ? [] : [n.attrs.id]));

/** A finalist with a path of `n` rounds taken from the demo's four, repeated and renamed as needed, and its group or none. */
function withRounds(team: RoadFinalist, n: number, group = true): RoadFinalist {
  const base = team.path;
  const path: RoadMatch[] = Array.from({ length: n }, (_, i) => ({ ...base[i % base.length], round: n <= 4 ? base[base.length - n + i].round : `round-${i + 1}` }));
  return { ...team, path, group: group ? team.group : undefined };
}

const chart = T.roadToFinal(finalists(), { id: "road", title: "Northern Cup 2030", final: ROAD_FINAL });

test("roadToFinal gives the options, a title, a summary, the numbers, the drawing and the table", () => {
  assert.deepEqual(Object.keys(chart).sort(), ["draw", "options", "summary", "table", "title", "totals"]);
  assert.equal(chart.title, "Aurelia and Calvara: Northern Cup 2030, Road to the final");
  assert.equal(chart.summary, "Matches played before the final: Aurelia (7) and Calvara (7). The final: Aurelia 2–2 Calvara (4–3 pens). Aurelia won the final.");
  assert.equal(chart.options.title, "Northern Cup 2030");
});

test("it counts each finalist's record, names the rounds earliest first, and finds the champion", () => {
  const t = chart.totals;
  assert.deepEqual(t.rounds, ["round-of-32", "round-of-16", "quarter-final", "semi-final"]);
  assert.equal(t.played, true);
  assert.equal(t.champion, "Aurelia");
  assert.deepEqual(t.finalists[0], { name: "Aurelia", matches: 7, won: 6, drawn: 1, lost: 0, scored: 14, conceded: 4 });
  assert.deepEqual(t.finalists[1], { name: "Calvara", matches: 7, won: 5, drawn: 1, lost: 1, scored: 14, conceded: 7 });
  assert.deepEqual({ played: T.roadToFinal(finalists()).totals.played, champion: T.roadToFinal(finalists()).totals.champion }, { played: false, champion: null });
});

for (const size of SIZES) {
  for (const locale of ["en", "ja", "fr", "es", "de"]) {
    test(`${size} in ${locale}: a well-formed drawing that names itself`, () => {
      const c = T.roadToFinal(finalists(), { id: "r", locale, size, final: ROAD_FINAL, title: "Northern Cup" });
      const svg = c.draw();
      const root = parse(svg);
      assert.equal(root.attrs.role, "img");
      assert.ok(root.attrs.class.split(" ").includes("tb-road"));
      assert.equal(root.attrs["data-size"], size);
      assert.equal(root.attrs.lang, locale);
      const [x, y, w, h] = viewBox(svg);
      assert.deepEqual([x, y, w], [0, 0, T.SIZES[size].width]);
      if (T.SIZES[size].height !== null) assert.equal(h, T.SIZES[size].height);
      else assert.ok(h > 600);
      assert.equal(root.attrs["aria-labelledby"], "r-t r-d");
      assert.equal(walk(root).find((n) => n.name === "title" && n.attrs.id === "r-t")?.text, c.title);
      assert.equal(walk(root).find((n) => n.name === "desc" && n.attrs.id === "r-d")?.text, c.summary);
      assert.ok(!/NaN|undefined|Infinity/.test(svg));
      if (locale === "ja") assert.ok(c.title.includes("決勝への道"));
    });
  }
}

test("the same call gives the same text, and each chart on a page has ids of its own", () => {
  const a = T.roadToFinal(finalists(), { final: ROAD_FINAL });
  assert.equal(a.draw(), T.roadToFinal(finalists(), { final: ROAD_FINAL }).draw());
  const b = T.roadToFinal(finalists(), { locale: "ja" });
  assert.notEqual(idsOf(a.draw())[0], idsOf(b.draw())[0]);
  const all = idsOf(a.draw());
  assert.equal(new Set(all).size, all.length);
  assert.ok(all.every((id) => id.startsWith("tb-")));
  assert.ok(idsOf(chart.draw()).every((id) => id.startsWith("road-")));
});

test("the rounds are down the middle, the last at the top, each with both finalists' matches", () => {
  const svg = chart.draw({ size: "card" });
  assert.deepEqual(textsOf(svg, "tb-lab"), ["Semi-final", "Quarter-final", "Round of 16", "Round of 32", "Group stage"]);
  const ys = withClass(parse(svg), "tb-lab").map((n) => Number(n.attrs.y));
  assert.deepEqual([...ys].sort((p, q) => p - q), ys);
  // Two big marks, then two for each of the eight matches, and one for each group match.
  assert.equal(markCount(svg), 2 + 2 * 8 + 6);
  assert.equal(textsOf(svg, "tb-r-dash").length, 8 + 1);
});

for (const rounds of [2, 3, 4, 5, 6]) {
  for (const group of [true, false]) {
    test(`${rounds} rounds ${group ? "with" : "without"} a group row: every size draws and keeps its words inside the picture`, () => {
      const pair = finalists().map((t) => withRounds(t, rounds, group)) as [RoadFinalist, RoadFinalist];
      for (const size of SIZES) {
        const svg = T.roadToFinal(pair, { size, labels: { "round-1": "First", "round-2": "Second", "round-3": "Third", "round-4": "Fourth", "round-5": "Fifth", "round-6": "Sixth" } }).draw();
        const [, , W, H] = viewBox(svg);
        assert.equal(textsOf(svg, "tb-lab").length, rounds + (group ? 1 : 0), `${size} labels`);
        assert.equal(markCount(svg), 2 + 2 * 2 * rounds + (group ? 6 : 0), `${size} marks`);
        for (const node of withClass(parse(svg), "tb-lab")) assert.ok(Number(node.attrs.y) < H, `${size} label`);
        // Nothing is written beyond the edge, by the package's own estimate of how wide a text is.
        for (const text of walk(parse(svg)).filter((n) => n.name === "text")) {
          const half = textWidth(text.text, Number(text.attrs["font-size"])) / 2;
          const x = Number(text.attrs.x);
          const anchor = text.attrs["text-anchor"];
          const [lo, hi] = anchor === "end" ? [x - 2 * half, x] : anchor === "start" ? [x, x + 2 * half] : [x - half, x + half];
          assert.ok(lo >= 0 && hi <= W, `${size} text ${text.text} (${lo}..${hi} of ${W})`);
        }
      }
    });
  }
}

test("how a match was decided is written under its score: FT, AET, or the shoot-out in the order the marks stand", () => {
  const subs = textsOf(chart.draw({ size: "card" }), "tb-r-sub");
  // Aurelia is on the left, its mark outermost: its shoot-out number first. Calvara is on the right: its number is last.
  for (const s of ["5–4 pens", "2–3 pens", "AET", "4–3 pens"]) assert.ok(subs.includes(s), s);
  assert.equal(subs.filter((s) => s === "FT").length, 5);
  const ja = textsOf(chart.draw({ locale: "ja" }), "tb-r-sub");
  for (const s of ["延長", "PK戦 5–4", "PK戦 2–3", "規定時間"]) assert.ok(ja.includes(s), s);
});

test("a team is put first by `homeFirst`, and each number stays with its own mark", () => {
  const [a, b] = finalists();
  const flip = (team: RoadFinalist, homeFirst: boolean): RoadFinalist => ({ ...team, path: team.path.map((m) => ({ ...m, homeFirst })) });
  const left = textsOf(T.roadToFinal([flip(a, false), flip(b, true)], { size: "card" }).draw(), "tb-r-n");
  const plain = textsOf(T.roadToFinal([a, b], { size: "card" }).draw(), "tb-r-n");
  assert.deepEqual(plain.slice(0, 3), ["2", "1", "1"]);
  assert.deepEqual(left.slice(0, 2), ["1", "2"]);
  assert.equal(left.length, plain.length);
});

test("the side that won each match is brighter: the opponent of a win is dimmed, a lost match dims the finalist", () => {
  const dimmed = (svg: string): number => walk(parse(svg)).filter((n) => (n.attrs.class ?? "").split(" ").includes("tb-r-dim") && n.name === "g").length;
  // Every knockout match is a win for its finalist, and three group matches are wins (one is a loss and two are draws, which dim no one).
  assert.equal(dimmed(T.roadToFinal(finalists()).draw()), 8 + 3);
  assert.equal(dimmed(T.roadToFinal(finalists(), { winner: "none" }).draw()), 0);
  assert.equal(dimmed(chart.draw()), 8 + 3 + 1);
  const lost = T.roadToFinal([{ ...finalists()[0], path: [{ ...finalists()[0].path[0], score: [0, 1] }] }, { ...finalists()[1], path: [] }]);
  assert.equal(dimmed(lost.draw()), 1 + 3);
});

test("the middle has the final: a v when it is not played, its score when it is, with the loser quiet", () => {
  const open = T.roadToFinal(finalists(), { id: "o" });
  assert.deepEqual(textsOf(open.draw(), "tb-r-vs"), ["v"]);
  assert.ok(open.summary.endsWith("The final is still to be played."));
  assert.deepEqual(textsOf(T.roadToFinal(finalists(), { locale: "ja" }).draw(), "tb-r-vs"), ["対"]);
  const won = T.roadToFinal(finalists(), { final: { score: [3, 1] } });
  assert.ok(textsOf(won.draw(), "tb-r-sub").includes("FT"));
  assert.equal(won.totals.champion, "Aurelia");
  const lostFinal = T.roadToFinal(finalists(), { final: { score: [0, 1], decidedBy: "aet" } });
  assert.equal(lostFinal.totals.champion, "Calvara");
  assert.ok(lostFinal.summary.includes("Calvara won the final."));
  assert.equal(T.roadToFinal(finalists(), { final: { score: [1, 1] } }).totals.champion, null);
  assert.ok(T.roadToFinal(finalists(), { final: { score: "4-2", note: "Game 6" } }).draw().includes(">Game 6<"));
});

test("a round the caller names is named, and any other key is written as it is: a series reads as well as a knockout", () => {
  const series = T.roadToFinal(roadSeries(EMBLEMS), { labels: SERIES_LABELS, final: { score: "4-2", note: "Game 6" }, id: "s" });
  assert.deepEqual(series.totals.rounds, ["first-round", "second-round", "conference-final"]);
  const svg = series.draw();
  assert.deepEqual(textsOf(svg, "tb-lab"), ["Conference final", "Second round", "First round"]);
  const subs = textsOf(svg, "tb-r-sub");
  for (const s of ["Game 5", "Game 7", "Cup final"]) assert.ok(subs.includes(s), s);
  // The final first (4-2), then the conference final: the Gulls' 4-2 on the left, and on the right the Owls' 4 with its opponent's 3 before it.
  assert.deepEqual(textsOf(svg, "tb-r-n").slice(0, 6), ["4", "2", "4", "2", "3", "4"]);
  assert.deepEqual(textsOf(T.roadToFinal(roadSeries(EMBLEMS)).draw(), "tb-lab"), ["conference-final", "second-round", "first-round"]);
  assert.ok(series.table().includes("<td>Second round</td>"));
  assert.ok(series.summary.includes("The final: Harbour City Gulls 4–2 Northern Owls (Game 6)."));
  assert.ok(T.roadToFinal(finalists(), { groupLabel: "Pool play" }).draw().includes(">Pool play<"));
});

test("a score that is text is split at its dash, or written whole when it will not split", () => {
  const [a, b] = finalists();
  const odd = { ...a, path: [{ ...a.path[0], score: "walkover" }, { ...a.path[1], score: "2 – 1" }, { ...a.path[2], score: ["3", "1"] as [string, string] }] };
  const c = T.roadToFinal([odd, { ...b, path: [] }], { id: "w" });
  // Rows run from the last round down: the third match (3-1), the second (2-1) and the first, which is written whole.
  assert.deepEqual(textsOf(c.draw(), "tb-r-n").slice(0, 5), ["3", "1", "2", "1", "walkover"]);
  assert.ok(c.table().includes("<td>walkover</td>"));
  assert.ok(c.table().includes("<td>2–1</td>"));
  assert.deepEqual({ won: c.totals.finalists[0].won, lost: c.totals.finalists[0].lost, matches: c.totals.finalists[0].matches }, { won: 2 + 2, lost: 0, matches: 3 + 3 });
  assert.equal(scoreText({ whole: "walkover" } as never, T.WORDS), "walkover");
});

test("a team with no mark is its initials on its colour, and never an image", () => {
  const bare = (t: RoadFinalist): RoadFinalist => ({ ...t, mark: undefined, logo: undefined, path: t.path.map((m) => ({ ...m, opponent: { name: m.opponent.name } })), group: t.group?.map((m) => ({ ...m, opponent: { name: m.opponent.name } })) });
  const svg = T.roadToFinal([bare({ ...finalists()[0], mark: undefined }), bare(finalists()[1])], { size: "square" }).draw();
  assert.deepEqual(walk(parse(svg)).filter((n) => n.name === "image" || n.name === "use"), []);
  assert.equal(withClass(parse(svg), "tb-initials").length, markCount(svg));
  assert.deepEqual(textsOf(svg, "tb-initials").slice(0, 2), ["AUR", "CAL"]);
  assert.ok(svg.length < 30_000);
  // A name with no abbreviation gets its initials: "Kestrel Isles" is KI.
  assert.deepEqual(textsOf(T.roadToFinal([{ name: "Kestrel Isles", path: [] }, { name: "Valdor", path: [] }]).draw(), "tb-initials"), ["KI", "VAL"]);
});

test("a flag is written once as a symbol and used wherever the team is; an address that could run is dropped", () => {
  const svg = chart.draw({ size: "card" });
  const doc = parse(svg);
  const uses = walk(doc).filter((n) => n.name === "use" && n.attrs.href?.startsWith("#"));
  const symbols = walk(doc).filter((n) => n.name === "symbol");
  assert.equal(uses.length, markCount(svg));
  assert.ok(symbols.length < uses.length, "each flag is once, however often it is used");
  assert.equal(new Set(symbols.map((s) => s.attrs.id)).size, symbols.length);
  for (const u of uses) assert.ok(symbols.some((s) => `#${s.attrs.id}` === u.attrs.href));
  const [a, b] = finalists();
  const web = T.roadToFinal([{ ...a, mark: "https://example.com/aurelia.svg" }, { ...b, mark: "javascript:alert(1)" }], { id: "x" }).draw();
  assert.ok(web.includes('href="https://example.com/aurelia.svg"'));
  assert.ok(!web.includes("javascript:"));
  assert.ok(textsOf(web, "tb-initials").includes("CAL"));
  // `logo` is another name for `mark`.
  const viaLogo = T.roadToFinal([{ ...a, mark: undefined, logo: "https://example.com/logo.svg" }, b], { id: "y" }).draw();
  assert.ok(viaLogo.includes('href="https://example.com/logo.svg"'));
});

test("a long name is set on two lines in a smaller size, and a long title wraps", () => {
  const [a, b] = finalists();
  const long = T.roadToFinal([{ ...a, name: "The Very Long Named Federation of Aurelia" }, b], { title: "An Extremely Long Tournament Name That Should Wrap Over Two Lines", size: "card" });
  const svg = long.draw();
  const names = withClass(parse(svg), "tb-r-name");
  assert.deepEqual(names.map((n) => n.text), ["THE VERY LONG NAMED", "FEDERATION OF AURELIA", "CALVARA"]);
  const sizes = names.map((n) => Number(n.attrs["font-size"]));
  assert.ok(sizes[0] < sizes[2]);
  assert.equal(withClass(parse(svg), "tb-r-t").length, 2);
  assert.deepEqual(textsOf(T.roadToFinal([a, b], { title: "Northern Cup" }).draw(), "tb-r-t"), ["Northern Cup"]);
});

test("the opponent's three letters are under its mark, unless asked not to", () => {
  assert.equal(textsOf(chart.draw(), "tb-r-code").length, 8 + 6);
  assert.deepEqual(textsOf(chart.draw(), "tb-r-code").slice(0, 2), ["NRV", "VAL"]);
  assert.deepEqual(textsOf(T.roadToFinal(finalists(), { codes: false }).draw(), "tb-r-code"), []);
});

test("a foot line, a look, a class and the stylesheet are written, or the stylesheet is left to the page", () => {
  const svg = chart.draw({ endnote: "Made-up results", theme: "dark", className: "mine", id: "road" });
  const root = parse(svg);
  assert.ok(root.attrs.class.split(" ").includes("mine"));
  assert.deepEqual(textsOf(svg, "tb-r-e"), ["Made-up results"]);
  const css = walk(root).find((n) => n.name === "style")?.text ?? "";
  assert.ok(css.includes(".road .tb-panel"));
  assert.ok(css.includes("var(--tb-mark-ring"));
  assert.ok(T.roadToFinal(finalists()).draw().includes("prefers-color-scheme: dark"));
  assert.equal(walk(parse(chart.draw({ theme: "none" }))).some((n) => n.name === "style"), false);
  assert.ok(chart.draw({ theme: "poster" }).includes("#0a1130"));
});

test("draw's options lay over the chart's own: the size, the language and the final", () => {
  assert.deepEqual(viewBox(chart.draw({ size: "wide" })).slice(2), [1200, 675]);
  assert.ok(chart.draw({ locale: "ja" }).includes("準決勝"));
  assert.deepEqual(textsOf(chart.draw({ final: undefined }), "tb-r-vs"), ["v"]);
  assert.ok(chart.draw().includes(">Semi-final<"));
});

test("it refuses what it cannot draw", () => {
  assert.throws(() => T.roadToFinal(undefined as never), TypeError);
  assert.throws(() => T.roadToFinal([finalists()[0]] as never), /two finalists/);
  assert.throws(() => T.roadToFinal([{ name: "A" }, { name: "B", path: [] }] as never), /path/);
  assert.throws(() => T.roadToFinal([{ name: "A", path: [{ round: "final" }] }, { name: "B", path: [] }] as never), /opponent/);
  assert.throws(() => T.roadToFinal([{ name: "A", path: [{ opponent: { name: "C" }, score: [1, 0] }] }, { name: "B", path: [] }] as never), /round/);
  assert.throws(() => T.roadToFinal(finalists(), { size: "huge" as never }), /Unknown size "huge"/);
  assert.throws(() => T.roadToFinal(finalists(), { final: {} as never }), /final/);
  assert.throws(() => T.roadToFinal(finalists()).draw({ size: "huge" as never }), RangeError);
});

test("the rounds of two paths merge: a round only one has stays where it falls", () => {
  assert.deepEqual(mergeRounds([["a", "b", "c"], ["a", "b", "c"]]), ["a", "b", "c"]);
  assert.deepEqual(mergeRounds([["r16", "qf", "sf"], ["r32", "r16", "qf", "sf"]]), ["r32", "r16", "qf", "sf"]);
  assert.deepEqual(mergeRounds([["a", "c"], ["a", "b", "c"]]), ["a", "b", "c"]);
  const bye = T.roadToFinal([{ ...finalists()[0], path: finalists()[0].path.slice(1) }, finalists()[1]]);
  assert.deepEqual(bye.totals.rounds, ["round-of-32", "round-of-16", "quarter-final", "semi-final"]);
  assert.equal(markCount(bye.draw()), 2 + 2 * 7 + 6);
});

test("the table says each match: a row for every match, the group first, the final last, with names made safe", () => {
  const doc = parse(chart.table());
  assert.equal(doc.name, "table");
  assert.equal(doc.attrs.class, "tb-table");
  assert.equal(doc.attrs["data-kind"], "road");
  assert.equal(doc.attrs.lang, "en");
  const rows = walk(doc).filter((n) => n.name === "tr");
  assert.equal(rows.length, 1 + 7 + 7 + 1);
  const cells = (row: Node): string[] => row.children.map((c) => c.text);
  assert.deepEqual(cells(rows[0]), ["Team", "Round", "Opponent", "Score", "Decided", "Result"]);
  assert.deepEqual(cells(rows[1]), ["Aurelia", "Group stage", "Isenmark", "2–0", "", "Won"]);
  assert.deepEqual(cells(rows[4]), ["Aurelia", "Round of 32", "Pellasia", "3–0", "FT", "Won"]);
  assert.deepEqual(cells(rows[6]), ["Aurelia", "Quarter-final", "Garrovia", "1–1", "5–4 pens", "Won"]);
  assert.deepEqual(cells(rows[8]).slice(0, 3), ["Calvara", "Group stage", "Estria"]);
  assert.deepEqual(cells(rows.at(-1)!), ["Aurelia", "Final", "Calvara", "2–2", "4–3 pens", "Won"]);
  assert.ok(rows.slice(1).every((row) => row.children[0].name === "th" && row.children[0].attrs.scope === "row"));
  assert.ok(walk(doc).find((n) => n.name === "caption")?.text.includes("Aurelia and Calvara: every match"));
  const ja = parse(chart.table({ locale: "ja", className: "mine" }));
  assert.equal(ja.attrs.class, "mine");
  assert.deepEqual(cells(walk(ja).filter((n) => n.name === "tr")[0]), ["チーム", "ラウンド", "対戦相手", "スコア", "決着", "結果"]);
  const tricky = T.roadToFinal([{ name: "A & B <C>", path: [{ round: "final-four", opponent: { name: 'D "E"' }, score: [1, 0] }] }, { name: "F", path: [] }]).table();
  assert.ok(tricky.includes("A &amp; B &lt;C&gt;"));
  assert.ok(tricky.includes("D &quot;E&quot;"));
  assert.doesNotThrow(() => parse(tricky));
});

test("it stays within its size budget, flags and all", () => {
  assert.ok(chart.draw({ size: "card" }).length < 40_000);
  assert.ok(chart.draw({ size: "phone" }).length < 40_000);
  assert.ok(T.roadToFinal(roadSeries(EMBLEMS), { labels: SERIES_LABELS }).draw().length < 30_000);
});

test("each size's structure is held: how many of each element and class a drawing is made of", () => {
  for (const size of SIZES) matchSnapshot("road", `road ${size}`, structure(T.roadToFinal(finalists(), { size, id: "snap", final: ROAD_FINAL }).draw()));
  matchSnapshot("road", "road series card", structure(T.roadToFinal(roadSeries(EMBLEMS), { labels: SERIES_LABELS, id: "snap" }).draw({ size: "card" })));
});

test("the words of the road are in every language, and keep the holes of the English ones", () => {
  const holes = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
  const keys = Object.keys(T.WORDS).filter((k) => k.startsWith("road")) as (keyof typeof T.WORDS)[];
  assert.ok(keys.length >= 22);
  for (const code of T.LOCALE_CODES) {
    const words = T.LOCALES[code as "en"].words;
    for (const key of keys) assert.ok(words[key].length > 0, `${code}.${key}`);
    for (const key of ["roadPens", "roadCaption", "roadName", "roadSummary", "roadFinal", "roadChampion"] as const) assert.equal(holes(words[key]), holes(T.WORDS[key]), `${code}.${key}`);
  }
});

test("the made-up nations are not real", () => {
  assert.equal(nation("aurelia").names?.ja, "アウレリア");
  assert.ok(T.roadToFinal(finalists(), { size: "card" }).draw().includes("Aurelia"));
});

// ---------------------------------------------------------------------------------------------- from a tournament

const idOf = (name: string) => wc2022.teams.find((t) => t.name === name)!.id;

test("one tournament draws the bracket and the road: the final's two sides are the finalists, with the ties they played", () => {
  const bracket = T.drawBracket(wc2022);
  const road = T.roadToFinal(wc2022, { id: "tr" });
  assert.ok(bracket.startsWith("<svg"));
  assert.deepEqual(road.totals.rounds, ["1", "2", "3"]);
  assert.equal(road.totals.champion, "Argentina");
  assert.deepEqual(road.totals.finalists.map((f) => [f.name, f.matches]), [["Argentina", 3], ["France", 3]]);
  assert.equal(road.summary, "Matches played before the final: Argentina (3) and France (3). The final: Argentina 3–3 France (4–2 pens). Argentina won the final.");
  const svg = road.draw({ size: "wide" });
  assert.deepEqual(textsOf(svg, "tb-lab"), ["Semi-finals", "Quarter-finals", "Round of 16"]);
  // The shoot-out of Argentina's quarter-final is written in Argentina's order, and the semi-final is a plain win.
  const subs = textsOf(svg, "tb-r-sub");
  assert.ok(subs.includes("4–3 pens"));
  assert.ok(subs.includes("4–2 pens"));
  const table = parse(road.table());
  const rows = walk(table).filter((n) => n.name === "tr").map((r) => r.children.map((c) => c.text));
  assert.deepEqual(rows[1], ["Argentina", "Round of 16", "Australia", "2–1", "FT", "Won"]);
  assert.deepEqual(rows[2], ["Argentina", "Quarter-finals", "Netherlands", "2–2", "4–3 pens", "Won"]);
  assert.deepEqual(rows.at(-1), ["Argentina", "Final", "France", "3–3", "4–2 pens", "Won"]);
});

test("`team` puts a finalist on the left, with the final's score from its side", () => {
  const france = T.roadToFinal(wc2022, { team: idOf("France") });
  assert.deepEqual(france.totals.finalists.map((f) => f.name), ["France", "Argentina"]);
  assert.equal(france.totals.champion, "Argentina");
  assert.ok(france.summary.includes("The final: France 3–3 Argentina (2–4 pens). Argentina won the final."));
  assert.throws(() => T.roadToFinal(wc2022, { team: idOf("Brazil") }), /not a side of the final/);
});

test("a tournament's road follows its language, its round names and its series", () => {
  const fr = T.roadToFinal(wc2022, { locale: "fr", teamName: (team, locale) => (team.region ? T.countryName(team.region, locale) : undefined) });
  assert.equal(fr.title, "Argentine et France\u00a0: Parcours vers la finale");
  assert.deepEqual(textsOf(fr.draw(), "tb-lab"), ["Demi-finales", "Quarts de finale", "Huitièmes de finale"]);
  const nhl = T.roadToFinal(nhl2024, { roundNames: T.playoffFormat("nhl", 2024)!, id: "n" });
  assert.equal(nhl.totals.champion, "Florida Panthers");
  assert.deepEqual(textsOf(nhl.draw({ size: "wide" }), "tb-lab"), ["Conference Finals", "Second Round", "First Round"]);
  const rows = walk(parse(nhl.table())).filter((n) => n.name === "tr").map((r) => r.children.map((c) => c.text));
  assert.deepEqual(rows[1], ["Florida Panthers", "First Round", "Tampa Bay Lightning", "4–1", "in 5", "Won"]);
  assert.equal(rows.at(-1)?.[1], "Stanley Cup Final");
  assert.equal(rows.at(-1)?.[4], "in 7");
});

test("round-robin games of a tournament are the group stage, and an unplayed final is a v", () => {
  const matchups = [
    { id: "g1", round: 0, sides: ["A", "C"], score: [2, 0] },
    { id: "g2", round: 0, sides: ["B", "D"], score: [1, 1] },
    { id: "g3", round: 0, sides: ["A", "D"], score: [3, 1] },
    { id: "s1", sides: ["A", "B"], score: [1, 0], date: "2" },
    { id: "s2", sides: ["C", "D"], score: [0, 2], date: "2" },
    { id: "f", sides: ["A", "D"], date: "3" },
  ] as const;
  const road = T.roadToFinal({ matchups: matchups as never }, { id: "grp" });
  assert.equal(road.totals.played, false);
  assert.deepEqual(road.totals.finalists.map((f) => [f.name, f.matches, f.won]), [["A", 3, 3], ["D", 3, 1]]);
  const svg = road.draw();
  assert.deepEqual(textsOf(svg, "tb-r-vs"), ["v"]);
  assert.ok(textsOf(svg, "tb-lab").includes("Group stage"));
  assert.ok(road.summary.endsWith("The final is still to be played."));
  assert.throws(() => T.roadToFinal([{ sides: ["A", "B"], round: 0, score: [1, 0] }] as never), /no final/);
});

test("a tournament with a layout gives the same road as its list of ties", () => {
  const layout = T.layoutBracket(wc2022);
  assert.equal(T.roadToFinal(layout, { id: "x" }).draw(), T.roadToFinal(wc2022, { id: "x" }).draw());
  assert.equal(T.roadToFinal(wc2022.matchups, { id: "y" }).totals.rounds.length, 3);
});

test("the road's marks come from the `flags` renderer, and fall back to the mark or the initials", async () => {
  const codes = ["AR", "FR", "AU", "NL", "HR", "BR", "MA", "PT", "GB-ENG", "JP", "KR", "US", "PL", "SN", "ES", "CH"];
  const loaded: Record<string, string | null> = {};
  for (const code of codes) loaded[code] = await flag(code, { shape: "round" });
  const asked: string[] = [];
  const flags: FlagRenderer = (code, request) => {
    asked.push(`${code}:${request.shape}:${request.size}`);
    return loaded[code];
  };
  const withFlags = { ...wc2022, teams: wc2022.teams.map((t) => ({ ...t, flag: t.region })) };
  const svg = T.roadToFinal(withFlags, { flags, id: "fl" }).draw({ size: "card" });
  assert.ok(svg.includes("<symbol"), "a flag is a symbol");
  assert.ok(asked.length > 0 && asked.every((a) => a.split(":")[1] === "round"));
  assert.equal(new Set(asked).size, asked.length, "the renderer is asked once for each flag and size");
  assert.ok(!textsOf(svg, "tb-initials").includes("ARG"), "Argentina is its flag, not its initials");
  // With no renderer the flag code is not drawn: initials.
  assert.ok(textsOf(T.roadToFinal(withFlags).draw(), "tb-initials").includes("ARG"));
});
