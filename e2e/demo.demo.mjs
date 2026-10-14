import { expect, test } from "@playwright/test";

const examples = ["nhl2024", "nhl1984", "nba2024", "mlb2022", "nfl2024", "cfl2024", "mls2024", "poster", "wc2022", "wc1938", "generic32", "twoLegs"];

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
  for (const button of await page.locator("#sport button, #example button, #size button, #lang button, .fam-chip").all()) {
    const box = await button.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(43.5);
  }
});

test("a sport picker opens each sport, and the examples of a sport are its editions", async ({ page }) => {
  await page.goto("/");
  for (const [sport, key, note] of [["NBA", "nba2024", "conferences"], ["NFL", "nfl2024", "Super Bowl"], ["CFL", "cfl2024", "Grey Cup"], ["MLS", "mls2024", "best-of-three"], ["MLB", "mlb2022", "byes"], ["World Cup", "poster", "poster look"]]) {
    await page.locator("#sport").getByRole("button", { name: sport, exact: true }).click();
    await expect(page.locator("#note")).toContainText(note);
    expect(page.url()).toContain(`ex=${key}`);
  }
  await page.locator("#sport").getByRole("button", { name: "NHL", exact: true }).click();
  await expect(page.locator("#example-row")).toBeVisible();
  await page.locator("#example").getByRole("button", { name: "1984, Campbell and Wales" }).click();
  await expect(page.locator("#stage > svg")).toContainText(/clarence campbell conference/i);
});

test("the language switcher changes the rounds, the notes and the countries, and is remembered", async ({ page }) => {
  await page.goto("/?ex=wc2022");
  const terms = { fr: ["HUITIÈMES DE FINALE", "Argentine"], ja: ["ラウンド16", "アルゼンチン"], es: ["OCTAVOS DE FINAL", "Argentina"], de: ["ACHTELFINALE", "Argentinien"] };
  for (const [code, [round, country]] of Object.entries(terms)) {
    await page.locator("#lang").locator(`button[data-value=${code}]`).click();
    await expect(page.locator("#stage > svg")).toHaveAttribute("lang", code);
    await expect(page.locator("#stage > svg")).toContainText(round);
    await expect(page.locator("#stage > svg")).toContainText(country);
    expect(page.url()).toContain(`lang=${code}`);
  }
  // The choice is kept: a visit with no `lang` in the address opens in German.
  await page.goto("/?ex=poster");
  await expect(page.locator("#stage > svg")).toHaveAttribute("lang", "de");
  await expect(page.locator("#stage > svg")).toContainText("SIEGER");
  await expect(page.locator("#table table")).toHaveAttribute("lang", "de");
  await page.locator("#lang").locator("button[data-value=en]").click();
  await page.goto("/?ex=poster");
  await expect(page.locator("#stage > svg")).toHaveAttribute("lang", "en");
});

test("every example follows the language, and none overflows the page", async ({ page }) => {
  // Forty-eight page loads: a slow runner needs more than the default thirty seconds.
  test.setTimeout(240_000);
  for (const code of ["fr", "ja", "es", "de"]) {
    for (const key of examples) {
      await page.goto(`/?ex=${key}&lang=${code}`);
      await expect(page.locator("#stage > svg")).toHaveAttribute("lang", code);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  }
});
