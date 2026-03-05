"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { useAuth } from "@/lib/auth-context"

interface LearningStats {
  total: number
  learned: number
  loading: boolean
  error: Error | null
}

export function useLearningStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<LearningStats>({
    total: 0,
    learned: 0,
    loading: true,
    error: null,
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        // 获取视频总数
        const { count: total, error: countError } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })

        if (countError) throw countError

        // 如果用户已登录，获取已学习的视频数
        let learned = 0
        if (user) {
          const { count: learnedCount, error: learnedError } = await supabase
            .from('user_learning_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'learned')

          if (learnedError) throw learnedError
          learned = learnedCount || 0
        }

        setStats({
          total: total || 0,
          learned,
          loading: false,
          error: null,
        })
      } catch (error) {
        console.error('Error fetching learning stats:', error)
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error as Error,
        }))
      }
    }

    fetchStats()
  }, [user])

  return stats
}