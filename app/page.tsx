"use client"

import { useState, useEffect, useMemo } from "react" // ✨ 1. 确保引入了 useMemo
import { Navbar } from "@/components/navbar"
import { LeftSidebar } from "@/components/left-sidebar"
import { FilterBar } from "@/components/filter-bar"
import { VideoGrid } from "@/components/video-grid"
import { supabase } from "@/lib/supabase-client"
import type { Video, StatusFilter, AdvancedFilters } from "@/lib/types"
import { Button } from "@/components/ui/button" // 按钮组件
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react"

// 🟢 拉取数据的函数保持不变
async function fetchAllVideoData() {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('*, description') 
    .order('created_at', { ascending: false })

  if (videosError) {
    console.error('加载视频失败:', videosError)
    return []
  }

  let favoriteIds = new Set()
  if (user) {
    const { data: favorites } = await supabase
      .from('user_favorites')
      .select('video_id')
      .eq('user_id', user.id)
      .not('video_id', 'is', null)

    if (favorites) {
      favoriteIds = new Set(favorites.map(f => f.video_id))
    }
  }

  return videos.map((v) => ({
    ...v,
    topics: v.topics || [],
    accent: v.accent || 'General',
    status: 'unlearned' as const,
    isFavorite: favoriteIds.has(v.id),
  }))
}

export default function DashboardPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    difficulty: [], duration: [], creator: [], topic: [],
  })

  // ✨ 2. 新增：排序状态，默认为降序 (desc)
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")

  useEffect(() => {
    fetchAllVideoData().then((data) => {
      setVideos(data)
      setIsLoading(false)
    })
  }, [])

  // ✨ 3. 新增：计算排序后的视频列表
 const sortedVideos = useMemo(() => {
  // 🟢 调试：在控制台看看数据到底长啥样
  console.log("当前排序方向:", sortOrder);
  if (videos.length > 0) {
    console.log("第一个视频时间:", videos[0].created_at);
  }

  return [...videos].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

    // 如果时间一样，就按标题字母排，这能帮你肉眼判断排序到底动没动
    if (dateA === dateB) {
      return sortOrder === "desc" 
        ? b.title.localeCompare(a.title) 
        : a.title.localeCompare(b.title);
    }

    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });
}, [videos, sortOrder]);

 return (
  <div className="flex min-h-screen flex-col bg-background">
    <Navbar />
    <div className="flex flex-1 gap-4 p-4 md:p-6 max-w-[1600px] mx-auto w-full">
      <LeftSidebar
        filter={statusFilter === "all" ? "all" : statusFilter === "learned" ? "completed" : "pending"}
        onFilterChange={(type) => {
          if (type === "all") setStatusFilter("all")
          else if (type === "completed") setStatusFilter("learned")
          else setStatusFilter("unlearned")
        }}
      />
      
      <main className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* 1. 筛选栏 (现在只负责筛选) */}
        <FilterBar
          videos={videos}
          statusFilter={statusFilter}
          advancedFilters={advancedFilters}
          onStatusChange={setStatusFilter}
          onAdvancedChange={setAdvancedFilters}
        />

        {/* ✨ 2. 新增：视频区域上方的排序与统计条 (网页与移动端通用) */}
        <div className="flex items-center justify-between px-1 py-0.5 mt-0">
          <div className="flex items-center gap-2">
             <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
               视频列表
             </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-transparent px-0"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          >
            {sortOrder === "desc" ? (
              <>
                <ArrowDownWideNarrow className="size-3.5" />
                <span>最新发布</span>
              </>
            ) : (
              <>
                <ArrowUpNarrowWide className="size-3.5" />
                <span>最早发布</span>
              </>
            )}
          </Button>
        </div>

        {/* 3. 视频展示区域 */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card shadow-sm">
                <div className="aspect-video animate-pulse bg-muted rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <VideoGrid
            initialVideos={sortedVideos}
            statusFilter={statusFilter}
            advancedFilters={advancedFilters}
          />
        )}
      </main>
    </div>
  </div>
)
}