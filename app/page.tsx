import { site } from "@/lib/site";
import type { Metadata } from "next";
import { pricing, money } from "@/lib/pricing";
import { LandingPage } from "@/components/landing-page";

export const metadata: Metadata = {
  title: `Engineering support for your team | ${site.brand.name}`,
  description: `Work directly with ${site.brand.personShortName} on features, integrations and blocked releases. ${money(pricing.monthlyRetainer)}/month for ${pricing.reservedHours} reserved engineering hours. Additional hours at ${money(pricing.additionalHourlyRate)}/hour.`,
  alternates: { canonical: "/" },
  openGraph: {
    title: `Engineering support for your team | ${site.brand.name}`,
    description: `Engineering support in your codebase. ${pricing.reservedHours} reserved hours a month for ${money(pricing.monthlyRetainer)}, with approved additional hours at ${money(pricing.additionalHourlyRate)}/hour.`,
    url: "/",
    type: "website",
    locale: site.locale.replaceAll("-", "_"),
  },
};

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.brand.name,
    ...(process.env.SITE_URL ? { url: process.env.SITE_URL } : {}),
    email: site.brand.email,
    founder: { "@type": "Person", name: site.brand.personName },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Engineering support for teams",
      itemListElement: site.services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.title,
          description: service.short,
        },
      })),
    },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <LandingPage />
    </>
  );
}
