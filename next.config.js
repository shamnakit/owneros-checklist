/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dnjplrtlcjjfehwbtfjm.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // ✅ ใช้ redirect เท่านั้น + named capture (?<tab>...)
  async redirects() {
    return [
      // groupN -> slug ใหม่
      { source: '/checklist/group1', destination: '/checklist/strategy', permanent: true },
      { source: '/checklist/group2', destination: '/checklist/structure', permanent: true },
      { source: '/checklist/group3', destination: '/checklist/sop',       permanent: true },
      { source: '/checklist/group4', destination: '/checklist/hr',        permanent: true },
      { source: '/checklist/group5', destination: '/checklist/finance',   permanent: true },
      { source: '/checklist/group6', destination: '/checklist/sales',     permanent: true },

      // /checklist?tab=strategy -> /checklist/strategy
      {
        source: '/checklist',
        has: [
          {
            type: 'query',
            key: 'tab',
            value: '(?<tab>strategy|structure|sop|hr|finance|sales)', // ⬅️ ประกาศ capture ชื่อ tab
          },
        ],
        destination: '/checklist/:tab',
        permanent: true,
      },
    ];
  },

  // ❌ ไม่ต้องมี rewrites เพื่อเลี่ยง error
};

module.exports = nextConfig;
