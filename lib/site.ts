import config from "./site.generated.json";

type SiteConfig = {
  brand: {
    name: string;
    wordmarkLead: string;
    wordmarkRest: string;
    personName: string;
    personShortName: string;
    email: string;
    registration: string;
    logoUrl: string;
    profiles: { label: string; url: string }[];
  };
  locale: string;
  seo: {
    title: string;
    description: string;
    privacyTitle: string;
    privacyDescription: string;
    imageUrl: string;
    imageAlt: string;
  };
  currency: string;
  phoneCountry: string;
  hero: { heading: string; emphasis: string; introduction: string };
  services: {
    id: string;
    title: string;
    short: string;
    enquiryLabel: string;
  }[];
  pricingNote: string;
  availability: string;
  experience: {
    introduction: string;
    credit: string;
    items: {
      organisation: string;
      url: string;
      environment: string;
      summary: string;
    }[];
  };
  booking: { url: string; question: string };
  analytics: { apiUrl: string; hostname: string };
  privacy: {
    updated: string;
    introduction: string;
    sections: {
      heading: string;
      paragraphs: string[];
      links: { label: string; url: string }[];
    }[];
  };
};

// All fields here are public-facing. API keys belong in server environment
// variables, never in this configuration or a NEXT_PUBLIC variable.
export const site: SiteConfig = config;
