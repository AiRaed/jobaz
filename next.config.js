/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  async redirects() {
    return [
      // Legacy CV builder routes → /cv-builder-v2
      {
        source: '/builder',
        destination: '/cv-builder-v2',
        permanent: true,
      },
      {
        source: '/cv-builder',
        destination: '/cv-builder-v2',
        permanent: true,
      },
      // Handle any sub-routes
      {
        source: '/builder/:path*',
        destination: '/cv-builder-v2/:path*',
        permanent: true,
      },
      {
        source: '/cv-builder/:path*',
        destination: '/cv-builder-v2/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
