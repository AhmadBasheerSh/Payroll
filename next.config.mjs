/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // ✅ Enable automatic image optimization
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    // Optimize image sizes
    remotePatterns: [],
    // Enable BLURRED placeholder for images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // ✅ Optimize production builds
  compress: true,
  // ✅ Enable SWR stale-while-revalidate
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
}

export default nextConfig
