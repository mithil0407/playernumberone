/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Serve AVIF first (better compression), fall back to WebP
    formats: ['image/avif', 'image/webp'],
    // Serve correctly-sized images for these screen widths
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache optimized images for 1 year
    minimumCacheTTL: 31536000,
  },
  // Enable gzip/brotli compression
  compress: true,
  // Long-lived cache for all static assets
  async headers() {
    return [
      {
        source: '/(:path*\.webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(:path*\.png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
