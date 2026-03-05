"use client"

import { useState, useEffect } from "react"
import { PageHeader, type TabKey } from "./components/page-header"
import { VideoCard, type VideoCardData } from "./components/video-card"
// 正确引入你在 lib/supabase-client.ts 中导出的实例
import { supabase } from "@/lib/supabase-client"

// 辅助函数：将数据库的时间戳转换为友好的格式
function formatLearnDate(dateString: string | null) {
  if (!dateString) return "未知时间"
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return "学习于今天"
  if (date.toDateString() === yesterday.toDateString()) return "学习于昨天"
  
  return `学习于 ${date.getMonth() + 1}月${date.getDate()}日`
}

export default function LearningHistoryPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("最近学习")
  const [allRecords, setAllRecords] = useState<VideoCardData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 1. 初始化拉取数据
  useEffect(() => {
    const fetchLearningHistory = async () => {
      try {
        setIsLoading(true)
        
        // 获取当前登录用户
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.error("未找到登录用户")
          setIsLoading(false)
          return
        }

        // 1. 获取收藏数据
        const { data: favoritesData, error: favError } = await supabase
          .from('user_favorites')
          .select('video_id')
          .eq('user_id', user.id)
          .not('video_id', 'is', null)
          
        // ✨ 关键修复：把查出来的数组转换成 Set 集合，这样第 81 行就不会报错了！
        const favoriteVideoIds = new Set(favoritesData?.map(f => f.video_id) || [])

        // 2. 获取进度数据
        const { data: progressData, error: progressError } = await supabase
          .from('user_learning_progress')
          .select(`
            progress,
            status,
            last_learned_at,
            created_at,
            video_id,
            videos ( id, title, cover_url, duration )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }) // 改用 created_at 兜底
          .limit(20)

        // 3. 修正格式化逻辑中的字段映射
        const formattedRecords: VideoCardData[] = (progressData || [])
          .filter(record => record.videos)
          .map((record: any) => {
            const video = record.videos
            return {
              id: video.id,
              title: video.title,
              thumbnail: video.cover_url || "/placeholder.png",
              duration: video.duration,
              progress: `${record.progress}%`,
              // 增加对 last_learned_at 为空的处理
              date: formatLearnDate(record.last_learned_at || record.created_at), 
              // 匹配你数据库里的 'learned' 状态字符串
              completed: record.status === 'learned' || record.progress >= 100,
              favorited: favoriteVideoIds.has(video.id)
            }
          })

        setAllRecords(formattedRecords)
      } catch (error) {
        console.error("获取学习记录失败:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLearningHistory()
  }, [])

  // 2. 收藏状态切换 (使用乐观更新)
  const handleToggleFavorite = async (id: string, currentStatus: boolean) => {
    const targetStatus = !currentStatus
    
    // UI 乐观更新
    setAllRecords(prev => 
      prev.map(v => v.id === id ? { ...v, favorited: targetStatus } : v)
    )

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not logged in")

      if (targetStatus) {
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            video_id: id
          })
        if (error && error.code !== '23505') throw error
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .match({
            user_id: user.id,
            video_id: id
          })
        if (error) throw error
      }
    } catch (error) {
      console.error("同步失败，回滚状态:", error)
      setAllRecords(prev => 
        prev.map(v => v.id === id ? { ...v, favorited: currentStatus } : v)
      )
    }
  }

  const displayVideos = allRecords.filter(video => {
    if (activeTab === "已完成") return video.completed
    if (activeTab === "已收藏") return video.favorited
    return true
  })

  return (
    <div className="min-h-screen bg-secondary/60 flex flex-col">
      <PageHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 flex-1 w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-4 text-sm">加载记录中...</p>
          </div>
        ) : displayVideos.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {displayVideos.map((video) => (
              <VideoCard 
                key={video.id} 
                video={video} 
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <p className="text-base">暂无{activeTab === "最近学习" ? "记录" : activeTab}</p>
          </div>
        )}
      </main>

      <footer className="pb-10 pt-6 text-center shrink-0">
        <p className="text-sm text-muted-foreground">仅显示最近20条记录</p>
      </footer>
    </div>
  )
}