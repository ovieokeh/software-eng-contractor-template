import type { EnquirySource, Interest } from "./content";

// Form values and contact details never enter this boundary.
export type AnalyticsEvent =
  | { name: "booking_clicked"; properties: { placement: EnquirySource } }
  | {
      name: "enquiry_opened" | "enquiry_submitted" | "enquiry_failed";
      properties: { interest: Interest; source: EnquirySource };
    };
export function track(event: AnalyticsEvent) {
  window.dispatchEvent(new CustomEvent("studio:analytics", { detail: event }));
}
