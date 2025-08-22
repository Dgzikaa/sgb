/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Otimizações básicas
  poweredByHeader: false,
  compress: true,
  
  // ✅ TypeScript e ESLint
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['src'],
  },
  
  // ✅ Configurações de imagem
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: ['localhost', '127.0.0.1'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // ✅ Headers de segurança
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
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development' 
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https: wss: ws:; font-src 'self' data: https:; worker-src 'self' blob:; frame-ancestors 'none';"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; font-src 'self' data: https:; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
  
  // ✅ Configurações webpack
  webpack(config, { dev, isServer }) {
    // Fallbacks para módulos Node.js
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      net: false,
      tls: false,
    };

    // Suprimir warnings críticos
    config.module = config.module || {};
    config.module.exprContextCritical = false;
    config.module.unknownContextCritical = false;
    
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /require function is used in a way in which dependencies cannot be statically extracted/,
      /@prisma\/instrumentation/,
      /@opentelemetry\/instrumentation/,
      /require-in-the-middle/,
      /@sentry\/node/,
    ];

    // Configurações específicas para desenvolvimento
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/dist/**',
          '**/build/**',
        ],
      };
      
      // Source maps otimizados para dev (sem warning)
      config.devtool = 'eval-source-map';
    }

    return config;
  },
  
  // ✅ Configurações experimentais
  experimental: {
    optimizePackageImports: ['lucide-react'],
    serverComponentsExternalPackages: [],
    esmExternals: true,
    webpackBuildWorker: false, // Desabilitar para evitar problemas
    // Otimizações para produção
    ...(process.env.NODE_ENV === 'production' && {
      optimizeCss: true,
      turbotrace: {
        logLevel: 'error',
        logAll: false,
      },
    }),
  },
  
  // ✅ Configurações de compilação
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error'], // Manter console.error em produção
    } : false,
  },
  
  // ✅ Configurações de performance
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;