import type { NextConfig } from "next";
import { join } from "node:path";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true
  },
  async rewrites() {
    return [
      {
        source: "/index",
        destination: "/ingredient-index"
      }
    ];
  },
  turbopack: {
    root: join(process.cwd(), "..")
  }
};

export default nextConfig;
