/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for Windows symlink issues
    config.resolve.symlinks = false;
    return config;
  },
  // Disable file system cache on Windows to prevent symlink errors
  experimental: {
    disableOptimizedLoading: true,
  },
}

export default nextConfig
