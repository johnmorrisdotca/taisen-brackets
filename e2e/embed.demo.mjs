// The embed page: a page made for an iframe, drawing what its address says and nothing else.
import { expect, test } from "@playwright/test";

test("the embed page draws a bracket from its address, with nothing else on the page", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/embed.html?look=road&theme=dark&locale=ja&size=square&title=Aurora%20Cup");
  const svg = page.locator("#bracket > svg");
  await expect(svg).toBeVisible();
  await expect(svg).toHaveAttribute("lang", "ja");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  expect(await page.locator("body > *:not(script)").count()).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("the embed page tells the page around it when the bracket is drawn, and takes the address after a #", async ({ page }) => {
  await page.goto("/embed.html");
  const message = await page.evaluate(
    () =>
      new Promise((resolve) => {
        window.addEventListener("message", (event) => resolve(event.data), { once: true });
        const frame = document.createElement("iframe");
        frame.id = "frame";
        frame.style.cssText = "width:640px;height:360px;border:0";
        frame.src = "/embed.html#look=road&size=wide";
        document.body.append(frame);
      }),
  );
  expect(message).toEqual({ taisen: "load" });
  await expect(page.frameLocator("#frame").locator("#bracket > svg")).toBeVisible();
});
