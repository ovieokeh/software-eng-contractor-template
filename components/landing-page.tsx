"use client";

import { site } from "@/lib/site";

import { pricing, money } from "@/lib/pricing";
import { services } from "@/lib/content";
import { useEnquiry } from "./use-enquiry";
import { Enquiry } from "./enquiry";
import { BookingLink } from "./booking-link";
import { ExperienceHighlights } from "./experience-highlights";
import { ArrowUpRight } from "./arrow-up-right";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { TimelineMarker } from "./timeline-marker";

export function LandingPage() {
  const { contact, props: enquiryProps } = useEnquiry();

  return (
    <>
      <SiteHeader
        links={[
          { href: "#retainer", label: "Pricing" },
          { href: "#how-it-works", label: "How it works" },
        ]}
      />
      <main id="main" className="site-page contractor-page">
        <section
          className="site-hero contractor-hero"
          aria-labelledby="contractor-heading"
        >
          <div>
            <h1 id="contractor-heading">
              {site.hero.heading}
              <span className="muted-heading">{site.hero.emphasis}</span>
            </h1>
            <p className="site-intro">{site.hero.introduction}</p>
            <BookingLink placement="hero" />
          </div>
          <aside
            id="retainer"
            className="contractor-retainer"
            aria-label="Monthly retainer"
          >
            <p className="contractor-price">
              {money(pricing.monthlyRetainer)}
              <span>/ month</span>
            </p>
            <p className="contractor-hours">
              {pricing.reservedHours} hours reserved for your work.
            </p>
            <ul className="contractor-inclusions">
              <li>Planning, onboarding, meetings and delivery included</li>
              <li>Weekly progress update + hours log</li>
              <li>
                Additional hours at{" "}
                <strong>{money(pricing.additionalHourlyRate)}/hour</strong>,
                with your approval
              </li>
            </ul>
            <p className="contractor-price-note">{site.pricingNote}</p>
          </aside>
        </section>

        <section
          className="site-section contractor-work"
          aria-labelledby="contractor-work-heading"
        >
          <div className="site-section-lead">
            <h2 id="contractor-work-heading">What needs doing?</h2>
          </div>
          <ul className="contractor-work-grid">
            {services.map((service) => (
              <li key={service.id}>
                <h3>
                  <BookingLink
                    placement="work"
                    interest={service.id}
                    className="contractor-work-link"
                  >
                    {service.title}
                  </BookingLink>
                </h3>
                <p>{service.short}</p>
              </li>
            ))}
          </ul>
          <BookingLink placement="work" interest="other">
            Got a different problem?
          </BookingLink>
        </section>

        <section
          id="how-it-works"
          className="site-section site-process contractor-process"
          aria-labelledby="contractor-process-heading"
        >
          <div className="site-section-lead">
            <h2 id="contractor-process-heading">Working with your team</h2>
          </div>
          <ol className="engagement-steps">
            <li>
              <TimelineMarker icon="phone" />
              <h3>Understand the work.</h3>
              <p>
                We agree the priorities, what done looks like and an estimate
                before starting.
              </p>
            </li>
            <li>
              <TimelineMarker icon="lock" />
              <h3>Fit into your team.</h3>
              <p>
                I work in your tools and follow your review process and release
                cadence. You keep control of access and approvals.
              </p>
            </li>
            <li>
              <TimelineMarker icon="check" />
              <h3>Deliver. Keep you in the loop.</h3>
              <p>
                Reviewable pull requests, relevant tests and clear handover
                notes. Your team approves the release.
              </p>
            </li>
          </ol>
          <div className="site-working-details contractor-working-details">
            <details>
              <summary>Availability and communication</summary>
              <p>{site.availability}</p>
            </details>
          </div>
        </section>

        <ExperienceHighlights />

        <section
          className="site-section contractor-close"
          aria-labelledby="contractor-close-heading"
        >
          <h2 id="contractor-close-heading">What’s on your backlog?</h2>
          <p className="site-intro">
            Bring the rough brief. We’ll work out where I can help.
          </p>
          <div className="site-actions">
            <BookingLink placement="close" />
            <button
              className="site-text-button"
              onClick={() => contact("other", "close")}
            >
              Prefer email? Send an enquiry <ArrowUpRight />
            </button>
          </div>
        </section>
      </main>
      <SiteFooter />
      <Enquiry {...enquiryProps} />
    </>
  );
}
