import { expect, test } from "@playwright/test";

const examples = ["nhl2024", "wc2022", "poster", "generic32", "mlb2022", "wc1938", "twoLegs"];

test("the demo draws a bracket and does not scroll sideways", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#stage > svg")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("every example draws, and at the width of the page: a phone gets the tall drawing", async ({ page }, info) => {
  const phone = info.project.name.includes("phone");
  for (const key of examples) {
    await page.goto(`/?ex=${key}`);
    const box = await page.locator("#stage > svg").boundingBox();
    expect(box.width).toBeGreaterThan(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const viewBox = await page.locator("#stage > svg").getAttribute("viewBox");
    const [, , w, h] = viewBox.split(" ").map(Number);
    if (phone) expect(w).toBe(390);
    else expect(w).toBe(1200);
    if (phone) expect(h).toBeGreaterThan(w);
  }
});

test("the controls change the drawing and the address, and a tap on the gallery opens an example", async ({ page }) => {
  await page.goto("/?ex=wc2022");
  await page.getByRole("button", { name: "Poster", exact: true }).click();
  await expect(page.locator("#stage > svg")).toHaveClass(/taisen/);
  expect(page.url()).toContain("theme=poster");
  await page.getByRole("button", { name: "Square", exact: true }).click();
  await expect(page.locator("#stage")).toHaveAttribute("data-size", "square");
  await page.getByRole("button", { name: "Champion", exact: true }).click();
  await expect(page.locator("#stage > svg")).not.toContainText("CHAMPION");
  await page.locator("#gallery button[data-value=nhl2024]").click();
  await expect(page.locator("#note")).toContainText("Best-of-seven");
});

test("the table and the call are there, and 44 pixels is the least a control gives a finger", async ({ page }) => {
  await page.goto("/?ex=wc2022");
  await page.locator("#table-box summary").click();
  await expect(page.locator("#table table tbody tr")).toHaveCount(16);
  await page.locator("#code-box summary").click();
  await expect(page.locator("#code")).toContainText("drawBracket(wc2022");
  for (const button of await page.locator("#example button, #size button, .fam-chip").all()) {
    const box = await button.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(43.5);
  }
});
