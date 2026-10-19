import { pricing } from "../lib/pricing";
import { baseURL } from "./test-url";
import { site } from "../lib/site";
import { bookingUrl } from "../lib/booking";
import {
  enquiryOptions,
  enquiryInterest,
  interestLabel,
  isInterest,
} from "../lib/content";
import { test, expect } from "@playwright/test";
import type { AnalyticsEvent } from "../lib/analytics";

test("contact links navigate to the configured calendar and leave email optional", async ({
  page,
}) => {
  const events: AnalyticsEvent[] = [];
  await page.exposeFunction("captureBooking", (event: AnalyticsEvent) =>
    events.push(event),
  );
  await page.addInitScript(() => {
    window.addEventListener("studio:analytics", (event) => {
      void (
        window as unknown as {
          captureBooking: (event: unknown) => Promise<void>;
        }
      ).captureBooking((event as CustomEvent).detail);
    });
  });
  await page.route(
    (url) => url.origin === new URL(site.booking.url).origin,
    (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<h1>Calendar destination</h1>",
      }),
  );
  for (const entry of [
    {
      name: `Start with a free ${pricing.callMinutes}-minute call`,
      placement: "hero",
      interest: undefined,
    },
    {
      name: `Book a free ${pricing.callMinutes}-minute call`,
      placement: "close",
      interest: undefined,
    },
    ...site.services.map((service) => ({
      name: service.title,
      placement: "work",
      interest: service.id,
    })),
    { name: "Got a different problem?", placement: "work", interest: "other" },
  ]) {
    await page.goto("/");
    await page
      .getByRole("button", { name: "Prefer email? Send an enquiry" })
      .click();
    await expect(page.getByLabel("What do you need help with?")).toHaveValue(
      "other",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.locator(`a[href^="${site.booking.url}"]`)).toHaveCount(
      site.services.length + 3,
    );
    const link = page.getByRole("link", { name: entry.name, exact: true });
    const expected = bookingUrl(entry.interest);
    await expect(link).toHaveAttribute("href", expected);
    const before = events.filter(
      (event) => event.name === "booking_clicked",
    ).length;
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(expected);
    await expect
      .poll(
        () => events.filter((event) => event.name === "booking_clicked").length,
      )
      .toBe(before + 1);
    await expect
      .poll(() => events)
      .toContainEqual({
        name: "booking_clicked",
        properties: { placement: entry.placement },
      });
  }
});

test("optional prefill preserves existing URL parameters and encodes exact service labels", () => {
  const original = { ...site.booking };
  try {
    site.booking.url = "https://example.com/book?ref=website";
    site.booking.question = "help-with";
    const url = new URL(bookingUrl(site.services[0].id));
    expect(url.searchParams.get("help-with")).toBe(
      site.services[0].enquiryLabel || site.services[0].title,
    );
    expect(url.searchParams.get("ref")).toBe("website");
    expect(bookingUrl()).toBe(site.booking.url);
    expect(bookingUrl("unknown-value")).toBe(site.booking.url);
    site.booking.question = "";
    expect(bookingUrl(site.services[0].id)).toBe(site.booking.url);
  } finally {
    Object.assign(site.booking, original);
  }
});

test("email choices group service cards using the same labels as calendar prefills", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Prefer email? Send an enquiry" })
    .click();
  const labels = [
    ...new Set(
      site.services.map((service) => service.enquiryLabel || service.title),
    ),
    "Something else",
  ];
  await expect(page.locator('select[name="interest"] option')).toHaveText(
    labels,
  );
  for (const service of site.services) {
    expect(isInterest(service.id)).toBe(true);
    const option = enquiryOptions.find(
      ({ id }) => id === enquiryInterest(service.id),
    );
    expect(option?.label).toBe(service.enquiryLabel || service.title);
    expect(interestLabel(service.id)).toBe(option?.label);
    if (site.booking.question) {
      expect(
        new URL(bookingUrl(service.id)).searchParams.get(site.booking.question),
      ).toBe(option?.label);
    }
  }
});

test("calendar booking works without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.route(
      (url) => url.origin === new URL(site.booking.url).origin,
      (route) =>
        route.fulfill({
          contentType: "text/html",
          body: "<h1>Calendar destination</h1>",
        }),
    );
    await page.goto(baseURL);
    await page
      .getByRole("link", {
        name: `Start with a free ${pricing.callMinutes}-minute call`,
      })
      .click();
    await expect(page).toHaveURL(site.booking.url);
  } finally {
    await context.close();
  }
});
