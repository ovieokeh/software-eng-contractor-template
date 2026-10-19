"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";
import type { EnquirySource, Interest } from "@/lib/content";

export function useEnquiry() {
  const [open, setOpen] = useState(false);
  const [interest, setInterest] = useState<Interest>("other");
  const [source, setSource] = useState<EnquirySource>("close");
  function contact(interest: Interest, source: EnquirySource) {
    setInterest(interest);
    setSource(source);
    setOpen(true);
    track({ name: "enquiry_opened", properties: { interest, source } });
  }
  return {
    contact,
    props: {
      open,
      interest,
      source,
      onInterestChange: setInterest,
      onClose: () => setOpen(false),
    },
  };
}
