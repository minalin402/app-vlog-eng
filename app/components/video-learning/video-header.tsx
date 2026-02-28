"use client"

import { ChevronLeft } from "lucide-react"

export function VideoHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-card shadow-sm shrink-0 z-20">
      <div className="flex items-center gap-2 min-w-0">
        <button className="p-1 rounded-md hover:bg-accent transition-colors shrink-0" aria-label="返回">
          <ChevronLeft className="size-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground md:text-lg truncate">
          谷爱凌：霸气回应质疑
        </h1>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="hidden md:inline text-sm text-muted-foreground">时长: 0:48</span>
        <span className="hidden md:inline text-sm text-muted-foreground">难度: 中级</span>
      </div>
    </header>
  )
}
