"use client"

import { BookOpen, Layers, LogOut, User, Menu, Clock, CreditCard, Youtube, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/app/components/ui/button"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/app/components/ui/sheet"
import { LearningStats } from "@/app/components/learning-stats"
import { SidebarCalendar } from "@/app/components/sidebar-calendar"
import { LearningGuide } from "@/app/components/learning-guide"
import { useAuth } from "@/lib/auth-context"

type FilterType = "all" | "completed" | "pending"

interface NavbarProps {
  activeFilter?: FilterType
  onFilterChange?: (type: FilterType) => void
  // ✨ 新增
  total?: number
  learned?: number
}

const navLinks = [
  { label: "学习记录", icon: BookOpen, href: "/records" },
  { label: "英语卡片", icon: Layers, href: "/vocabulary" },
]

export function Navbar({ activeFilter = "all", onFilterChange, total = 0, learned = 0 }: NavbarProps) {
  const router = useRouter()
  const { user, loading: isLoading, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = useCallback(async () => {
    try {
      await signOut()
      toast.success("已安全退出")
      await new Promise((resolve) => setTimeout(resolve, 500))
      router.push("/login")
    } catch (err) {
      toast.error("退出失败，请重试")
    }
  }, [router, signOut])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      {/* Desktop navbar */}
      <div className="hidden h-16 items-center justify-between px-6 lg:!flex">
        <div className="flex items-center gap-8">
          <h1 className="flex items-center gap-2 text-lg font-bold text-foreground tracking-tight">
            <Youtube className="size-6 text-red-600" />
            油管英语语料库
          </h1>
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Button key={link.label} variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" asChild>
                <Link href={link.href}><link.icon className="size-4" />{link.label}</Link>
              </Button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="size-4" /><span>你好，{user?.email?.split('@')[0] || '访客'}</span>
          </div>
          <Button variant="outline" size="sm" className="gap-2" disabled={isLoading} onClick={handleLogout}>
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            {isLoading ? "退出中..." : "登出"}
          </Button>
        </div>
      </div>

      {/* Mobile navbar */}
      <div className="flex h-14 items-center justify-between px-4 lg:!hidden">
        <div className="flex items-center gap-3">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="size-9"><Menu className="size-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto p-0">
              <SheetHeader className="border-b border-border p-4">
                <SheetTitle className="flex items-center gap-2 text-left"><Youtube className="size-5 text-red-600" />油管英语语料库</SheetTitle>
              </SheetHeader>
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted"><User className="size-5 text-muted-foreground" /></div>
                  <span className="text-sm font-medium text-foreground">{user?.email?.split('@')[0] || '访客'}</span>
                </div>
                <Button variant="destructive" size="sm" className="gap-1.5" disabled={isLoading} onClick={handleLogout}>
                  {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}退出
                </Button>
              </div>
              <div className="flex flex-col gap-4 p-4">
                {/* ✨ 将计算好的数字传给抽屉里的统计组件 */}
                <LearningStats 
                  activeFilter={activeFilter} 
                  //total={total} 
                  //learned={learned}
                  onFilterChange={(type) => {
                    if (onFilterChange) onFilterChange(type)
                    setIsMobileMenuOpen(false)
                  }} 
                />
                <SidebarCalendar />
                <LearningGuide />
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="flex items-center gap-2 text-base font-bold text-foreground tracking-tight"><Youtube className="size-5 text-red-600" />油管英语语料库</h1>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 lg:!hidden">
            <Button variant="ghost" size="icon" className="size-9 text-muted-foreground" asChild><Link href="/records"><Clock className="size-5" /></Link></Button>
            <Button variant="ghost" size="icon" className="size-9 text-muted-foreground" asChild><Link href="/vocabulary"><CreditCard className="size-5" /></Link></Button>
          </div>
        </div>
      </div>
    </header>
  )
}