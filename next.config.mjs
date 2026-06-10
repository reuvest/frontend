// next.config.js
const nextConfig = {
  transpilePackages: ['leaflet', 'react-leaflet'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-614b1fbd5c4f46ca8e95d0ccbde016c9.r2.dev',
        pathname: '/lands/**',
      },
    ],
  },
};

export default nextConfig;