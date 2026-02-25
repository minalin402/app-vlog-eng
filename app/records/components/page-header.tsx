"use client"

import {
  ChevronLeft,
  MoreVertical,
  AlignJustify,
  CheckCircle2,
  Heart,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const TAB_LABELS = ["最近学习", "已完成", "已收藏"] as const
export type TabKey = (typeof TAB_LABELS)[number]

const TAB_ICONS: Record<TabKey, React.ReactNode> = {
  最近学习: <AlignJustify className="h-4 w-4" />,
  已完成: <CheckCircle2 className="h-4 w-4" />,
  已收藏: <Heart className="h-4 w-4" />,
}

interface PageHeaderProps {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

export function PageHeader({ activeTab, onTabChange }: PageHeaderProps) {
  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          {/* Left: Back Button */}
          <button className="flex items-center text-foreground transition-colors hover:text-muted-foreground">
            <ChevronLeft className="h-5 w-5 shrink-0" />
            {/* Desktop: 学习记录 / Mobile: active tab name */}
            <span className="hidden text-lg font-bold md:inline">
              学习记录
            </span>
            <span className="text-lg font-bold md:hidden">{activeTab}</span>
          </button>

          {/* Right: Desktop logout button */}
          <button className="hidden rounded-md bg-foreground/85 px-5 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-foreground md:block">
            登出
          </button>

          {/* Right: Mobile 3-dot menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent">
                  <MoreVertical className="h-5 w-5" />
                  <span className="sr-only">打开菜单</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {TAB_LABELS.map((tab) => (
                  <DropdownMenuItem
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={activeTab === tab ? "font-bold" : ""}
                  >
                    {tab}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Desktop Segmented Control Tabs */}
      <nav className="hidden md:block" aria-label="学习记录分类">
        <div className="mx-auto max-w-5xl px-6 pt-8 pb-2">
          <div className="grid grid-cols-3 rounded-xl bg-secondary/80 p-1.5">
            {TAB_LABELS.map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {TAB_ICONS[tab]}
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  )
}
