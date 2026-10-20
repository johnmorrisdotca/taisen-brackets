// The demo's own tests: a real browser, real taps. `pnpm test:demo` builds the demo and runs them.
// The server is scripts/dev.mjs on port 7101: this package's block of ports is 7100 to 7199, and tests use 7101 and up.
import { defineConfig, devices } from "@playwright/test";

const phone = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

export default defineConfig({
  testDir: "e2e",
  testMatch: "*.demo.mjs",
  // The demo draws many boards and the CI runners are slow, WebKit on a phone most of all: 30 s was too tight for the longest tests.
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: true,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:7101", reducedMotion: "reduce", locale: "en-US" },
  webServer: { command: "node scripts/dev.mjs", env: { PORT: "7101" }, url: "http://127.0.0.1:7101/", reuseExistingServer: false },
  projects: [
    { name: "chromium-phone", use: { ...devices["Desktop Chrome"], ...phone } },
    { name: "chromium-desk", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    // WebKit on a desktop viewport with touch: `isMobile` is Chromium's to honour.
    { name: "webkit-phone", use: { ...devices["Desktop Safari"], viewport: phone.viewport, hasTouch: true } },
  ],
});
