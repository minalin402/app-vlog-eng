import { LearningStats } from "@/components/learning-stats"
import { SidebarCalendar } from "@/components/sidebar-calendar"
import { LearningGuide } from "@/components/learning-guide"

type FilterType = "all" | "completed" | "pending"

interface LeftSidebarProps {
  filter: FilterType
  onFilterChange: (type: FilterType) => void
}

export function LeftSidebar({ filter, onFilterChange }: LeftSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-4 lg:flex">
      <LearningStats activeFilter={filter} onFilterChange={onFilterChange} />
      <SidebarCalendar />
      <LearningGuide />
    </aside>
  )
}
