import { isIP } from "node:net";

// Resolve once during generation so prerendered pages and crawl files agree.
export function seoPolicy(env) {
  const mode = env.SITE_INDEXING || "false";
  if (!["true", "false"].includes(mode))
    throw new Error("SITE_INDEXING must be true or false");
  const indexable = mode === "true";
  const raw = env.SITE_URL?.trim();
  if (!raw) {
    if (indexable)
      throw new Error("SITE_URL is required when SITE_INDEXING=true");
    return { origin: null, indexable: false };
  }
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("SITE_URL must be an absolute HTTP(S) origin");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "SITE_URL must be an HTTP(S) origin without credentials, path, query or fragment",
    );
  const host = url.hostname.toLowerCase();
  if (
    indexable &&
    (url.protocol !== "https:" ||
      url.port ||
      !host.includes(".") ||
      host.length > 253 ||
      !host
        .split(".")
        .every((label) =>
          /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label),
        ) ||
      isIP(host) ||
      host.includes(":") ||
      /(^|\.)(localhost|local|test|internal|invalid)$/.test(host))
  )
    throw new Error(
      "Indexing requires a public HTTPS hostname without a custom port",
    );
  return { origin: url.origin, indexable };
}
