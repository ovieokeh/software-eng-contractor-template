import { baseURL } from "./test-url";
import { site } from "../lib/site";
import { test, expect } from "@playwright/test";
import { experienceHighlights } from "../lib/experience-highlights";

test("experience comes from configuration with attributed links", async ({
  page,
}) => {
  for (const path of ["/"]) {
    await page.goto(path);
    const section = page.locator(".site-experience");
    await expect(section.getByRole("heading", { level: 2 })).toHaveText(
      "The experience you get",
    );
    await expect(section).toContainText(site.experience.credit);
    await expect(section.getByRole("listitem")).toHaveCount(
      site.experience.items.length,
    );
    for (const experience of experienceHighlights) {
      const link = section.getByRole("link", {
        name: `${experience.organisation} (opens in a new tab)`,
        exact: true,
      });
      await expect(link).toHaveAttribute("href", experience.url);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noreferrer/);
      await expect(section).toContainText(experience.summary);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("homepage, privacy page and sitemap use straightforward canonical routes", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    site.hero.heading,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    baseURL,
  );
  await page.getByRole("link", { name: "Privacy", exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/privacy`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Privacy policy",
  );
  await page.getByRole("link", { name: `${site.brand.name} home` }).click();
  await expect(page).toHaveURL(`${baseURL}/`);
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain(`${baseURL}/privacy`);
  expect(
    (await request.get("/unconfigured-page", { maxRedirects: 0 })).status(),
  ).toBe(404);
});
