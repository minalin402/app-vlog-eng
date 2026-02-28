"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { VideoCard } from "@/components/video-card"
import { Button } from "@/components/ui/button"
import { mockVideos } from "@/lib/mock-videos"
import type { Video } from "@/lib/mock-videos"
import type { StatusFilter, AdvancedFilters } from "@/components/filter-bar"

// ─── 模拟后端 API：获取视频列表 ───────────────────────────────────────────────

/**
 * 模拟 GET /api/videos
 * 500ms 延迟后返回 mock 数据
 */
async function fetchVideos(): Promise<Video[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockVideos), 500)
  })
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface VideoGridProps {
  statusFilter: StatusFilter
  advancedFilters: AdvancedFilters
}

const ITEMS_PER_PAGE = 6

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export function VideoGrid({ statusFilter, advancedFilters }: VideoGridProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)

  // 初始加载 —— 模拟 fetchVideos API 调用
  useEffect(() => {
    setIsLoading(true)
    fetchVideos()
      .then((data) => setVideos(data))
      .finally(() => setIsLoading(false))
  }, [])

  /**
   * 联动过滤逻辑：
   *   - 不同维度之间是 AND（交集）：每个维度都必须满足
   *   - 同一维度的多选项之间是 OR（并集）：选中任意一项即满足
   *   - 某维度未选任何项时，视为"不限"（该维度不参与过滤）
   */
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
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
      // 将视频的时长字符串（如 "3:24"）映射到选项区间
      if (advancedFilters.duration.length > 0) {
        const matched = advancedFilters.duration.some((opt) =>
          matchDuration(video.duration, opt)
        )
        if (!matched) return false
      }

      // 维度4：博主（多选 OR；未选则不限）
      if (
        advancedFilters.creator.length > 0 &&
        !advancedFilters.creator.includes(video.creator)
      ) {
        return false
      }

      // 维度5：话题（多选 OR；未选则不限）
      // video.topics 是数组，只要与选中项有交集即满足
      if (advancedFilters.topic.length > 0) {
        const hasOverlap = advancedFilters.topic.some((t) =>
          video.topics.includes(t)
        )
        if (!hasOverlap) return false
      }

      return true
    })
  }, [videos, statusFilter, advancedFilters])

  // 筛选条件变化时重置到第一页
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setPage(1)
  }, [statusFilter, advancedFilters])

  const displayedVideos = filteredVideos.slice(0, page * ITEMS_PER_PAGE)
  const hasMore = page * ITEMS_PER_PAGE < filteredVideos.length

  // ── 加载骨架屏 ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            <div className="aspect-video animate-pulse bg-muted" />
            <div className="flex flex-col gap-3 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── 空状态 ──────────────────────────────────────────────────────────────────
  if (filteredVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
        <span className="text-4xl">&#128269;</span>
        <p className="text-sm">没有找到符合条件的视频</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {displayedVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
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
    </div>
  )
}

// ─── 工具函数：将视频时长字符串映射到筛选区间 ────────────────────────────────

/**
 * 将 "M:SS" 格式的时长（如 "2:45"）转换为秒数，
 * 再与固定选项区间做匹配
 */
function parseDurationToSeconds(duration: string): number {
  const parts = duration.split(":").map(Number)
  if (parts.length === 2) {
    const [m, s] = parts
    return m * 60 + s
  }
  if (parts.length === 3) {
    const [h, m, s] = parts
    return h * 3600 + m * 60 + s
  }
  return 0
}

function matchDuration(duration: string, option: string): boolean {
  const seconds = parseDurationToSeconds(duration)
  switch (option) {
    case "1分钟内":
      return seconds <= 60
    case "2分钟内":
      return seconds <= 120
    case "5分钟内":
      return seconds <= 300
    case "10分钟以上":
      return seconds > 600
    default:
      return false
  }
}
