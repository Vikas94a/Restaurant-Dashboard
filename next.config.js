/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  experimental: {
    optimizePackageImports: ['@fortawesome/react-fontawesome', '@fortawesome/free-solid-svg-icons'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig; 