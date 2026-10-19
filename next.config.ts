import type { NextConfig } from "next";
import deployment from "./lib/seo.generated.json";
const config: NextConfig = {
  output: "standalone",
  turbopack: { root: __dirname },
  poweredByHeader: false,
  async headers() {
    return deployment.indexable
      ? []
      : [
          {
            source: "/:path*",
            headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
          },
        ];
  },
};
export default config;
