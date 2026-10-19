import { site } from "./site";

export const services = site.services;
export type Interest = string;
export type EnquirySource = "hero" | "work" | "close";
export const enquiryOptions = [
  ...services.map(({ id, title }) => ({ id, label: title })),
  { id: "other", label: "Something else" },
];
export function isInterest(value: unknown): value is Interest {
  return (
    typeof value === "string" && enquiryOptions.some(({ id }) => id === value)
  );
}
export function interestLabel(interest: Interest) {
  return (
    enquiryOptions.find(({ id }) => id === interest)?.label ?? "Something else"
  );
}
