import { site } from "./site";
import { interestLabel, isInterest, type Interest } from "./content";

export function bookingUrl(interest?: Interest) {
  const { url, question } = site.booking;
  if (!question || interest === undefined || !isInterest(interest)) return url;
  const destination = new URL(url);
  // Optional provider-specific prefill: only configured choices, never form data.
  destination.searchParams.set(question, interestLabel(interest));
  return destination.href;
}
