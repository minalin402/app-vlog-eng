"use client"

import { useState } from "react"
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Calendar } from "@/app/components/ui/calendar"
import { Spinner } from "@/app/components/ui/spinner"
import { supabase } from "@/lib/supabase-client"
import { isSameDay, startOfMonth, endOfMonth } from "date-fns"

/**
 * 获取学习日历数据的 fetcher 函数
 */
async function fetchLearnedDates(month: Date): Promise<Date[]> {
  // 1. 获取当前登录用户
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // 2. 计算本月的起始和结束时间
  const start = startOfMonth(month).toISOString()
  const end = endOfMonth(month).toISOString()

  // 3. 查询 user_learning_progress 表中在本月更新过的记录
  const { data, error } = await supabase
    .from('user_learning_progress')
    .select('last_learned_at')
    .eq('user_id', user.id)
    .eq('status', 'learned')
    .gte('last_learned_at', start)
    .lte('last_learned_at', end)

  if (error) throw error

  // 4. 将字符串日期转换为 Date 对象并去重
  const dates = (data || [])
    .map(item => new Date(item.last_learned_at))
    .filter((date, index, self) => 
      self.findIndex(d => isSameDay(d, date)) === index
    )
  
  return dates
}

/**
 * 学习日历组件 - 使用 SWR 缓存
 * 
 * 优势：
 * - 切换月份时，如果之前加载过会立即显示缓存数据
 * - 后台自动重新验证，保持数据新鲜
 * - 多次打开侧边栏不会重复请求
 */
export function SidebarCalendar() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1))

  // 使用 SWR 获取学习日期
  // key 包含月份信息，切换月份时会自动重新获取
  const { data: learnedDates = [], isLoading } = useSWR(
    ['learned-dates', currentMonth.toISOString()],
    ([_, monthStr]) => fetchLearnedDates(new Date(monthStr)),
    {
      revalidateOnFocus: true,        // 窗口重新获得焦点时重新验证
      revalidateOnReconnect: true,    // 网络重新连接时重新验证
      dedupingInterval: 30000,        // 30秒内的重复请求会被去重
      focusThrottleInterval: 60000,   // focus 重新验证的节流时间（60秒）
    }
  )

  return (
    <Card className="w-full border-border shadow-sm">
      <CardHeader className="pt-1 pb-0 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          学习日历
          {isLoading && <Spinner className="size-3 text-muted-foreground" />}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-2 pt-0 pb-3 w-full -mt-2">
        <div className="w-full overflow-hidden [&_.rdp]:w-full [&_table]:w-full [&_th]:w-[14.28%] [&_td]:w-[14.28%] [&_td]:p-0 [&_th]:p-0">
          <Calendar
            mode="single"
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="w-full p-0" 

            modifiers={{
              learned: learnedDates,
              todayNotLearned: (date) => isSameDay(date, new Date()) && !learnedDates.some((d) => isSameDay(d, date)),
            }}
            modifiersClassNames={{
              // 绿色的已学圆圈
              learned: "bg-green-100 text-green-600 font-bold hover:bg-green-200",
              // 蓝色的今日圆圈
              todayNotLearned: "bg-blue-500 text-white font-bold shadow-sm hover:bg-blue-600",
            }}
            classNames={{
              // 彻底清除原本的丑陋灰色背景
              day_today: "", 
              // 核心修复：用 h-8 w-8 固定尺寸，加上 rounded-full 强制变成完美的正圆形
              day: "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
            }}
          />  
        </div>
      </CardContent>
    </Card>
  )
}
