"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { DayButton } from "react-day-picker"
import { cn } from "@/lib/utils"

// 模拟已学习的日期
const learnedDates = [
  new Date(2026, 1, 20),
  new Date(2026, 1, 21),
  new Date(2026, 1, 23),
]

export function SidebarCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 1, 24))

  const isLearned = (day: Date) => {
    return learnedDates.some(
      (d) =>
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate()
    )
  }

  const isToday = (day: Date) => {
    const today = new Date()
    return (
      day.getFullYear() === today.getFullYear() &&
      day.getMonth() === today.getMonth() &&
      day.getDate() === today.getDate()
    )
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">
          学习日历
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center px-2 pb-3">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          defaultMonth={new Date(2026, 1)}
          className="w-full"
          components={{
            DayButton: ({ day, modifiers, ...props }) => {
              const learned = isLearned(day.date)
              const today = isToday(day.date)
              
              return (
                <button
                  {...props}
                  className={cn(
                    "flex aspect-square size-auto w-full items-center justify-center text-sm font-normal",
                    learned && "bg-green-100 text-green-700 rounded-full hover:bg-green-200",
                    today && !learned && "bg-blue-500 text-white rounded-md hover:bg-blue-600",
                    !learned && !today && "hover:bg-accent hover:text-accent-foreground rounded-md",
                    modifiers.outside && "text-muted-foreground opacity-50"
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
