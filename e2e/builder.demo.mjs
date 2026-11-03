// The builder page: each row of choices redraws the bracket and rewrites the code, the code is the call that draws it, and nothing is wider than the screen.
import { expect, test } from "@playwright/test";

test("a choice redraws the bracket and rewrites the code", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto("/builder.html");
  await page.waitForSelector('body[data-ready="true"]');
  await expect(page.locator('[data-testid="stage"] > svg')).toBeVisible();
  await expect(page.locator('[data-testid="code"]')).toContainText("singleElimination(teams)");
  await expect(page.locator('[data-testid="code"]')).toContainText('"size": "wide"');
  await page.locator('[data-choice="size"] button[data-value="phone"]').click();
  await expect(page.locator('[data-testid="code"]')).toContainText('"size": "phone"');
  expect(await page.locator('[data-testid="stage"] > svg').getAttribute("viewBox")).toMatch(/^0 0 390 /);
  await page.locator('[data-choice="teams"] button[data-value="16"]').click();
  await expect(page.locator('[data-testid="code"]')).toContainText('"Team 16"');
  await page.locator('[data-choice="theme"] button[data-value="poster"]').click();
  await page.locator('[data-choice="background"] button[data-value="ice"]').click();
  await expect(page.locator('[data-testid="code"]')).toContainText('"background": "ice"');
  await page.locator('#tabs button[data-way="element"]').click();
  await expect(page.locator('[data-testid="code"]')).toContainText("drawBracket(ties");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
