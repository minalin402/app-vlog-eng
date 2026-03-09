"use client"

import { SWRConfig } from 'swr'
import type { ReactNode } from 'react'

/**
 * SWR 全局配置组件
 * 
 * 配置说明：
 * - revalidateOnFocus: 窗口重新获得焦点时自动重新验证数据
 * - revalidateOnReconnect: 网络重新连接时自动重新验证数据
 * - dedupingInterval: 去重间隔，相同请求在此时间内只会发送一次
 * - focusThrottleInterval: focus 重新验证的节流时间
 * - errorRetryCount: 错误重试次数
 * - errorRetryInterval: 错误重试间隔
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        // 性能优化配置
        revalidateOnFocus: true,          // 窗口获得焦点时重新验证
        revalidateOnReconnect: true,      // 网络重连时重新验证
        dedupingInterval: 5000,           // 5秒内的重复请求会被去重
        focusThrottleInterval: 30000,     // focus 重新验证节流 30秒
        
        // 错误处理配置
        errorRetryCount: 3,               // 最多重试 3 次
        errorRetryInterval: 5000,         // 重试间隔 5秒
        shouldRetryOnError: true,         // 发生错误时是否重试
        
        // 缓存配置
        revalidateIfStale: true,          // 如果数据过期则重新验证
        revalidateOnMount: true,          // 组件挂载时重新验证
        
        // 全局 fetcher（可选，如果每个 useSWR 都提供了 fetcher 则不需要）
        // fetcher: (url: string) => fetch(url).then(res => res.json()),
      }}
    >
      {children}
    </SWRConfig>
  )
}
