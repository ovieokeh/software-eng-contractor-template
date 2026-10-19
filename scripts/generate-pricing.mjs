import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfigEnv } from "./config-env.mjs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extractPricing, readPricingSheet } from "./pricing-workbook.mjs";

const root = new URL("../", import.meta.url);
await loadConfigEnv(root);
const source = resolve(
  fileURLToPath(root),
  process.env.TEMPLATE_DEFAULTS === "1"
    ? "config/pricing.example.xlsx"
    : process.env.PRICING_WORKBOOK_PATH || "config/pricing.example.xlsx",
);
const outputFlag = process.argv.indexOf("--output");
const output =
  outputFlag === -1
    ? new URL("lib/pricing.generated.json", root)
    : pathToFileURL(process.argv[outputFlag + 1]);
try {
  const pricing = extractPricing(readPricingSheet(await readFile(source)));
  const generated = JSON.stringify(pricing, null, 2) + "\n";
  if (process.argv.includes("--check")) {
    const current = await readFile(output, "utf8").catch(() => "");
    if (current !== generated)
      throw new Error(
        "Pricing is out of sync. Save the workbook and run npm run pricing:generate, then regenerate the public-facing data.",
      );
    console.log("Spreadsheet pricing is in sync.");
  } else {
    await writeFile(output, generated);
    console.log(`Updated ${fileURLToPath(output)}`);
  }
} catch (error) {
  console.error(`Pricing import failed: ${error.message}`);
  process.exitCode = 1;
}
