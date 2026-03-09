import Image from "next/image"
import { Heart } from "lucide-react"
import { useRouter } from "next/navigation"

export interface VideoCardData {
  id: string
  title: string
  thumbnail: string
  duration: string
  progress: string
  date: string
  completed: boolean
  favorited: boolean
}

interface VideoCardProps {
  video: VideoCardData
  onToggleFavorite: (id: string, currentStatus: boolean) => void
}

export function VideoCard({ video, onToggleFavorite }: VideoCardProps) {
  const router = useRouter()

  return (
    <div 
      className="group relative rounded-xl bg-card shadow-sm transition-shadow hover:shadow-md cursor-pointer"
      onClick={() => router.push(`/videos/${video.id}`)}
    >
      {/* 封面图区域 */}
      <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        
        {/* 时长标签 */}
        <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {video.duration}
        </span>

        {/* === 修改后的爱心按钮：完全内嵌，去掉白色圆底，增加阴影 === */}
        <button
          onClick={(e) => {
            e.stopPropagation() 
            onToggleFavorite(video.id, video.favorited)
          }}
          className={`absolute top-3 right-3 z-20 p-1.5 transition-all hover:scale-110 ${
            video.favorited ? "opacity-100" : "opacity-60 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
          }`}
        >
          <Heart 
            className={`h-5 w-5 drop-shadow-md transition-colors ${
              video.favorited 
                ? "fill-[#ef4444] text-[#ef4444]" // 收藏时：红色实心
                : "text-white"                    // 未收藏时：白色描边（带阴影）
            }`} 
          />
        </button>
      </div>

      {/* 底部信息区域 */}
      <div className="p-3.5">
        <h3 className="text-sm font-bold leading-snug text-foreground line-clamp-2">
          {video.title}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {video.date}
            {video.progress && `，看至${video.progress}`}
          </span>
          {video.completed && (
            <span className="shrink-0 rounded bg-[#10b981] px-2 py-0.5 text-xs font-medium text-white">
              已完成
            </span>
          )}
        </div>
      </div>
    </div>
  )
}