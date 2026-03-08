"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase-client" // 导入真实客户端
import { isSameDay, startOfMonth, endOfMonth } from "date-fns"

export function SidebarCalendar() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1))
  const [learnedDates, setLearnedDates] = useState<Date[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // 🟢 核心修改：从 Supabase 拉取真实学习日期
  const loadLearnedDates = useCallback(async (month: Date) => {
    setIsLoading(true)
    try {
      // 1. 获取当前登录用户
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 2. 计算本月的起始和结束时间
      const start = startOfMonth(month).toISOString()
      const end = endOfMonth(month).toISOString()

      // 3. 查询 user_learning_progress 表中在本月更新过的记录
      const { data, error } = await supabase
        .from('user_learning_progress')
        .select('last_learned_at')
        .eq('user_id', user.id)
        .eq('status', 'learned') // 只统计已完成的
        .gte('last_learned_at', start)
        .lte('last_learned_at', end)

      if (error) throw error

      // 4. 将字符串日期转换为 Date 对象并去重
      const dates = data
        .map(item => new Date(item.last_learned_at))
        .filter((date, index, self) => 
          self.findIndex(d => isSameDay(d, date)) === index
        )
      
      setLearnedDates(dates)
    } catch (err) {
      console.error("加载学习日历失败:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初始加载和切换月份加载
  useEffect(() => {
    loadLearnedDates(currentMonth)
  }, [currentMonth, loadLearnedDates])

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          学习日历
          {isLoading && <Spinner className="size-3 text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-1 md:px-2 pb-3 w-full">
        <div className="w-full overflow-hidden [&_.rdp]:w-full [&_table]:w-full [&_th]:w-[14.28%] [&_td]:w-[14.28%] [&_td]:p-0 [&_th]:p-0"></div>
        <Calendar
          mode="single"
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          className="w-full"
          components={{
            DayButton: ({ day, modifiers, ...props }) => {
              const learned = learnedDates.some((d) => isSameDay(d, day.date))
              const isToday = isSameDay(day.date, new Date())
              const outside = modifiers.outside

              return (
                <button
                  {...props}
                  className={cn(
                    "mx-auto flex aspect-square w-[85%] max-w-[32px] items-center justify-center text-sm font-normal transition-colors",
                    learned && "bg-green-100 text-green-600 rounded-full font-bold hover:bg-green-200",
                    isToday && !learned && "bg-blue-500 text-white rounded-full font-bold",
                    !learned && !isToday && "hover:bg-accent rounded-md",
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