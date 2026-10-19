# Software Engineer Contractor Template

A website for independent software engineers: services, experience, monthly pricing, calendar booking and an email enquiry form. Built with Next.js, React and Tailwind, with light and dark themes and responsive layouts.

## Get started

Use Node.js 22 or newer.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open [localhost:3000](http://localhost:3000). The site runs with fictional example content. Calendar links point to a reserved example domain; email delivery and analytics are disabled until configured.

The routes are straightforward: `/` is the contractor landing page, `/privacy` is the privacy notice, and `/api/contact` handles email enquiries.

## Make it yours

Copy the examples into an ignored local directory:

```sh
mkdir -p private
cp config/site.example.json private/site.json
cp config/pricing.example.xlsx private/pricing.xlsx
```

Set these paths in `.env.local`:

```dotenv
SITE_CONFIG_PATH=private/site.json
PRICING_WORKBOOK_PATH=private/pricing.xlsx
```

Edit the JSON for your identity, headline, services, experience, availability, booking link and privacy notice. Set `locale`, `currency` and `phoneCountry` for your audience. Services populate both the landing-page cards and the enquiry choices; `other` is reserved for “Something else”. Edit the React components for larger copy or layout changes.

The example privacy notice and experience entries are explicitly placeholders. Replace them, the pricing note and the booking destination before publishing.

Run `npm run config:generate` after changing these files; rebuild for deployment. Development, builds, typechecks and tests run this generator automatically when they start. Missing or invalid configured files fail explicitly.

### Public content versus secrets

| Setting                                                             | Where it belongs                               | Visibility                                   |
| ------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| Identity, services, experience, calendar and public contact details | Site JSON                                      | Entire configuration is browser-visible      |
| Advertised prices and allowances                                    | Pricing workbook                               | Only the four recognised values are exported |
| Canonical website origin                                            | `SITE_URL`                                     | Public; set at build time and runtime        |
| Email delivery                                                      | `RESEND_API_KEY`, `CONTACT_FROM`, `CONTACT_TO` | Server environment only                      |
| Optional analytics client ID                                        | `OPEN_PANEL_CLIENT_ID`                         | Public; set at build time                    |

Private configuration keeps your deployment details out of the public repository. It does not hide content displayed on your website. Never put credentials or internal notes in the site JSON. Its schema rejects unknown fields, but you should still review what you publish.

Paths can be relative to the project or absolute. Generators read shell variables first, then `.env.local`, then `.env`. `TEMPLATE_DEFAULTS=1` forces example inputs and skips dotenv loading in the generators; it does not disable credentials elsewhere in the application. Keep private inputs backed up separately.

## Pricing

The example workbook has one `Pricing` sheet with four amber input cells:

| Label in column A      | Value in column B                          |
| ---------------------- | ------------------------------------------ |
| Monthly retainer       | Amount in your configured website currency |
| Reserved hours         | Positive whole hours per month             |
| Additional hourly rate | Amount in your configured website currency |
| Intro call duration    | Positive whole minutes                     |

Keep the labels unchanged. Row positions can change. Monetary amounts allow up to two decimal places. The importer supports numeric inputs and basic formulas using same-sheet cell references, parentheses and `+ - * /`; it recalculates them instead of trusting cached values. Unsupported formulas, duplicate labels and invalid values fail the build.

```sh
npm run pricing:generate
npm run pricing:check
```

Only the advertised values go into the application. Other workbook content is not bundled. Changing the currency setting changes formatting, not exchange rates.

## Booking and email

Set `booking.url` to your public calendar URL. All contact links lead there except “Prefer email? Send an enquiry”. Calendar navigation works without JavaScript.

`booking.question` is optional. Leave it empty for a plain link. For providers supporting URL prefills, such as Cal.com, set the exact question identifier and use service titles as the provider's option labels, plus “Something else”. Service links pass the corresponding label; general call links leave the answer unset. Verify this with your provider after configuration. The template does not store attendees or track confirmed bookings.

The email form uses Resend. Configure a verified sender in `CONTACT_FROM`, a destination in `CONTACT_TO`, `RESEND_API_KEY` and your origin in `SITE_URL`. Missing configuration produces an error with a direct email fallback. No real email is sent by the test suite.

## Search and social previews

Indexing is **off by default**, including for existing deployments upgrading to this version. Pages send `noindex, follow` in both HTML metadata and HTTP headers. Robots.txt allows page crawling so crawlers can read that instruction, and the sitemap is empty. Preview and demo deployments should retain `SITE_INDEXING=false`.

To enable indexing for your real website, set these before building:

```dotenv
SITE_URL=https://your-domain.com
SITE_INDEXING=true
```

The generator validates the origin and rejects credentials, paths, queries and fragments. Indexable builds require HTTPS with a domain name, not an IP address, local hostname or custom port. This validates configuration; it does not verify DNS or guarantee indexing. Canonicals, social URLs, entity IDs, sitemap and robots.txt use this one normalised origin. Indexing mode and metadata are baked into the build; changing runtime variables alone does not change them.

The optional `seo` object in the site JSON accepts:

| Field                | Default                                      |
| -------------------- | -------------------------------------------- |
| `title`              | Hero heading and emphasis                    |
| `description`        | Hero introduction                            |
| `privacyTitle`       | Privacy policy                               |
| `privacyDescription` | A short privacy description using your brand |
| `imageUrl`           | Generated `/social-image` PNG                |
| `imageAlt`           | Your brand and homepage title                |

The metadata helper adds your brand as a title suffix. Blank text fields use the defaults. Existing files can omit the entire `seo` object. Homepage and privacy metadata each include matching OpenGraph and Twitter/X titles, descriptions and canonical URLs.

The generated image is a 1200×630 card using the brand and homepage title, rendered once during the production build and cached. The response permits one hour of browser caching and one day of shared-cache storage; a content hash in the generated image URL changes when the brand or title changes. It contains no prices. Very long text is shortened on the image. Set `imageUrl` to an absolute HTTPS image URL and provide `imageAlt` to override it for both networks. Custom images must be publicly accessible to sharing bots; they are linked directly, never fetched by the application server. Use a new image URL when replacing a custom image to help social platforms refresh their caches. The generated card uses Next.js's bundled font; use a custom image if you need a specific typeface or unsupported script.

Optional `brand.logoUrl` and `brand.profiles` support a public HTTPS logo and personal profile links, for example `[{"label":"GitHub","url":"https://github.com/your-handle"}]`. The logo appears beside the wordmark, and profile links appear in the footer. Structured data connects the person, business, website and visible services using stable IDs. Profile URLs describe the person, not company profiles. No ratings, credentials or results are invented.

After deployment, inspect the domain in Google Search Console or Bing Webmaster Tools and submit `/sitemap.xml`. Check an actual shared link as social platforms cache previews independently. `llms.txt` is not included.

## Analytics

Analytics are optional. Set `analytics.apiUrl`, `analytics.hostname` and `OPEN_PANEL_CLIENT_ID` to enable OpenPanel in production on that exact hostname. Booking clicks and enquiry outcomes contain only placement and configured service IDs. Form values are excluded. Page URLs omit queries and fragments; referrers are reduced to their origin. Describe your actual analytics and contact processing in the privacy notice.

## Deployment

```sh
npm run build
npm start
```

Set `SITE_URL` for the public domain at build time and runtime. Supply email credentials at runtime. Content, pricing and public analytics changes require a rebuild. Next.js downloads and self-hosts the IBM Plex fonts during the build.

The Dockerfile produces an unprivileged standalone container on port 3000. With no private inputs it uses the examples. To supply your own inputs using BuildKit:

```sh
docker build \
  --secret id=site_config,src=private/site.json \
  --secret id=pricing_workbook,src=private/pricing.xlsx \
  --build-arg SITE_URL=https://example.com \
  --build-arg SITE_INDEXING=true \
  -t contractor-site .
docker run --rm -p 3000:3000 --env-file .env.production contractor-site
```

Raw private inputs and dotenv files are excluded from the Docker build context. Secret mounts supply inputs only during generation; their rendered content remains public. If changing a BuildKit secret's contents, rebuild with `--no-cache` because secret contents do not invalidate Docker's cache.

Use `npm run build` so the post-build cleanup removes any dotenv files copied into standalone output. The contact endpoint has a process-local delivery cap; add a shared rate limit at the hosting layer for a public or replicated deployment. There is no database, payment processing or subscription management.

## Development

```sh
npx playwright install chromium
npm run typecheck
npm test
npm run build
```

Set `TEST_PORT=3002` when port 3000 is already in use. Tests cover configuration, workbook imports, booking navigation and prefills, email validation and mocked delivery, keyboard dialogs, themes and mobile overflow. Hosted calendar availability needs a separate smoke test.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the code layout and configuration flow.

GitHub Actions runs the checks on pull requests and pushes to `main`, using separate preview and indexable production builds. It uses only example data, with read-only repository permissions and no deployment credentials. Checks include metadata without JavaScript, crawl controls, image responses and structured data. To run the production checks locally on a spare port:

```sh
export SITE_URL=https://contractor.example.com SITE_INDEXING=true
export TEST_PORT=3003 TEST_PRODUCTION=1 TEMPLATE_DEFAULTS=1
npm run build
cp -R .next/static .next/standalone/.next/static
npm test
```

The test server accepts local-origin enquiry requests while metadata retains the configured public origin. Unset these variables when returning to ordinary development. The example domain in this command is a test fixture, not a suggested deployment domain.

## Licence

[ISC](LICENSE). Dependencies and fonts retain their own licences.
