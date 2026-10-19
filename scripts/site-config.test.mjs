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
      s.currency = "INVALID";
    },
    (s) => {
      s.locale = "";
    },
    (s) => {
      s.phoneCountry = "INVALID";
    },
  ]) {
    const config = structuredClone(example);
    mutate(config);
    assert.throws(() => validateSiteConfig(config));
  }
});
