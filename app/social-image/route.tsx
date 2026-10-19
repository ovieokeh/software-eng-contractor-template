import { ImageResponse } from "next/og";
import { site } from "@/lib/site";
import { homeTitle } from "@/lib/seo";

export const dynamic = "force-static";

// A regular static route keeps the optional metadata image override authoritative.
export function GET() {
  const headline =
    homeTitle.length > 160 ? `${homeTitle.slice(0, 157)}…` : homeTitle;
  const brand =
    site.brand.name.length > 65
      ? `${site.brand.name.slice(0, 62)}…`
      : site.brand.name;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#191919",
        color: "#f4f4f4",
        padding: "64px 76px",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>
        {brand}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: headline.length > 110 ? 44 : headline.length > 60 ? 52 : 64,
          lineHeight: 1.12,
          letterSpacing: "-2px",
          maxWidth: 1048,
        }}
      >
        {headline}
      </div>
      <div
        style={{
          display: "flex",
          width: "100%",
          height: 3,
          background: "#777",
        }}
      />
    </div>,
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    },
  );
}
