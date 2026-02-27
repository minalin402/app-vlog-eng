"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { LeftSidebar } from "@/components/left-sidebar"
import { FilterBar, type StatusFilter, type AdvancedFilters } from "@/components/filter-bar"
import { VideoGrid } from "@/components/video-grid"
import { mockVideos } from "@/lib/mock-videos"

const DEFAULT_ADVANCED_FILTERS: AdvancedFilters = {
  difficulty: [],
  duration: [],
  creator: [],
  topic: [],
}

export default function DashboardPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(
    DEFAULT_ADVANCED_FILTERS
  )

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 gap-6 p-4 md:p-6">
        <LeftSidebar
          filter={statusFilter === "all" ? "all" : statusFilter === "learned" ? "completed" : "pending"}
          onFilterChange={(type) => {
            if (type === "all") setStatusFilter("all")
            else if (type === "completed") setStatusFilter("learned")
            else setStatusFilter("unlearned")
          }}
        />
        <main className="flex min-w-0 flex-1 flex-col gap-4 md:gap-5">
          <FilterBar
            videos={mockVideos}
            statusFilter={statusFilter}
            advancedFilters={advancedFilters}
            onStatusChange={setStatusFilter}
            onAdvancedChange={setAdvancedFilters}
          />
          <VideoGrid
            statusFilter={statusFilter}
            advancedFilters={advancedFilters}
          />
        </main>
      </div>
    </div>
  )
}
