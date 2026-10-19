import { test, expect } from "@playwright/test";
import type { AnalyticsEvent } from "../lib/analytics";

test("Enquiry events preserve fixed choices without form data", async ({
  page,
}) => {
  const events: AnalyticsEvent[] = [];
  await page.exposeFunction("captureAnalytics", (event: AnalyticsEvent) =>
    events.push(event),
  );
  await page.addInitScript(() => {
    window.addEventListener("studio:analytics", (event) => {
      void (
        window as unknown as {
          captureAnalytics: (event: unknown) => Promise<void>;
        }
      ).captureAnalytics((event as CustomEvent).detail);
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Prefer email? Send an enquiry", exact: true })
    .click();
  await expect
    .poll(() => events)
    .toContainEqual({
      name: "enquiry_opened",
      properties: {
        interest: "other",
        source: "close",
      },
    });
  await page.getByLabel("What do you need help with?").selectOption("other");
  await page.getByLabel("Your name").fill("Private Test Name");
  await page.getByLabel("Email address").fill("private@example.com");
  await page
    .getByLabel("What are you working on?")
    .fill("Private project description");
  let payload: Record<string, string> | undefined;
  await page.route("**/api/contact", (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({ status: 503, body: "{}" });
  });
  await page.getByRole("button", { name: "Send your enquiry" }).click();
  await expect
    .poll(() => events)
    .toContainEqual({
      name: "enquiry_failed",
      properties: {
        interest: "other",
        source: "close",
      },
    });
  await page.route("**/api/contact", (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({ status: 200, body: '{"ok":true}' });
  });
  await page.getByRole("button", { name: "Send your enquiry" }).click();
  await expect
    .poll(() => events)
    .toContainEqual({
      name: "enquiry_submitted",
      properties: {
        interest: "other",
        source: "close",
      },
    });
  expect(payload?.interest).toBe("other");
  const encoded = JSON.stringify(events);
  expect(encoded).not.toContain("Private");
  expect(encoded).not.toContain("private@example.com");
  await page.goto("/");
  await page
    .getByRole("button", { name: "Prefer email? Send an enquiry", exact: true })
    .click();
  await expect
    .poll(() => events)
    .toContainEqual({
      name: "enquiry_opened",
      properties: {
        interest: "other",
        source: "close",
      },
    });
});
