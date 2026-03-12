"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { VideoCard } from "@/app/components/video-card"
import type { Video, StatusFilter, AdvancedFilters } from "@/lib/types"
import { SearchX } from "lucide-react"

interface VideoGridProps {
  statusFilter: StatusFilter
  advancedFilters: AdvancedFilters
  initialVideos: Video[]
}

export function VideoGrid({ statusFilter, advancedFilters, initialVideos }: VideoGridProps) {
  // ✨ 本地分页状态：每次展示 12 个
  const [visibleCount, setVisibleCount] = useState(12)
  const observerTarget = useRef<HTMLDivElement>(null)

  // 1. 核心过滤逻辑 (保持不变，但现在是在全量 1000 个视频里搜，非常准)
  const filteredVideos = useMemo(() => {
    return initialVideos.filter((video) => {
      if (statusFilter === "learned" && video.status !== "learned") return false
      if (statusFilter === "unlearned" && video.status !== "unlearned") return false
      if (advancedFilters.difficulty.length > 0 && !advancedFilters.difficulty.includes(String(video.difficulty))) return false
      if (advancedFilters.creator.length > 0 && !advancedFilters.creator.includes(video.creator || "")) return false
      if (advancedFilters.topic.length > 0) {
        const hasMatchedTopic = video.topics?.some(t => advancedFilters.topic.includes(t))
        if (!hasMatchedTopic) return false
      }
      if (advancedFilters.duration.length > 0) {
        const minutes = parseInt(video.duration) || 0 
        const isMatch = advancedFilters.duration.some(range => {
          if (range === "1分钟内") return minutes > 0 && minutes <= 1
          if (range === "2分钟内") return minutes > 1 && minutes <= 2
          if (range === "5分钟内") return minutes > 2 && minutes <= 5
          if (range === "10分钟内") return minutes > 5 && minutes <= 10
          if (range === "10分钟以上") return minutes > 10
          return false
        })
        if (!isMatch) return false
      }
      return true
    })
  }, [initialVideos, statusFilter, advancedFilters])

  // ✨ 当筛选条件变化时，重置展示数量
  useEffect(() => {
    setVisibleCount(12)
  }, [statusFilter, advancedFilters])

  // ✨ 自动化无限滚动：滑到底部就增加 visibleCount
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredVideos.length) {
          setVisibleCount(prev => prev + 12)
        }
      },
      { threshold: 0.1 }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [visibleCount, filteredVideos.length])

  // ✨ 仅截取当前需要显示的视频
  const displayedVideos = useMemo(() => {
    return filteredVideos.slice(0, visibleCount)
  }, [filteredVideos, visibleCount])

  if (filteredVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 ring-1 ring-border/50">
          <SearchX className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-foreground">没有找到相关视频</h3>
          <p className="text-sm text-muted-foreground">尝试调整筛选条件或重置全部</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {displayedVideos.map((video, index) => (
          <VideoCard key={video.id} video={video} priority={index < 4} />
        ))}
      </div>
      
      {/* ✨ 隐形探测器：用来触发本地“翻页” */}
      {visibleCount < filteredVideos.length && (
        <div ref={observerTarget} className="h-20 w-full flex items-center justify-center" />
      )}
    </div>
  )
}