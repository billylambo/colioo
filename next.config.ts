import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [390, 480, 640, 750, 828],
    imageSizes: [54, 96, 108, 170, 384],
    minimumCacheTTL: 2592000,
  },
};

export default nextConfig;