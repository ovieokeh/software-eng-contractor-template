import type { MetadataRoute } from "next";
import { deployment } from "@/lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!deployment.indexable || !deployment.origin) return [];
  return [
    { url: new URL("/", deployment.origin).href },
    { url: new URL("/privacy", deployment.origin).href },
  ];
}
