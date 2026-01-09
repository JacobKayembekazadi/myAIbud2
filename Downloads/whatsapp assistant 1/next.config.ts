import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Clerk Proxy Configuration - bypasses custom subdomain SSL issues
  env: {
    NEXT_PUBLIC_CLERK_PROXY_URL: 'https://mychatflow.app/__clerk',
  },
};

export default nextConfig;
