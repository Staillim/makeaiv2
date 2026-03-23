import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Clear Next.js workspace root warning
  outputFileTracingRoot: __dirname,
  
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
  },
};

export default nextConfig;
