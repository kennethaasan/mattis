import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",
};

export default nextConfig;
