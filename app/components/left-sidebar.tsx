import { LearningStats } from "@/app/components/learning-stats"
import { SidebarCalendar } from "@/app/components/sidebar-calendar"
import { LearningGuide } from "@/app/components/learning-guide"

type FilterType = "all" | "completed" | "pending"

interface LeftSidebarProps {
  filter: FilterType
  onFilterChange: (type: FilterType) => void
}

export function LeftSidebar({ filter, onFilterChange }: LeftSidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col gap-4 shrink-0 lg:w-[18%] lg:min-w-[240px] lg:max-w-[280px]">
      <LearningStats activeFilter={filter} onFilterChange={onFilterChange} />
      <SidebarCalendar />
      <LearningGuide />
    </aside>
  )
}
