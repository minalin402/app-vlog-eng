"use client"

import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { VideoDetail } from "@/lib/video-api"

interface VideoHeaderProps {
  video?: VideoDetail | null;
  prevVideoId?: string | null;
  nextVideoId?: string | null;
  currentSort?: string; // ✨ 新增
  from?: string; // ✨ 新增
}

// 2. 在组件括号里把它解构出来（顺便给个默认值 'desc'）
export function VideoHeader({ 
  video, 
  prevVideoId, 
  nextVideoId, 
  currentSort = 'desc', // ✨ 新增这个参数
  from = 'home' // ✨ 接收
}: VideoHeaderProps) {
  const router = useRouter()

  // ✨ 定义退出函数
  const handleExit = () => {
    if (from === 'vocab') {
      router.push('/vocabulary') // 回到词卡页
    } else {
      router.push('/') // 回到首页
    }
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-card shadow-sm shrink-0 z-20">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={handleExit}
          className="p-1 rounded-md hover:bg-accent transition-colors shrink-0 -ml-2"
          aria-label="返回"
        >
          <ChevronLeft className="size-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground md:text-lg truncate">
          {video?.title || '加载中...'}
        </h1>
      </div>
      
      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        <span className="hidden md:flex items-center text-sm text-muted-foreground">
          时长: <span className="ml-1 font-medium text-foreground">{video?.duration || '--:--'}</span>
        </span>
        
        <span className="hidden md:flex items-center text-sm text-muted-foreground">
          难度: 
          <div className="flex items-center gap-0.5 ml-1.5">
            {video?.difficulty ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-3.5 ${
                    i < Number(video.difficulty) 
                      ? "fill-yellow-400 text-yellow-400" 
                      : "fill-muted text-muted"
                  }`}
                />
              ))
            ) : (
              <span>--</span>
            )}
          </div>
        </span>

        {/* ✨ 极简胶囊版：上一期 / 下一期 */}
        <div className="flex items-center border border-border/80 rounded-lg overflow-hidden shadow-sm bg-background ml-1">
          {prevVideoId ? (
            <Link 
            prefetch={true} // ✨ 核心提速：开启后台强制预加载
            href={`/videos/${prevVideoId}?sort=${currentSort}&from=${from}`} // ✨ 加上 from
            className="px-2.5 py-1.5 hover:bg-muted text-muted-foreground hover:text-primary transition-all duration-100 active:scale-90 active:bg-muted-foreground/20 flex items-center justify-center border-r border-border/80" title="上一期">
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <div className="px-2.5 py-1.5 text-muted-foreground/30 flex items-center justify-center cursor-not-allowed" title="已经是第一期">
              <ChevronLeft className="size-4" />
            </div>
          )}
          
          <div className="w-[1px] h-3.5 bg-border/80" />
          
          {nextVideoId ? (
            <Link 
              prefetch={true} // ✨ 核心提速：开启后台强制预加载
              href={`/videos/${nextVideoId}?sort=${currentSort}&from=${from}`} // ✨ 加上 from
              className="px-2.5 py-1.5 hover:bg-muted text-muted-foreground hover:text-primary transition-all duration-100 active:scale-90 active:bg-muted-foreground/20 flex items-center justify-center" title="下一期">
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <div className="px-2.5 py-1.5 text-muted-foreground/30 flex items-center justify-center cursor-not-allowed" title="已经是最新一期">
              <ChevronRight className="size-4" />
            </div>
          )}
        </div>

      </div>
    </header>
  )
}