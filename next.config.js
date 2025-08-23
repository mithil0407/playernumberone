/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable image optimization
  images: {
    // Enable lazy loading for all images
    loading: 'lazy',
    // Enable blur placeholder
    placeholder: 'blur',
    // Optimize images for mobile
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Enable WebP format for better compression
    formats: ['image/webp'],
    // Enable responsive images
    responsive: true,
    // Enable lazy loading
    lazy: true,
  },
  // Enable experimental features for better performance
  experimental: {
    // Enable optimized images
    optimizeImages: true,
    // Enable lazy loading
    lazy: true,
  },
  // Enable compression
  compress: true,
  // Enable minification
  swcMinify: true,
  // Enable source maps for development
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
