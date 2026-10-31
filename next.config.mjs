/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.output.chunkFilename = 'chunks/[name].js';
    }
    return config;
  },
};

export default nextConfig;

