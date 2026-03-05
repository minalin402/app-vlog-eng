import type { NextConfig } from 'next'

// @ts-ignore - Turbopack 实验性配置
const config = {
  // 生产环境配置
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ASSETS_DOMAIN: process.env.NEXT_PUBLIC_ASSETS_DOMAIN,
    NEXT_PUBLIC_MEDIA_DOMAIN: process.env.NEXT_PUBLIC_MEDIA_DOMAIN,
  },

  // 图片域名白名单
  images: {
    domains: [
      'assets.engvloglab.com',
      'media.engvloglab.com',
      'images.unsplash.com', // 👈 加上这一行
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') || '',
    ],
  },

  // 自定义 headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(),, geolocation=()'
          }
        ]
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.CORS_ALLOWED_ORIGINS || 'https://engvloglab.com'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ]
  },

  // 重定向配置
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true
      }
    ]
  },

  // 重写配置
  async rewrites() {
    return {
      beforeFiles: [
        // 静态资源 CDN
        {
          source: '/assets/:path*',
          destination: `https://${process.env.NEXT_PUBLIC_ASSETS_DOMAIN}/:path*`
        },
        // 媒体文件 CDN
        {
          source: '/media/:path*',
          destination: `https://${process.env.NEXT_PUBLIC_MEDIA_DOMAIN}/:path*`
        }
      ]
    }
  },

  // 压缩配置
  compress: true,

  // 生产环境源码映射
  productionBrowserSourceMaps: false,

  // 性能优化
  experimental: {
    turbo: true,
    optimizeCss: true,
    scrollRestoration: true
  },

  // 输出配置
  output: 'standalone',

  // 构建配置
  swcMinify: true,
  reactStrictMode: true,
  poweredByHeader: false,

  // 国际化配置
  //i18n: {
   // locales: ['zh-CN', 'en'],
    //defaultLocale: 'zh-CN'
  //},

  // 禁用 webpack 配置以支持 Turbopack
  webpack: undefined
}

export default config