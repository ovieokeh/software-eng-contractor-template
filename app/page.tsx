import { LandingPage } from "@/components/landing-page";
import {
  homeTitle,
  homeDescription,
  pageMetadata,
  structuredData,
} from "@/lib/seo";

export const metadata = pageMetadata("/", homeTitle, homeDescription);

export default function Home() {
  const data = structuredData();
  return (
    <>
      {data && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <LandingPage />
    </>
  );
}
