"use client"

import { useState, useMemo } from "react"
import { Navbar } from "@/app/components/navbar"
import { LeftSidebar } from "@/app/components/left-sidebar"
import { FilterBar } from "@/app/components/filter-bar"
import { VideoGrid } from "@/app/components/video-grid"
import type { Video, StatusFilter, AdvancedFilters } from "@/lib/types"
import { Button } from "@/app/components/ui/button"
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react"

interface DashboardClientProps {
  initialVideos: Video[]
}

export function DashboardClient({ initialVideos }: DashboardClientProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    difficulty: [], duration: [], creator: [], topic: [],
  })
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")

  // ✨ 直接在内存里把数据算好，耗时 0 毫秒！
  const totalVideos = initialVideos.length
  const learnedVideos = initialVideos.filter(v => (v as any).status === 'learned').length

  const sortedVideos = useMemo(() => {
    return [...initialVideos].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
      if (dateA === dateB) {
        return sortOrder === "desc" ? b.title.localeCompare(a.title) : a.title.localeCompare(b.title)
      }
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB
    })
  }, [initialVideos, sortOrder])

  const getFilterType = (status: StatusFilter) => 
    status === "all" ? "all" : status === "learned" ? "completed" : "pending"
    
  const handleFilterChange = (type: "all" | "completed" | "pending") => {
    if (type === "all") setStatusFilter("all")
    else if (type === "completed") setStatusFilter("learned")
    else setStatusFilter("unlearned")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 传给 Navbar */}
      <Navbar 
        activeFilter={getFilterType(statusFilter)}
        onFilterChange={handleFilterChange}
        total={totalVideos}
        learned={learnedVideos}
      />
      
      <div className="flex flex-col lg:flex-row flex-1 gap-4 p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
        {/* 传给 LeftSidebar */}
        <LeftSidebar
          filter={getFilterType(statusFilter)}
          onFilterChange={handleFilterChange}
          //total={totalVideos}
          //learned={learnedVideos}
        />
        
        <main className="flex min-w-0 flex-1 flex-col gap-0.5">
          <FilterBar
            videos={initialVideos}
            statusFilter={statusFilter}
            advancedFilters={advancedFilters}
            onStatusChange={setStatusFilter}
            onAdvancedChange={setAdvancedFilters}
          />

          <div className="flex items-center justify-between px-1 py-0.5 mt-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">视频列表</span>
            <Button 
              variant="ghost" size="sm" className="h-7 gap-1.5 text-[11px]" 
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            >
              {sortOrder === "desc" ? <><ArrowDownWideNarrow className="size-3.5" /><span>最新发布</span></> : <><ArrowUpNarrowWide className="size-3.5" /><span>最早发布</span></>}
            </Button>
          </div>

          <VideoGrid 
            initialVideos={sortedVideos} 
            statusFilter={statusFilter} 
            advancedFilters={advancedFilters} 
          />
        </main>
      </div>
    </div>
  )
}