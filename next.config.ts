import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  turbopack: { root: __dirname },
  poweredByHeader: false,
};
export default config;
