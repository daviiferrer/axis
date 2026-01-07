import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["motion", "framer-motion"],
  experimental: {
    optimizePackageImports: ["motion", "framer-motion"],
  },
};

export default nextConfig;
