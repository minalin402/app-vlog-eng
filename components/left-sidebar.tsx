import { LearningStats } from "@/components/learning-stats"
import { SidebarCalendar } from "@/components/sidebar-calendar"
import { LearningGuide } from "@/components/learning-guide"

export function LeftSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-4 lg:flex">
      <LearningStats />
      <SidebarCalendar />
      <LearningGuide />
    </aside>
  )
}
