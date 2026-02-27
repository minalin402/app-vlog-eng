"use client"

import { Navbar } from "@/components/navbar"
import { LeftSidebar } from "@/components/left-sidebar"
import { FilterBar } from "@/components/filter-bar"
import { VideoGrid } from "@/components/video-grid"
import { useState } from "react"

type FilterType = "all" | "completed" | "pending"

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")

  const handleFilterChange = (type: FilterType) => {
    setActiveFilter(type)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 gap-6 p-4 md:p-6">
        <LeftSidebar filter={activeFilter} onFilterChange={handleFilterChange} />
        <main className="flex min-w-0 flex-1 flex-col gap-4 md:gap-5">
          <FilterBar filter={activeFilter} onFilterChange={handleFilterChange} />
          <VideoGrid filter={activeFilter} />
        </main>
      </div>
    </div>
  )
}
