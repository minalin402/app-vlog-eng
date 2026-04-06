"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, Heart } from "lucide-react"
import { useState, useCallback, useMemo, useRef } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase-client"
import { cn } from "@/lib/utils"
import type { Video } from "@/lib/types"

interface VideoCardProps {
  video: Video
  priority?: boolean
  sortOrder?: string // ✨ 1. 新增：接收从外层传来的排序状态
}

export function VideoCard({ video, priority = false, sortOrder = "desc" }: VideoCardProps) {
  const [isFavorite, setIsFavorite] = useState(video.isFavorite)
  const prewarmedRef = useRef(false) // 记录是否已经预热过，防止重复请求

  // ✨ 预热终极魔法：只拉取 1KB 的 m3u8 索引，不耗流量，不花钱
  const handlePrewarm = () => {
    if (prewarmedRef.current || !video.video_url?.endsWith('.m3u8')) return
    prewarmedRef.current = true
    // ✨ 核心修改：把 no-cors 改成 cors
    fetch(video.video_url, { mode: 'cors' }).catch(() => {})
  }

  // ✨ 修复：定义 formattedDate
  const formattedDate = useMemo(() => {
    if (!video.created_at) return "2026/3/4"
    return new Date(video.created_at).toLocaleDateString()
  }, [video.created_at])

  const handleToggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return toast.error("请先登录再收藏")

    const prevState = isFavorite
    const nextState = !isFavorite
    setIsFavorite(nextState)

    try {
      if (nextState) {
        const { error } = await supabase.from('user_favorites').insert({
          user_id: user.id,
          video_id: video.id
        })
        // ✨ 关键修复：错误代码 23505 代表"数据已存在"。如果是这个错，我们直接放行，不抛出异常。
        if (error && error.code !== '23505') throw error
      } else {
        const { error } = await supabase.from('user_favorites').delete()
          .eq('user_id', user.id).eq('video_id', video.id)
        if (error) throw error
      }
    } catch (err) {
      setIsFavorite(prevState)
      toast.error("操作失败，请重试")
    }
  }, [isFavorite, video.id])

  return (
    <Link 
      href={`/videos/${video.id}?sort=${sortOrder}&from=home`}
      // ✨✨✨ 就在这里：加入双端预热事件 ✨✨✨
      onMouseEnter={handlePrewarm} 
      onTouchStart={handlePrewarm}
      // ============================================
      className="group relative flex flex-col w-full h-full overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
    >
      {/* 收藏按钮 */}
      <button onClick={handleToggleFavorite} className={cn(
        "absolute top-3 right-3 z-20 flex size-8 items-center justify-center rounded-full shadow-sm transition-all backdrop-blur-md",
        isFavorite 
          ? "bg-white/90 opacity-100" 
          : "bg-black/20 opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
      )}>
        <Heart className={cn("size-4", isFavorite ? "fill-red-500 text-red-500" : "text-white")} />
      </button>

      <div className="relative aspect-video overflow-hidden">
        <Image
          src={video.cover_url || '/placeholder-video.jpg'}
          alt={video.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          // ✨ 性能终极杀招：放弃 Next.js 极慢的内置压缩，直接使用 R2 的全球边缘节点加速！
          unoptimized
        />
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <span className="rounded-md bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur-md">@{video.creator}</span>
          <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] text-white font-medium">{video.accent}</span>
        </div>
        <span className="absolute bottom-2 right-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] text-white">{video.duration}</span>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="line-clamp-1 text-sm font-bold text-foreground">{video.title}</h3>
        <p className="line-clamp-2 text-xs text-muted-foreground min-h-[32px]">{video.description}</p>
        
        {/* ✨ 修复：多标签展示 */}
        <div className="flex flex-wrap gap-2 py-1">
          {video.topics?.map((tag, index) => (
            <span key={index} className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={cn("size-3.5", i < Number(video.difficulty) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted")} />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">{formattedDate}</span>
        </div>
      </div>
    </Link>
  )
}