# Architecture

This is a single-offer contractor website with a monthly retainer as its example pricing model. It uses Next.js App Router with server-rendered content and client components for the theme, enquiry dialog and analytics.

## Code map

| Responsibility                             | Files                                                                            |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| Homepage metadata and structured data      | `app/page.tsx`                                                                   |
| Landing-page layout and copy               | `components/landing-page.tsx`                                                    |
| Shared header, footer and experience cards | `components/site-*.tsx`, `components/experience-highlights.tsx`                  |
| Public configuration schema and generation | `scripts/site-config.mjs`, `scripts/generate-site.mjs`, `lib/site.ts`            |
| Pricing workbook parsing and generation    | `scripts/pricing-workbook.mjs`, `scripts/generate-pricing.mjs`, `lib/pricing.ts` |
| Service choices and calendar links         | `lib/content.ts`, `lib/booking.ts`, `components/booking-link.tsx`                |
| Enquiry dialog and state                   | `components/enquiry.tsx`, `components/use-enquiry.ts`                            |
| Server-only email delivery                 | `app/api/contact/route.ts`                                                       |
| Analytics event boundary                   | `lib/analytics.ts`, `components/analytics-bridge.tsx`                            |
| Theme tokens and responsive styles         | `app/globals.css`                                                                |

## Configuration flow

`config/site.example.json` and `config/pricing.example.xlsx` are usable defaults. Environment variables can select private replacement files. Generation validates those inputs and writes ignored `lib/site.generated.json`, `lib/pricing.generated.json` and `app/icon.svg`. Application components consume the generated data through `lib/site.ts` and `lib/pricing.ts`.

Site configuration is a fixed schema of public content, with HTTPS links, unique service IDs and locale/currency/country validation. The entire site JSON is available to the browser. The workbook importer selects four recognised labels and evaluates supported numeric formulas; the source workbook is not an application asset. Generated files must be refreshed before building or typechecking, which the npm lifecycle scripts handle.

## Contact flow

Calendar CTAs are ordinary anchors. An optional question parameter carries a configured service label. The email fallback opens a native dialog with focus handling and scroll locking. Client validation provides feedback; the server independently validates every submitted field.

The API checks origin, content type, body size, a honeypot and configured service IDs before contacting Resend. Credentials and recipient addresses come from server environment variables. Delivery failure is reported rather than shown as success. The in-memory attempt cap is per process, not a distributed anti-abuse system.

## Analytics and deployment boundaries

The browser dispatches typed, fixed-choice events without form data. The optional OpenPanel bridge forwards them only in production on the configured hostname. Booking clicks indicate navigation, not completed meetings.

Standalone output is cleaned of dotenv files by the post-build script. Docker excludes local inputs and generated output, mounts private configuration as optional build secrets, and copies only the standalone application and static assets into the runtime image. Build secrets are not automatically cache-busting. Runtime credentials must be provided by the deployment environment.

`scripts/build-with-secrets.mjs` adapts file secrets to the generator inputs. It accepts a raw workbook or its base64 representation, never both, reads an explicit allowlist of public build settings, and removes the decoded temporary workbook even when the build fails. `REQUIRE_PRIVATE_CONFIG=true` rejects missing private inputs and forced example defaults. This allows text-only hosting dashboards without embedding private source files in Git or image layers.

## Search and social metadata

`lib/seo.ts` builds per-page metadata and the entity graph. Optional SEO configuration fields have defaults for older site files. `scripts/seo-policy.mjs` validates `SITE_INDEXING` and `SITE_URL`, then generation writes the normalised origin and indexing decision into ignored `lib/seo.generated.json`. Metadata, HTTP headers, robots.txt, the sitemap and JSON-LD consume that snapshot so runtime settings cannot disagree with prerendered pages. Rebuild to change the mode or origin.

`pageMetadata` returns a complete metadata object for each route to avoid Next.js's shallow merging retaining homepage descriptions on other pages. `app/social-image/route.tsx` uses a static route rather than a file-based metadata image convention so it cannot override a configured custom image URL. Its PNG is prerendered and cached, with a content hash in metadata URLs to refresh changed brand/title content (bump the card revision when changing its design); metadata links to the custom URL instead when present. No arbitrary remote images are fetched server-side.

Entity IDs use canonical-origin fragments. Service URLs resolve to visible cards. The logo and personal profiles are shared by the page and structured data; profiles belong to the person. No business location or additional commercial terms are inferred. `.github/workflows/checks.yml` verifies preview and production builds, including metadata, image responses and crawl controls in `tests/seo.spec.ts`.

## Extending the template

Add or rename services in configuration; cards, enquiry options and booking labels derive from the same list. An optional `enquiryLabel` groups several services into one email choice and calendar answer without changing their card titles. Distinct labels retain service order and the first matching service ID; all service IDs remain valid for submissions and analytics. Keep provider-side question options in sync. Change shared types and validation together when adding configuration fields. Different commercial models belong in the pricing schema and landing component, rather than a collection of unused route or audience flags.
