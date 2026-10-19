import type { MetadataRoute } from "next";
import { deployment } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  const { origin, indexable } = deployment;
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    // Allow page crawling so bots can see noindex on previews.
    ...(origin && indexable ? { sitemap: `${origin}/sitemap.xml` } : {}),
  };
}
