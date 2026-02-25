"use client"

import { useState } from "react"
import { PageHeader, type TabKey } from "@/components/page-header"
import { VideoCard } from "@/components/video-card"
import {
  getRecentVideos,
  getCompletedVideos,
} from "@/lib/mock-data"

export default function LearningHistoryPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("最近学习")

  const videos =
    activeTab === "最近学习"
      ? getRecentVideos()
      : getCompletedVideos()

  return (
    <div className="min-h-screen bg-secondary/60">
      <PageHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Video Card Grid */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <p className="text-base">暂无记录</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="pb-10 pt-6 text-center">
        <p className="text-sm text-muted-foreground">仅显示最近20条记录</p>
      </footer>
    </div>
  )
}
