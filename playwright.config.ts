import { baseURL, testPort } from "./tests/test-url";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: { baseURL, browserName: "chromium" },
  webServer: {
    command:
      process.env.TEST_PRODUCTION === "1"
        ? "node .next/standalone/server.js"
        : `npm run dev -- --port ${testPort}`,
    url: baseURL,
    env: {
      SITE_URL: baseURL,
      PORT: String(testPort),
      HOSTNAME: "127.0.0.1",
      RESEND_API_KEY: "",
      CONTACT_FROM: "",
      CONTACT_TO: "",
      OPEN_PANEL_CLIENT_ID: "",
    },
    reuseExistingServer: false,
  },
  reporter: "list",
});
