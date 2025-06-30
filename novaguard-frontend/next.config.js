/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@solidity-parser/parser', 'solc'],
  },
  webpack: (config, { isServer }) => {
    // Handle node modules that need to be transpiled
    config.externals = config.externals || []
    
    if (!isServer) {
      // Fallbacks for client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      }
    }

    // Handle Monaco Editor
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' },
    })

    return config
  },
  images: {
    domains: [
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'img.clerk.com',
      'images.unsplash.com',
    ],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'NovaGuard',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  // Enable static exports for better performance
  output: 'standalone',
  
  // Security headers
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
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Redirects for better UX
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/overview',
        permanent: false,
      },
      {
        source: '/audit',
        destination: '/dashboard/audit',
        permanent: false,
      },
      {
        source: '/deploy',
        destination: '/dashboard/deploy',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
