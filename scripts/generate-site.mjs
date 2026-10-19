import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfigEnv } from "./config-env.mjs";
import { validateSiteConfig } from "./site-config.mjs";
import { seoPolicy } from "./seo-policy.mjs";

const root = new URL("../", import.meta.url);
await loadConfigEnv(root);
try {
  const deployment = seoPolicy(process.env);
  const source =
    process.env.TEMPLATE_DEFAULTS === "1"
      ? "config/site.example.json"
      : process.env.SITE_CONFIG_PATH || "config/site.example.json";
  const site = validateSiteConfig(
    JSON.parse(await readFile(resolve(fileURLToPath(root), source), "utf8")),
  );
  await writeFile(
    new URL("lib/seo.generated.json", root),
    JSON.stringify(deployment, null, 2) + "\n",
  );
  await writeFile(
    new URL("lib/site.generated.json", root),
    JSON.stringify(site, null, 2) + "\n",
  );
  const initial = site.brand.wordmarkLead.slice(0, 1).replace(/[<>&"']/g, "");
  await writeFile(
    new URL("app/icon.svg", root),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#191919"/><text x="32" y="44" font-family="Arial,sans-serif" font-size="36" font-weight="700" fill="#fff" text-anchor="middle">${initial}</text></svg>\n`,
  );
  console.log("Generated public-facing site configuration.");
} catch (error) {
  console.error(`Site configuration failed: ${error.message}`);
  process.exitCode = 1;
}
