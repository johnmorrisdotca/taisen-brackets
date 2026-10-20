// The demo's broadcast boards, played in a real browser: the state is in the address, every example draws at each width, the size of the board is the one resultsBoardSize says, and nothing scrolls sideways.
import { expect, test } from "@playwright/test";

const noSidewaysScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const board = (page) => page.locator("#boards-stage > svg");

test("every example draws at each width and look from the address, without scrolling sideways", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const ex of ["apparatus", "allAround", "swimming", "athletics", "skating"]) {
    await page.goto(`/?gex=${ex}&gwidth=720`);
    await expect(board(page)).toBeVisible();
    await expect(board(page).locator(".bc-row")).toHaveCount(8);
    expect(await noSidewaysScroll(page)).toBe(true);
  }
  for (const look of ["blue", "night", "paper"]) {
    await page.goto(`/?glook=${look}&gwidth=960`);
    await expect(board(page)).toHaveAttribute("viewBox", "0 0 960 414");
  }
  expect(errors).toEqual([]);
});

test("the controls change the drawing and the address, and the size shown is the board's", async ({ page }) => {
  await page.goto("/");
  await expect(board(page)).toHaveAttribute("viewBox", "0 0 1280 552");
  await expect(page.locator("#boards-size")).toHaveText("1280 by 552");
  await page.locator("#boards-controls").getByRole("button", { name: "Swimming final, record badge" }).click();
  expect(page.url()).toContain("gex=swimming");
  await expect(board(page).locator(".bc-badge")).toHaveCount(1);
  await page.locator("#boards-controls").getByRole("button", { name: "Medal boxes" }).click();
  expect(page.url()).toContain("grank=medal");
  await expect(board(page).locator(".bc-g1")).toHaveCount(1);
  await page.locator("#boards-controls").getByRole("button", { name: "960", exact: true }).click();
  await expect(page.locator("#boards-size")).toHaveText("960 by 414");
  await page.locator("#boards-controls").getByRole("button", { name: "Capitals" }).click();
  await expect(board(page).locator("text", { hasText: /^MICHAEL PHILLIPS$/ })).toBeVisible();
  await page.reload();
  await expect(board(page).locator("text", { hasText: /^MICHAEL PHILLIPS$/ })).toBeVisible();
  await page.locator("#boards-code-box summary").click();
  await expect(page.locator("#boards-code")).toContainText("resultsBoard(source");
});

test("choosing the all-around opens it with plain ranks, and the board follows the language", async ({ page }) => {
  await page.goto("/");
  await page.locator("#boards-controls").getByRole("button", { name: "All-around" }).click();
  expect(page.url()).toContain("grank=plain");
  await expect(board(page).locator(".bc-rank")).toHaveCount(0);
  await page.goto("/?lang=fr");
  await expect(board(page).locator("text", { hasText: /^VAULT$/ }).first()).toBeVisible();
  await page.goto("/?lang=fr&gex=allAround");
  await expect(board(page).locator("text", { hasText: /^RÉSULTAT$/ })).toBeVisible();
});

test("the bout presentation board draws from the address, its size is the officials', and the controls follow the board", async ({ page }) => {
  await page.goto("/?gview=bout");
  await expect(board(page)).toHaveAttribute("viewBox", "0 0 1280 484");
  await expect(board(page).locator(".bc-official")).toHaveCount(6);
  await expect(board(page).locator(".bc-athlete")).toHaveCount(2);
  await expect(page.locator("#boards-size")).toHaveText("1280 by 484");
  await expect(page.locator("#boards-controls").getByRole("button", { name: "Medal boxes" })).toBeHidden();
  await page.locator("#boards-controls").getByRole("button", { name: "720", exact: true }).click();
  expect(page.url()).toContain("gwidth=720");
  await expect(board(page)).toHaveAttribute("viewBox", "0 0 720 272");
  await page.locator("#boards-controls").getByRole("button", { name: "Results board" }).click();
  await expect(board(page).locator(".bc-row")).toHaveCount(8);
  await page.goto("/?gview=bout&lang=ja");
  await expect(board(page).locator("text", { hasText: /^試合紹介$/ })).toBeVisible();
  await page.locator("#boards-code-box summary").click();
  await expect(page.locator("#boards-code")).toContainText("boutBoard(source");
});

test("the broadcast medal table draws from the address at each width, and its size is the rows'", async ({ page }) => {
  test.setTimeout(120_000);
  for (const [width, height] of [["1280", "600"], ["960", "450"], ["720", "338"]]) {
    await page.goto(`/?gview=medals&gwidth=${width}`);
    await expect(board(page)).toHaveAttribute("viewBox", `0 0 ${width} ${height}`);
    await expect(board(page).locator(".bc-row")).toHaveCount(10);
    await expect(page.locator("#boards-size")).toHaveText(`${width} by ${height}`);
    expect(await noSidewaysScroll(page)).toBe(true);
  }
  await expect(board(page).locator(".bc-medalhead")).toHaveCount(3);
  await page.goto("/?gview=medals&lang=fr");
  await expect(board(page).locator("text", { hasText: /^TABLEAU DES MÉDAILLES$/ })).toBeVisible();
  await page.locator("#boards-code-box summary").click();
  await expect(page.locator("#boards-code")).toContainText("broadcastMedalTable(");
});
