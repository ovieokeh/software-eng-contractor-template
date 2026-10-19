import { test } from "node:test";
import assert from "node:assert/strict";
import { seoPolicy } from "./seo-policy.mjs";

test("indexing is opt-in, with normalised origins and safe preview defaults", () => {
  assert.deepEqual(seoPolicy({}), { origin: null, indexable: false });
  assert.deepEqual(seoPolicy({ SITE_URL: "http://localhost:3002/" }), {
    origin: "http://localhost:3002",
    indexable: false,
  });
  assert.deepEqual(
    seoPolicy({
      SITE_URL: "https://contractor.example.com/",
      SITE_INDEXING: "true",
    }),
    { origin: "https://contractor.example.com", indexable: true },
  );
  assert.equal(
    seoPolicy({
      SITE_URL: "https://preview.example.com",
      SITE_INDEXING: "false",
    }).indexable,
    false,
  );
});

test("invalid origins and accidental indexing of local deployments fail generation", () => {
  for (const origin of [
    "",
    "http://example.com",
    "https://localhost",
    "https://localhost.",
    "https://bad..example.com",
    "https://bad_host.example.com",
    "https://studio.local",
    "https://127.0.0.1",
    "https://192.168.1.2",
    "https://[::1]",
    "https://host",
    "https://example.com:3000",
  ]) {
    assert.throws(() => seoPolicy({ SITE_URL: origin, SITE_INDEXING: "true" }));
  }
  for (const origin of [
    "not a url",
    "ftp://example.com",
    "https://u:p@example.com",
    "https://example.com/path",
    "https://example.com?ref=x",
    "https://example.com/#x",
  ]) {
    assert.throws(() => seoPolicy({ SITE_URL: origin }));
  }
  assert.throws(() => seoPolicy({ SITE_INDEXING: "yes" }), /true or false/);
});
