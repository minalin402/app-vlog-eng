"use client"

import { useState, useEffect, useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { LeftSidebar } from "@/components/left-sidebar"
import { FilterBar } from "@/components/filter-bar"
import { VideoGrid } from "@/components/video-grid"
import { supabase } from "@/lib/supabase-client"
import type { Video, StatusFilter, AdvancedFilters } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react"
import { useRouter } from "next/navigation"

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

// 🟢 唯一的“一家之主”
export default function DashboardPage() {
  const router = useRouter()
  
  // 状态管理
  const [isAuthChecking, setIsAuthChecking] = useState(true) // ✨ 专门用于查户口的 loading
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true) // 原本拉取视频用的 loading
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    difficulty: [], duration: [], creator: [], topic: [],
  })
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")

  // ✨ 1. 第一步：先查户口（路由守卫）
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login") // 没登录直接踢走
      } else {
        setIsAuthChecking(false) // 登录了，解除门禁
      }
    }
    checkAuth()
  }, [router])

  // ✨ 2. 第二步：门禁解除后，再去拉取真实的视频数据
  useEffect(() => {
    if (!isAuthChecking) {
      fetchAllVideoData().then((data) => {
        setVideos(data)
        setIsLoading(false)
      })
    }
  }, [isAuthChecking]) // 依赖 isAuthChecking，等它变成 false 才执行

  // 计算排序
  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

      if (dateA === dateB) {
        return sortOrder === "desc" 
          ? b.title.localeCompare(a.title) 
          : a.title.localeCompare(b.title);
      }

      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [videos, sortOrder]);

  // ✨ 3. 如果还在查户口，就只显示白屏提示，防止页面闪烁
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 bg-background">
        正在验证身份，请稍候...
      </div>
    )
  }

  // ✨ 4. 查户口通过，渲染你原本的页面
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
          <FilterBar
            videos={videos}
            statusFilter={statusFilter}
            advancedFilters={advancedFilters}
            onStatusChange={setStatusFilter}
            onAdvancedChange={setAdvancedFilters}
          />

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