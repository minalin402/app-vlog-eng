"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"

export function SidebarCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 1, 24))

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
        />
      </CardContent>
    </Card>
  )
}
