import { site } from "./site";

export const services = site.services;
export type Interest = string;
export type EnquirySource = "hero" | "work" | "close";
export const enquiryOptions = [
  ...services
    .map(({ id, title, enquiryLabel }) => ({
      id,
      label: enquiryLabel || title,
    }))
    .filter(
      (option, index, options) =>
        options.findIndex(({ label }) => label === option.label) === index,
    ),
  { id: "other", label: "Something else" },
];
export function isInterest(value: unknown): value is Interest {
  return (
    typeof value === "string" &&
    (value === "other" || services.some(({ id }) => id === value))
  );
}
export function interestLabel(interest: Interest) {
  const service = services.find(({ id }) => id === interest);
  return service ? service.enquiryLabel || service.title : "Something else";
}

// Several service cards can lead to one broader contact choice.
export function enquiryInterest(interest: Interest): Interest {
  return (
    enquiryOptions.find(({ label }) => label === interestLabel(interest))?.id ??
    "other"
  );
}
