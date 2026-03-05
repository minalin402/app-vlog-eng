"use client"

import { BookOpen } from "lucide-react"
import { VideoDetail } from "@/lib/video-api"

interface VideoDescriptionProps {
  video?: VideoDetail | null;
}

export function VideoDescription({ video }: VideoDescriptionProps) {
  return (
    <div className="bg-card rounded-2xl shadow-md p-4">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="size-5 text-[#3b82f6]" />
        <h2 className="font-semibold text-foreground">视频简介</h2>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {video?.description || '加载中...'}
        {/* ✨ 在描述文字的末尾加上这段代码 */}
        {(video as any)?.originalYoutubeUrl && (
          <a
            href={(video as any)?.originalYoutubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-300 hover:text-blue-600 hover:underline ml-2 font-medium inline-flex items-center"
          >
            原视频↗
          </a>
        )}
      </p>
    </div>
  )
}

