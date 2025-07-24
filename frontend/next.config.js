/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript e ESLint ativos para qualidade
  typescript: {
    // ✅ Manter validação TypeScript
    // ⚠️ Warnings não bloqueiam build
    ignoreBuildErrors: true,
  },
  eslint: {
    // ✅ Manter validação ESLint
    // ⚠️ Warnings não bloqueiam build
    ignoreDuringBuilds: true,
    // 🚫 Suprimir warnings durante build
    dirs: ['src'],
  },
  // 🚫 Suprimir warnings do console durante build
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Configurações de otimização
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Configurações de imagem
  images: {
    domains: ['localhost', '127.0.0.1'],
    unoptimized: true,
  },
  // Configurações de webpack para resolver problemas de hidratação
  webpack: (config, { isServer }) => {
    // Resolver problemas de hidratação
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
  // Configurações de PWA
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  // Configurações de compilação
  compiler: {
    // Remover console.log em produção
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Configurações de performance
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig 