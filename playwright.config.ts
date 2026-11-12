import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  use: {
    baseURL: "http://127.0.0.1:4179",
    viewport: { width: 1200, height: 1000 },
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }, {
    name: "firefox",
    use: { browserName: "firefox" },
  }],
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4179 --strictPort",
    url: "http://127.0.0.1:4179/tests/browser.html",
    env: { DISABLE_PWA: "true" },
    reuseExistingServer: false,
  },
});
