// The builder page: each row of choices redraws the bracket and rewrites the code, the code is the family's embed panel with the call that draws it, and nothing is wider than the screen.
import { expect, test } from "@playwright/test";

test("a choice redraws the bracket and rewrites the code", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto("/builder.html");
  await page.waitForSelector('body[data-ready="true"]');
  await expect(page.locator('[data-testid="stage"] > svg')).toBeVisible();
  await expect(page.locator('#embed-panel [part="code"]')).toContainText("singleElimination(teams)");
  await expect(page.locator('#embed-panel [part="code"]')).toContainText('"size": "wide"');
  await page.locator('[data-choice="size"] button[data-value="phone"]').click();
  await expect(page.locator('#embed-panel [part="code"]')).toContainText('"size": "phone"');
  expect(await page.locator('[data-testid="stage"] > svg').getAttribute("viewBox")).toMatch(/^0 0 390 /);
  await page.locator('[data-choice="teams"] button[data-value="16"]').click();
  await expect(page.locator('#embed-panel [part="code"]')).toContainText('"Team 16"');
  await page.locator('[data-choice="theme"] button[data-value="poster"]').click();
  await page.locator('[data-choice="background"] button[data-value="ice"]').click();
  await expect(page.locator('#embed-panel [part="code"]')).toContainText('"background": "ice"');
  await page.locator('#embed-panel button[data-kind="html"]').click();
  await expect(page.locator('#embed-panel [part="code"]')).toContainText("drawBracket(ties");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("nothing the builder had before the shared panel is gone: the six rows, The call, In a page, Copy, the three links, and the panel adds five ways, the embed page, the docs, a picture and the credit", async ({ page }) => {
  await page.goto("/builder.html");
  await page.waitForSelector('body[data-ready="true"]');
  const panel = page.locator("#embed-panel");
  for (const [key, values] of [["teams", ["4", "8", "16"]], ["size", ["wide", "square", "card", "phone"]], ["look", ["classic", "road"]], ["theme", ["auto", "light", "dark", "poster"]], ["layout", ["tree", "rows", "shields", "update", "columns"]], ["background", ["none", "midnight", "ice", "hardwood", "pitch", "turf"]]]) {
    await expect(page.locator(`[data-choice="${key}"] button`), key).toHaveText(values);
  }
  await expect(page.locator('[data-testid="stage"] > svg')).toBeVisible();
  await expect(panel.locator('[role="tab"]')).toHaveText(["The call", "In a page", "React", "Vue", "Angular", "Svelte", "iframe"]);
  await expect(panel.locator('[role="tab"][aria-selected="true"]')).toHaveText("The call");
  await expect(panel.locator('[part="size-button"]').first()).toBeHidden();
  await expect(panel.locator('[part="preview"] svg')).toHaveCount(1);
  await expect(panel.locator('[part="copy"]')).toHaveText("Copy code");
  await expect(panel.locator('[part="open"]')).toHaveAttribute("href", "embed.html?look=road&theme=light&size=wide");
  await expect(panel.locator('[part="docs"]')).toHaveAttribute("href", "docs/index.html");
  await expect(panel.locator('[part="credits"]')).toContainText("Taisen Brackets");
  await expect(page.getByRole("link", { name: "Getting started" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Layouts, looks and backgrounds" })).toBeVisible();
  await expect(page.getByRole("link", { name: "API reference" })).toBeVisible();
  for (const [kind, needle] of [["react", "dangerouslySetInnerHTML"], ["vue", "v-html"], ["angular", "bypassSecurityTrustHtml"], ["svelte", "{@html"], ["iframe", "embed.html?look=road&amp;theme=light&amp;size=wide"]]) {
    await panel.locator(`button[data-kind="${kind}"]`).click();
    await expect(panel.locator('[part="code"]'), kind).toContainText(needle);
  }
  await expect(panel.locator('[part="note"]')).toContainText("sample knockout");
  await expect(page).toHaveURL(/embed=iframe/);
  await expect(panel.locator('[part="preview"] iframe')).toHaveAttribute("src", /^embed\.html\?look=road/);
});
