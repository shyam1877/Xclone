import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: path.join(__dirname),
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

