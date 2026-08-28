import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for cPanel hosting (drillguard.enetworkstechnologiesltd.com).
  output: "export",
  // dir/index.html output so cPanel Apache serves deep links (/dashboard/)
  // without any rewrite rules.
  trailingSlash: true,
};

export default nextConfig;
