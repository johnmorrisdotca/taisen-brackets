// The demo's judo scoreboard, played in a real browser: the state is in the address, the controls change the drawing, both styles and every size draw, and nothing scrolls sideways.
import { expect, test } from "@playwright/test";

const noSidewaysScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const board = (page) => page.locator("#board-stage > svg");

test("the scoreboard draws in each style and size from the address, without scrolling sideways", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [size, box] of [["tv", "1920 1080"], ["tablet", "1280 800"], ["tablet-tall", "800 1280"]]) {
    for (const style of ["board", "flip"]) {
      await page.goto(`/?bstyle=${style}&bsize=${size}`);
      await expect(board(page)).toBeVisible();
      await expect(board(page)).toHaveAttribute("viewBox", `0 0 ${box}`);
      await expect(board(page).locator(style === "flip" ? ".jb-card" : ".jb-tile").first()).toBeAttached();
      expect(await noSidewaysScroll(page)).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});

test("a counter's plus changes the drawing and the address, and the state comes back from the address", async ({ page }) => {
  await page.goto("/");
  const yukoWhite = page.locator("#board-w .counter").nth(2);
  await expect(yukoWhite.locator("output")).toHaveText("0");
  await yukoWhite.getByRole("button", { name: /more yuko/ }).click();
  await expect(yukoWhite.locator("output")).toHaveText("1");
  expect(page.url()).toContain("bw=0%2C1%2C1%2C1");
  await page.reload();
  await expect(page.locator("#board-w .counter").nth(2).locator("output")).toHaveText("1");
  await page.getByRole("button", { name: "Golden score", exact: true }).click();
  await expect(board(page).locator("text", { hasText: /^GOLDEN SCORE$/ })).toBeVisible();
  expect(page.url()).toContain("bgs=1");
});

test("ippon on one side clears the other's, so the state stays one the rules allow, and the winner is named", async ({ page }) => {
  await page.goto("/?bw=1%2C0%2C0%2C0");
  await page.locator("#board-b .counter").first().getByRole("button").click();
  await expect(page.locator("#board-w .counter").first().getByRole("button")).toHaveText("Off");
  await expect(board(page).locator("text", { hasText: /^Winner: Mathis Roussel/ })).toBeVisible();
});

test("the language and the controls reach the board: the words are the language's", async ({ page }) => {
  await page.goto("/?lang=ja&bstyle=flip");
  await expect(board(page).locator("text", { hasText: /^抑え込み$/ })).toBeVisible();
  await page.goto("/?lang=fr");
  await expect(board(page).locator("text", { hasText: /^OSAEKOMI$/ })).toBeVisible();
  await expect(board(page)).toContainText("Tapis 1");
  await page.getByRole("button", { name: "Blue first", exact: true }).click();
  expect(page.url()).toContain("bswap=1");
});

test("the controls are at least 44 pixels, and the call that draws the board is shown", async ({ page }) => {
  await page.goto("/");
  for (const button of await page.locator("#board-controls button").all()) {
    const box = await button.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(43.5);
  }
  await page.locator("#board-code-box summary").click();
  await expect(page.locator("#board-code")).toContainText("judoScoreboard(");
});
