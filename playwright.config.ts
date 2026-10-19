import { baseURL, testPort } from "./tests/test-url";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: { baseURL, browserName: "chromium" },
  webServer: {
    command: `npm run dev -- --port ${testPort}`,
    url: baseURL,
    env: {
      SITE_URL: baseURL,
      RESEND_API_KEY: "",
      CONTACT_FROM: "",
      CONTACT_TO: "",
      OPEN_PANEL_CLIENT_ID: "",
    },
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
