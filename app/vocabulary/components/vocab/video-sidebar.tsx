"use client"

import { useState } from "react"
import { Search, MonitorPlay } from "lucide-react"
import type { VideoItem } from "@/lib/vocab-data"

interface VideoSidebarProps {
  videos: VideoItem[]
  activeVideoId: string
  onSelectVideo: (id: string) => void
}

export function VideoSidebar({ videos, activeVideoId, onSelectVideo }: VideoSidebarProps) {
  const [search, setSearch] = useState("")

  const filtered = videos.filter((v) => v.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <MonitorPlay className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{'< 1'}</span>
        </div>
        <h2 className="text-lg font-bold text-foreground mb-3">视频库</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索视频.."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {filtered.map((video) => (
          <button
            key={video.id}
            onClick={() => onSelectVideo(video.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
              video.id === activeVideoId
                ? "bg-blue-500 text-white"
                : "text-foreground hover:bg-accent"
            }`}
          >
            <span className="flex-1 line-clamp-2 leading-relaxed">{video.title}</span>
            <MonitorPlay className={`h-5 w-5 shrink-0 ${video.id === activeVideoId ? "text-white/80" : "text-muted-foreground"}`} />
          </button>
        ))}
      </div>
    </aside>
  )
}
