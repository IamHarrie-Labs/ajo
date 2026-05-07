/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  // SPA-style routing: every app route is served by the root page.
  // The client reads window.location.pathname to set the initial view.
  async rewrites() {
    return [
      { source: '/dashboard',    destination: '/' },
      { source: '/discover',     destination: '/' },
      { source: '/create',       destination: '/' },
      { source: '/profile',      destination: '/' },
      { source: '/pools/:id',    destination: '/' },
    ];
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};

module.exports = nextConfig;
