import { isSupportedCountry } from "libphonenumber-js";

// Reject unknown fields so secrets accidentally added to this file cannot
// silently become part of the public client bundle.
const shape = {
  brand: {
    name: "",
    wordmarkLead: "",
    wordmarkRest: "",
    personName: "",
    personShortName: "",
    email: "",
    registration: "",
  },
  locale: "",
  currency: "",
  phoneCountry: "",
  hero: { heading: "", emphasis: "", introduction: "" },
  services: [{ id: "", title: "", short: "" }],
  pricingNote: "",
  availability: "",
  experience: {
    introduction: "",
    credit: "",
    items: [{ organisation: "", url: "", environment: "", summary: "" }],
  },
  booking: { url: "", question: "" },
  analytics: { apiUrl: "", hostname: "" },
  privacy: {
    updated: "",
    introduction: "",
    sections: [
      { heading: "", paragraphs: [""], links: [{ label: "", url: "" }] },
    ],
  },
};

function check(value, schema, path) {
  if (typeof schema === "string") {
    if (typeof value !== "string") throw new Error(`${path} must be text`);
    return;
  }
  if (Array.isArray(schema)) {
    if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
    value.forEach((item, index) => check(item, schema[0], `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${path} must be an object`);
  if (Object.keys(value).some((key) => !Object.hasOwn(schema, key)))
    throw new Error(
      `Unexpected field in ${path}; site configuration is public-facing data only`,
    );
  for (const [key, child] of Object.entries(schema))
    check(value[key], child, `${path}.${key}`);
}

function https(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be an HTTPS URL`);
  }
  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error(`${label} must be an HTTPS URL without credentials`);
}

export function validateSiteConfig(value) {
  check(value, shape, "site");
  for (const key of ["name", "wordmarkLead", "personName", "personShortName"])
    if (!value.brand[key].trim()) throw new Error(`brand.${key} is required`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.brand.email))
    throw new Error("brand.email must be an email address");
  https(value.booking.url, "booking.url");
  if (!Intl.supportedValuesOf("currency").includes(value.currency))
    throw new Error("currency must be a supported ISO currency code");
  if (
    !value.locale ||
    !Intl.NumberFormat.supportedLocalesOf(value.locale).length
  )
    throw new Error("locale must be a supported language tag");
  if (!isSupportedCountry(value.phoneCountry))
    throw new Error("phoneCountry must be a supported two-letter country code");
  const ids = new Set(["other"]);
  if (!value.services.length)
    throw new Error("At least one service is required");
  for (const service of value.services) {
    if (!/^[a-z][a-z0-9_-]*$/.test(service.id) || ids.has(service.id))
      throw new Error("Service IDs must be unique slugs; other is reserved");
    if (!service.title.trim() || !service.short.trim())
      throw new Error("Service title and short description are required");
    ids.add(service.id);
  }
  for (const item of value.experience.items) https(item.url, "experience.url");
  for (const section of value.privacy.sections)
    for (const link of section.links) https(link.url, "privacy link");
  if (Boolean(value.analytics.apiUrl) !== Boolean(value.analytics.hostname))
    throw new Error(
      "Set both analytics.apiUrl and analytics.hostname, or leave both empty",
    );
  if (value.analytics.apiUrl) {
    https(value.analytics.apiUrl, "analytics.apiUrl");
    if (!/^[a-z0-9.-]+$/i.test(value.analytics.hostname))
      throw new Error("analytics.hostname must be a hostname");
  }
  return value;
}
