// The demo's first screen, played in a real browser: the World Cup bracket fills in game by game, with its play bar in view on a phone and on a desk, and a change to an option leaves the games coming in.
import { expect, test } from "@playwright/test";

const played = async (page) => Number((await page.locator('[data-testid="game-out"]').textContent()).split(" of ")[0]);
// Measured in the page in one go: the bracket is drawn again every game, so an element found a moment ago may be gone.
const inView = (page, selector) =>
  page.evaluate((query) => {
    const box = document.querySelector(query)?.getBoundingClientRect();
    return box !== undefined && box.y >= 0 && box.y + Math.min(box.height, 120) <= window.innerHeight;
  }, selector);

test.describe("a reader who has not asked for less motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("the page opens on the bracket and its play bar, in the first screen, and the games come in by themselves", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#stage > svg")).toBeVisible();
    expect(await inView(page, '[data-testid="playbar"]')).toBe(true);
    expect(await inView(page, "#stage > svg")).toBe(true);
    await expect(page.locator('[data-testid="play"]')).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => played(page), { timeout: 8000 }).toBeGreaterThan(0);
    // The address says nothing about it while it plays: a reload starts the games again.
    expect(page.url()).not.toMatch(/game=|play=/);
  });

  test("changing the options while it plays leaves the games coming in", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#stage > svg")).toBeVisible();
    await expect.poll(() => played(page), { timeout: 8000 }).toBeGreaterThan(0);
    // A look, the style and a toggle are changed one after the other, and the count keeps rising after each (the bar stays pinned, and the bracket keeps its place on the page).
    for (const choose of [
      () => page.locator("#theme").getByRole("button", { name: "Dark", exact: true }).click(),
      () => page.locator("#look").getByRole("button", { name: "Classic", exact: true }).click(),
      () => page.locator("#toggles").getByRole("button", { name: "Scores", exact: true }).click(),
    ]) {
      const before = await played(page);
      if (before >= 14) break;
      await choose();
      await expect.poll(() => played(page), { timeout: 8000 }).toBeGreaterThan(before);
    }
  });

  test("Pause holds the bracket and writes the game in the address, Play carries on, Play again starts over and the slider holds any game", async ({ page }) => {
    // A game every four seconds, so that a slow browser has time to press the buttons before the last one.
    await page.goto("/?game=3&play=0&gap=4000");
    await expect(page.locator("#stage > svg")).toBeVisible();
    const play = page.locator('[data-testid="play"]');
    // The bar is pinned: a mouse click sent to it by WebKit under test can miss once the page has scrolled (a tap and a real click do not), so the buttons are clicked where they are, with the page at the top.
    await play.click();
    await expect(play).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => played(page), { timeout: 12000 }).toBeGreaterThan(3);
    await play.click();
    await expect(play).toHaveAttribute("aria-pressed", "false");
    const stopped = await played(page);
    await expect(page).toHaveURL(new RegExp(`play=0&game=${stopped}&gap=4000|game=${stopped}`));
    await page.waitForTimeout(1000);
    expect(await played(page)).toBe(stopped);
    await page.locator('[data-testid="restart"]').click();
    await expect(play).toHaveAttribute("aria-pressed", "true");
    await page.locator('[data-testid="game"]').fill("5");
    await expect(play).toHaveAttribute("aria-pressed", "false");
    expect(await played(page)).toBe(5);
    await expect(page.locator("#stage .tb-champ")).toHaveCount(0);
  });

  test("another sport opens its own games from the first, and a sport that is not played out hides the bar", async ({ page }) => {
    await page.goto("/");
    await page.locator("#sport").getByRole("button", { name: "NBA", exact: true }).click();
    await expect(page.locator('[data-testid="playbar"]')).toBeVisible();
    await expect.poll(() => played(page), { timeout: 8000 }).toBeGreaterThan(0);
    await page.locator("#sport").getByRole("button", { name: "Judo", exact: true }).click();
    await expect(page.locator('[data-testid="playbar"]')).toBeHidden();
  });
});

test("an address that names a game opens paused at it, and a reader who prefers reduced motion gets the finished bracket", async ({ page }) => {
  await page.goto("/?game=7&play=0");
  await expect(page.locator("#stage > svg")).toBeVisible();
  expect(await played(page)).toBe(7);
  await expect(page.locator('[data-testid="play"]')).toHaveAttribute("aria-pressed", "false");
  await page.waitForTimeout(1000);
  expect(await played(page)).toBe(7);
  // The test config prefers reduced motion: with no game in the address the bracket is whole and nothing moves.
  await page.goto("/");
  await expect(page.locator("#stage > svg")).toBeVisible();
  expect(await played(page)).toBe(16);
  await expect(page.locator('[data-testid="play"]')).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator('[data-testid="play"]')).toHaveText("Play");
});
