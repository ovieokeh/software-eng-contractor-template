import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  extractPricing,
  readPricingSheet,
  numberAt,
} from "./pricing-workbook.mjs";

const source = await readFile(
  new URL("../config/pricing.example.xlsx", import.meta.url),
);
const fresh = () => readPricingSheet(source);
const addressFor = (cells, label) =>
  [...cells]
    .find(([key, cell]) => /^A\d+$/.test(key) && cell.value === label)[0]
    .replace(/^A/, "B");
const set = (cells, label, value) =>
  cells.set(addressFor(cells, label), { value: String(value), type: "n" });

test("example workbook exports only advertised prices and allowances", () => {
  const cells = fresh();
  assert.deepEqual(extractPricing(cells), {
    monthlyRetainer: 2000,
    reservedHours: 20,
    additionalHourlyRate: 125,
    callMinutes: 20,
  });
  set(cells, "Monthly retainer", 2500);
  assert.equal(extractPricing(cells).monthlyRetainer, 2500);
  cells.set(addressFor(cells, "Monthly retainer"), {
    formula: `${addressFor(cells, "Reserved hours")}*150`,
    value: "9999",
  });
  assert.equal(extractPricing(cells).monthlyRetainer, 3000);
});

test("rejects missing or duplicated labels, invalid capacity and negative or imprecise prices", () => {
  const cells = fresh();
  cells.set("A999", { value: "Intro call duration", type: "s" });
  assert.throws(() => extractPricing(cells), /exactly one/);
  cells.delete("A999");
  for (const value of [0, 20.5, -1]) {
    set(cells, "Reserved hours", value);
    assert.throws(() => extractPricing(cells), /Invalid count/);
  }
  set(cells, "Reserved hours", 20);
  set(cells, "Monthly retainer", -1);
  assert.throws(() => extractPricing(cells), /Invalid money/);
  set(cells, "Monthly retainer", 100.001);
  assert.throws(() => extractPricing(cells), /two decimal/);
  set(cells, "Monthly retainer", 100);
  cells.delete(
    [...cells].find(([, c]) => c.value === "Intro call duration")[0],
  );
  assert.throws(() => extractPricing(cells), /exactly one/);
});

test("fails rather than trusting unsupported, circular, empty or erroneous formulas", () => {
  for (const [cell, pattern] of [
    [{ formula: "SUM(B1:B3)", value: "2000" }, /Unsupported/],
    [{ formula: "A1", value: "2000" }, /Circular/],
    [{ formula: "10/0" }, /Non-finite/],
    [{ formula: "(1+2" }, /Invalid formula/],
    [{ value: "" }, /numeric/],
    [{ value: "#REF!", type: "e" }, /numeric/],
    [{ value: "2000", type: "s" }, /numeric/],
  ])
    assert.throws(() => numberAt(new Map([["A1", cell]]), "A1"), pattern);
  assert.equal(numberAt(new Map([["A1", { formula: "2*(3+4)-1" }]]), "A1"), 13);
});

test("CLI drift check rejects stale JSON and generation repairs the snapshot", async () => {
  const dir = await mkdtemp(join(tmpdir(), "studio-pricing-test-"));
  const output = join(dir, "pricing.json");
  const script = new URL("./generate-pricing.mjs", import.meta.url);
  const run = (...args) =>
    spawnSync(
      process.execPath,
      [fileURLToPath(script), "--output", output, ...args],
      { encoding: "utf8", env: { ...process.env, TEMPLATE_DEFAULTS: "1" } },
    );
  try {
    await writeFile(output, "{}\n");
    const stale = run("--check");
    assert.equal(stale.status, 1);
    assert.match(stale.stderr, /out of sync/);
    assert.equal(run().status, 0);
    assert.equal(run("--check").status, 0);
    assert.equal(JSON.parse(await readFile(output, "utf8")).callMinutes, 20);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
