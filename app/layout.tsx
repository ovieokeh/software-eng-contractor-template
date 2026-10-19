import { site } from "@/lib/site";
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { AnalyticsBridge } from "@/components/analytics-bridge";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  weight: "variable",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-sans",
});

const plexMono = IBM_Plex_Mono({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-mono",
});
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: `${site.brand.name} | Engineering support for teams`,
  description: `Engineering help from ${site.brand.personName} for features, integrations and blocked releases. Extra capacity for the work your team needs to ship.`,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${site.brand.name} | Engineering support for teams`,
    description: `Work directly with ${site.brand.personName}. Experienced engineering support in your codebase, tools and review process.`,
    type: "website",
    locale: site.locale.replaceAll("-", "_"),
  },
};
const themeScript = `try{const t=localStorage.getItem('studio-theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}`;
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={site.locale}
      className={`${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {process.env.NODE_ENV === "production" &&
          process.env.OPEN_PANEL_CLIENT_ID && (
            <AnalyticsBridge clientId={process.env.OPEN_PANEL_CLIENT_ID} />
          )}
        {children}
      </body>
    </html>
  );
}
