import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Øg body-size limit for lydoptagelser (default er 4 MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
