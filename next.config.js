/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow loading images from your Supabase Storage public buckets
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dnjplrtlcjjfehwbtfjm.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;
