import type { NextConfig } from "next";
import path from "path";
import dotenv from "dotenv";

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

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
