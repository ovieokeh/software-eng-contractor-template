import type { Metadata } from "next";
import { createHash } from "node:crypto";
import deployment from "./seo.generated.json";
import { site } from "./site";

export { deployment };
export const homeTitle =
  site.seo.title || `${site.hero.heading} ${site.hero.emphasis}`;
export const homeDescription = site.seo.description || site.hero.introduction;
const imageVersion = createHash("sha256")
  .update(JSON.stringify(["card-v1", site.brand.name, homeTitle]))
  .digest("hex")
  .slice(0, 12);
export const generatedSocialImageUrl = `/social-image?v=${imageVersion}`;
export function pageMetadata(
  path: string,
  title: string,
  description: string,
): Metadata {
  const socialImage = site.seo.imageUrl || generatedSocialImageUrl;
  const socialImageAlt =
    site.seo.imageAlt || `${site.brand.name}: ${homeTitle}`;
  const fullTitle = `${title} | ${site.brand.name}`;
  return {
    metadataBase: new URL(deployment.origin || "http://localhost:3000"),
    title: fullTitle,
    description,
    ...(deployment.origin
      ? { alternates: { canonical: new URL(path, deployment.origin).href } }
      : {}),
    robots: { index: deployment.indexable, follow: true },
    openGraph: {
      title: fullTitle,
      description,
      siteName: site.brand.name,
      type: "website",
      locale: site.locale.replaceAll("-", "_"),
      ...(deployment.origin
        ? { url: new URL(path, deployment.origin).href }
        : {}),
      images: [
        {
          url: socialImage,
          alt: socialImageAlt,
          ...(!site.seo.imageUrl
            ? { width: 1200, height: 630, type: "image/png" }
            : {}),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [{ url: socialImage, alt: socialImageAlt }],
    },
  };
}

export function structuredData() {
  if (!deployment.origin) return null;
  const root = new URL("/", deployment.origin).href;
  const business = `${root}#business`;
  const person = `${root}#person`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": person,
        name: site.brand.personName,
        worksFor: { "@id": business },
        ...(site.brand.profiles.length
          ? { sameAs: site.brand.profiles.map((p) => p.url) }
          : {}),
      },
      {
        "@type": "Organization",
        "@id": business,
        name: site.brand.name,
        url: root,
        email: site.brand.email,
        founder: { "@id": person },
        ...(site.brand.logoUrl ? { logo: site.brand.logoUrl } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${root}#website`,
        url: root,
        name: site.brand.name,
        publisher: { "@id": business },
        inLanguage: site.locale,
      },
      ...site.services.map((service) => ({
        "@type": "Service",
        "@id": `${root}#service-${service.id}`,
        name: service.title,
        description: service.short,
        url: `${root}#service-${service.id}`,
        provider: { "@id": business },
      })),
    ],
  };
}
