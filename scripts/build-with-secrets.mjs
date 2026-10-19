import { readFile, access, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

async function optionalFile(path) {
  try {
    await access(path);
    return path;
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

// Some hosts pass every build variable as a file secret, including public
// settings. Read only these explicit names; never print secret contents.
export async function withBuildSecrets(
  run,
  { directory = "/run/secrets", env = process.env } = {},
) {
  const buildEnv = { ...env };
  for (const name of [
    "SITE_URL",
    "SITE_INDEXING",
    "OPEN_PANEL_CLIENT_ID",
    "REQUIRE_PRIVATE_CONFIG",
  ]) {
    const path = await optionalFile(join(directory, name));
    if (path) buildEnv[name] = (await readFile(path, "utf8")).trim();
  }
  if (
    ![undefined, "", "true", "false"].includes(buildEnv.REQUIRE_PRIVATE_CONFIG)
  )
    throw new Error("REQUIRE_PRIVATE_CONFIG must be true or false");
  const site = await optionalFile(join(directory, "site_config"));
  const workbook = await optionalFile(join(directory, "pricing_workbook"));
  const encoded = await optionalFile(
    join(directory, "pricing_workbook_base64"),
  );
  if (workbook && encoded)
    throw new Error("Supply only one pricing workbook secret");
  if (
    buildEnv.REQUIRE_PRIVATE_CONFIG === "true" &&
    (!site || !(workbook || encoded) || buildEnv.TEMPLATE_DEFAULTS === "1")
  )
    throw new Error(
      "Private site and pricing secrets are required for this deployment",
    );
  const temporary = await mkdtemp(join(tmpdir(), "contractor-build-"));
  try {
    if (site) buildEnv.SITE_CONFIG_PATH = site;
    if (workbook) buildEnv.PRICING_WORKBOOK_PATH = workbook;
    if (encoded) {
      const input = (await readFile(encoded, "utf8")).replace(/\s/g, "");
      const bytes = Buffer.from(input, "base64");
      if (!input || bytes.toString("base64") !== input)
        throw new Error("Pricing workbook secret must be valid base64");
      const path = join(temporary, "pricing.xlsx");
      await writeFile(path, bytes, { mode: 0o600 });
      buildEnv.PRICING_WORKBOOK_PATH = path;
    }
    return await run(buildEnv);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    process.exitCode = await withBuildSecrets((env) => {
      const result = spawnSync("npm", ["run", "build"], {
        env,
        stdio: "inherit",
      });
      if (result.error || result.status === null)
        throw new Error("Build process could not complete");
      return result.status;
    });
  } catch (error) {
    console.error(`Build configuration failed: ${error.message}`);
    process.exitCode = 1;
  }
}
