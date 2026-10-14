// Takes the README's pictures of the demo into docs/images: a desk and a phone, light and dark, and the poster.
// It serves the demo on port 7101 (this package's own block, tests and tools from 7101 up) and stops the server it started.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = `${root}docs/images`;
mkdirSync(out, { recursive: true });
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
  const shoot = async (name, query, { width, height, scheme = "light", phone = false }) => {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, hasTouch: phone, isMobile: phone, deviceScaleFactor: 2, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${port}/?${query}`);
    await page.waitForSelector("#stage svg");
    await (await page.$("#stage svg")).screenshot({ path: `${out}/${name}.png` });
    await context.close();
  };
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
  // The road look's own pictures: the classic look beside it, a card, one team's path, and the road to the final in three sizes.
  await shoot("classic-desk-light", "ex=wc2022&look=classic", { width: 1280, height: 900 });
  await shoot("card-light", "ex=wc2022&size=card", { width: 1280, height: 900 });
  await shoot("path-desk-light", "ex=wc2022&path=1", { width: 1280, height: 900 });
  await shoot("road-card-light", "ex=wc2022&view=road&size=card", { width: 1280, height: 900 });
  await shoot("road-wide-nhl-light", "ex=nhl2024&view=road&size=wide", { width: 1280, height: 900 });
  await shoot("road-phone-dark", "ex=wc2022&view=road&size=phone&theme=dark", { width: 390, height: 844, phone: true, scheme: "dark" });
  await shoot("poster-desk-ja", "ex=poster&lang=ja", { width: 1280, height: 900 });
  await shoot("hero-desk-fr", "ex=wc2022&lang=fr", { width: 1280, height: 900 });
  await shoot("phone-ja", "ex=wc2022&lang=ja", { width: 390, height: 844, phone: true });
  // The same bracket in all five languages, side by side: the World Cup of 2022 on a phone's layout, drawn by the package itself in the demo's page.
  {
    const context = await browser.newContext({ viewport: { width: 2000, height: 1200 }, deviceScaleFactor: 1.5, colorScheme: "light", reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${port}/?ex=wc2022`);
    await page.waitForSelector("#stage svg");
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
    await (await page.$("#languages")).screenshot({ path: `${out}/languages-wc2022.png` });
    await context.close();
  }
  await browser.close();
  console.log(`pictures written to ${out}`);
} finally {
  server.kill();
}
