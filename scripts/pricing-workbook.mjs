import { unzipSync, strFromU8 } from "fflate";
import { XMLParser } from "fast-xml-parser";
import { posix } from "node:path";

const array = (value) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];
const text = (value) =>
  typeof value === "object" && value !== null
    ? (value["#text"] ?? "")
    : (value ?? "");
const richText = (value) =>
  value?.t !== undefined
    ? String(text(value.t))
    : array(value?.r)
        .map((run) => text(run.t))
        .join("");

// Read only the explicitly named worksheet; formula caches are never used.
export function readPricingSheet(bytes) {
  const files = unzipSync(bytes);
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    parseTagValue: false,
    trimValues: false,
  });
  function xml(path) {
    if (!files[path]) throw new Error(`Missing workbook part: ${path}`);
    return parser.parse(strFromU8(files[path]));
  }
  const sheet = array(xml("xl/workbook.xml").workbook.sheets.sheet).find(
    (s) => s["@_name"] === "Pricing",
  );
  if (!sheet) throw new Error('Missing "Pricing" worksheet');
  const rel = array(
    xml("xl/_rels/workbook.xml.rels").Relationships.Relationship,
  ).find((r) => r["@_Id"] === sheet["@_id"]);
  if (!rel || rel["@_TargetMode"] === "External")
    throw new Error("Pricing worksheet must be inside the workbook");
  const target = rel["@_Target"];
  const path = target.startsWith("/")
    ? target.slice(1)
    : posix.normalize(`xl/${target}`);
  const shared = files["xl/sharedStrings.xml"]
    ? array(xml("xl/sharedStrings.xml").sst.si).map(richText)
    : [];
  const cells = new Map();
  for (const row of array(xml(path).worksheet.sheetData.row))
    for (const cell of array(row.c)) {
      const value =
        cell["@_t"] === "s"
          ? shared[Number(cell.v)]
          : cell["@_t"] === "inlineStr"
            ? richText(cell.is)
            : cell.v;
      cells.set(cell["@_r"], {
        value,
        formula: cell.f === undefined ? undefined : String(text(cell.f)),
        type: cell["@_t"],
      });
    }
  return cells;
}

// This workbook uses scalar arithmetic and same-sheet references. Reject richer
// Excel syntax rather than silently exporting stale cached formula results.
export function numberAt(cells, address, ancestors = new Set()) {
  if (ancestors.has(address))
    throw new Error(`Circular pricing formula at ${address}`);
  const cell = cells.get(address);
  if (!cell) throw new Error(`Missing pricing cell ${address}`);
  const path = new Set([...ancestors, address]);
  let value;
  if (cell.formula !== undefined) {
    const source = cell.formula.replace(/^=/, "").replace(/\s/g, "");
    const tokens =
      source.match(/\$?[A-Z]+\$?\d+|(?:\d+(?:\.\d*)?|\.\d+)|[()+*/-]/g) ?? [];
    if (tokens.join("") !== source)
      throw new Error(`Unsupported formula at ${address}: ${cell.formula}`);
    let i = 0;
    function atom() {
      const token = tokens[i++];
      if (token === "+") return atom();
      if (token === "-") return -atom();
      if (token === "(") {
        const result = sum();
        if (tokens[i++] !== ")")
          throw new Error(`Invalid formula at ${address}`);
        return result;
      }
      if (/^\$?[A-Z]+\$?\d+$/.test(token ?? ""))
        return numberAt(cells, token.replaceAll("$", ""), path);
      if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token ?? ""))
        throw new Error(`Invalid formula at ${address}`);
      return Number(token);
    }
    function product() {
      let value = atom();
      while (["*", "/"].includes(tokens[i])) {
        const op = tokens[i++];
        const rhs = atom();
        value = op === "*" ? value * rhs : value / rhs;
      }
      return value;
    }
    function sum() {
      let value = product();
      while (["+", "-"].includes(tokens[i])) {
        const op = tokens[i++];
        const rhs = product();
        value = op === "+" ? value + rhs : value - rhs;
      }
      return value;
    }
    value = sum();
    if (i !== tokens.length) throw new Error(`Invalid formula at ${address}`);
  } else {
    if (
      ![undefined, "n"].includes(cell.type) ||
      cell.value === undefined ||
      String(cell.value).trim() === ""
    )
      throw new Error(`Expected a numeric input at ${address}`);
    value = Number(cell.value);
  }
  if (!Number.isFinite(value))
    throw new Error(`Non-finite value at ${address}`);
  return value;
}

const fields = {
  monthlyRetainer: ["Monthly retainer", "money"],
  reservedHours: ["Reserved hours", "count"],
  additionalHourlyRate: ["Additional hourly rate", "money"],
  callMinutes: ["Intro call duration", "count"],
};

export function extractPricing(cells) {
  const result = {};
  for (const [key, [label, type]] of Object.entries(fields)) {
    const matches = [...cells].filter(
      ([address, cell]) => /^A\d+$/.test(address) && cell.value === label,
    );
    if (matches.length !== 1)
      throw new Error(
        `Expected exactly one Pricing row labelled "${label}"; found ${matches.length}`,
      );
    const address = matches[0][0].replace(/^A/, "B");
    const value = numberAt(cells, address);
    if (
      value < 0 ||
      (type === "count" && (!Number.isInteger(value) || value === 0))
    )
      throw new Error(`Invalid ${type} value for ${label}`);
    // Currency is expressed to cents; don't silently round a spreadsheet input.
    if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-7)
      throw new Error(`Use at most two decimal places for ${label}`);
    result[key] = Math.round(value * 100) / 100;
  }
  return result;
}
