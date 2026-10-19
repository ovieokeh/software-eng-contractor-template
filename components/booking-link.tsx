"use client";

import type { EnquirySource, Interest } from "@/lib/content";
import { bookingUrl } from "@/lib/booking";
import type { ReactNode } from "react";
import { track } from "@/lib/analytics";
import { pricing } from "@/lib/pricing";
import { ArrowUpRight } from "./arrow-up-right";

export function BookingLink({
  placement,
  interest,
  children,
  className = "site-text-button",
}: {
  interest?: Interest;
  placement: EnquirySource;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <a
      className={className}
      href={bookingUrl(interest)}
      onClick={() =>
        track({ name: "booking_clicked", properties: { placement } })
      }
    >
      {children ??
        `${placement === "hero" ? "Start with" : "Book"} a free ${pricing.callMinutes}-minute call`}
      <ArrowUpRight />
    </a>
  );
}
