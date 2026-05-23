import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['html5-qrcode'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
