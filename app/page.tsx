"use client"

import { useState, useEffect, useMemo } from "react"
import { Navbar } from "@/app/components/navbar"
import { LeftSidebar } from "@/app/components/left-sidebar"
import { FilterBar } from "@/app/components/filter-bar"
import { VideoGrid } from "@/app/components/video-grid"
import { supabase } from "@/lib/supabase-client"
import type { Video, StatusFilter, AdvancedFilters } from "@/lib/types"
import { Button } from "@/app/components/ui/button"
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react"
import { useRouter } from "next/navigation"

async function fetchAllVideoData() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('*, description') 
    .order('created_at', { ascending: false })

  if (videosError) return []

  let favoriteIds = new Set()
  if (user) {
    const { data: favorites } = await supabase
      .from('user_favorites')
      .select('video_id')
      .eq('user_id', user.id).not('video_id', 'is', null)
    if (favorites) favoriteIds = new Set(favorites.map(f => f.video_id))
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
  const router = useRouter()
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    difficulty: [], duration: [], creator: [], topic: [],
  })
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push("/login")
      else setIsAuthChecking(false)
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (!isAuthChecking) {
      fetchAllVideoData().then((data) => {
        setVideos(data)
        setIsLoading(false)
      })
    }
  }, [isAuthChecking])

  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (dateA === dateB) return sortOrder === "desc" ? b.title.localeCompare(a.title) : a.title.localeCompare(b.title);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [videos, sortOrder]);

  if (isAuthChecking) return <div className="min-h-screen flex items-center justify-center bg-background">验证中...</div>

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-col lg:flex-row flex-1 gap-4 p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
        {/* 左侧边栏：>= 1024px 显示 */}
        <LeftSidebar
            filter={statusFilter === "all" ? "all" : statusFilter === "learned" ? "completed" : "pending"}
            onFilterChange={(type) => {
              if (type === "all") setStatusFilter("all")
              else if (type === "completed") setStatusFilter("learned")
              else setStatusFilter("unlearned")
            }}
          />
        
        <main className="flex min-w-0 flex-1 flex-col gap-0.5">
          <FilterBar
            videos={videos}
            statusFilter={statusFilter}
            advancedFilters={advancedFilters}
            onStatusChange={setStatusFilter}
            onAdvancedChange={setAdvancedFilters}
          />

          <div className="flex items-center justify-between px-1 py-0.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">视频列表</span>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[11px]" onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}>
              {sortOrder === "desc" ? <><ArrowDownWideNarrow className="size-3.5" /><span>最新发布</span></> : <><ArrowUpNarrowWide className="size-3.5" /><span>最早发布</span></>}
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border animate-pulse bg-card p-4">
                  <div className="aspect-video bg-muted rounded-lg mb-3" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : (
            <VideoGrid initialVideos={sortedVideos} statusFilter={statusFilter} advancedFilters={advancedFilters} />
          )}
        </main>
      </div>
    </div>
  )
}