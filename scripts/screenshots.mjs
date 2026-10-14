// Takes the README's pictures of the demo into docs/images, all of them in one command (`pnpm images`): a desk and a phone, light and dark, the poster, every sport on the background that
// suits it, the road look and the road to the final, the classic look beside it, the languages, the twenty-five backgrounds as two grids (dark and light), and every layout.
// The pictures are WebP, made in the browser (no tool beyond Chromium): at the quality used here they are 2 to 3 times smaller than the JPEG they replaced, with no loss anyone can see.
// It serves the demo on port 7101 (this package's own block, tests and tools from 7101 up) and stops the server it started.
//
//   node scripts/screenshots.mjs                   every picture of docs/images
//   node scripts/screenshots.mjs --extra <folder>  also the review shots (taisen-bg-*.png, taisen-layout-*.png) into <folder>
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = `${root}docs/images`;
const extraAt = process.argv.indexOf("--extra");
const extra = extraAt > -1 ? process.argv[extraAt + 1] : null;
mkdirSync(out, { recursive: true });
if (extra) mkdirSync(extra, { recursive: true });
const port = 7101;
const server = spawn(process.execPath, ["scripts/dev.mjs"], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: "ignore" });
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
  /** A PNG as a WebP, made by the browser's own encoder. */
  const webpPage = await browser.newPage();
  const toWebp = async (png) => {
    const base64 = await webpPage.evaluate(async (data) => {
      const image = new globalThis.Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext("2d").drawImage(image, 0, 0);
      const blob = await new Promise((done) => canvas.toBlob(done, "image/webp", 0.86));
      const reader = new globalThis.FileReader();
      reader.readAsDataURL(blob);
      await new Promise((done) => { reader.onloadend = done; });
      return String(reader.result).split(",")[1];
    }, png.toString("base64"));
    return Buffer.from(base64, "base64");
  };
  const open = async (query, { width, height, scheme = "light", phone = false, scale = 2 }) => {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, hasTouch: phone, isMobile: phone, deviceScaleFactor: scale, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${port}/?${query}`);
    await page.waitForSelector("#stage svg");
    return { page, context };
  };
  // The README pictures are WebP (a gradient and a pattern are far smaller so); the review shots in `--extra` are PNG.
  const shoot = async (name, query, options, dir = out) => {
    const { page, context } = await open(query, options);
    const element = await page.$("#stage svg");
    if (dir === out) writeFileSync(`${dir}/${name}.webp`, await toWebp(await element.screenshot({ type: "png" })));
    else await element.screenshot({ path: `${dir}/${name}.png` });
    await context.close();
  };
  // Each example opens on the background that suits its sport (the demo's default), so the pictures show the range: ice, hardwood, an infield, turf, a pitch, waves, a sunburst...
  await shoot("hero-desk-light", "ex=wc2022", { width: 1280, height: 900 });
  await shoot("hero-desk-dark", "ex=wc2022", { width: 1280, height: 900, scheme: "dark" });
  await shoot("nhl-desk-light", "ex=nhl2024", { width: 1280, height: 900 });
  await shoot("poster-desk", "ex=poster", { width: 1280, height: 900 });
  await shoot("phone-light", "ex=wc2022", { width: 390, height: 844, phone: true });
  await shoot("phone-dark", "ex=wc2022", { width: 390, height: 844, phone: true, scheme: "dark" });
  await shoot("phone-poster", "ex=poster", { width: 390, height: 844, phone: true });
  await shoot("byes-desk-light", "ex=mlb2022", { width: 1280, height: 900 });
  await shoot("replays-desk-light", "ex=wc1938", { width: 1280, height: 900 });
  await shoot("generic32-desk-light", "ex=generic32", { width: 1280, height: 900 });
  await shoot("nba-desk-light", "ex=nba2024", { width: 1280, height: 900 });
  await shoot("nfl-desk-light", "ex=nfl2024", { width: 1280, height: 900 });
  await shoot("cfl-desk-light", "ex=cfl2024", { width: 1280, height: 900 });
  await shoot("mls-desk-light", "ex=mls2024", { width: 1280, height: 900 });
  await shoot("nhl1984-desk-light", "ex=nhl1984", { width: 1280, height: 900 });
  // The road look's own pictures: the classic look beside it (it keeps its plain colour), a card, one team's path, and the road to the final in three sizes.
  await shoot("classic-desk-light", "ex=wc2022&look=classic&bg=plain", { width: 1280, height: 900 });
  await shoot("card-light", "ex=wc2022&size=card&bg=royal", { width: 1280, height: 900 });
  await shoot("path-desk-light", "ex=wc2022&path=1&bg=floodlights", { width: 1280, height: 900 });
  await shoot("road-card-light", "ex=wc2022&view=road&size=card&bg=royal", { width: 1280, height: 900 });
  await shoot("road-wide-nhl-light", "ex=nhl2024&view=road&size=wide", { width: 1280, height: 900 });
  await shoot("road-phone-dark", "ex=wc2022&view=road&size=phone&theme=dark&bg=aurora", { width: 390, height: 844, phone: true, scheme: "dark" });
  await shoot("poster-desk-ja", "ex=poster&lang=ja", { width: 1280, height: 900 });
  await shoot("hero-desk-fr", "ex=wc2022&lang=fr", { width: 1280, height: 900 });
  await shoot("phone-ja", "ex=wc2022&lang=ja", { width: 390, height: 844, phone: true });
  // The same bracket in all five languages, side by side: the World Cup of 2022 on a phone's layout, drawn by the package itself in the demo's page.
  {
    const { page, context } = await open("ex=wc2022", { width: 2000, height: 1200, scale: 1.5 });
    await page.evaluate(async () => {
      const T = await import("/dist/index.js");
      const { examples } = await import("/examples.js");
      const example = examples(T).find((e) => e.key === "wc2022");
      const teamName = (team, locale) => (team.region ? T.countryName(team.region, locale) : undefined);
      const names = { en: "English", fr: "Français", ja: "日本語", es: "Español", de: "Deutsch" };
      const box = document.createElement("div");
      box.id = "languages";
      box.style.cssText = "display:flex;gap:14px;align-items:flex-start;padding:14px;background:#f4efe4;width:max-content;font:700 15px system-ui,sans-serif;color:#1f2320";
      box.innerHTML = T.LOCALE_CODES.map((code) => `<figure style="margin:0;width:390px"><figcaption style="padding:0 0 8px">${names[code]}</figcaption>${T.drawBracket(example.data, { ...example.options, size: "phone", locale: code, teamName, id: `l-${code}`, title: example.titles?.[code] ?? example.options.title, background: false })}</figure>`).join("");
      document.body.replaceChildren(box);
    });
    writeFileSync(`${out}/languages-wc2022.webp`, await toWebp(await (await page.$("#languages")).screenshot({ type: "png" })));
    await context.close();
  }
  // The twenty-five backgrounds, each on the sport it suits, in the dark and in the light variant: two grids of five by five.
  for (const scheme of ["dark", "light"]) {
    const { page, context } = await open("ex=wc2022", { width: 2000, height: 1200, scale: 1, scheme });
    await page.evaluate(async (theme) => {
      const T = await import("/dist/index.js");
      const { examples } = await import("/examples.js");
      const { renderEmblem } = await import("/emblems.js");
      const { FLAGS } = await import("/flags-data.js");
      const all = examples(T);
      const pick = { midnight: "nhl2024", crimson: "mls2024", royal: "wc2022", emerald: "cfl2024", pitch: "wc2022", ice: "nhl2024", hardwood: "nba2024", infield: "mlb2022", turf: "nfl2024", "ball-panels": "wc1938", swirl: "nba2024", waves: "mls2024", glow: "poster", floodlights: "wc2022", confetti: "twoLegs", carbon: "nfl2024", aurora: "nhl1984", sunburst: "cfl2024", chevrons: "mlb2022", halftone: "generic32", argyle: "nhl1984", contour: "wc1938", stardust: "poster", mesh: "nba2024", spotlight: "wc2022" };
      const teamName = (team, locale) => (team.region ? T.countryName(team.region, locale) : undefined);
      const box = document.createElement("div");
      box.id = "grid";
      box.style.cssText = "display:grid;grid-template-columns:repeat(5,384px);gap:8px;padding:8px;background:#20242b;width:max-content";
      box.innerHTML = T.BACKGROUND_PRESETS.map((name) => {
        const e = all.find((x) => x.key === pick[name]);
        const emblem = T.LEAGUE_EMBLEMS[e.sport === "wc" ? "worldcup" : e.sport];
        const svg = T.drawBracket(e.data, { ...e.options, ...(emblem && { emblems: renderEmblem, trophy: emblem }), look: "road", flags: (c) => FLAGS[c], size: "wide", theme, background: name, id: `g-${name}`, teamName, seeds: e.key === "nhl2024" });
        return `<figure style="margin:0;position:relative;width:384px"><figcaption style="position:absolute;left:8px;bottom:8px;padding:3px 10px;border-radius:99px;background:rgba(0,0,0,.62);color:#fff;font:700 13px system-ui,sans-serif;z-index:2">${name}</figcaption>${svg.replace('style="max-width:100%;height:auto"', 'style="display:block;width:100%;height:auto"')}</figure>`;
      }).join("");
      document.body.replaceChildren(box);
    }, scheme);
    writeFileSync(`${out}/backgrounds-${scheme}.webp`, await toWebp(await (await page.$("#grid")).screenshot({ type: "png" })));
    await context.close();
  }
  // Every layout, on the sport that suits it, on its own background; the playground opens each from the address.
  const LAYOUT_SHOTS = [
    ["layout-rows-nhl", "rows", "ex=nhl2024&layout=rows&bg=ice", { width: 1280, height: 900 }],
    ["layout-update-nhl", "update", "ex=nhl2024&layout=update&bg=aurora", { width: 1280, height: 900 }],
    ["layout-shields-wc2022", "shields", "ex=wc2022&layout=shields&bg=floodlights", { width: 1280, height: 900 }],
    ["layout-columns-nfl", "columns", "ex=nfl2024&layout=columns&bg=turf&headers=1", { width: 1280, height: 900 }],
    ["layout-playin-nba", "playin", "ex=nba2024playin&bg=hardwood", { width: 1280, height: 900 }],
    ["layout-series-nba", "series", "ex=nba2024&layout=series&bg=carbon&size=card&headers=1", { width: 1280, height: 900 }],
    ["layout-groups-cup", "groups", "ex=cupGroups&bg=midnight", { width: 1280, height: 900 }],
    ["layout-groups-softball", "groups", "ex=softballGroups&bg=royal&size=phone", { width: 390, height: 844, phone: true }],
    ["layout-columns-phone", "columns", "ex=wc2022&layout=columns&bg=pitch&size=phone", { width: 390, height: 844, phone: true }],
  ];
  for (const [name, , query, options] of LAYOUT_SHOTS) await shoot(name, query, options);
  // A final alone, with its third-place match, centred (the World Cups of 1974 and 1978 ended so): drawn by the package itself in the demo's page.
  {
    const { page, context } = await open("ex=wc2022", { width: 1280, height: 900 });
    await page.evaluate(async () => {
      const T = await import("/dist/index.js");
      const { FLAGS } = await import("/flags-data.js");
      const { renderEmblem } = await import("/emblems.js");
      const teams = [{ id: "NED", name: "Netherlands", flag: "NL", abbr: "NED" }, { id: "GER", name: "West Germany", flag: "DE", abbr: "FRG" }, { id: "POL", name: "Poland", flag: "PL", abbr: "POL" }, { id: "BRA", name: "Brazil", flag: "BR", abbr: "BRA" }];
      const matchups = [{ id: "F", sides: ["NED", "GER"], round: 1, score: [1, 2] }, { id: "T", sides: ["POL", "BRA"], third: true, score: [1, 0] }];
      document.getElementById("stage").innerHTML = T.drawBracket({ teams, matchups }, { look: "road", flags: (c) => FLAGS[c], background: "pitch", title: "FIFA World Cup 1974", subtitle: "The final and the third-place match", emblems: renderEmblem, trophy: T.LEAGUE_EMBLEMS.worldcup, id: "lone" });
    });
    writeFileSync(`${out}/layout-lone-final.webp`, await toWebp(await (await page.$("#stage svg")).screenshot({ type: "png" })));
    await context.close();
  }
  // The review shots, when asked for: the World Cup 2022 card on four backgrounds, the NHL wide, a phone in the dark, and a picture of your own.
  if (extra) {
    // One picture of each layout, for review.
    await shoot("taisen-layout-tree", "ex=wc2022&bg=pitch", { width: 1280, height: 900 }, extra);
    for (const [, layout, query, options] of LAYOUT_SHOTS.slice(0, 7)) await shoot(`taisen-layout-${layout}`, query, options, extra);
    await shoot("taisen-layout-groups-softball", "ex=softballGroups&bg=royal", { width: 1280, height: 900 }, extra);
    for (const bg of ["pitch", "royal", "crimson", "aurora"]) await shoot(`taisen-bg-wc2022-card-${bg}`, `ex=wc2022&size=card&bg=${bg}`, { width: 1280, height: 900 }, extra);
    await shoot("taisen-bg-nhl-wide", "ex=nhl2024&size=wide", { width: 1280, height: 900 }, extra);
    await shoot("taisen-bg-phone-dark", "ex=wc2022&size=phone&theme=dark", { width: 390, height: 844, phone: true, scheme: "dark" }, extra);
    // A picture of your own: drawn in the page (a gradient and some lines, as a data address), so that no file is needed.
    const { page, context } = await open("ex=wc2022&size=card", { width: 1280, height: 900 });
    await page.evaluate(async () => {
      const T = await import("/dist/index.js");
      const { examples } = await import("/examples.js");
      const { renderEmblem } = await import("/emblems.js");
      const { FLAGS } = await import("/flags-data.js");
      const e = examples(T).find((x) => x.key === "wc2022");
      const photo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6b26b"/><stop offset=".55" stop-color="#c0504d"/><stop offset="1" stop-color="#2b2a4c"/></linearGradient></defs><rect width="400" height="500" fill="url(#s)"/><circle cx="270" cy="170" r="70" fill="#ffe9b0"/><path d="M0 380 L90 300 L170 370 L260 280 L400 390 V500 H0Z" fill="#1b1f3a"/></svg>`;
      const image = `data:image/svg+xml;base64,${window.btoa(photo)}`;
      const svg = T.drawBracket(e.data, { ...e.options, emblems: renderEmblem, trophy: T.LEAGUE_EMBLEMS.worldcup, look: "road", flags: (c) => FLAGS[c], size: "card", theme: "dark", background: { image, fit: "cover", dim: 0.5 }, id: "mine", teamName: (t, l) => (t.region ? T.countryName(t.region, l) : undefined) });
      document.getElementById("stage").innerHTML = svg;
    });
    await (await page.$("#stage svg")).screenshot({ path: `${extra}/taisen-bg-custom-image.png` });
    await context.close();
  }
  await browser.close();
  console.log(`pictures written to ${out}${extra ? ` and ${extra}` : ""}`);
} finally {
  server.kill();
}
