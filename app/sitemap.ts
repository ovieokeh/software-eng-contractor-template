import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!process.env.SITE_URL) return [];
  return [
    { url: process.env.SITE_URL },
    { url: new URL("/privacy", process.env.SITE_URL).toString() },
  ];
}
