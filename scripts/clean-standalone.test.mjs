import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  access,
  rm,
  symlink,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { cleanStandalone } from "./clean-standalone.mjs";

test("standalone cleanup removes nested dotenv files without following directory symlinks", async () => {
  const root = await mkdtemp(join(tmpdir(), "studio-build-"));
  try {
    const output = join(root, "output");
    const outside = join(root, "outside");
    await mkdir(join(output, "nested"), { recursive: true });
    await mkdir(outside);
    await writeFile(join(output, ".env"), "TOKEN=sentinel");
    await writeFile(join(output, "nested/.env.local"), "TOKEN=sentinel");
    await writeFile(join(output, "server.js"), "// Keep the server");
    await writeFile(join(outside, ".env"), "TOKEN=untouched");
    await symlink(outside, join(output, "linked"), "dir");
    await cleanStandalone(output);
    await assert.rejects(access(join(output, ".env")));
    await assert.rejects(access(join(output, "nested/.env.local")));
    assert.equal(
      await readFile(join(output, "server.js"), "utf8"),
      "// Keep the server",
    );
    assert.equal(
      await readFile(join(outside, ".env"), "utf8"),
      "TOKEN=untouched",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
