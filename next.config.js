/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Allow development origins
  allowedDevOrigins: ["192.168.0.109"],

  // Optimize image loading
  images: {
    unoptimized: true, // Disable image optimization in development
  },

  // Webpack configuration (for production build)
  webpack: (config, { dev, isServer }) => {
    // Optimize only in production
    if (!dev) {
      // Split chunks optimization
      config.optimization.splitChunks = {
        chunks: "all",
        minSize: 20000,
        maxSize: 244000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },

  // Headers configuration
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
    ];
  },

  // Experimental features for better performance
  experimental: {
    // Optimize CSS loading
    optimizeCss: true,
  },
};

module.exports = nextConfig;
