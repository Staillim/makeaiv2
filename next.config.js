/** @type {import('next').NextConfig} */
const nextConfig = {
  // Clear Next.js workspace root warning  
  outputFileTracingRoot: process.cwd(),
  
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
  },
};

module.exports = nextConfig;