import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test/e2e",
  timeout: 30000,
  retries: 0,
  workers: 1, // Electron tests must run serially (single display)
  reporter: process.env.CI ? "github" : "list",
  use: {
    trace: "on-first-retry",
  },
});
