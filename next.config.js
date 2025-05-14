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

  // Turbopack configuration (for development)
  turbo: {
    // Turbopack-specific configurations
    resolveAlias: {
      recharts: false, // Exclude recharts from client bundle
    },
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

    // Exclude heavy dependencies from client bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        recharts: false, // Exclude recharts from client bundle
      };
    }

    return config;
  },

  // Experimental features for better performance
  experimental: {
    // Optimize CSS loading
    optimizeCss: true,
  },
};

module.exports = nextConfig;
