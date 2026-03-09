import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ErrorBoundaryWrapper } from "./components/error-boundary"
import { AuthProvider } from "@/lib/auth-context"
import { SWRProvider } from "@/lib/swr-provider"
import { Toaster } from "sonner"
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