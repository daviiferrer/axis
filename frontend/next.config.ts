import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["motion", "framer-motion"],
  experimental: {
    optimizePackageImports: ["motion", "framer-motion"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "assets.aceternity.com",
      },
    ],
  },
};

export default nextConfig;
