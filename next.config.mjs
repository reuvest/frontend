const R2_HOSTNAME = (() => {
  try {
    const hostname = new URL(process.env.NEXT_PUBLIC_R2_URL || '').hostname;
    if (!hostname) throw new Error('empty hostname');
    return hostname;
  } catch {
    throw new Error(
      'NEXT_PUBLIC_R2_URL is missing or invalid — set it in your environment ' +
      '(see .env.example).'
    );
  }
})();

const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  transpilePackages: ['leaflet', 'react-leaflet'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: R2_HOSTNAME,
        pathname: '/lands/**',
      },
    ],
  },
};

export default nextConfig;