"use client"

import { useMemo, useState } from "react"
import { VideoCard } from "@/components/video-card"
import { Button } from "@/components/ui/button"
import { mockVideos } from "@/lib/mock-videos"
import type { StatusFilter, AdvancedFilters } from "@/components/filter-bar"

interface VideoGridProps {
  statusFilter: StatusFilter
  advancedFilters: AdvancedFilters
}

const ITEMS_PER_PAGE = 6

export function VideoGrid({ statusFilter, advancedFilters }: VideoGridProps) {
  const [page, setPage] = useState(1)

  /**
   * 联动过滤逻辑：
   *   - 不同维度之间是 AND（交集）：每个维度都必须满足
   *   - 同一维度的多选项之间是 OR（并集）：选中任意一项即满足
   *   - 某维度未选任何项时，视为"不限"（该维度不参与过滤）
   */
  const filteredVideos = useMemo(() => {
    return mockVideos.filter((video) => {
      // 维度1：学习状态（单选）
      if (statusFilter === "learned" && video.status !== "learned") return false
      if (statusFilter === "unlearned" && video.status !== "unlearned") return false

      // 维度2：难度（多选 OR；未选则不限）
      if (
        advancedFilters.difficulty.length > 0 &&
        !advancedFilters.difficulty.includes(video.difficulty)
      ) {
        return false
      }

      // 维度3：时长（多选 OR；未选则不限）
      if (
        advancedFilters.duration.length > 0 &&
        !advancedFilters.duration.includes(video.duration)
      ) {
        return false
      }

      // 维度4：博主（多选 OR；未选则不限）
      if (
        advancedFilters.creator.length > 0 &&
        !advancedFilters.creator.includes(video.creator)
      ) {
        return false
      }

      // 维度5：话题（多选 OR；未选则不限）
      if (
        advancedFilters.topic.length > 0 &&
        !advancedFilters.topic.includes(video.topic)
      ) {
        return false
      }

      return true
    })
  }, [statusFilter, advancedFilters])

  // 筛选条件变化时重置到第一页
  useMemo(() => {
    setPage(1)
  }, [statusFilter, advancedFilters])

  const displayedVideos = filteredVideos.slice(0, page * ITEMS_PER_PAGE)
  const hasMore = page * ITEMS_PER_PAGE < filteredVideos.length

  // 将 lib/mock-videos.ts 的 Video 结构适配到 VideoCard 期望的 VideoData 结构
  const difficultyToNumber = (d: string) => d.length

  return (
    <div className="flex flex-col gap-4">
      {filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
          <span className="text-4xl">🔍</span>
          <p className="text-sm">没有找到符合条件的视频</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {displayedVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={{
                  id: parseInt(video.id.replace("v", ""), 10),
                  title: video.title,
                  description: `博主：${video.creator} · ${video.topic}`,
                  thumbnail: `/images/thumb-${(parseInt(video.id.replace("v", ""), 10) % 6) + 1}.jpg`,
                  duration: video.duration,
                  host: video.creator,
                  accent: "美音",
                  topics: [video.topic],
                  difficulty: difficultyToNumber(video.difficulty),
                  date: new Date().toISOString().split("T")[0],
                  completed: video.status === "learned",
                  favorited: false,
                }}
              />
            ))}
          </div>
          {hasMore && (
            <Button
              variant="outline"
              className="mx-auto"
              onClick={() => setPage((p) => p + 1)}
            >
              加载更多
            </Button>
          )}
        </>
      )}
    </div>
  )
}
