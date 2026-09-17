import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    browserName: "chromium",
    channel: "chrome",
    baseURL: "http://127.0.0.1:4173",
  },
  webServer: [
    {
      command: "corepack pnpm vite --host 127.0.0.1 --port 4173",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: false,
    },
  ],
});
