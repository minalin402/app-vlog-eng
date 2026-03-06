"use client"

import { useState } from "react"
import { Search, MonitorPlay, ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface VideoSidebarProps {
  videos: any[]
  activeVideoId: string
  onSelectVideo: (id: string) => void
}

export function VideoSidebar({ videos, activeVideoId, onSelectVideo }: VideoSidebarProps) {
  const [search, setSearch] = useState("")
  const router = useRouter()

  const filtered = videos.filter((v) => v.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border">
        {/* 返回首页按钮 */}
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-1 mb-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" /> 返回首页
        </button>
        
        <h2 className="text-lg font-bold text-foreground mb-3">视频库</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索视频.."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {filtered.map((video) => (
          <div
            key={video.id}
            className={`w-full flex items-center justify-between px-2 py-1.5 transition-colors ${
              video.id === activeVideoId ? "bg-accent" : "hover:bg-accent/50"
            }`}
          >
            {/* 点击文字，筛选当前视频的词卡 */}
            <button
              onClick={() => onSelectVideo(video.id)}
              className="flex-1 text-left px-2 py-2 text-sm"
            >
              <span className={`line-clamp-2 leading-relaxed ${video.id === activeVideoId ? "font-bold text-[#3b82f6]" : "text-foreground"}`}>
                {video.title}
              </span>
            </button>
            
            {/* 点击图标，直接跳转到视频学习页 */}
            <button
              onClick={() => router.push(`/videos/${video.id}`)}
              className="p-2 shrink-0 text-muted-foreground hover:text-[#3b82f6] hover:bg-[#3b82f6]/10 rounded-md transition-colors"
              title="前往学习该视频"
            >
              <MonitorPlay className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  )
}