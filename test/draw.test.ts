import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "../demo/data.js";
import * as T from "../src/index.ts";
import type { Matchup, Team } from "../src/index.ts";
import { finished, wellFormed } from "./helpers.ts";

const { mlb2022, mls2024, nhl2024, twoLegs, wc1938, wc2022, wc2026 } = build(T);
const count = (text: string, part: string) => text.split(part).length - 1;
const viewBox = (svg: string) => /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)!.slice(1).map(Number);

test("a drawing is well-formed SVG with a title, a description and no stray numbers", () => {
  for (const ex of [nhl2024, wc2022, wc2026, mlb2022, wc1938, twoLegs]) {
    const svg = T.drawBracket(ex);
    assert.equal(wellFormed(svg), null);
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /role="img" aria-labelledby="(tb-[a-z0-9]+)-t \1-d"/);
    assert.ok(!/NaN|undefined|Infinity|\bnull\b/.test(svg), "no NaN, undefined or null in the drawing");
    assert.equal(count(svg, 'class="tb-tie'), ex.matchups.length, "a box for every tie");
  }
});

test("the same input gives the same string, and a different one a different id", () => {
  const a = T.drawBracket(wc2022, { title: "A" });
  assert.equal(a, T.drawBracket(wc2022, { title: "A" }));
  const idOf = (svg: string) => /class="taisen ([^ "]+)/.exec(svg)![1];
  assert.notEqual(idOf(a), idOf(T.drawBracket(wc2022, { title: "B" })));
  assert.equal(idOf(T.drawBracket(wc2022, { id: "mine" })), "mine");
});

test("the three sizes are 1200 by 675, 1080 by 1080, and 390 wide as tall as it needs", () => {
  assert.deepEqual(viewBox(T.drawBracket(wc2022, { size: "wide" })), [1200, 675]);
  assert.deepEqual(viewBox(T.drawBracket(wc2022, { size: "square" })), [1080, 1080]);
  const [w, h] = viewBox(T.drawBracket(wc2022, { size: "phone" }));
  assert.equal(w, 390);
  assert.ok(h > 600, `a phone's bracket is tall (${h})`);
  assert.deepEqual(viewBox(T.drawBracket(wc2022, { size: { width: 800, height: 500 } })), [800, 500]);
  const [, big] = viewBox(T.drawBracket(finished(64), { size: { width: 600, height: 300 } }));
  assert.ok(big > 300, "the drawing grows rather than squashing its boxes");
});

test("the phone's bracket is drawn in rows, the others in columns, and a box never leaves the drawing", () => {
  for (const size of ["wide", "square", "phone"] as const) {
    for (const n of [4, 8, 16, 32]) {
      const svg = T.drawBracket(finished(n, { thirdPlace: true }), { size, title: "t", subtitle: "s" });
      const [w, h] = viewBox(svg);
      for (const m of svg.matchAll(/<rect class="tb-box" x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
        const [x, y, bw, bh] = m.slice(1).map(Number);
        assert.ok(x >= 0 && y >= 0 && x + bw <= w + 0.01 && y + bh <= h + 0.01, `${size} ${n}: box at ${x},${y} ${bw}x${bh} is outside ${w}x${h}`);
      }
    }
  }
  const wide = T.drawBracket(wc2022, { orientation: "vertical" });
  assert.equal(wellFormed(wide), null);
});

test("no two boxes overlap", () => {
  for (const size of ["wide", "square", "phone"] as const) {
    for (const ex of [finished(8, { thirdPlace: true }), finished(16, { thirdPlace: true }), finished(32), nhl2024, mlb2022]) {
      const svg = T.drawBracket(ex, { size });
      const boxes = [...svg.matchAll(/<rect class="tb-box" x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)].map((m) => m.slice(1).map(Number));
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const [ax, ay, aw, ah] = boxes[i], [bx, by, bw, bh] = boxes[j];
          const overlap = ax < bx + bw - 0.5 && bx < ax + aw - 0.5 && ay < by + bh - 0.5 && by < ay + ah - 0.5;
          assert.ok(!overlap, `${size}: boxes ${i} and ${j} overlap`);
        }
      }
    }
  }
});

test("themes: auto follows the page, the others are one look, none writes no style", () => {
  const auto = T.drawBracket(wc2022);
  assert.match(auto, /<style>/);
  assert.match(auto, /@media \(prefers-color-scheme: dark\)/);
  assert.match(auto, /:root\[data-theme="dark"\]/);
  assert.ok(!/@media/.test(T.drawBracket(wc2022, { theme: "dark" })));
  assert.match(T.drawBracket(wc2022, { theme: "poster" }), new RegExp(T.THEMES.poster.line));
  const none = T.drawBracket(wc2022, { theme: "none" });
  assert.ok(!/<style>/.test(none));
  assert.match(none, /stroke="currentColor"/);
  assert.match(auto, /var\(--tb-ink, #1f2320\)/, "every colour can be set from the page");
  assert.match(T.drawBracket(wc2022, { background: false }), /^(?:(?!class="tb-bg" width).)*$/s);
});

test("the champion is in the centre once the final is played, with an optional trophy", () => {
  const svg = T.drawBracket(wc2022);
  assert.match(svg, /CHAMPION/);
  assert.match(svg, /Argentina<\/text>/);
  assert.ok(!/CHAMPION/.test(T.drawBracket(wc2022, { champion: false })));
  const last = wc2022.matchups.find((m: Matchup) => m.round === 4 && !m.third)!;
  const open = wc2022.matchups.map((m: Matchup) => (m === last ? { id: last.id, sides: last.sides } : m));
  assert.ok(!/CHAMPION/.test(T.drawBracket({ matchups: open, teams: wc2022.teams })));
  const trophy = '<svg viewBox="0 0 10 10"><path d="M1 1h8v3H1z"/></svg>';
  const withTrophy = T.drawBracket(wc2022, { trophy });
  assert.match(withTrophy, /class="tb-gold"[^>]*viewBox="0 0 10 10"/);
  assert.equal(wellFormed(withTrophy), null);
  const noTrophy = T.drawBracket(wc2022);
  assert.ok(!/class="tb-gold"/.test(noTrophy.replace(/\.tb-[^{]*\{[^}]*\}/g, "")));
});

test("the third-place match is drawn apart, under the final, and can be hidden", () => {
  const svg = T.drawBracket(wc2022);
  assert.match(svg, /THIRD PLACE/);
  assert.equal(count(svg, 'class="tb-tie'), 16);
  const hidden = T.drawBracket(wc2022, { thirdPlace: "hide" });
  assert.ok(!/THIRD PLACE/.test(hidden));
  assert.equal(count(hidden, 'class="tb-tie'), 15);
});

test("the winner is highlighted, the loser quiet, and scores, pens and notes are written", () => {
  const svg = T.drawBracket(wc2022);
  assert.ok(count(svg, 'class="tb-won"') >= 15);
  assert.ok(count(svg, 'class="tb-lost"') >= 15);
  assert.match(svg, /Argentina 3, France 3 \(after extra time, 4–2 on penalties\)\. Winner: Argentina/);
  assert.match(svg, /\(4\)/);
  const plain = T.drawBracket(wc2022, { winnerHighlight: false, scores: false });
  assert.ok(!/class="tb-won"/.test(plain));
  assert.ok(!/class="tb-score"/.test(plain));
});

test("a series is drawn with its games won, and notes say how long it went", () => {
  const svg = T.drawBracket(nhl2024, { size: "square" });
  assert.match(svg, /Florida Panthers 4, Edmonton Oilers 3 \(in 7\)/);
  assert.match(svg, /class="tb-half"[^>]*>Western Conference</);
  assert.match(svg, /class="tb-half"[^>]*>Eastern Conference</);
});

test("round names: generic, from a format, from a list, or in the words you choose", () => {
  const svg = T.drawBracket(finished(8));
  assert.match(svg, /QUARTER-FINALS/);
  assert.match(svg, /SEMI-FINALS/);
  assert.match(svg, /FINAL/);
  const format = T.playoffFormat("nhl", 2024)!;
  const named = T.drawBracket(nhl2024, { roundNames: format });
  assert.match(named, /STANLEY CUP FINAL/);
  assert.match(named, /CONFERENCE FINALS/);
  assert.match(T.drawBracket(wc2022, { roundNames: ["A", "B", "C", "D"] }), />A</);
  assert.match(T.drawBracket(wc2022, { words: { champion: "Winner!" } }), /WINNER!/);
  assert.ok(!/ROUND OF 16/.test(T.drawBracket(wc2022, { roundLabels: false })));
});

test("a team's mark: a logo address, inline SVG, or initials; unsafe things are dropped", () => {
  const teams: Team[] = [
    { id: "A", name: "Alpha", mark: "https://example.com/a.png" },
    { id: "B", name: "Beta", mark: '<svg viewBox="0 0 4 3"><rect width="4" height="3" fill="#c00"/><script>alert(1)</script><circle r="1" onclick="x()"/></svg>' },
    { id: "C", name: "Gamma", mark: "javascript:alert(1)" },
    { id: "D", name: "Delta" },
  ];
  const matchups: Matchup[] = [{ sides: ["A", "B"], score: [1, 0], date: "1" }, { sides: ["C", "D"], score: [0, 1], date: "1" }, { sides: ["A", "D"], score: [2, 0], date: "2" }];
  const svg = T.drawBracket({ matchups, teams });
  assert.match(svg, /<image href="https:\/\/example\.com\/a\.png"/);
  assert.match(svg, /<symbol id="[^"]+" viewBox="0 0 4 3" preserveAspectRatio="xMidYMid slice">/);
  assert.match(svg, /<use href="#[^"]+-m1" x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*"\/>/);
  assert.equal(count(svg, "<symbol "), 1, "a mark used in several places is written once");
  assert.ok(!/alert|onclick|<script/.test(svg));
  assert.match(svg, /class="tb-initials"[^>]*>GAM</);
  assert.equal(wellFormed(svg), null);
  assert.match(svg, /<clipPath id="[^"]+-c\d/);
  assert.ok(!/<image/.test(T.drawBracket({ matchups, teams }, { markShape: "none" })));
  assert.equal(T.safeUrl("javascript:alert(1)"), false);
  assert.equal(T.safeUrl("data:text/html;base64,AAAA"), false);
  assert.equal(T.safeUrl("/logos/a.svg"), true);
  assert.equal(T.safeUrl("//evil.example/x.png"), false);
  assert.equal(T.cleanSvg("<div>no</div>"), null);
});

test("names are escaped", () => {
  const teams: Team[] = [{ id: "x", name: '<b onload="1">Evil</b> & Sons' }, { id: "y", name: "Good" }];
  const svg = T.drawBracket({ matchups: [{ sides: ["x", "y"], score: [1, 0] }], teams }, { title: "<script>" });
  assert.ok(!/<b |<script>/.test(svg));
  assert.match(svg, /&lt;b onload=&quot;1&quot;&gt;Evil&lt;\/b&gt; &amp; Sons/);
  assert.equal(wellFormed(svg), null);
  assert.equal(wellFormed(T.bracketTable({ matchups: [{ sides: ["x", "y"], score: [1, 0] }], teams })), null);
});

test("the poster look, flags only: marks in each box, no names, no round labels", () => {
  const svg = T.drawBracket(wc2022, { theme: "poster", detail: "mark", roundLabels: false, title: "World Cup 2022" });
  assert.match(svg, /WORLD CUP 2022/);
  assert.ok(!/class="tb-name"[^>]*>(Netherlands|NED)</.test(svg.replace(/<title>.*?<\/title>/g, "")));
  assert.ok(!/ROUND OF 16/.test(svg));
  assert.equal(wellFormed(svg), null);
});

test("ties that lead nowhere are drawn below the bracket", () => {
  const { teams, matchups } = finished(8);
  const svg = T.drawBracket({ matchups: [...matchups, { id: "x", sides: ["T8", "T7"], round: 1, winner: "T8", date: "1", score: [1, 0] }], teams });
  assert.match(svg, /OTHER TIES/);
  assert.equal(count(svg, 'class="tb-tie'), 8);
  assert.equal(wellFormed(svg), null);
});

test("a bracket drawn left to right ends in the champion", () => {
  const svg = T.drawBracket(finished(8), { shape: "ltr" });
  assert.match(svg, /CHAMPION/);
  assert.equal(wellFormed(svg), null);
  assert.match(T.drawBracket(finished(8), { shape: "ltr", size: "phone" }), /CHAMPION/);
});

test("an unplayed bracket draws, with TBD where a side is not known", () => {
  const teams = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: `Seed ${i + 1}` }));
  const svg = T.drawBracket(T.singleElimination(teams, { thirdPlace: true }));
  assert.match(svg, />TBD</);
  assert.ok(!/CHAMPION/.test(svg));
  assert.equal(wellFormed(svg), null);
});

test("seeds are shown when asked", () => {
  assert.match(T.drawBracket(finished(8), { seeds: true }), />1 Team 1</);
  assert.ok(!/>1 Team 1</.test(T.drawBracket(finished(8))));
});

test("the table lists every tie, with the winner in bold, and describes the bracket", () => {
  const html = T.bracketTable(wc2022);
  assert.equal(wellFormed(html), null);
  assert.match(html, /<caption>16 teams, 4 rounds<\/caption>/);
  assert.equal(count(html, "<tr>"), 17, "a header row and a row for each of 16 ties");
  assert.match(html, /<th scope="row">Round of 16<\/th><td>Dec 3, 2022<\/td><td><strong>Netherlands<\/strong><\/td><td>3–1<\/td><td>United States<\/td>/);
  assert.match(html, /<th scope="row">Third place<\/th>/);
  assert.match(html, /after extra time, 4–2 on penalties/);
  assert.equal(T.describeBracket(wc2022), "16 teams, 4 rounds. Final: Argentina 3, France 3 (after extra time, 4–2 on penalties). Winner: Argentina. Champion: Argentina.");
  assert.match(T.bracketTable(nhl2024, { caption: "NHL", roundNames: T.playoffFormat("nhl", 2024)! }), /Stanley Cup Final/);
});

test("replays are noted, and a team with no first-round match is drawn with a bye", () => {
  const svg = T.drawBracket(wc1938);
  assert.match(svg, /replay/);
  const layout = T.layoutBracket(wc1938);
  const withBye = layout.sides.flatMap((s) => s.boxes).filter((b) => b.bye !== null);
  assert.deepEqual(withBye.map((b) => layout.ties[b.i].sides[b.bye!]!.name), ["Sweden"], "Austria withdrew: Sweden had no first-round tie");
});

test("no matchups draw an empty bracket, not an error", () => {
  const svg = T.drawBracket([], { title: "Nothing yet" });
  assert.equal(wellFormed(svg), null);
  assert.ok(!/NaN|undefined/.test(svg));
  assert.match(svg, /Nothing yet/);
  assert.equal(T.bracketTable([]).includes("<tbody></tbody>"), true);
});

test("a side that had a bye says so beside its score", () => {
  const svg = T.drawBracket(mlb2022);
  assert.equal(count(svg, ">bye</text>"), 4, "the four teams that skipped the wild card series");
  assert.equal(count(T.drawBracket(wc2022), ">bye</text>"), 0);
  assert.match(T.drawBracket(mlb2022, { words: { bye: "pass" } }), />pass<\/text>/);
  // Where a box is too narrow for the name and the word, the word is left out rather than the name cut.
  assert.ok(!T.drawBracket(mls2024).includes(">bye</text>"), "MLS round one boxes are too narrow for the name and the word");
  assert.ok(T.drawBracket(mls2024, { size: { width: 2600, height: 900 } }).includes(">bye</text>"), "and have room for both when the drawing is wider");
});
