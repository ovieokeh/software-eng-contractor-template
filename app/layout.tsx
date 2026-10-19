import { site } from "@/lib/site";
import { homeTitle, homeDescription, pageMetadata } from "@/lib/seo";
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
export const metadata = pageMetadata("/", homeTitle, homeDescription);
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
