import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Increased for video/PDF uploads
    },
  },
};

export default nextConfig;
