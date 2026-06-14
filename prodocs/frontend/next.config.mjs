/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8000';

const nextConfig = {
  reactStrictMode: false, // İŞTE SİHİRLİ DOKUNUŞ BU!
  async rewrites() {
    return [
      {
        source: '/api/targets/ws/:path*',
        destination: `${backendUrl}/api/targets/ws/:path*`,
      },
    ];
  },
};

export default nextConfig;