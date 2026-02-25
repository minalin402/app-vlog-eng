import Image from "next/image"
import { Heart } from "lucide-react"

export interface VideoCardData {
  id: number
  title: string
  thumbnail: string
  duration: string
  progress: string
  date: string
  completed: boolean
  favorited: boolean
}

export function VideoCard({ video }: { video: VideoCardData }) {
  return (
    <div className="group relative rounded-xl bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Thumbnail Area */}
      <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Duration Badge */}
        <span className="absolute bottom-2.5 right-2.5 rounded-md bg-foreground/70 px-2.5 py-1 text-xs font-medium text-primary-foreground">
          {video.duration}
        </span>
      </div>

      {/* Favorite Heart - positioned at the top-right corner, overlapping the edge */}
      {video.favorited && (
        <span className="absolute top-[-6px] right-[-6px] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-md">
          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
        </span>
      )}

      {/* Content Area */}
      <div className="p-3.5">
        <h3 className="text-sm font-bold leading-snug text-foreground line-clamp-2">
          {video.title}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {video.date}
            {video.progress && `，${video.progress}`}
          </span>
          {video.completed && (
            <span className="shrink-0 rounded bg-emerald-500 px-2 py-0.5 text-xs font-medium text-card">
              已完成
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
