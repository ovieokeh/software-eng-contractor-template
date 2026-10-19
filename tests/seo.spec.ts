import { test, expect } from "@playwright/test";
import { baseURL } from "./test-url";
import { site } from "../lib/site";
import {
  deployment,
  structuredData,
  pageMetadata,
  generatedSocialImageUrl,
} from "../lib/seo";
import { writeFile, mkdir } from "node:fs/promises";

test("search and social metadata are route-specific and present without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    for (const path of ["/", "/privacy"]) {
      await page.goto(`${baseURL}${path}`);
      const title =
        path === "/"
          ? site.seo.title || `${site.hero.heading} ${site.hero.emphasis}`
          : site.seo.privacyTitle || "Privacy policy";
      const description =
        path === "/"
          ? site.seo.description || site.hero.introduction
          : site.seo.privacyDescription ||
            `How ${site.brand.name} handles enquiries and personal data.`;
      await expect(page).toHaveTitle(`${title} | ${site.brand.name}`);
      for (const selector of [
        'meta[name="description"]',
        'meta[property="og:description"]',
        'meta[name="twitter:description"]',
      ])
        await expect(page.locator(`head ${selector}`)).toHaveAttribute(
          "content",
          description,
        );
      await expect(
        page.locator('head meta[property="og:title"]'),
      ).toHaveAttribute("content", `${title} | ${site.brand.name}`);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        "content",
        "summary_large_image",
      );
      expect(
        new URL(
          (await page.locator('link[rel="canonical"]').getAttribute("href"))!,
        ).href,
      ).toBe(new URL(path, deployment.origin!).href);
      expect(
        new URL(
          (await page
            .locator('meta[property="og:url"]')
            .getAttribute("content"))!,
        ).href,
      ).toBe(new URL(path, deployment.origin!).href);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        site.seo.imageUrl || `${deployment.origin}${generatedSocialImageUrl}`,
      );
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        deployment.indexable ? "index, follow" : "noindex, follow",
      );
    }
  } finally {
    await context.close();
  }
});

test("crawl files and HTTP headers agree with the indexing setting", async ({
  request,
}) => {
  const robots = await (await request.get("/robots.txt")).text();
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(robots).toContain("Disallow: /api/");
  expect(robots).not.toContain("Disallow: /\n");
  if (deployment.indexable) {
    expect(robots).toContain(`Sitemap: ${deployment.origin}/sitemap.xml`);
    expect(sitemap.match(/<loc>/g)).toHaveLength(2);
    expect(sitemap).toContain(`<loc>${deployment.origin}/privacy</loc>`);
  } else {
    expect(robots).not.toContain("Sitemap:");
    expect(sitemap).not.toContain("<loc>");
  }
  for (const path of ["/", "/privacy", "/social-image"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    if (deployment.indexable)
      expect(response.headers()["x-robots-tag"]).toBeUndefined();
    else expect(response.headers()["x-robots-tag"]).toBe("noindex, follow");
  }
});

test("social image serves a correctly sized PNG to sharing bots", async ({
  request,
}) => {
  for (const agent of [
    "Twitterbot/1.0",
    "facebookexternalhit/1.1",
    "LinkedInBot/1.0",
  ]) {
    const response = await request.get("/social-image", {
      headers: { "user-agent": agent },
    });
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
    const bytes = await response.body();
    expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(bytes.readUInt32BE(16)).toBe(1200);
    expect(bytes.readUInt32BE(20)).toBe(630);
    expect(bytes.length).toBeLessThan(5_000_000);
    if (process.env.TEST_PRODUCTION === "1")
      expect(response.headers()["cache-control"]).toMatch(/s-maxage/);
    await mkdir("test-results", { recursive: true });
    await writeFile("test-results/social-image.png", bytes);
  }
});

test("structured entities link to visible services and the configured identity", async ({
  page,
}) => {
  await page.goto("/");
  const graph = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent())!,
  )["@graph"];
  expect(
    graph.filter(
      (entity: Record<string, string>) => entity["@type"] === "Service",
    ),
  ).toHaveLength(site.services.length);
  const ids = graph.map((entity: Record<string, string>) => entity["@id"]);
  expect(new Set(ids).size).toBe(ids.length);
  for (const service of site.services) {
    await expect(page.locator(`#service-${service.id}`)).toContainText(
      service.title,
    );
    const entity = graph.find(
      (e: Record<string, string>) =>
        e["@id"] === `${deployment.origin}/#service-${service.id}`,
    );
    expect(entity.description).toBe(service.short);
    expect(ids).toContain(entity.provider["@id"]);
  }
  await expect(page.locator(".site-experience")).toContainText(
    site.brand.personName,
  );
  const person = graph.find(
    (e: Record<string, string>) => e["@type"] === "Person",
  );
  expect(person.name).toBe(site.brand.personName);
  for (const profile of site.brand.profiles) {
    await expect(
      page.getByRole("link", { name: profile.label, exact: true }),
    ).toHaveAttribute("href", profile.url);
    expect(person.sameAs).toContain(profile.url);
  }
});

test("configured logo and profiles attach only to their matching entities", () => {
  const original = { ...site.brand };
  try {
    site.brand.logoUrl = "https://example.com/logo.png";
    site.brand.profiles = [
      { label: "Professional profile", url: "https://example.com/profile" },
    ];
    const graph = structuredData()!["@graph"];
    expect(graph.find((e) => e["@type"] === "Organization")).toMatchObject({
      logo: site.brand.logoUrl,
    });
    expect(graph.find((e) => e["@type"] === "Person")).toMatchObject({
      sameAs: [site.brand.profiles[0].url],
    });
  } finally {
    Object.assign(site.brand, original);
  }
});

test("custom social image overrides both networks without false dimensions", () => {
  const previous = { ...site.seo };
  try {
    site.seo.imageUrl = "https://example.com/custom.jpg";
    site.seo.imageAlt = "Custom image description";
    const meta = pageMetadata("/privacy", "Privacy", "Privacy details");
    expect(meta.openGraph?.images).toEqual([
      { url: site.seo.imageUrl, alt: site.seo.imageAlt },
    ]);
    expect(meta.twitter?.images).toEqual([
      { url: site.seo.imageUrl, alt: site.seo.imageAlt },
    ]);
  } finally {
    Object.assign(site.seo, previous);
  }
});
