/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  
  // Otimizaá§áµes de performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Configuraá§á£o de bundling otimizada
  swcMinify: true,
  
  // Configuraá§á£o de imagens
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Webpack customizado
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Otimizaá§áµes de produá§á£o
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }
    
    return config;
  },
  
  // Headers para melhor performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 