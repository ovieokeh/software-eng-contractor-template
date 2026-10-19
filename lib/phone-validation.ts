import {
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";

export function normalisePhone(input: string, country: string): string | null {
  const value = input.trim();
  if (!value) return "";
  if (value.length > 40 || !isSupportedCountry(country)) return null;

  const parsed = parsePhoneNumberFromString(value, {
    defaultCountry: country as CountryCode,
    extract: false,
  });
  return parsed?.isValid() ? parsed.number : null;
}
