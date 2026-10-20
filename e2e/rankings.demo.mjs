// The demo's ranking lists, played in a real browser: the state is in the address, the controls change the drawing, every size and style draws, paging works, and nothing scrolls sideways.
import { expect, test } from "@playwright/test";

const noSidewaysScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const list = (page) => page.locator("#ranking-stage > svg");

test("the ranking list draws for each size and style from the address, without scrolling sideways", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [size, box] of [["tv", "1920 1080"], ["tablet", "1280 800"], ["tablet-tall", "800 1280"], ["phone", "600 1300"], ["square", "1080 1080"], ["portrait", "1080 1350"]]) {
    for (const style of ["podium", "featured", "list"]) {
      await page.goto(`/?ksize=${size}&kstyle=${style}`);
      await expect(list(page)).toBeVisible();
      await expect(list(page)).toHaveAttribute("viewBox", `0 0 ${box}`);
      await expect(list(page).locator(".rk-entry").first()).toBeAttached();
      expect(await noSidewaysScroll(page)).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});

test("the controls change the drawing and the address, and the state comes back from the address", async ({ page }) => {
  await page.goto("/");
  await expect(list(page).locator(".rk-medal1")).toHaveCount(1);
  await page.locator("#ranking-controls").getByRole("button", { name: "Plain list", exact: true }).click();
  await expect(list(page).locator(".rk-medal1")).toHaveCount(0);
  expect(page.url()).toContain("kstyle=list");
  await page.locator("#ranking-controls").getByRole("button", { name: "Senior women -57 kg (with a champion)" }).click();
  expect(page.url()).toContain("klist=senior-women-57");
  await expect(list(page).locator("text", { hasText: /^C$/ })).toBeVisible();
  await page.reload();
  await expect(list(page).locator("text", { hasText: /^C$/ })).toBeVisible();
  await page.locator("#ranking-code-box summary").click();
  await expect(page.locator("#ranking-code")).toContainText("rankingList(");
});

test("paging shows which entries are drawn and the buttons turn the page", async ({ page }) => {
  await page.goto("/?krows=5");
  await expect(list(page).locator(".rk-entry")).toHaveCount(5);
  await expect(list(page).locator("text", { hasText: /^1–5 of 15$/ })).toBeVisible();
  await expect(page.locator("#ranking-prev")).toBeDisabled();
  await page.locator("#ranking-next").click();
  expect(page.url()).toContain("kpage=1");
  await expect(list(page).locator("text", { hasText: /^6–10 of 15$/ })).toBeVisible();
  await page.locator("#ranking-next").click();
  await expect(page.locator("#ranking-next")).toBeDisabled();
  await expect(list(page).locator("text", { hasText: /^11–15 of 15$/ })).toBeVisible();
});

test("the ranking list follows the language of the page", async ({ page }) => {
  await page.goto("/?lang=fr");
  await expect(list(page).locator("text", { hasText: /^Classement$/ })).toBeVisible();
  await page.goto("/?lang=ja");
  await expect(list(page).locator("text", { hasText: /^ランキング$/ })).toBeVisible();
});
