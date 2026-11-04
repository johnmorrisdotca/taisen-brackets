// The code the builder's embed panel writes for each way a page is made: the call runs and draws what the page draws, and every other way holds the options of the choices made.
import assert from "node:assert/strict";
import { test } from "node:test";
import { advanceWinners, drawBracket, singleElimination } from "../src/index.ts";
import { CHOICES, drawOptions, embedCode, frameCode, frameQuery, tournament, type State } from "../demo/embed-code.js";

const T = { advanceWinners, singleElimination };
const STATE = Object.fromEntries(Object.entries(CHOICES).map(([key, one]) => [key, one.default])) as State;
const AsyncFunction = Object.getPrototypeOf(async () => undefined).constructor as new (...names: string[]) => (...values: unknown[]) => Promise<void>;

test("the call runs against the package and draws the bracket the page draws, for every number of teams and every look", async () => {
  for (const teams of CHOICES.teams.values) {
    for (const look of CHOICES.look.values) {
      const state = { ...STATE, teams, look, layout: "rows", background: "ice" };
      const played = tournament(T, Number(teams));
      const code = embedCode("module", played, drawOptions(state));
      assert.ok(code);
      let written = "";
      const body = code.replace(/^import .*$/m, "");
      await new AsyncFunction("advanceWinners", "drawBracket", "singleElimination", "document", body)(advanceWinners, drawBracket, singleElimination, { querySelector: () => ({ set innerHTML(html: string) { written = html; } }) });
      assert.equal(written, drawBracket({ teams: played.teams, matchups: played.matchups }, drawOptions(state)), `${teams} teams, ${look}`);
    }
  }
});

test("the other ways draw your list of games with the options chosen", () => {
  const played = tournament(T, 8);
  const options = drawOptions({ ...STATE, background: "turf", look: "classic" });
  for (const kind of ["html", "react", "vue", "angular", "svelte"]) {
    const code = embedCode(kind, played, options);
    assert.ok(code, kind);
    assert.ok(code.includes(`drawBracket(${kind === "vue" ? "props.ties" : "ties"}, ${JSON.stringify(options)})`), kind);
  }
  assert.match(embedCode("html", played, options)!, /cdn\.jsdelivr\.net\/npm\/@johnmorrisdotca\/taisen-brackets@0\/\+esm/);
  assert.match(embedCode("react", played, options)!, /dangerouslySetInnerHTML/);
  assert.match(embedCode("vue", played, options)!, /v-html/);
  assert.match(embedCode("angular", played, options)!, /bypassSecurityTrustHtml/);
  assert.match(embedCode("svelte", played, options)!, /\{@html /);
  assert.equal(embedCode("iframe", played, options), undefined);
});

test("the options are what the rows chose: a road look adds seeds and a background only when there is one", () => {
  assert.deepEqual(drawOptions(STATE), { size: "wide", look: "road", theme: "light", layout: "tree", seeds: true });
  assert.deepEqual(drawOptions({ ...STATE, look: "classic", background: "pitch" }), { size: "wide", look: "classic", theme: "light", layout: "tree", background: "pitch" });
});

test("the frame is the embed page at the drawn size, with the look, the theme and the size it reads", () => {
  assert.equal(frameQuery({ ...STATE, theme: "dark", size: "card" }), "look=road&theme=dark&size=card");
  const copied = frameCode(STATE, 960, 540, false);
  assert.match(copied, /src="https:\/\/johnmorrisdotca\.github\.io\/taisen-brackets\/embed\.html\?look=road&amp;theme=light&amp;size=wide"/);
  assert.match(copied, /width="960"/);
  assert.match(copied, /height="540"/);
  assert.match(frameCode(STATE, 960, 540, true), /src="embed\.html\?look=road/);
});
