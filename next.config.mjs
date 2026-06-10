/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['leaflet', 'react-leaflet'],
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;