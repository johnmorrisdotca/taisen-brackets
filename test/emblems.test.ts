import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { EMBLEM_IDS, emblemName, renderEmblem } from "@johnmorrisdotca/dougu-sports/emblems";
import { build } from "../demo/data.js";
import * as T from "../src/index.ts";
import type { EmblemRenderer, EmblemRequest } from "../src/index.ts";
import { wellFormed } from "./helpers.ts";

const { nhl2024, wc2022 } = build(T);
const noStyle = (svg: string) => svg.replace(/<style>[\s\S]*?<\/style>/, "");
const heightOf = (svg: string) => Number(/class="tb-emblem"[^>]*height="([\d.]+)"/.exec(svg)![1]);

/** A renderer that records what it was asked for and answers with a small SVG that carries a title and a script. */
function spy() {
  const calls: { id: string; options: EmblemRequest }[] = [];
  const render: EmblemRenderer = (id, options) => {
    calls.push({ id, options });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${options.size}" height="${options.size}" role="img"><title>Spy</title><script>alert(1)</script><circle cx="32" cy="32" r="20" onclick="x()"/></svg>`;
  };
  return { calls, render };
}

test("a string trophy that names an emblem is drawn through the renderer, once, with the size it has in the drawing", () => {
  const { calls, render } = spy();
  const svg = T.drawBracket(wc2022, { emblems: render, trophy: "trophy:soccer-globe" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, "trophy:soccer-globe");
  assert.equal(calls[0].options.size, heightOf(svg), "the renderer is asked for the size the trophy is drawn at");
  assert.ok(calls[0].options.size > 0);
  assert.match(svg, /class="tb-emblem"[^>]*viewBox="0 0 64 64"/);
  assert.equal(wellFormed(svg), null);
});

test("the renderer is told the style, the tint and the look of the bracket", () => {
  const ask = (options: Partial<T.DrawOptions>) => { const s = spy(); T.drawBracket(wc2022, { emblems: s.render, trophy: "trophy:cup", ...options }); return s.calls[0].options; };
  assert.equal(ask({}).style, "metal");
  assert.equal(ask({ emblemStyle: "line" }).style, "line");
  assert.equal(ask({}).tint, undefined);
  assert.equal(ask({ emblemTint: "#c8102e" }).tint, "#c8102e");
  assert.equal(ask({ theme: "light" }).theme, "light");
  assert.equal(ask({ theme: "dark" }).theme, "dark");
  assert.equal(ask({ theme: "poster" }).theme, "dark");
  assert.equal(ask({ theme: "auto" }).theme, "inherit");
  assert.equal(ask({}).theme, "inherit");
  assert.equal(ask({ theme: "none" }).theme, "inherit");
  assert.equal(ask({ size: "phone" }).size > 0, true);
});

test("an emblem id with no renderer draws nothing, takes no room and does not throw", () => {
  const without = T.drawBracket(wc2022);
  const id = T.drawBracket(wc2022, { trophy: "trophy:hockey-cup" });
  assert.ok(!/tb-emblem"|<image/.test(noStyle(id)));
  assert.equal(/viewBox="[^"]+"/.exec(id)![0], /viewBox="[^"]+"/.exec(without)![0], "the drawing is as tall as one with no trophy");
  assert.equal(wellFormed(id), null);
  assert.ok(!/tb-emblem"|<image/.test(noStyle(T.drawBracket(nhl2024, { trophy: "medal:gold/line", emblems: undefined }))));
});

test("no champion, no emblem: the renderer is not called", () => {
  const { calls, render } = spy();
  T.drawBracket(wc2022, { emblems: render, trophy: "trophy:cup", champion: false });
  assert.equal(calls.length, 0);
});

test("a trophy that is inline SVG or an address is drawn as before, with or without a renderer", () => {
  const inline = '<svg viewBox="0 0 10 10"><path d="M1 1h8v3H1z"/></svg>';
  const { calls, render } = spy();
  for (const trophy of [inline, "https://example.com/cup.svg", "img/cup.png", "data:image/png;base64,AAAA"]) {
    const plain = T.drawBracket(wc2022, { trophy });
    assert.equal(T.drawBracket(wc2022, { trophy, emblems: render }), plain, "a renderer changes nothing for a trophy that is not an emblem id");
    assert.ok(!/tb-emblem"/.test(noStyle(plain)));
  }
  assert.equal(calls.length, 0);
  assert.match(T.drawBracket(wc2022, { trophy: inline }), /class="tb-gold"[^>]*viewBox="0 0 10 10"/);
  assert.match(T.drawBracket(wc2022, { trophy: "https://example.com/cup.svg" }), /<image href="https:\/\/example\.com\/cup\.svg"/);
});

test("what an emblem renderer returns is cleaned, and a renderer that fails draws no trophy", () => {
  const { render } = spy();
  const svg = T.drawBracket(wc2022, { emblems: render, trophy: "trophy:cup" });
  assert.ok(!/<script|onclick|alert\(1\)|<title>Spy/.test(svg), "scripts, handlers and the emblem's own title are removed");
  assert.match(svg, /<circle cx="32" cy="32" r="20"\/>/);
  const broken: EmblemRenderer[] = [() => { throw new Error("unknown emblem"); }, () => "not svg", () => "<div>no</div>", () => undefined as unknown as string];
  for (const emblems of broken) {
    const out = T.drawBracket(wc2022, { emblems, trophy: "trophy:cup" });
    assert.ok(!/tb-emblem"/.test(noStyle(out)));
    assert.equal(wellFormed(out), null);
  }
});

test("the emblem takes its ink from the drawing's own colour, so it follows light, dark and poster", () => {
  for (const theme of ["auto", "light", "dark", "poster"] as const) assert.match(T.drawBracket(wc2022, { theme }), /\.tb-emblem\{color:var\(--tb-ink, #[0-9a-f]{6}\)\}/);
  assert.ok(!/<style>/.test(T.drawBracket(wc2022, { theme: "none" })));
});

test("the real renderer of @johnmorrisdotca/dougu-sports draws a trophy in every look and style", () => {
  for (const theme of ["auto", "light", "dark", "poster", "none"] as const) {
    for (const emblemStyle of ["metal", "line", "color"] as const) {
      const svg = T.drawBracket(wc2022, { emblems: renderEmblem, trophy: "trophy:soccer-globe", theme, emblemStyle });
      assert.match(svg, /class="tb-emblem"/);
      assert.equal(wellFormed(svg), null, `${theme} ${emblemStyle}`);
      assert.ok(!/NaN|undefined|Infinity/.test(svg));
    }
  }
  const svg = T.drawBracket(nhl2024, { emblems: renderEmblem, trophy: "trophy:hockey-cup" });
  assert.ok(!svg.includes(emblemName("trophy:hockey-cup")), "the emblem's own title (English only) is not written into the drawing");
  assert.equal(svg, T.drawBracket(nhl2024, { emblems: renderEmblem, trophy: "trophy:hockey-cup" }), "the same input gives the same string");
  assert.match(T.drawBracket(nhl2024, { emblems: renderEmblem, trophy: "trophy:hockey-cup", locale: "ja" }), /lang="ja"/);
});

test("every league's default emblem is an emblem of @johnmorrisdotca/dougu-sports, and each format carries it", () => {
  for (const league of T.LEAGUES) {
    const id = T.LEAGUE_EMBLEMS[league];
    assert.ok((EMBLEM_IDS as readonly string[]).includes(id), `${league}: ${id}`);
    assert.ok(T.isEmblemId(id));
    assert.equal(T.playoffEras(league)[0].emblem, id);
  }
  assert.deepEqual(
    { nhl: "trophy:hockey-cup", nba: "trophy:basketball", mlb: "trophy:baseball", nfl: "trophy:football", cfl: "trophy:canadian-bowl", worldcup: "trophy:soccer-globe" },
    Object.fromEntries((["nhl", "nba", "mlb", "nfl", "cfl", "worldcup"] as const).map((l) => [l, T.playoffFormat(l, l === "worldcup" ? 2022 : 2024)!.emblem])),
  );
  const svg = T.drawBracket(nhl2024, { emblems: renderEmblem, trophy: T.playoffFormat("nhl", 2024)!.emblem });
  assert.match(svg, /class="tb-emblem"/);
});

test("isEmblemId tells an emblem id from SVG and from an address", () => {
  for (const yes of ["trophy:cup", "trophy:hockey-cup", " medal:gold ", "trophy:cup/line", "crest:shield"]) assert.ok(T.isEmblemId(yes), yes);
  for (const no of ["", "cup", "<svg></svg>", "https://example.com/a.svg", "data:image/png;base64,AAAA", "javascript:alert(1)", "//host/a.svg", "img/cup.png", "mailto:a@b.c", "trophy:cup/other"]) assert.ok(!T.isEmblemId(no), no);
});

test("the package stays dependency-free: nothing in src imports the emblems, and the manifest only names them as an optional peer", () => {
  for (const file of readdirSync(new URL("../src/", import.meta.url))) {
    const text = readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
    assert.ok(!/from\s+["'][^"']*dougu/.test(text) && !/import\(\s*["'][^"']*dougu/.test(text) && !/require\(/.test(text), `${file} imports nothing from dougu-sports`);
  }
  const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(manifest.dependencies, undefined, "no runtime dependencies");
  assert.equal(manifest.peerDependenciesMeta["@johnmorrisdotca/dougu-sports"].optional, true);
  assert.deepEqual(Object.keys(manifest.peerDependencies), ["@johnmorrisdotca/dougu-sports"]);
  assert.match(manifest.devDependencies["@johnmorrisdotca/dougu-sports"], /^\d+\.\d+\.\d+$/, "pinned to an exact version");
});
