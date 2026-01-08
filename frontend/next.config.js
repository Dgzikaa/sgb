const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Otimizações básicas
  poweredByHeader: false,
  compress: true,
  reactStrictMode: false, // Desabilitar para evitar chamadas duplas da API
  
  // ✅ Definir raiz do workspace para evitar warning de múltiplos lockfiles
  outputFileTracingRoot: path.join(__dirname, '../'),
  
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
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://vercel.live https://cdn.pluggy.ai; style-src 'self' 'unsafe-inline' https://cdn.pluggy.ai; img-src 'self' data: blob: https:; connect-src 'self' https: wss: ws: https://api.pluggy.ai; font-src 'self' data: https:; worker-src 'self' blob:; frame-src 'self' https://docs.google.com https://vercel.live https://cdn.pluggy.ai https://connect.pluggy.ai; frame-ancestors 'none';"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://vercel.live https://cdn.pluggy.ai; style-src 'self' 'unsafe-inline' https://cdn.pluggy.ai; img-src 'self' data: blob: https:; connect-src 'self' https: wss: https://api.pluggy.ai; font-src 'self' data: https:; worker-src 'self' blob:; frame-src 'self' https://docs.google.com https://vercel.live https://cdn.pluggy.ai https://connect.pluggy.ai; frame-ancestors 'none';",
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
        // Ignorar pastas de sistema do Windows e diretórios comuns
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/dist/**',
          '**/build/**',
          '**/System Volume Information/**',
          '**/$RECYCLE.BIN/**',
          '**/$Recycle.Bin/**',
          '**/Recovery/**',
          '**/Config.Msi/**',
          '**/Windows/**',
          '**/ProgramData/**',
          '**/Program Files/**',
          '**/Program Files (x86)/**',
          // Arquivos de sistema Windows na raiz
          '**/pagefile.sys',
          '**/hiberfil.sys',
          '**/swapfile.sys',
          '**/DumpStack.log.tmp',
          '**/DumpStack.log',
          '**/bootmgr',
          '**/BOOTNXT',
        ],
      };
      // Não ajustar devtool em desenvolvimento para evitar regressões e warnings do Next.js
    }

    return config;
  },
  
  // ✅ Configurações experimentais (otimizadas)
  experimental: {
    // Otimiza imports de pacotes grandes - reduz bundle size significativamente
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-switch',
      '@radix-ui/react-slider',
      'framer-motion',
      'date-fns',
      'recharts',
      '@supabase/supabase-js',
    ],
    esmExternals: true,
    webpackBuildWorker: false, // Desabilitar para evitar problemas
    // optimizeCss: true, // Desabilitado - causa erro com critters
  },
  
  // ✅ Pacotes externos do servidor (movido de experimental)
  serverExternalPackages: [],
  
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