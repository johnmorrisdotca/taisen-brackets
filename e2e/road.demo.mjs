/* global getComputedStyle */
// The demo's road look, road to the final, links, path and flags, played in a real browser.
import { expect, test } from "@playwright/test";

const noSidewaysScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const SPORTS = ["nhl2024", "nba2024", "mlb2022", "nfl2024", "cfl2024", "mls2024", "wc2022", "poster"];

test("the road look is the demo's default, the classic look is one tap away, and a tap on the size card draws a tall post", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?ex=wc2022");
  await expect(page.locator("#stage > svg")).toHaveClass(/tb-look-road/);
  await expect(page.locator("#stage > svg .tb-panel").first()).toBeVisible();
  await page.locator("#look").getByRole("button", { name: "Classic", exact: true }).click();
  await expect(page.locator("#stage > svg")).not.toHaveClass(/tb-look-road/);
  expect(page.url()).toContain("look=classic");
  await page.locator("#look").getByRole("button", { name: "Road", exact: true }).click();
  await page.locator("#size").getByRole("button", { name: "Card", exact: true }).click();
  await expect(page.locator("#stage")).toHaveAttribute("data-size", "card");
  expect(await page.locator("#stage > svg").getAttribute("viewBox")).toBe("0 0 1080 1350");
  expect(page.url()).toContain("size=card");
  expect(await noSidewaysScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test("every sport draws in the road look at every size, and in the road to the final, without scrolling sideways", async ({ page }, info) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const key of SPORTS) {
    for (const size of ["wide", "card", "phone"]) {
      await page.goto(`/?ex=${key}&size=${size}`);
      const [, , w] = (await page.locator("#stage > svg").getAttribute("viewBox")).split(" ").map(Number);
      expect(w).toBe(size === "wide" ? 1200 : size === "card" ? 1080 : 390);
      expect(await noSidewaysScroll(page)).toBe(true);
      await page.goto(`/?ex=${key}&size=${size}&view=road`);
      await expect(page.locator("#stage > svg")).toHaveClass(/tb-road/);
      expect(await noSidewaysScroll(page)).toBe(true);
    }
  }
  expect(errors, info.project.name).toEqual([]);
});

test("the road to the final is drawn from the same tournament, with its own table and call", async ({ page }) => {
  await page.goto("/?ex=wc2022");
  await page.locator("#view").getByRole("button", { name: "Road to the final", exact: true }).click();
  await expect(page.locator("#stage")).toHaveAttribute("data-view", "road");
  expect(page.url()).toContain("view=road");
  const svg = page.locator("#stage > svg");
  await expect(svg).toHaveClass(/tb-road/);
  expect(await svg.locator("text.tb-lab").allTextContents()).toEqual(["Semi-finals", "Quarter-finals", "Round of 16"]);
  await expect(svg.locator("text.tb-r-name").first()).toHaveText("ARGENTINA");
  await expect(page.locator("#show-row")).toBeHidden();
  await page.locator("#table-box summary").click();
  await expect(page.locator("#table table[data-kind='road'] tbody tr")).toHaveCount(7);
  await page.locator("#code-box summary").click();
  await expect(page.locator("#code")).toContainText("roadToFinal(wc2022");
  await page.locator("#lang button[data-value=ja]").click();
  await expect(svg.locator("text.tb-lab").first()).toHaveText("準決勝");
  await expect(page.locator("#table th[scope=col]").first()).toHaveText("チーム");
});

test("the champion's path is dotted and the other ties are quieter; the boxes can be links with names", async ({ page }) => {
  await page.goto("/?ex=wc2022");
  await page.getByRole("button", { name: "Champion's path", exact: true }).click();
  const svg = page.locator("#stage > svg");
  await expect(svg).toHaveClass(/tb-follow/);
  expect(await svg.locator("path.tb-path").count()).toBe(3);
  const dim = await svg.locator("g.tb-tie:not(.tb-on-path)").first().evaluate((el) => Number(getComputedStyle(el).opacity));
  expect(dim).toBeLessThan(1);
  await page.getByRole("button", { name: "Links on the boxes", exact: true }).click();
  expect(await svg.locator("a.tb-link").count()).toBe(16);
  const first = svg.locator("a.tb-link").first();
  expect(await first.getAttribute("href")).toMatch(/^#tie-/);
  expect((await first.getAttribute("aria-label")).length).toBeGreaterThan(10);
  await expect(page.locator("#code")).not.toBeEmpty();
  expect(page.url()).toContain("links=1");
});

test("the section of made-up roads draws four roads with a title, a description and a table that opens", async ({ page }) => {
  await page.goto("/?ex=wc2022");
  const figures = page.locator('[data-testid="road-cards"] figure');
  await expect(figures).toHaveCount(4);
  for (const [index, key] of ["card", "wide", "phone", "series"].entries()) {
    const figure = figures.nth(index);
    await expect(figure).toHaveAttribute("data-road", key);
    const svg = figure.locator("svg.tb-road");
    await svg.scrollIntoViewIfNeeded();
    expect(await svg.locator("title").first().textContent()).toContain("Road to the final");
    expect(await svg.locator("desc").first().textContent()).not.toBe("");
    const details = figure.locator("details");
    await expect(details.locator("table")).toBeHidden();
    await details.locator("summary").click();
    await expect(details.locator("table[data-kind='road']")).toBeVisible();
  }
  expect(await figures.nth(0).locator("g.tb-r-fin").count()).toBeGreaterThan(8);
  expect(await noSidewaysScroll(page)).toBe(true);
  await page.locator("#lang button[data-value=ja]").click();
  expect(await figures.nth(0).locator("text.tb-lab").first().textContent()).toBe("準決勝");
});

test("the flags come through the flags option: each is a symbol written once, and the call says so", async ({ page }) => {
  await page.goto("/?ex=wc2022");
  expect(await page.locator("#stage > svg symbol").count()).toBeGreaterThan(8);
  await page.locator("#code-box summary").click();
  await expect(page.locator("#code")).toContainText("loadedFlags");
  await page.goto("/?ex=wc1938");
  expect(await page.locator("#stage > svg symbol").count()).toBe(0);
});
