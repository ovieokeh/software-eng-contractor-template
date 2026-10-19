import { site } from "@/lib/site";
import { interestLabel, isInterest } from "@/lib/content";
import { normaliseWebsite } from "@/lib/contact-validation";
import { normalisePhone } from "@/lib/phone-validation";
export const runtime = "nodejs";
// A bounded, process-local safety cap. Put a shared rate limit at the reverse proxy
// before scaling to multiple replicas. No personal data is retained here.
let windowStart = Date.now();
let attempts = 0;
export async function POST(request: Request) {
  const origin =
    process.env.SITE_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : null);
  if (!origin)
    return Response.json(
      { error: "Site origin is not configured" },
      { status: 503 },
    );
  if (request.headers.get("origin") !== new URL(origin).origin)
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: "Expected JSON" }, { status: 415 });
  let raw = "";
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Missing body");
    const decoder = new TextDecoder();
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 24000) {
        await reader.cancel();
        return Response.json({ error: "Request too large" }, { status: 413 });
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (data.fax) return Response.json({ ok: true });
  const {
    name,
    email,
    message,
    interest,
    phone,
    phoneCountry,
    projectWebsite,
  } = data;
  const validPhone =
    phone === undefined
      ? ""
      : typeof phone === "string" && typeof phoneCountry === "string"
        ? normalisePhone(phone, phoneCountry)
        : null;
  const validWebsite =
    projectWebsite === undefined
      ? ""
      : typeof projectWebsite === "string"
        ? normaliseWebsite(projectWebsite)
        : null;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.length > 100 ||
    /[\r\n]/.test(name) ||
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof message !== "string" ||
    message.trim().length < 10 ||
    message.length > 4000 ||
    validPhone === null ||
    validWebsite === null ||
    !isInterest(interest)
  ) {
    return Response.json(
      { error: "Please check your details" },
      { status: 400 },
    );
  }
  if (
    !process.env.RESEND_API_KEY ||
    !process.env.CONTACT_FROM ||
    !process.env.CONTACT_TO
  )
    return Response.json(
      { error: "Email delivery is not configured" },
      { status: 503 },
    );
  if (Date.now() - windowStart > 3600000) {
    windowStart = Date.now();
    attempts = 0;
  }
  if (attempts >= 20)
    return Response.json(
      { error: "Please email us directly" },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((3600000 - (Date.now() - windowStart)) / 1000),
          ),
        },
      },
    );
  attempts++;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(12000),
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM,
        to: [process.env.CONTACT_TO],
        reply_to: email,
        subject: `${site.brand.name} enquiry: ${interestLabel(interest)}`,
        text: [
          `Name: ${name.trim()}`,
          `Email: ${email}`,
          ...(validPhone ? [`Phone: ${validPhone}`] : []),
          ...(validWebsite ? [`Website: ${validWebsite}`] : []),
          `Interest: ${interestLabel(interest)}`,
          "",
          message.trim(),
        ].join("\n"),
      }),
    });
    if (!response.ok) throw new Error("Provider rejected delivery");
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: `Delivery failed. Please email ${site.brand.email}` },
      { status: 502 },
    );
  }
}
