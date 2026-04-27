import type { NextConfig } from "next";
import { join } from "node:path";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true
  },
  turbopack: {
    root: join(process.cwd(), "..")
  }
};

export default nextConfig;
