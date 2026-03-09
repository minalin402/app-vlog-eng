"use client"

import useSWR from 'swr'
import { supabase } from "@/lib/supabase-client"
import { useAuth } from "@/lib/auth-context"

interface LearningStats {
  total: number
  learned: number
  loading: boolean
  error: Error | null
}

/**
 * 获取学习统计数据的 fetcher 函数
 * SWR 会自动缓存和重新验证这个函数的结果
 */
async function fetchLearningStats(userId: string | null): Promise<Omit<LearningStats, 'loading' | 'error'>> {
  // 获取视频总数
  const { count: total, error: countError } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })

  if (countError) throw countError

  // 如果用户已登录，获取已学习的视频数
  let learned = 0
  if (userId) {
    const { count: learnedCount, error: learnedError } = await supabase
      .from('user_learning_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'learned')

    if (learnedError) throw learnedError
    learned = learnedCount || 0
  }

  return {
    total: total || 0,
    learned,
  }
}

/**
 * 使用 SWR 缓存的学习统计 Hook
 * 
 * 优势：
 * - 自动缓存数据，切换页面后瞬间显示
 * - 后台自动重新验证，保持数据新鲜
 * - 多个组件共享同一份数据，避免重复请求
 * - 支持 focus 重新验证，窗口重新获得焦点时自动更新
 */
export function useLearningStats() {
  const { user } = useAuth()
  
  // 使用 SWR 获取数据
  // key: 缓存键，包含 userId 以便用户切换时重新获取
  // fetcher: 数据获取函数
  const { data, error, isLoading } = useSWR(
    user ? ['learning-stats', user.id] : ['learning-stats', null],
    ([_, userId]: [string, string | null]) => fetchLearningStats(userId),
    {
      // 配置选项
      revalidateOnFocus: true,        // 窗口重新获得焦点时重新验证
      revalidateOnReconnect: true,    // 网络重新连接时重新验证
      dedupingInterval: 10000,        // 10秒内的重复请求会被去重
      focusThrottleInterval: 30000,   // focus 重新验证的节流时间（30秒）
    }
  )

  return {
    total: data?.total ?? 0,
    learned: data?.learned ?? 0,
    loading: isLoading,
    error: error || null,
  }
}
