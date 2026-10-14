// The demo's layout switcher, played in a real browser: each layout on the sports that suit it, at a phone's width and a desk's, without scrolling sideways.
import { expect, test } from "@playwright/test";

const noSidewaysScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const LAYOUTS = [
  ["nhl2024", "rows", ".tb-slot"], ["nhl2024", "update", ".tb-emptybar, .tb-slot"], ["nfl2024", "columns", ".tb-cslot"], ["wc2022", "shields", ".tb-shield"],
  ["nba2024playin", "playin", ".tb-arrow"], ["nba2024", "series", ".tb-series"], ["cupGroups", "groups", ".tb-gtile"], ["softballGroups", "groups", ".tb-gtile"],
];

test("every layout opens from the address and from its button, draws what it is, and does not scroll sideways", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [ex, layout, marker] of LAYOUTS) {
    await page.goto(`/?ex=${ex}&layout=${layout}`);
    await expect(page.locator("#stage > svg").first()).toBeVisible();
    await expect(page.locator(`#stage > svg ${marker}`).first()).toBeAttached();
    expect(await noSidewaysScroll(page)).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("the layout buttons change the drawing and the address, and a layout the example cannot draw is not offered", async ({ page }) => {
  await page.goto("/?ex=nhl2024");
  const buttons = page.locator("#layout button");
  await expect(buttons).toHaveText(["Tree", "Rows", "Update", "Series"]);
  await page.locator("#layout").getByRole("button", { name: "Rows", exact: true }).click();
  await expect(page.locator("#stage > svg .tb-slot").first()).toBeAttached();
  expect(page.url()).toContain("layout=rows");
  await page.locator("#toggles").getByRole("button", { name: "Headers", exact: true }).click();
  await expect(page.locator("#stage > svg .tb-head")).toHaveCount(2);
  await page.locator("#layout").getByRole("button", { name: "Tree", exact: true }).click();
  expect(page.url()).not.toContain("layout=");
  // The groups' examples have one layout, the play-in's two.
  await page.goto("/?ex=cupGroups");
  await expect(page.locator("#layout-row")).toBeHidden();
  await expect(page.locator("#stage > svg .tb-gcard")).toHaveCount(4);
  await page.goto("/?ex=nba2024playin&layout=nope");
  await expect(page.locator("#stage > svg .tb-arrow").first()).toBeAttached();
  // An address naming a layout the example does not offer opens its first one.
  await page.goto("/?ex=cupGroups&layout=rows");
  await expect(page.locator("#stage > svg .tb-gcard")).toHaveCount(4);
});

test("the gallery of layouts opens each in the playground, on its background", async ({ page }) => {
  await page.goto("/");
  const tiles = page.locator("#layout-gallery button");
  expect(await tiles.count()).toBe(9);
  await page.locator('#layout-gallery button[data-layout="columns"]').click();
  await expect(page.locator("#stage > svg .tb-cslot").first()).toBeAttached();
  expect(page.url()).toContain("layout=columns");
  expect(page.url()).toContain("bg=turf");
  await expect(page.locator("#code")).toContainText('"layout": "columns"');
});

test("a layout is drawn in each language and in the dark, and AT replaces VS in the columns", async ({ page }) => {
  await page.goto("/?ex=nfl2024&layout=columns");
  await expect(page.locator("#stage > svg .tb-atag-t").first()).toHaveText("VS");
  await page.locator("#toggles").getByRole("button", { name: "AT", exact: true }).click();
  await expect(page.locator("#stage > svg .tb-atag-t").first()).toHaveText("AT");
  await page.locator("#lang").getByRole("button", { name: "Français" }).click();
  await expect(page.locator("#stage > svg .tb-atag-t").first()).toHaveText("À");
  await page.locator("#theme").getByRole("button", { name: "Dark", exact: true }).click();
  expect(await noSidewaysScroll(page)).toBe(true);
});
