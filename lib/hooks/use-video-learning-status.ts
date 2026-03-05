"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { useAuth } from "@/lib/auth-context"
import type { Video } from "@/lib/types"

interface VideoLearningStatus {
  [videoId: string]: {
    status: 'unlearned' | 'learning' | 'learned'
    progress: number
  }
}

export function useVideoLearningStatus(videos: Video[]) {
  const { user } = useAuth()
  const [learningStatus, setLearningStatus] = useState<VideoLearningStatus>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLearningStatus() {
      try {
        // 如果用户未登录或没有视频，返回空状态
        if (!user || !videos.length) {
          const defaultStatus: VideoLearningStatus = {}
          videos.forEach(video => {
            defaultStatus[video.id] = {
              status: 'unlearned',
              progress: 0
            }
          })
          setLearningStatus(defaultStatus)
          setLoading(false)
          return
        }

        // 获取用户的学习进度
        const { data, error } = await supabase
          .from('user_learning_progress')
          .select('video_id, status, progress')
          .eq('user_id', user.id)
          .in('video_id', videos.map(v => v.id))

        if (error) throw error

        const statusMap: VideoLearningStatus = {}
        data.forEach(item => {
          statusMap[item.video_id] = {
            status: item.status as 'unlearned' | 'learning' | 'learned',
            progress: item.progress
          }
        })

        // 为没有学习记录的视频设置默认状态
        videos.forEach(video => {
          if (!statusMap[video.id]) {
            statusMap[video.id] = {
              status: 'unlearned',
              progress: 0
            }
          }
        })

        setLearningStatus(statusMap)
      } catch (error) {
        console.error('Error fetching learning status:', error)
        // 发生错误时设置默认状态
        const defaultStatus: VideoLearningStatus = {}
        videos.forEach(video => {
          defaultStatus[video.id] = {
            status: 'unlearned',
            progress: 0
          }
        })
        setLearningStatus(defaultStatus)
      } finally {
        setLoading(false)
      }
    }

    fetchLearningStatus()
  }, [user, videos])

  return { learningStatus, loading }
}