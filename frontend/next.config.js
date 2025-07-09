/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  env: {
    // Supabase configuration from secrets
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SERVICE_ROLE_KEY: process.env.SERVICE_ROLE_KEY,
  },
  images: {
    domains: ['localhost'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  poweredByHeader: false,
  reactStrictMode: true,
  
  trailingSlash: false,
  
  // Disable font optimization to avoid Google Fonts connectivity issues during build
  optimizeFonts: false,
  
  // PWA Configuration
  async headers() {
    return [
      {
        source: '/site.webmanifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
  
  // Configuração mínima sem webpack customizado para evitar problemas
  eslint: {
    ignoreDuringBuilds: true, // Skip lint during build to avoid issues
  },
  typescript: {
    ignoreBuildErrors: false,
  }
}

module.exports = nextConfig 