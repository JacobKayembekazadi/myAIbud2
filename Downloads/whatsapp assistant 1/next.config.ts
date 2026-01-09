import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Clerk Proxy Configuration - bypasses custom subdomain SSL issues
  async rewrites() {
    return [
      {
        source: '/__clerk/:path*',
        destination: 'https://clerk.mychatflow.app/:path*',
      },
    ];
  },
};

export default nextConfig;
