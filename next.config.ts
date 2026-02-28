/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // 允许加载 Unsplash 的图片
      },
    ],
  },
};

export default nextConfig;