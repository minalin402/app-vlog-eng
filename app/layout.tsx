import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ErrorBoundaryWrapper } from "./components/error-boundary"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "sonner"
// ✨ 1. 引入 Analytics 组件
import { Analytics } from "@vercel/analytics/react"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "EngVlogLab - 英语视频学习平台",
  description: "通过优质英语视频内容提升听说能力",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundaryWrapper>
          <AuthProvider>
            {children}
            <Toaster />
            {/* ✨ 2. 在 AuthProvider 内部（或外部均可）加上探针 */}
            <Analytics />
          </AuthProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  )
}