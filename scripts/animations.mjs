// Makes the README's moving pictures into docs/images, as animated webp: the 2022 World Cup bracket filling in game by game, a judo contest on the flip-card scoreboard from the first second to ippon, a provincial
// ranking list taking in new results and re-ordering with its movement arrows, and a medal table changing from one Games to the next. Each is drawn by the package itself inside the demo page, from the demo's own
// data (the real World Cup 2022 results, and the invented judo, ranking and medal samples), in a light and a dark twin. Playwright takes one png per step and `img2webp` (libwebp's tool: `brew install webp`)
// joins them into a looping lossy animation, each file well under 1.5 MB. A step holds as long as its scene says (a game shows for a moment, the ticking osaekomi clock for a fraction of one).
//
//   node scripts/animations.mjs                  all of them (needs a build: `pnpm animations` builds first)
//   ONLY=hero-fill node scripts/animations.mjs   one scene (hero-fill, judo-flip, ranking-live, medals-live), both twins
//   IMAGES_OUT=dir                               writes somewhere else than docs/images
//   QUALITY=80                                   the webp quality
//   FRAMES_OUT=dir                               also keeps every step as a png there, to look at
//
// It serves the demo on port 7103, or TEST_PORT (this package's own block, tests and tools from 7101 up), and stops the server it started.
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = process.env.IMAGES_OUT ?? `${root}docs/images`;
const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
const quality = Number(process.env.QUALITY ?? 80);
const port = Number(process.env.TEST_PORT ?? 7103);
const framesOut = process.env.FRAMES_OUT ?? null;
const MAX_BYTES = 1.5 * 1024 * 1024;

if (spawnSync("img2webp", ["-version"], { stdio: "ignore" }).status === null) throw new Error("img2webp is not installed: `brew install webp` (libwebp's animation tool)");
mkdirSync(out, { recursive: true });

// Each scene's `setup` runs in the page (it is sent as text, so it carries what it uses) and returns the steps: `count`, `delay(i)` in milliseconds and `paint(i)`, the SVG of step i.
const heroFill = async (scheme) => {
  const T = await import("/dist/index.js");
  const { examples } = await import("/examples.js");
  const { fillBracket } = await import("/play.js");
  const { FLAGS } = await import("/flags-data.js");
  const { renderEmblem } = await import("/emblems.js");
  const example = examples(T).find((e) => e.key === "wc2022");
  const total = fillBracket(T, example.data, 0).total;
  const options = {
    ...example.options, size: "wide", look: "road", locale: "en", flags: (code) => FLAGS[code], teamName: (team, locale) => (team.region ? T.countryName(team.region, locale) : undefined),
    background: "pitch", emblems: renderEmblem, trophy: T.LEAGUE_EMBLEMS.worldcup, emblemStyle: "metal", theme: scheme, id: "hero-fill",
  };
  // The empty bracket (the sixteen teams in), then every game in the order it was played, the last one held longest.
  return { count: total + 1, delay: (i) => (i === 0 ? 1200 : i === total ? 3500 : i === total - 1 ? 900 : 420), paint: (i) => T.drawBracket(fillBracket(T, example.data, i).data, options) };
};

const judoFlip = async (scheme) => {
  const T = await import("/dist/index.js");
  const { FLAGS } = await import("/flags-data.js");
  const white = { name: "Daiki Hoshino", code: "JPN", flag: "JP", coach: "Yuki Mori" };
  const blue = { name: "Mathis Roussel", code: "FRA", flag: "FR", coach: "Alain Lefort" };
  const side = (ippon, wazaAri, yuko, shido) => ({ ...(ippon ? { ippon: true } : {}), wazaAri, yuko, shido });
  // [clock, white, blue, osaekomi, golden score, finished, how long it stays]: a contest from the first second to the ippon that ends it.
  const steps = [
    ["4:00", side(0, 0, 0, 0), side(0, 0, 0, 0), null, 1300],
    ["3:41", side(0, 0, 0, 0), side(0, 0, 0, 1), null, 900],
    ["3:12", side(0, 0, 1, 0), side(0, 0, 0, 1), null, 900],
    ["2:34", side(0, 0, 1, 0), side(0, 0, 1, 1), null, 800],
    ["1:58", side(0, 0, 1, 1), side(0, 0, 1, 1), null, 800],
    ["1:21", side(0, 0, 1, 1), side(0, 0, 1, 1), { side: 0, seconds: 0 }, 330],
    ["1:21", side(0, 0, 1, 1), side(0, 0, 1, 1), { side: 0, seconds: 3 }, 330],
    ["1:21", side(0, 0, 1, 1), side(0, 0, 1, 1), { side: 0, seconds: 6 }, 330],
    ["1:21", side(0, 0, 1, 1), side(0, 0, 1, 1), { side: 0, seconds: 9 }, 330],
    ["1:21", side(0, 1, 1, 1), side(0, 0, 1, 1), { side: 0, seconds: 10 }, 700],
    ["1:21", side(0, 1, 1, 1), side(0, 0, 1, 1), { side: 0, seconds: 13 }, 330],
    ["1:21", side(0, 1, 1, 1), side(0, 0, 1, 1), { side: 0, seconds: 16 }, 330],
    ["1:21", side(0, 1, 1, 1), side(0, 0, 1, 1), { side: 0, seconds: 19 }, 330],
    ["1:21", side(1, 1, 1, 1), side(0, 0, 1, 1), null, 3500, true],
  ];
  const contest = ([clock, w, b, osa, , finished]) => ({
    white, blue, sides: [w, b], clock, goldenScore: false, finished: finished === true, ...(osa ? { osaekomi: osa } : {}),
    weight: T.judoCategoryLabel({ sex: "men", weight: "-66" }, "en"), round: T.roundName(2), mat: 1, contest: "G-24",
  });
  return { count: steps.length, delay: (i) => steps[i][4], paint: (i) => T.judoScoreboard(contest(steps[i]), { size: "tv", style: "flip", theme: scheme, flags: (code) => FLAGS[code], locale: "en" }) };
};

const rankingLive = async (scheme) => {
  const T = await import("/dist/index.js");
  const { FLAGS } = await import("/flags-data.js");
  const { RANKING_SAMPLE } = await import("/data/ranking-sample.js");
  const list = RANKING_SAMPLE.lists["u18-men-60"];
  // New results come in: the points each athlete gains at a tournament. The list is sorted again every time and each row's arrow says how many places it moved since the step before.
  const gains = [{}, { Brar: 62, Okafor: 40, Sandhu: 25 }, { Leclerc: 70, Whitehorse: 55 }, { Nakamura: 75, Lindqvist: 60 }, { Sandhu: 80, Brar: 20 }, { Okafor: 65, Leclerc: 30 }];
  const lists = [];
  let points = new Map(list.entries.map((e) => [e.name.surname, e.points]));
  let previous = list.entries.map((e) => e.name.surname);
  gains.forEach((gain, step) => {
    for (const [name, add] of Object.entries(gain)) points.set(name, points.get(name) + add);
    const order = [...list.entries].sort((a, b) => points.get(b.name.surname) - points.get(a.name.surname));
    lists.push(order.map((e, i) => ({ ...e, points: points.get(e.name.surname), change: step === 0 ? e.change : previous.indexOf(e.name.surname) - i })));
    previous = order.map((e) => e.name.surname);
  });
  const source = (entries, step) => ({ category: T.rankingCategoryLabel(list.category, "en"), date: step === 0 ? "October 2026" : `After tournament ${step}`, source: RANKING_SAMPLE.source, entries: entries.slice(0, 12) });
  return { count: lists.length, delay: (i) => (i === 0 ? 1500 : i === lists.length - 1 ? 3000 : 1700), paint: (i) => T.rankingList(source(lists[i], i), { size: "tv", theme: scheme, style: "podium", movement: "arrow", precision: 2, locale: "en", flags: (code) => FLAGS[code] }) };
};

const medalsLive = async (scheme) => {
  const T = await import("/dist/index.js");
  const { FLAGS } = await import("/flags-data.js");
  const { MEDAL_AWARDS, MEDAL_GAMES } = await import("/data/medal-sample.js");
  const games = MEDAL_GAMES.slice(-6);
  return {
    count: games.length, delay: (i) => (i === games.length - 1 ? 3000 : 1500),
    paint: (i) => T.medalTable({ subtitle: `Judo and wrestling · Games of ${games[i]}`, source: "Sample data, invented for the demo", rows: T.tallyMedals(MEDAL_AWARDS, { games: games[i] }) }, { size: "tv", theme: scheme, sort: "gold", top: 8, locale: "en", flags: (code) => FLAGS[code] }),
  };
};

const SCENES = [
  { name: "hero-fill", width: 760, setup: heroFill },
  { name: "judo-flip", width: 760, setup: judoFlip },
  { name: "ranking-live", width: 760, setup: rankingLive },
  { name: "medals-live", width: 760, setup: medalsLive },
];

const server = spawn(process.execPath, ["scripts/dev.mjs"], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: "ignore" });
const work = mkdtempSync(join(tmpdir(), "taisen-animations-"));
try {
  await new Promise((resolve, reject) => {
    const started = Date.now();
    const poll = async () => {
      try { if ((await fetch(`http://127.0.0.1:${port}/`)).ok) return resolve(); } catch { /* not up yet */ }
      if (Date.now() - started > 8000) return reject(new Error("the demo server did not start"));
      setTimeout(poll, 150);
    };
    poll();
  });
  const browser = await chromium.launch();
  for (const scene of SCENES) {
    if (only && !only.includes(scene.name)) continue;
    for (const scheme of ["light", "dark"]) {
      const { width } = scene;
      const context = await browser.newContext({ viewport: { width, height: 600 }, colorScheme: scheme, deviceScaleFactor: 1.25, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:${port}/?ex=wc2022`);
      await page.waitForSelector("#stage svg");
      const info = await page.evaluate(async ({ source, width, scheme }) => {
        const box = document.createElement("div");
        box.id = "scene";
        box.style.cssText = `width:${width}px;line-height:0;background:transparent`;
        document.body.replaceChildren(box);
        const made = await (0, eval)(`(${source})`)(scheme);
        globalThis.paint = (i) => { box.innerHTML = made.paint(i); const svg = box.querySelector("svg"); svg.removeAttribute("height"); svg.style.cssText = "display:block;width:100%;height:auto"; };
        globalThis.delays = Array.from({ length: made.count }, (_, i) => made.delay(i));
        return { count: made.count, delays: globalThis.delays };
      }, { source: scene.setup.toString(), width, scheme });
      const dir = join(work, `${scene.name}-${scheme}`);
      mkdirSync(dir);
      const args = [];
      for (let i = 0; i < info.count; i++) {
        await page.evaluate((n) => globalThis.paint(n), i);
        const file = join(dir, `${String(i).padStart(3, "0")}.png`);
        writeFileSync(file, await (await page.$("#scene")).screenshot({ type: "png" }));
        args.push("-d", String(info.delays[i]), file);
        if (framesOut) { mkdirSync(framesOut, { recursive: true }); copyFileSync(file, join(framesOut, `${scene.name}-${scheme}-${String(i).padStart(2, "0")}.png`)); }
      }
      const target = join(out, `${scene.name}-${scheme}.webp`);
      const run = spawnSync("img2webp", ["-loop", "0", "-lossy", "-q", String(quality), "-m", "6", ...args, "-o", target], { encoding: "utf8" });
      if (run.status !== 0) throw new Error(`img2webp failed: ${run.stderr}`);
      const size = statSync(target).size;
      if (size > MAX_BYTES) throw new Error(`${target} is ${size} bytes, over 1.5 MB: lower QUALITY`);
      console.log(`ok   ${scene.name}-${scheme}.webp  ${Math.round(size / 1024)} kB, ${info.count} frames`);
      await context.close();
    }
  }
  await browser.close();
} finally {
  server.kill();
  rmSync(work, { recursive: true, force: true });
}
