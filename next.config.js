/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'baatein.blob.core.windows.net',
            port: '',
            pathname: '/**',
          },
        ],
      },
};
module.exports = nextConfig;
