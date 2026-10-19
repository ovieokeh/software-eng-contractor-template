import { site } from "@/lib/site";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({
  links = [],
}: {
  links?: readonly { href: string; label: string }[];
}) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header flex items-center justify-between gap-6">
        <a href="/" className="wordmark" aria-label={`${site.brand.name} home`}>
          {site.brand.wordmarkLead}
          <span>{site.brand.wordmarkRest}</span>
          <span className="brand-square" aria-hidden="true" />
        </a>
        {links.length ? (
          <nav className="flex items-center gap-7" aria-label="Main navigation">
            {links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
            <ThemeToggle />
          </nav>
        ) : (
          <ThemeToggle />
        )}
      </header>
    </>
  );
}
