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
    // Allow Next.js Image to optimise Supabase Storage URLs
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/**',
      },
    ],
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
  async redirects() {
    const retiredCityRedirects = [
      '/personal-stylist-ahmedabad',
      '/personal-stylist-bhopal',
      '/personal-stylist-chandigarh',
      '/personal-stylist-coimbatore',
      '/personal-stylist-indore',
      '/personal-stylist-jaipur',
      '/personal-stylist-kochi',
      '/personal-stylist-kolkata',
      '/personal-stylist-lucknow',
      '/personal-stylist-mysuru',
      '/personal-stylist-nagpur',
      '/personal-stylist-patna',
      '/personal-stylist-surat',
      '/personal-stylist-thiruvananthapuram',
      '/personal-stylist-vadodara',
      '/personal-stylist-visakhapatnam',
    ].map((source) => ({
      source,
      destination: '/personal-stylist-india',
      permanent: true,
    }));

    return [
      ...retiredCityRedirects,
      {
        source: '/body-type-styling/apple',
        destination: '/body-type-styling/apple-body-shape-india',
        permanent: true,
      },
      {
        source: '/body-type-styling/pear',
        destination: '/body-type-styling/pear-body-shape-india',
        permanent: true,
      },
      {
        source: '/body-type-styling/rectangle',
        destination: '/body-type-styling/rectangle-body-shape-india',
        permanent: true,
      },
      {
        source: '/body-type-styling/rectangle-india',
        destination: '/body-type-styling/rectangle-body-shape-india',
        permanent: true,
      },
      {
        source: '/body-type-styling/hourglass-india',
        destination: '/body-type-styling/hourglass',
        permanent: true,
      },
      {
        source: '/body-type-styling/plus-size-india',
        destination: '/body-type-styling/plus-size',
        permanent: true,
      },
      {
        source: '/arms',
        destination: '/body-type-styling/heavy-arms-styling',
        permanent: true,
      },
      {
        source: '/tummy',
        destination: '/body-type-styling/how-to-dress-tummy',
        permanent: true,
      },
      {
        source: '/plus-size',
        destination: '/body-type-styling/plus-size',
        permanent: true,
      },
      {
        source: '/modest',
        destination: '/style-guides/modest-professional-fashion-india',
        permanent: true,
      },
      {
        source: '/iconik-methodology',
        destination: '/methodology',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
