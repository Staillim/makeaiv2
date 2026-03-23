/** @type {import('next').NextConfig} */
const nextConfig = {
  // Clear Next.js workspace root warning  
  outputFileTracingRoot: process.cwd(),
  
  // Remove static export - we need serverless functions for API routes
  // output: 'export', 
  // trailingSlash: true,
  // distDir: 'out',
  
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
  },
  
  // Keep image optimization enabled for better performance
  images: {
    domains: [], // Add domains as needed
  }
};

module.exports = nextConfig;