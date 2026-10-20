// The bout presentation board: its size from the officials, what each part says, roles in order, looks, languages, and that every text sits inside its band or row.
import assert from "node:assert/strict";
import { test } from "node:test";
import { FLAGS, FLAGS_RECT } from "../demo/flags-data.js";
import { BOUT_SAMPLE as B } from "../demo/data/results-sample.js";
import * as T from "../src/index.ts";
import type { BoutBoardOptions, BoutBoardSource } from "../src/index.ts";
import { overlap, textBox } from "./geometry.ts";
import { wellFormed } from "./helpers.ts";
import { parseXml, walk, withClass } from "./xml.ts";

const flags = (code: string, r: { shape: string }) => (r.shape === "rect" ? (FLAGS_RECT as Record<string, string>)[code] : (FLAGS as Record<string, string>)[code]);
const texts = (svg: string): string[] => walk(parseXml(svg)).filter((n) => n.name === "text").map((n) => n.text);
const textsOf = (g: ReturnType<typeof withClass>[number]) => walk(g).filter((n) => n.name === "text" && n.attrs.class !== "tb-initials").map((n) => n.text);
const view = (svg: string): [number, number] => /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)!.slice(1).map(Number) as [number, number];

test("the size follows from the officials: the width given and 64 + 38 + 10 + 62 + 10 + 38 + 42 an official + 10, scaled", () => {
  assert.deepEqual(T.boutBoardSize(6), { width: 1280, height: 484 });
  assert.deepEqual(T.boutBoardSize(0), { width: 1280, height: 232 });
  assert.deepEqual(T.boutBoardSize(6, { width: 640 }), { width: 640, height: 242 });
  for (const width of [720, 960, 1280, 1920]) {
    const svg = T.boutBoard(B, { width, flags });
    assert.deepEqual(view(svg), [width, T.boutBoardSize(B.officials!.length, { width }).height]);
  }
});

test("the board says the event and phase, the bout, the two athletes, and each official with the role", () => {
  const svg = T.boutBoard(B, { flags });
  assert.equal(wellFormed(svg), null);
  assert.equal(svg, T.boutBoard(B, { flags }));
  const t = texts(svg);
  for (const x of ["WOMEN'S 57-60 KG", "PRELIMINARIES", "BOUT PRESENTATION", "BOUT: 142", "REFEREE AND JUDGES", "–"]) assert.ok(t.includes(x), x);
  const root = parseXml(svg);
  const athletes = withClass(root, "bc-athlete").map(textsOf);
  assert.deepEqual(athletes, [["BRA", "TAVARES M."], ["MAYER M.", "USA"]]);
  const officials = withClass(root, "bc-official").map(textsOf);
  assert.equal(officials.length, 6);
  assert.deepEqual(officials[0], ["MGL", "KHISHIGEE Khas-Erdene", "REFEREE"]);
  assert.deepEqual(officials[1], ["POL", "GORNY Mariusz", "JUDGE 1"]);
  assert.deepEqual(officials[5], ["FRA", "MADFOUA Fathi", "JUDGE 5"]);
  assert.equal(withClass(root, "bc-red").length, 1);
  assert.equal(withClass(root, "bc-blue").length, 1);
  assert.match(svg, /data-board="bout-board"/);
  assert.match(svg, /<title id="[^"]+">Women's 57-60 kg<\/title>/);
  // Flags are asked for 4:3.
  const asked = new Set<string>();
  T.boutBoard(B, { flags: (c, r) => { asked.add(r.shape); return flags(c, r); } });
  assert.deepEqual([...asked], ["rect"]);
});

test("judges are numbered in the order given, whatever comes between, and a role of your own is written as it is", () => {
  const src: BoutBoardSource = { title: "x", red: { name: "A" }, blue: { name: "B" }, officials: [{ name: "One" }, { name: "Chair", role: "Mat president" }, { name: "Two", role: "judge" }, { name: "Ref", role: "referee" }, { name: "Three" }] };
  const roles = withClass(parseXml(T.boutBoard(src)), "bc-official").map((g) => textsOf(g).at(-1));
  assert.deepEqual(roles, ["JUDGE 1", "MAT PRESIDENT", "JUDGE 2", "REFEREE", "JUDGE 3"]);
  assert.deepEqual(withClass(parseXml(T.boutBoard(src, { locale: "fr" })), "bc-official").map((g) => textsOf(g).at(-1)).slice(0, 1), ["JUGE 1"]);
});

test("with no bout number and no officials the board is the title, the athletes and one bar", () => {
  const svg = T.boutBoard({ title: "Final", red: { name: "A" }, blue: { name: "B" } });
  assert.equal(wellFormed(svg), null);
  assert.ok(!texts(svg).some((x) => x.startsWith("BOUT:")));
  assert.equal(withClass(parseXml(svg), "bc-official").length, 0);
  assert.deepEqual(view(svg), [1280, 232]);
  assert.equal(texts(T.boutBoard({ title: "Final", bout: "A-12", red: { name: "A" }, blue: { name: "B" } })).includes("BOUT: A-12"), true);
});

test("names: two-part names, capitals, and the description is a sentence", () => {
  const src: BoutBoardSource = { title: "Women's 57-60 kg", phase: "Preliminaries", bout: 142, red: { name: { surname: "Tavares", given: "Marta" }, code: "BRA" }, blue: { name: "Mayer M.", code: "USA" }, officials: [{ name: "Gorny Mariusz", code: "POL", role: "referee" }, { name: "Sidi", code: "ALG" }] };
  const names = (o: BoutBoardOptions) => withClass(parseXml(T.boutBoard(src, o)), "bc-athlete").map((g) => textsOf(g).filter((x) => !/^(BRA|USA)$/.test(x))[0]);
  assert.deepEqual(names({}), ["TAVARES Marta", "Mayer M."]);
  assert.deepEqual(names({ nameStyle: "given-first" }), ["Marta TAVARES", "Mayer M."]);
  assert.deepEqual(names({ nameCase: "upper" }), ["TAVARES MARTA", "MAYER M."]);
  assert.equal(T.describeBoutBoard(src), "Women's 57-60 kg. Preliminaries. Bout presentation: Bout: 142. TAVARES Marta (BRA) v Mayer M. (USA). Referee and judges: Referee Gorny Mariusz (POL), Judge 1 Sidi (ALG).");
});

test("the looks and the icons draw, and hostile text is escaped", () => {
  for (const look of T.BROADCAST_LOOKS) for (const icon of ["medal", "stopwatch", "none"] as const) assert.equal(wellFormed(T.boutBoard(B, { look, icon, flags })), null);
  const svg = T.boutBoard({ title: "<script>", phase: "<b>", bout: "<i>", red: { name: "<u>", code: "<o>" }, blue: { name: `"&"` }, officials: [{ name: "<n>", role: "<r>" }] }, { id: `x"><script>` });
  assert.equal(wellFormed(svg), null);
  assert.ok(!/<script|<b>|<i>|<u>|<o>|<n>|<r>/.test(svg));
});

test("the board refuses what cannot be drawn", () => {
  const ok: BoutBoardSource = { title: "x", red: { name: "A" }, blue: { name: "B" } };
  assert.throws(() => T.boutBoard({ ...ok, title: " " }), /needs a title/);
  assert.throws(() => T.boutBoard(undefined as never), /needs a title/);
  assert.throws(() => T.boutBoard({ ...ok, red: { name: "" } }), /red athlete needs a name/);
  assert.throws(() => T.boutBoard({ ...ok, blue: undefined as never }), /blue athlete needs a name/);
  assert.throws(() => T.boutBoard({ ...ok, officials: [{ name: "" }] }), /official 1 needs a name/);
  assert.throws(() => T.boutBoard({ ...ok, officials: Array.from({ length: 13 }, (_, i) => ({ name: `J${i}` })) }), /at most 12 officials/);
  assert.throws(() => T.boutBoard({ ...ok, officials: [{ name: "A", role: " " }] }), /role of official 1/);
  assert.throws(() => T.boutBoard({ ...ok, bout: {} as never }), /bout number/);
  assert.throws(() => T.boutBoard(ok, { nameCase: "x" as never }), /nameCase/);
  assert.throws(() => T.boutBoard(ok, { look: "red" as never }), /look/);
  assert.throws(() => T.boutBoard(ok, { width: 700 }), /width is from 720/);
});

test("every language draws with no hole left unfilled, and nothing is stretched", () => {
  for (const locale of T.LOCALE_CODES) {
    const svg = T.boutBoard(B, { locale, flags });
    assert.equal(wellFormed(svg), null, locale);
    assert.ok(!/undefined|\{[a-z]+\}/.test(svg.replace(/<style>[\s\S]*?<\/style>/, "")), locale);
    assert.ok(!/undefined|\{[a-z]+\}/.test(T.describeBoutBoard(B, { locale })), locale);
  }
  assert.ok(texts(T.boutBoard(B, { locale: "fr" })).includes("ARBITRE ET JUGES"));
  for (const width of [720, 1280]) {
    const svg = T.boutBoard(B, { width });
    assert.ok(!/textLength|lengthAdjust/.test(svg));
    for (const n of walk(parseXml(svg)).filter((x) => x.name === "text")) {
      assert.equal(n.attrs.transform, undefined);
      assert.ok(Number(n.attrs["font-size"]) >= 9, `${width}: "${n.text}" is ${n.attrs["font-size"]}`);
    }
  }
});

test("every text stays inside the board and inside its band or row, and no two texts of one touch, at every width and look, with long names and several languages", () => {
  const long = "Maximilian Alexander Konstantinopoulos-Wilhelmsen";
  const bad: string[] = [];
  for (const width of [720, 960, 1280, 1920, 4000]) for (const look of T.BROADCAST_LOOKS) for (const locale of ["en", "ja", "de"]) for (const wide of [false, true]) {
    const src: BoutBoardSource = wide
      ? { ...B, title: `${long} Championships`, phase: `${long} phase`, bout: "A-12345678", red: { ...B.red, name: long }, blue: { ...B.blue, name: long }, officials: B.officials!.map((o, i) => ({ ...o, name: i % 2 ? long : o.name, role: i === 2 ? `${long} role` : o.role })) }
      : B;
    const svg = T.boutBoard(src, { width, look, locale, flags, nameCase: wide ? "upper" : "as-is" });
    const root = parseXml(svg);
    const [W, H] = view(svg);
    const tag = `${width} ${look} ${locale} ${wide ? "long" : "short"}`;
    for (const n of walk(root).filter((x) => x.name === "text")) {
      const b = textBox(n);
      if (b.x < -0.5 || b.x + b.w > W + 0.5 || b.y < -0.5 || b.y + b.h > H + 0.5) bad.push(`${tag}: "${n.text}" is outside ${W}x${H}`);
    }
    for (const cls of ["bc-athlete", "bc-official"]) for (const g of withClass(root, cls)) {
      const r = g.children[0];
      const box = { x: Number(r.attrs.x), y: Number(r.attrs.y), w: Number(r.attrs.width), h: Number(r.attrs.height) };
      const ts = walk(g).filter((n) => n.name === "text").map((n) => ({ n, b: textBox(n) }));
      for (const { n, b } of ts) if (b.x < box.x - 0.5 || b.x + b.w > box.x + box.w + 0.5 || b.y < box.y - 0.5 || b.y + b.h > box.y + box.h + 0.5) bad.push(`${tag}: "${n.text}" leaves its ${cls}`);
      ts.forEach(({ n, b }, i) => ts.slice(i + 1).forEach(({ n: m, b: c }) => { if (overlap({ ...b, h: b.h * 0.7, y: b.y + b.h * 0.15 }, { ...c, h: c.h * 0.7, y: c.y + c.h * 0.15 }, -1)) bad.push(`${tag}: "${n.text}" touches "${m.text}" in ${cls}`); }));
    }
  }
  assert.deepEqual(bad.slice(0, 8), [], `${bad.length} problems`);
});
