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
  await browser.close();
  console.log(`pictures written to ${out}`);
} finally {
  server.kill();
}
