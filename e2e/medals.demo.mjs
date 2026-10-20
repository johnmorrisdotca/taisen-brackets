// The demo's medal table, played in a real browser: the state is in the address, the filters change the rows, every size draws, and nothing scrolls sideways.
import { expect, test } from "@playwright/test";

const noSidewaysScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const table = (page) => page.locator("#medal-stage > svg");

test("the medal table draws for each size from the address, without scrolling sideways", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [size, box] of [["tv", "1920 1080"], ["tablet", "1280 800"], ["tablet-tall", "800 1280"], ["phone", "600 1300"], ["square", "1080 1080"], ["portrait", "1080 1350"]]) {
    await page.goto(`/?msize=${size}`);
    await expect(table(page)).toBeVisible();
    await expect(table(page)).toHaveAttribute("viewBox", `0 0 ${box}`);
    await expect(table(page).locator(".rk-entry").first()).toBeAttached();
    expect(await noSidewaysScroll(page)).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("the filters change the rows and the address, a weight class goes with its sport, and the state comes back from the address", async ({ page }) => {
  await page.goto("/");
  const controls = page.locator("#medal-controls");
  const all = await table(page).locator(".rk-entry").count();
  await controls.getByRole("button", { name: "Judo", exact: true }).click();
  expect(page.url()).toContain("msport=judo");
  await expect(controls.getByRole("button", { name: "Wrestling -65 kg" })).toBeHidden();
  await controls.getByRole("button", { name: "Judo +100 kg" }).click();
  await controls.getByRole("button", { name: "2024", exact: true }).click();
  expect(page.url()).toContain("mgames=2024");
  await expect(table(page).locator(".rk-entry")).not.toHaveCount(all);
  await expect(table(page).locator("text", { hasText: /^Judo · \+100 kg · Games of 2024$/ })).toBeVisible();
  await page.reload();
  await expect(table(page).locator("text", { hasText: /^Judo · \+100 kg · Games of 2024$/ })).toBeVisible();
  await controls.getByRole("button", { name: "Total medals", exact: true }).click();
  expect(page.url()).toContain("msort=total");
  await page.locator("#medal-code-box summary").click();
  await expect(page.locator("#medal-code")).toContainText("tallyMedals(awards");
});

test("the medal table follows the language of the page", async ({ page }) => {
  await page.goto("/?lang=fr");
  await expect(table(page).locator("text", { hasText: /^Tableau des médailles$/ })).toBeVisible();
  await page.goto("/?lang=ja");
  await expect(table(page).locator("text", { hasText: /^メダル獲得表$/ })).toBeVisible();
});
