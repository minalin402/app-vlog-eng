"use client"

import { useMemo, useState } from "react"
import { VideoCard } from "@/app/components/video-card"
import { Button } from "@/app/components/ui/button"
import { useVideoLearningStatus } from "@/lib/hooks/use-video-learning-status"
import type { Video, StatusFilter, AdvancedFilters } from "@/lib/types"
import { SearchX } from "lucide-react"

interface VideoGridProps {
  statusFilter: StatusFilter
  advancedFilters: AdvancedFilters
  initialVideos: Video[]
}

export function VideoGrid({ statusFilter, advancedFilters, initialVideos }: VideoGridProps) {
  const [page, setPage] = useState(1)
  const { learningStatus, loading: statusLoading } = useVideoLearningStatus(initialVideos)

  const filteredVideos = useMemo(() => {
    return initialVideos.filter((video) => {
      // 1. 学习状态筛选
      const videoStatus = learningStatus[video.id]?.status || 'unlearned'
      if (statusFilter === "learned" && videoStatus !== "learned") return false
      if (statusFilter === "unlearned" && videoStatus !== "unlearned") return false

      // 2. 视频难度筛选
      if (advancedFilters.difficulty.length > 0 && !advancedFilters.difficulty.includes(String(video.difficulty))) return false

      // 3. 视频博主筛选
      if (advancedFilters.creator.length > 0 && !advancedFilters.creator.includes(video.creator || "")) return false

      // 4. 视频分类/标签筛选
      if (advancedFilters.topic.length > 0) {
        const hasMatchedTopic = video.topics?.some(t => advancedFilters.topic.includes(t))
        if (!hasMatchedTopic) return false
      }

      // 5. 视频时长筛选 (✨ 严格按照前开后闭原则)
      if (advancedFilters.duration.length > 0) {
        const minutes = parseInt(video.duration) || 0 
        const isMatch = advancedFilters.duration.some(range => {
          if (range === "1分钟内") return minutes > 0 && minutes <= 1
          if (range === "2分钟内") return minutes > 1 && minutes <= 2
          if (range === "5分钟内") return minutes > 2 && minutes <= 5
          if (range === "10分钟内") return minutes > 5 && minutes <= 10
          if (range === "10分钟以上") return minutes > 10 // 为了互斥，此处为大于10
          return false
        })
        if (!isMatch) return false
      }

      return true
    })
  }, [initialVideos, statusFilter, advancedFilters, learningStatus])

  const displayedVideos = filteredVideos.slice(0, page * 6)

  if (statusLoading) return <div className="py-20 text-center text-muted-foreground">正在同步学习状态...</div>

  // ✨ 只有在真的没数据时才显示的现代版空状态
  if (filteredVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-center animate-in fade-in duration-500">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 ring-1 ring-border/50">
          <SearchX className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-foreground">没有找到相关视频</h3>
          <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
            尝试调整筛选条件，或点击“重置全部”查看更多内容。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {displayedVideos.map((video) => (
          <VideoCard 
            key={video.id} 
            video={{ ...video, status: learningStatus[video.id]?.status || 'unlearned' }} 
          />
        ))}
      </div>
    </div>
  )
}