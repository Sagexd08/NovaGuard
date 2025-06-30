/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: ['monaco-editor'],
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Webpack configuration for Monaco Editor and WASM support
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Monaco Editor configuration
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' },
    })

    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    // Solidity compiler support
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      url: require.resolve('url'),
      zlib: require.resolve('browserify-zlib'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      assert: require.resolve('assert'),
      os: require.resolve('os-browserify'),
      path: require.resolve('path-browserify'),
    }

    // Ignore node-specific modules in client bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'solc/wrapper': false,
      }
    }

    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: isServer
            ? '../analyze/server.html'
            : './analyze/client.html',
        })
      )
    }

    return config
  },

  // Image optimization
  images: {
    domains: [
      'avatars.githubusercontent.com',
      'images.unsplash.com',
      'via.placeholder.com',
      'novaguard.app',
      'cdn.novaguard.app',
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
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
      // Monaco Editor worker files
      {
        source: '/monaco-editor/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Redirects for SEO and UX
  async redirects() {
    return [
      {
        source: '/docs',
        destination: '/docs/getting-started',
        permanent: true,
      },
      {
        source: '/github',
        destination: 'https://github.com/novaguard/novaguard',
        permanent: false,
      },
      {
        source: '/discord',
        destination: 'https://discord.gg/novaguard',
        permanent: false,
      },
    ]
  },

  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
    // Enable SWC minification
    swcMinify: true,
  },

  // Output configuration
  output: 'standalone',

  // Enable static optimization
  trailingSlash: false,

  // Power pack features
  poweredByHeader: false,

  // Compression
  compress: true,

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src', 'pages', 'components', 'lib', 'hooks'],
  },

  // Development configuration
  ...(process.env.NODE_ENV === 'development' && {
    reactStrictMode: true,
    fastRefresh: true,
  }),

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    reactStrictMode: true,
    optimizeFonts: true,
  }),
}

module.exports = nextConfig
