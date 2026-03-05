'use client'

import React from 'react'
import { useEffect } from 'react'
import { logger } from '@/lib/logger'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误到日志服务
    logger.error('React error boundary caught error', error, {
      componentStack: errorInfo.componentStack,
      errorInfo: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date().toISOString()
    })

    this.setState({
      error,
      errorInfo
    })
  }

  private handleRefresh = () => {
    // 清除错误状态
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    
    // 刷新页面
    window.location.reload()
  }

  private handleReport = () => {
    // 如果已经配置了错误报告服务，可以在这里添加额外的报告逻辑
    logger.info('User reported error', {
      error: this.state.error,
      errorInfo: this.state.errorInfo,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    })

    alert('感谢您的反馈！我们会尽快处理这个问题。')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                抱歉，出现了一些问题
              </h2>
              <p className="text-gray-600 mb-4">
                我们正在努力修复这个问题。您可以尝试刷新页面或报告这个问题。
              </p>
              
              {process.env.NODE_ENV !== 'production' && (
                <div className="mt-4 p-4 bg-red-50 rounded-md">
                  <p className="text-sm text-red-600 break-all">
                    {this.state.error?.message}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="mt-2 text-xs text-red-500 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}

              <div className="mt-6 space-x-4">
                <button
                  onClick={this.handleRefresh}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  刷新页面
                </button>
                <button
                  onClick={this.handleReport}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  报告问题
                </button>
              </div>

              <div className="mt-4">
                <a
                  href="/"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  返回首页
                </a>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 包装组件，用于重置错误状态
export function ErrorBoundaryWrapper({ children }: ErrorBoundaryProps) {
  useEffect(() => {
    // 在路由变化时重置错误状态
    const handleRouteChange = () => {
      if (window.location.pathname !== window.history.state?.prevPath) {
        window.history.state.prevPath = window.location.pathname
        
        // 记录路由变化
        logger.info('Route changed', {
          from: window.history.state?.prevPath,
          to: window.location.pathname,
          timestamp: new Date().toISOString()
        })
      }
    }

    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  return <ErrorBoundary>{children}</ErrorBoundary>
}

export default ErrorBoundaryWrapper