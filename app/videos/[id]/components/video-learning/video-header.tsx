"use client"

// ✨ 新增导入 Star 图标
import { ChevronLeft, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { VideoDetail } from "@/lib/video-api"

interface VideoHeaderProps {
  video?: VideoDetail | null;
}

export function VideoHeader({ video }: VideoHeaderProps) {
  const router = useRouter()
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-card shadow-sm shrink-0 z-20">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => router.back()}
          className="p-1 rounded-md hover:bg-accent transition-colors shrink-0"
          aria-label="返回"
        >
          <ChevronLeft className="size-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground md:text-lg truncate">
          {video?.title || '加载中...'}
        </h1>
      </div>
      
      <div className="flex items-center gap-4 shrink-0">
        {/* ✨ 渲染真实时长 */}
        <span className="hidden md:flex items-center text-sm text-muted-foreground">
          时长: <span className="ml-1 font-medium text-foreground">{video?.duration || '--:--'}</span>
        </span>
        
        {/* ✨ 渲染真实难度，并转化为星星图标 */}
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
      </div>
    </header>
  )
}