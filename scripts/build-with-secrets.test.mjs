import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, access, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { withBuildSecrets } from "./build-with-secrets.mjs";

test("hosted secrets override build defaults and decoded pricing is removed on success or failure", async () => {
  const directory = await mkdtemp(join(tmpdir(), "build-secrets-test-"));
  try {
    const workbook = await readFile(
      new URL("../config/pricing.example.xlsx", import.meta.url),
    );
    for (const [name, value] of Object.entries({
      SITE_URL: "https://example.com",
      SITE_INDEXING: "true",
      OPEN_PANEL_CLIENT_ID: "public-id",
      REQUIRE_PRIVATE_CONFIG: "true",
      site_config: "{}",
      pricing_workbook_base64: workbook.toString("base64"),
    }))
      await writeFile(join(directory, name), value);
    for (const fail of [false, true]) {
      let decoded;
      const operation = withBuildSecrets(
        async (env) => {
          assert.equal(env.SITE_URL, "https://example.com");
          assert.equal(env.SITE_INDEXING, "true");
          assert.equal(env.OPEN_PANEL_CLIENT_ID, "public-id");
          assert.equal(env.SITE_CONFIG_PATH, join(directory, "site_config"));
          decoded = env.PRICING_WORKBOOK_PATH;
          assert.deepEqual(await readFile(decoded), workbook);
          if (fail) throw new Error("simulated build failure");
          return 0;
        },
        { directory, env: { SITE_URL: "", SITE_INDEXING: "false" } },
      );
      if (fail) await assert.rejects(operation, /simulated build failure/);
      else assert.equal(await operation, 0);
      await assert.rejects(access(decoded), { code: "ENOENT" });
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("missing required inputs, conflicting files and malformed base64 fail before building", async () => {
  const directory = await mkdtemp(join(tmpdir(), "build-secrets-test-"));
  const run = () => {
    throw new Error("must not build");
  };
  try {
    await assert.rejects(
      withBuildSecrets(run, {
        directory,
        env: { REQUIRE_PRIVATE_CONFIG: "true" },
      }),
      /Private site and pricing secrets/,
    );
    await writeFile(join(directory, "pricing_workbook_base64"), "invalid!");
    await assert.rejects(
      withBuildSecrets(run, { directory, env: {} }),
      /valid base64/,
    );
    await writeFile(join(directory, "pricing_workbook"), "binary workbook");
    await assert.rejects(
      withBuildSecrets(run, { directory, env: {} }),
      /only one pricing/,
    );
    await rm(join(directory, "pricing_workbook_base64"));
    await writeFile(join(directory, "site_config"), "{}");
    await assert.rejects(
      withBuildSecrets(run, {
        directory,
        env: { REQUIRE_PRIVATE_CONFIG: "true", TEMPLATE_DEFAULTS: "1" },
      }),
      /Private site and pricing secrets/,
    );
    await withBuildSecrets(
      (env) =>
        assert.equal(
          env.PRICING_WORKBOOK_PATH,
          join(directory, "pricing_workbook"),
        ),
      { directory, env: {} },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
