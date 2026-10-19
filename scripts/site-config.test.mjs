import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateSiteConfig } from "./site-config.mjs";

const example = JSON.parse(
  await readFile(
    new URL("../config/site.example.json", import.meta.url),
    "utf8",
  ),
);
test("example configuration is usable and analytics are disabled", () => {
  assert.equal(
    validateSiteConfig(structuredClone(example)).analytics.apiUrl,
    "",
  );
});
test("public configuration rejects extra fields, secret-shaped fields and unsafe URLs", () => {
  for (const mutate of [
    (s) => {
      s.RESEND_API_KEY = "sentinel-not-a-real-key";
    },
    (s) => {
      s.brand.internalNotes = "private";
    },
    (s) => {
      s.booking.url = "javascript:alert(1)";
    },
    (s) => {
      s.experience.items[0].url = "https://user:password@example.com";
    },
    (s) => {
      s.analytics.apiUrl = "https://example.com";
    },
    (s) => {
      s.brand.email = "hello@example.com\nBcc: other@example.com";
    },
    (s) => {
      s.services.push({ ...s.services[0] });
    },
    (s) => {
      s.services[0].id = "other";
    },
    (s) => {
      s.services = [];
    },
    (s) => {
      s.services[0].enquiryLabel = 123;
    },
    (s) => {
      s.services[0].enquiryLabel = "Something else";
    },
    (s) => {
      s.currency = "INVALID";
    },
    (s) => {
      s.locale = "";
    },
    (s) => {
      s.phoneCountry = "INVALID";
    },
    (s) => {
      s.brand.logoUrl = "javascript:alert(1)";
    },
    (s) => {
      s.brand.profiles = [
        { label: "Profile", url: "https://user:secret@example.com" },
      ];
    },
    (s) => {
      s.seo.imageUrl = "https://example.com/image.png";
    },
    (s) => {
      s.seo = null;
    },
    (s) => {
      s.seo = [];
    },
  ]) {
    const config = structuredClone(example);
    mutate(config);
    assert.throws(() => validateSiteConfig(config));
  }
});

test("services can share an optional enquiry label without changing their titles", () => {
  const input = structuredClone(example);
  assert.equal(validateSiteConfig(input).services[0].enquiryLabel, "");
  input.services[0].enquiryLabel = " Features and integrations ";
  input.services[1].enquiryLabel = "Features and integrations";
  const config = validateSiteConfig(input);
  assert.equal(config.services[0].title, input.services[0].title);
  assert.equal(
    config.services[0].enquiryLabel,
    config.services[1].enquiryLabel,
  );
  assert.equal(config.services[0].enquiryLabel, "Features and integrations");
});

test("existing site files get optional SEO defaults without losing custom values", () => {
  const old = structuredClone(example);
  delete old.seo;
  delete old.brand.logoUrl;
  delete old.brand.profiles;
  const config = validateSiteConfig(old);
  assert.equal(config.seo.title, "");
  assert.deepEqual(config.brand.profiles, []);
  config.seo = {
    title: "Custom title",
    imageUrl: "https://example.com/card.jpg",
    imageAlt: "Custom preview",
  };
  assert.equal(validateSiteConfig(config).seo.title, "Custom title");
});
