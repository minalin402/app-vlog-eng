"use client"

import { Video, BookOpen, Layers, LogOut, User, Menu, Clock, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { LearningStats } from "@/components/learning-stats"
import { SidebarCalendar } from "@/components/sidebar-calendar"
import { LearningGuide } from "@/components/learning-guide"

const navLinks = [
  { label: "视频库", icon: Video, active: true },
  { label: "学习记录", icon: BookOpen, active: false },
  { label: "英语卡片", icon: Layers, active: false },
]

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      {/* Desktop navbar */}
      <div className="hidden h-16 items-center justify-between px-6 md:flex">
        <div className="flex items-center gap-8">
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            油管英语学习素材库
          </h1>
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Button
                key={link.label}
                variant={link.active ? "default" : "ghost"}
                size="sm"
                className={
                  link.active
                    ? "gap-2"
                    : "gap-2 text-muted-foreground hover:text-foreground"
                }
              >
                <link.icon className="size-4" />
                {link.label}
              </Button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="size-4" />
            <span>你好，学习者</span>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <LogOut className="size-4" />
            登出
          </Button>
        </div>
      </div>

      {/* Mobile navbar */}
      <div className="flex h-14 items-center justify-between px-4 md:hidden">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9">
                <Menu className="size-5" />
                <span className="sr-only">打开菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto p-0">
              <SheetHeader className="border-b border-border p-4">
                <SheetTitle className="text-left">油管英语学习素材库</SheetTitle>
              </SheetHeader>

              {/* User info + logout */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <User className="size-5 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">用户7640</span>
                </div>
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <LogOut className="size-3.5" />
                  退出
                </Button>
              </div>

              {/* Sidebar content in drawer */}
              <div className="flex flex-col gap-4 p-4">
                <LearningStats />
                <SidebarCalendar />
                <LearningGuide />
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-base font-bold text-foreground tracking-tight">
            油管英语学习素材库
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-9 text-muted-foreground">
            <Clock className="size-5" />
            <span className="sr-only">学习记录</span>
          </Button>
          <Button variant="ghost" size="icon" className="size-9 text-muted-foreground">
            <CreditCard className="size-5" />
            <span className="sr-only">英语卡片</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
