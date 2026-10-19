"use client";

import { site } from "@/lib/site";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";
import { normaliseWebsite } from "@/lib/contact-validation";
import {
  enquiryOptions,
  isInterest,
  type EnquirySource,
  type Interest,
} from "@/lib/content";
import { phoneCountries } from "@/lib/phone-countries";
export function Enquiry({
  interest,
  onInterestChange,
  source,
  open,
  onClose,
}: {
  interest: Interest;
  onInterestChange: (interest: Interest) => void;
  source: EnquirySource;
  open: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const phoneInput = useRef<HTMLInputElement>(null);
  const websiteInput = useRef<HTMLInputElement>(null);
  const [phoneCountry, setPhoneCountry] = useState(site.phoneCountry);
  const [phoneError, setPhoneError] = useState("");
  const [websiteError, setWebsiteError] = useState("");
  const selectedCountry = phoneCountries.find(
    ([code]) => code === phoneCountry,
  );
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  useEffect(() => {
    if (!open) return;

    const previousRootOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousRootOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [open]);
  // Ref callback synchronises the native dialog, preserving its focus trap and Escape handling.
  function syncDialog(node: HTMLDialogElement | null) {
    dialog.current = node;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }
  function handleClose() {
    setStatus("idle");
    setPhoneError("");
    setWebsiteError("");
    onClose();
  }
  async function checkPhone(value: string, country = phoneCountry) {
    if (!value.trim()) {
      setPhoneError("");
      return "";
    }
    const { normalisePhone } = await import("@/lib/phone-validation");
    const phone = normalisePhone(value, country);
    const error = phone
      ? ""
      : "Enter a valid phone number for the selected country.";
    setPhoneError(error);
    return phone;
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const website = normaliseWebsite(String(values.projectWebsite || ""));
    if (website === null) {
      setWebsiteError("Enter a valid website address, such as example.com.");
      websiteInput.current?.focus();
      return;
    }
    setWebsiteError("");
    const phone = await checkPhone(String(values.phone || ""));
    if (phone === null) {
      phoneInput.current?.focus();
      return;
    }
    values.phone = phone;
    values.projectWebsite = website;
    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, interest }),
      });
      if (!response.ok) throw new Error("Delivery failed");
      setStatus("sent");
      track({
        name: "enquiry_submitted",
        properties: { interest, source },
      });
    } catch {
      setStatus("error");
      track({
        name: "enquiry_failed",
        properties: { interest, source },
      });
    }
  }
  return (
    <dialog
      ref={syncDialog}
      onCancel={onClose}
      onClose={handleClose}
      aria-labelledby="enquiry-title"
      className="enquiry-dialog"
    >
      <button
        type="button"
        className="close-button"
        aria-label="Close enquiry"
        onClick={onClose}
      >
        ×
      </button>
      {status === "sent" ? (
        <div className="py-10">
          <p className="eyebrow">Message sent</p>
          <h2 id="enquiry-title">Thanks for the context.</h2>
          <p className="mt-5 muted">I’ll reply by email with a next step.</p>
          <button className="primary-button mt-8" onClick={onClose}>
            Back to the site
          </button>
        </div>
      ) : (
        <>
          <h2 id="enquiry-title">
            Let’s talk about
            <br />
            your project.
          </h2>
          <p className="mt-5 muted">
            Send me a bit of context. I’ll reply by email with a next step.
          </p>
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <label>
              What do you need help with?
              <select
                name="interest"
                value={interest}
                onChange={(event) => {
                  if (isInterest(event.target.value))
                    onInterestChange(event.target.value);
                }}
              >
                {enquiryOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Your name
              <input
                name="name"
                autoComplete="name"
                required
                maxLength={100}
                placeholder="Alex"
              />
            </label>
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="alex@company.com"
              />
            </label>
            <label>
              What are you working on?
              <textarea
                name="message"
                required
                minLength={10}
                maxLength={4000}
                rows={3}
                placeholder="What needs to change? Include any existing product, technical constraints or target dates."
              />
            </label>
            <div className="form-field">
              <label htmlFor="enquiry-phone">Phone number (optional)</label>
              <div className="phone-control">
                <div className="country-picker">
                  <span className="country-picker-display" aria-hidden="true">
                    {phoneCountry} +{selectedCountry?.[2]}
                  </span>
                  <select
                    name="phoneCountry"
                    aria-label="Phone country code"
                    title={selectedCountry?.[1]}
                    value={phoneCountry}
                    onChange={(event) => {
                      setPhoneCountry(event.target.value);
                      setPhoneError("");
                    }}
                  >
                    {phoneCountries.map(([code, name, dial]) => (
                      <option key={code} value={code}>
                        {code} +{dial} · {name}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  ref={phoneInput}
                  id="enquiry-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel-national"
                  inputMode="tel"
                  maxLength={40}
                  placeholder="Your phone number"
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? "phone-error" : undefined}
                  onChange={() => setPhoneError("")}
                  onBlur={(event) => void checkPhone(event.target.value)}
                />
              </div>
              {phoneError && (
                <p id="phone-error" className="field-error">
                  {phoneError}
                </p>
              )}
            </div>
            <label>
              Website (optional)
              <input
                ref={websiteInput}
                name="projectWebsite"
                type="text"
                inputMode="url"
                autoComplete="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={2048}
                placeholder="example.com"
                aria-invalid={!!websiteError}
                aria-describedby={websiteError ? "website-error" : undefined}
                onChange={() => setWebsiteError("")}
                onBlur={(event) =>
                  setWebsiteError(
                    normaliseWebsite(event.target.value) === null
                      ? "Enter a valid website address, such as example.com."
                      : "",
                  )
                }
              />
              {websiteError && (
                <p id="website-error" className="field-error">
                  {websiteError}
                </p>
              )}
            </label>
            <div className="honeypot" aria-hidden="true">
              <label>
                Fax
                <input name="fax" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <p className="text-sm muted">
              We’ll use these details to respond to your enquiry. No mailing
              list. Read our{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Privacy policy (opens in a new tab)"
              >
                privacy policy
              </a>
              .
            </p>
            <div role="status" aria-live="polite">
              {status === "error" && (
                <p className="form-error">
                  Your message couldn’t be sent. Please try again, or email{" "}
                  <a href={`mailto:${site.brand.email}`}>{site.brand.email}</a>.
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={status === "sending"}
              className="primary-button"
            >
              {status === "sending" ? "Sending…" : "Send your enquiry"}
            </button>
          </form>
        </>
      )}
    </dialog>
  );
}
