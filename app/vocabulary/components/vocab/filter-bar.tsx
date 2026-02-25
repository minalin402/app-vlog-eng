"use client"

import { Eye, EyeOff } from "lucide-react"

export type FilterType = "all" | "unmarked" | "known" | "unknown" | "bookmarked"

interface FilterBarProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  hideChinese: boolean
  onToggleChinese: () => void
  totalCount: number
}

export function FilterBar({
  activeFilter,
  onFilterChange,
  hideChinese,
  onToggleChinese,
  totalCount,
}: FilterBarProps) {
  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: `全部 (${totalCount})` },
    { key: "bookmarked", label: "我收藏(0)" },
  ]

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              activeFilter === filter.key
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-card text-foreground border-border hover:bg-accent"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <button
        onClick={onToggleChinese}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {hideChinese ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {hideChinese ? "显示中文" : "隐藏中文"}
      </button>
    </div>
  )
}
