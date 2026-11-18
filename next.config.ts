import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Docker / VPS / Render үшін өз бетінше жұмыс істейтін сервер
  output: 'standalone',
  typescript: { ignoreBuildErrors: true },
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000',
  },
}

export default nextConfig
