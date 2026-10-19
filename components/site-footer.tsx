import { site } from "@/lib/site";
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        {site.brand.registration && <span>{site.brand.registration}</span>}
        <a href={`mailto:${site.brand.email}`}>{site.brand.email}</a>
      </div>
      <nav className="footer-links" aria-label="Footer">
        <a href="/privacy">Privacy</a>
      </nav>
      <div className="footer-legal">
        <span>
          © {new Date().getFullYear()} {site.brand.name}
        </span>
      </div>
    </footer>
  );
}
