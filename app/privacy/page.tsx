import { pageMetadata } from "@/lib/seo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";

export const metadata = pageMetadata(
  "/privacy",
  site.seo.privacyTitle || "Privacy policy",
  site.seo.privacyDescription ||
    `How ${site.brand.name} handles enquiries and personal data.`,
);

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader links={[{ href: "/", label: "Back to site" }]} />
      <main id="main" className="policy-page">
        <h1>Privacy policy</h1>
        <p className="policy-updated">Last updated {site.privacy.updated}</p>
        <p>{site.privacy.introduction}</p>
        {site.privacy.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((text, index) => (
              <p key={index}>{text}</p>
            ))}
            {section.links.length > 0 && (
              <ul>
                {section.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
