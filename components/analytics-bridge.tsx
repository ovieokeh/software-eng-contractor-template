"use client";

import { site } from "@/lib/site";
import { OpenPanel } from "@openpanel/web";
import { useEffect } from "react";
import type { AnalyticsEvent } from "@/lib/analytics";

export function AnalyticsBridge({ clientId }: { clientId: string }) {
  useEffect(() => {
    if (
      !site.analytics.apiUrl ||
      window.location.hostname !== site.analytics.hostname
    )
      return;

    const op = new OpenPanel({
      clientId,
      apiUrl: site.analytics.apiUrl,
    });
    let referrer = "";
    try {
      referrer = new URL(document.referrer).origin;
    } catch {
      // Direct visits have no referrer.
    }
    op.setGlobalProperties({
      __referrer: referrer,
    });
    // Query strings and fragments may contain personal data.
    op.screenView(window.location.pathname);

    function forward(event: Event) {
      const { name, properties } = (event as CustomEvent<AnalyticsEvent>)
        .detail;
      void op.track(name, properties);
    }

    window.addEventListener("studio:analytics", forward);
    return () => window.removeEventListener("studio:analytics", forward);
  }, [clientId]);

  return null;
}
