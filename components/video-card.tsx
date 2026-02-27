"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, Heart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useCallback } from "react"
import { toast } from "sonner"
import type { Video } from "@/lib/mock-videos"

// ─── 模拟后端 API：更新收藏状态 ───────────────────────────────────────────────

/**
 * 模拟 PATCH /api/videos/:id/favorite
 * 500ms 延迟，10% 概率随机失败（演示回滚效果）
 */
async function apiToggleFavorite(id: string, isFavorite: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        reject(new Error("服务器繁忙，请稍后再试"))
      } else {
        resolve()
      }
    }, 500)
  })
}

// ─── VideoCard 组件 ───────────────────────────────────────────────────────────

interface VideoCardProps {
  video: Video
}

export function VideoCard({ video }: VideoCardProps) {
  const [isFavorite, setIsFavorite] = useState(video.isFavorite)
  const [isPending, setIsPending] = useState(false)

  const formattedDate = (() => {
    const d = new Date(video.updateTime)
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  })()

  /**
   * 乐观更新收藏状态：
   * 1. 立即翻转前端状态（乐观 UI）
   * 2. 发送异步请求到后端
   * 3. 若失败，回滚状态并弹出 Toast
   */
  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (isPending) return

      const prevFavorite = isFavorite
      const nextFavorite = !isFavorite

      // 乐观更新
      setIsFavorite(nextFavorite)
      setIsPending(true)

      try {
        await apiToggleFavorite(video.id, nextFavorite)
      } catch (err) {
        // 请求失败 → 回滚
        setIsFavorite(prevFavorite)
        toast.error("操作失败", {
          description: err instanceof Error ? err.message : "收藏状态更新失败，请重试",
        })
      } finally {
        setIsPending(false)
      }
    },
    [isFavorite, isPending, video.id, toast]
  )

  return (
    <Link
      href={`/videos/${video.id}`}
      className="group relative block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* ── 收藏按钮 ──────────────────────────────────────────────────── */}
      <button
        onClick={handleToggleFavorite}
        disabled={isPending}
        className={`absolute top-3 right-3 z-20 flex size-8 items-center justify-center rounded-full shadow-sm transition-all ${
          isFavorite
            ? "bg-card/90 opacity-100"
            : "bg-card/90 opacity-0 group-hover:opacity-100"
        } ${isPending ? "cursor-wait opacity-50" : ""}`}
        aria-label={isFavorite ? "取消收藏" : "收藏"}
      >
        <Heart
          className={`size-4 transition-colors ${
            isFavorite
              ? "fill-red-500 text-red-500"
              : "text-muted-foreground hover:text-red-400"
          }`}
        />
      </button>

      {/* ── 封面图 ────────────────────────────────────────────────────── */}
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={video.coverUrl}
          alt={video.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          crossOrigin="anonymous"
        />

        {/* 底部渐变遮罩 */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />

        {/* 博主名 + 口音 — 左下 */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <span className="rounded-md bg-foreground/70 px-2 py-0.5 text-xs font-medium text-card backdrop-blur-sm">
            @{video.creator}
          </span>
          <span className="rounded-md bg-primary/90 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground backdrop-blur-sm">
            {video.accent}
          </span>
        </div>

        {/* 时长 — 右下 */}
        <span className="absolute bottom-2 right-2 rounded-md bg-foreground/70 px-2 py-0.5 text-xs font-medium text-card backdrop-blur-sm">
          {video.duration}
        </span>
      </div>

      {/* ── 内容区 ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5 p-4">
        <h3 className="line-clamp-1 text-sm font-bold text-foreground">
          {video.title}
        </h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {video.description}
        </p>

        {/* 话题标签 */}
        <div className="flex flex-wrap items-center gap-1.5">
          {video.topics.map((topic) => (
            <Badge
              key={topic}
              variant="outline"
              className="border-success/30 bg-success/10 text-success px-2 py-0.5 text-[10px] font-medium"
            >
              {topic}
            </Badge>
          ))}
        </div>

        {/* 底部：难度星级 + 更新日期 */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-0.5" aria-label={`难度：${video.difficulty}`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-4 ${
                  i < video.difficulty.length
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>
      </div>
    </Link>
  )
}
