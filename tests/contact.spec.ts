import { test, expect } from "@playwright/test";
import { POST } from "../app/api/contact/route";
import { site } from "../lib/site";
import { enquiryOptions } from "../lib/content";

test("email delivery uses configured interests, server-only recipient and honest failures", async () => {
  const keys = [
    "SITE_URL",
    "RESEND_API_KEY",
    "CONTACT_FROM",
    "CONTACT_TO",
  ] as const;
  const previous = keys.map((key) => process.env[key]);
  const originalFetch = globalThis.fetch;
  const emails: {
    subject: string;
    text: string;
    to: string[];
    reply_to: string;
  }[] = [];
  Object.assign(process.env, {
    SITE_URL: "https://example.com",
    RESEND_API_KEY: "test-key",
    CONTACT_FROM: "test@example.com",
    CONTACT_TO: "recipient@example.com",
  });
  globalThis.fetch = async (url, init) => {
    expect(String(url)).toBe("https://api.resend.com/emails");
    emails.push(JSON.parse(String(init?.body)));
    return new Response('{"id":"test"}', { status: 200 });
  };
  const send = (interest: string) =>
    POST(
      new Request("https://example.com/api/contact", {
        method: "POST",
        headers: {
          origin: "https://example.com",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Test Visitor",
          email: "visitor@example.com",
          message: "Help with a software project.",
          interest,
        }),
      }),
    );
  try {
    for (const option of enquiryOptions) {
      expect((await send(option.id)).status).toBe(200);
      expect(emails.at(-1)?.subject).toBe(
        `${site.brand.name} enquiry: ${option.label}`,
      );
      expect(emails.at(-1)?.to).toEqual(["recipient@example.com"]);
      expect(emails.at(-1)?.reply_to).toBe("visitor@example.com");
      expect(emails.at(-1)?.text).toContain(`Interest: ${option.label}`);
    }
    const sent = emails.length;
    expect((await send("unknown-interest")).status).toBe(400);
    expect(emails).toHaveLength(sent);
    globalThis.fetch = async () =>
      new Response("Provider unavailable", { status: 503 });
    expect((await send("other")).status).toBe(502);
    delete process.env.RESEND_API_KEY;
    expect((await send("other")).status).toBe(503);
  } finally {
    globalThis.fetch = originalFetch;
    keys.forEach((key, i) => {
      if (previous[i] === undefined) delete process.env[key];
      else process.env[key] = previous[i];
    });
  }
});
