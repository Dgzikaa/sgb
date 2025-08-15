/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript e ESLint ativos para qualidade
  typescript: {
    // ✅ Manter validação TypeScript
    // ⚠️ Warnings não bloqueiam build
    ignoreBuildErrors: true,
  },
  // Bundle Analyzer opcional
  webpack(config) {
    // mantém fallbacks
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      net: false,
      tls: false,
    };

    if (process.env.NEXT_PUBLIC_ANALYZE_BUNDLE === 'true') {
      // Pequena estatística básica (sem plugin) usando built-in stats
      config.stats = {
        preset: 'minimal',
        modules: false,
        chunkModules: false,
      };
    }

    return config;
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
  // Configurações de PWA
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; font-src 'self' data: https:; frame-ancestors 'none';",
          },
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
    ];
  },
  // Configurações de compilação
  compiler: {
    // Remover console.log em produção
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Configurações de performance
  poweredByHeader: false,
  compress: true,
};

module.exports = nextConfig;


// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "zykor",
    project: "javascript-nextjs",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);
