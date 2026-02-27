"use client"

import { BarChart3 } from "lucide-react"

// Mock 数据：total 来自后端视频表接口（占位），learned 来自后端用户表接口（占位）
const mockStats = {
  total: 165,
  learned: 3,
}

type FilterType = "all" | "completed" | "pending"

interface StatItem {
  label: string
  value: number
  color: string
  type: FilterType
}

interface LearningStatsProps {
  onFilterChange?: (type: FilterType) => void
  activeFilter?: FilterType
}

export function LearningStats({ onFilterChange, activeFilter = "all" }: LearningStatsProps) {
  const unlearned = mockStats.total - mockStats.learned

  const stats: StatItem[] = [
    {
      label: "总期数",
      value: mockStats.total,
      color: "text-gray-700",
      type: "all",
    },
    {
      label: "已学习",
      value: mockStats.learned,
      color: "text-emerald-600",
      type: "completed",
    },
    {
      label: "未学习",
      value: unlearned,
      color: "text-blue-500",
      type: "pending",
    },
  ]

  return (
    <div className="rounded-lg bg-white p-4">
      <div className="flex items-center gap-2 pb-3">
        <BarChart3 className="size-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">学习统计</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => onFilterChange?.(stat.type)}
            className={`flex flex-col items-center justify-center gap-1 rounded-lg p-3 transition-all cursor-pointer
              ${
                activeFilter === stat.type
                  ? "bg-blue-100/30 border-2 border-blue-300/50 shadow-sm"
                  : "hover:bg-gray-50 border-2 border-transparent"
              }`}
          >
            <span className={`text-3xl font-bold ${stat.color}`}>
              {stat.value}
            </span>
            <span className="text-sm whitespace-nowrap text-muted-foreground">
              {stat.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
