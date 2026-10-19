export function normaliseWebsite(input: string): string | null {
  const value = input.trim();
  if (!value) return "";
  if (value.length > 2048 || /\s/.test(value)) return null;

  try {
    const url = new URL(
      /^https?:\/\//i.test(value) ? value : `https://${value}`,
    );
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      !url.hostname.includes(".") ||
      url.hostname.endsWith(".") ||
      url.hostname
        .split(".")
        .some((part) => !/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(part))
    ) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}
