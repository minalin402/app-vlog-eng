import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ErrorBoundaryWrapper } from "./components/error-boundary"
import { AuthProvider } from "@/lib/auth-context"
import { SWRProvider } from "@/lib/swr-provider"
import { Toaster } from "sonner"
import { Analytics } from "@vercel/analytics/react"
import NextTopLoader from 'nextjs-toploader';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "EngVlogLab - 英语视频学习星球",
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
        {/* ✨ 2. 核心修改：放在 body 的最前面，所有的 Provider 之外 */}
        <NextTopLoader 
          color="#3b82f6" 
          showSpinner={false} 
          height={3} 
          shadow="0 0 10px #3b82f6,0 0 5px #3b82f6"
        />

        <ErrorBoundaryWrapper>
          <SWRProvider>
            <AuthProvider>
              {children}
              <Toaster />
              <Analytics />
            </AuthProvider>
          </SWRProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  )
}