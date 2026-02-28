"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

// ──────────────────────────────────────────────
// 类型定义
// ──────────────────────────────────────────────

interface LearnedDatesMap {
  [key: string]: Date[]
}

// ──────────────────────────────────────────────
// 模拟异步 API：根据年月返回已学习日期
// ──────────────────────────────────────────────

const MOCK_LEARNED_DATES: LearnedDatesMap = {
  // 2026 年 1 月
  "2026-1": [
    new Date(2026, 0, 5),
    new Date(2026, 0, 12),
    new Date(2026, 0, 18),
    new Date(2026, 0, 25),
  ],
  // 2026 年 2 月
  "2026-2": [
    new Date(2026, 1, 3),
    new Date(2026, 1, 10),
    new Date(2026, 1, 17),
    new Date(2026, 1, 20),
    new Date(2026, 1, 21),
    new Date(2026, 1, 23),
  ],
  // 2026 年 3 月
  "2026-3": [
    new Date(2026, 2, 1),
    new Date(2026, 2, 8),
    new Date(2026, 2, 15),
  ],
}

function fetchLearnedDates(year: number, month: number): Promise<Date[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const key = `${year}-${month + 1}`
      resolve(MOCK_LEARNED_DATES[key] ?? [])
    }, 500)
  })
}

// ──────────────────────────────────────────────
// 工具函数
// ──────────────────────────────────────────────

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isToday(day: Date): boolean {
  return isSameDay(day, new Date())
}

// ──────────────────────────────────────────────
// 组件
// ──────────────────────────────────────────────

export function SidebarCalendar() {
  const today = new Date()

  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [learnedDates, setLearnedDates] = useState<Date[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // 加载指定月份的已学习日期
  const loadLearnedDates = useCallback(async (month: Date) => {
    setIsLoading(true)
    try {
      const data = await fetchLearnedDates(month.getFullYear(), month.getMonth())
      setLearnedDates(data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初始加载当前月
  useEffect(() => {
    loadLearnedDates(currentMonth)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 切换月份时懒加载
  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month)
    loadLearnedDates(month)
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          学习日历
          {isLoading && (
            <Spinner className="size-3 text-muted-foreground" aria-label="加载中" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center px-2 pb-3">
        <Calendar
          mode="single"
          month={currentMonth}
          onMonthChange={handleMonthChange}
          className="w-full"
          components={{
            DayButton: ({ day, modifiers, ...props }) => {
              const learned = learnedDates.some((d) => isSameDay(d, day.date))
              const todayDay = isToday(day.date)
              const outside = modifiers.outside

              return (
                <button
                  {...props}
                  className={cn(
                    "flex aspect-square size-auto w-full items-center justify-center text-sm font-normal transition-colors",
                    learned &&
                      "bg-green-100 text-green-600 rounded-full font-bold hover:bg-green-200",
                    todayDay &&
                      !learned &&
                      "bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600",
                    !learned && !todayDay && "hover:bg-accent hover:text-accent-foreground rounded-md",
                    outside && "text-muted-foreground opacity-50"
                  )}
                >
                  {day.date.getDate()}
                </button>
              )
            },
          }}
        />
      </CardContent>
    </Card>
  )
}
