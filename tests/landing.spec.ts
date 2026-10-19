import { enquiryOptions, services } from "../lib/content";
import { bookingUrl } from "../lib/booking";
import { baseURL } from "./test-url";
import { site } from "../lib/site";
import { test, expect } from "@playwright/test";
import { pricing, money } from "../lib/pricing";
test("team enquiry, keyboard dialog, theme and mobile layout", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    site.hero.heading,
  );
  await page
    .getByRole("button", { name: "Prefer email? Send an enquiry" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
  const scrollBeforeWheel = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 900);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBe(scrollBeforeWheel);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
  await expect(
    page.getByRole("button", { name: "Prefer email? Send an enquiry" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Toggle colour theme" }).click();
  const theme = await page.locator("html").getAttribute("data-theme");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme!);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "light";
  });
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
});
test("form handles delivery failure and success without losing user input", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Prefer email? Send an enquiry" })
    .click();
  await page.getByLabel("Your name").fill("Test Visitor");
  await page.getByLabel("Email address").fill("visitor@example.com");
  await page
    .getByLabel("What are you working on?")
    .fill("A useful product that needs engineering help.");
  await page.route("**/api/contact", (route) =>
    route.fulfill({ status: 503, body: "{}" }),
  );
  await page.getByRole("button", { name: "Send your enquiry" }).click();
  await expect(page.getByRole("status")).toContainText("couldn’t be sent");
  await expect(page.getByLabel("Your name")).toHaveValue("Test Visitor");
  await page.route("**/api/contact", (route) =>
    route.fulfill({ status: 200, body: '{"ok":true}' }),
  );
  await page.getByRole("button", { name: "Send your enquiry" }).click();
  await expect(
    page.getByRole("heading", { name: "Thanks for the context." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to the site" }).click();
  await page
    .getByRole("button", { name: "Prefer email? Send an enquiry" })
    .click();
  await expect(
    page.getByRole("button", { name: "Send your enquiry" }),
  ).toBeVisible();
});
test("email enquiry uses configured interests and reaches the email API", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Prefer email? Send an enquiry" })
    .click();
  const select = page.getByLabel("What do you need help with?");
  await expect(select).toHaveValue("other");
  await expect(select.locator("option")).toHaveText(
    enquiryOptions.map((option) => option.label),
  );
  await page
    .getByLabel("What do you need help with?")
    .selectOption(services[0].id);
  await page.getByLabel("Your name").fill("Test Visitor");
  await page.getByLabel("Email address").fill("visitor@example.com");
  await page
    .getByLabel("What are you working on?")
    .fill("A product feature that needs engineering help.");
  let payload: Record<string, string> | undefined;
  await page.route("**/api/contact", (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({ status: 200, body: '{"ok":true}' });
  });
  await page.getByRole("button", { name: "Send your enquiry" }).click();
  await expect(page.getByText("Thanks for the context.")).toBeVisible();
  expect(payload?.interest).toBe(services[0].id);
  await page.getByRole("button", { name: "Back to the site" }).click();
  await page
    .getByRole("button", { name: "Prefer email? Send an enquiry" })
    .click();
  await expect(page.getByLabel("What do you need help with?")).toHaveValue(
    "other",
  );
});
test("team offer explains monthly capacity and delivery", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /^https?:\/\/[^/]+\/?$/,
  );
  const retainer = page.locator("#retainer");
  await expect(retainer).toContainText(money(pricing.monthlyRetainer));
  await expect(retainer).toContainText(
    `${pricing.reservedHours} hours reserved`,
  );
  await expect(retainer).toContainText(
    `${money(pricing.additionalHourlyRate)}/hour`,
  );
  await expect(retainer).toContainText("with your approval");
  await page.getByRole("link", { name: "How it works" }).click();
  const engagement = page.locator("#how-it-works");
  await expect(engagement).toBeInViewport();
  await expect(engagement).toContainText(
    "You keep control of access and approvals",
  );
  await expect(engagement).toContainText("Your team approves the release");
  await page
    .getByText("Availability and communication", { exact: true })
    .click();
  await expect(
    engagement.getByText(site.availability, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: services[0].title }),
  ).toHaveAttribute("href", bookingUrl(services[0].id));
});
test("optional contact details validate and are normalised before sending", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Prefer email? Send an enquiry" })
    .click();
  await page.getByLabel("Your name").fill("Test Visitor");
  await page.getByLabel("Email address").fill("visitor@example.com");
  await page
    .getByLabel("What are you working on?")
    .fill("A product with an existing website.");
  await page.getByLabel("Phone country code").selectOption("GB");
  await expect(page.locator(".country-picker-display")).toHaveText("GB +44");
  await expect(page.locator('option[value="GB"]')).toContainText(
    "United Kingdom",
  );
  await page.getByLabel("Phone country code").selectOption("NL");
  await page.getByLabel("Phone number (optional)").fill("1234");
  await page.getByLabel("Website (optional)").fill("not a website");
  await page.getByRole("button", { name: "Send your enquiry" }).click();
  await expect(page.getByText("Enter a valid website address")).toBeVisible();

  await page.getByLabel("Website (optional)").fill("example.com");
  await page.getByRole("button", { name: "Send your enquiry" }).click();
  await expect(page.getByText("Enter a valid phone number")).toBeVisible();

  await page.getByLabel("Phone number (optional)").fill("06 1234 5678");
  let payload: Record<string, string> | undefined;
  await page.route("**/api/contact", (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({ status: 200, body: '{"ok":true}' });
  });
  await page.getByRole("button", { name: "Send your enquiry" }).click();
  await expect(
    page.getByRole("heading", { name: "Thanks for the context." }),
  ).toBeVisible();
  expect(payload?.phone).toBe("+31612345678");
  expect(payload?.projectWebsite).toBe("https://example.com/");
  expect(payload?.fax).toBe("");
  await expect(
    page.getByRole("link", { name: "Privacy", exact: true }),
  ).toHaveAttribute("href", "/privacy");
});
test("contact endpoint rejects cross-origin and invalid requests", async ({
  request,
}) => {
  const crossOrigin = await request.post("/api/contact", {
    headers: { origin: "https://untrusted.example" },
    data: {},
  });
  expect(crossOrigin.status()).toBe(403);
  const invalid = await request.post("/api/contact", {
    headers: { origin: baseURL },
    data: { name: "A", email: "invalid", message: "short" },
  });
  expect(invalid.status()).toBe(400);
  const oversized = await request.post("/api/contact", {
    headers: { origin: baseURL },
    data: { message: "a".repeat(25000) },
  });
  expect(oversized.status()).toBe(413);
  const invalidPhone = await request.post("/api/contact", {
    headers: { origin: baseURL },
    data: {
      name: "A",
      email: "a@example.com",
      message: "This is a valid enquiry",
      interest: "other",
      phone: "1234",
      phoneCountry: "NL",
    },
  });
  expect(invalidPhone.status()).toBe(400);
  const invalidWebsite = await request.post("/api/contact", {
    headers: { origin: baseURL },
    data: {
      name: "A",
      email: "a@example.com",
      message: "This is a valid enquiry",
      interest: "other",
      projectWebsite: "javascript:alert(1)",
    },
  });
  expect(invalidWebsite.status()).toBe(400);
  const missingInterest = await request.post("/api/contact", {
    headers: { origin: baseURL },
    data: {
      name: "A",
      email: "a@example.com",
      message: "This is a valid enquiry",
    },
  });
  expect(missingInterest.status()).toBe(400);
});
