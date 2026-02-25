import { BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const stats = [
  {
    label: "总期数",
    value: 163,
    color: "text-primary",
    borderColor: "border-primary/30",
    bg: "bg-primary/5",
  },
  {
    label: "已学习",
    value: 3,
    color: "text-success",
    borderColor: "border-transparent",
    bg: "bg-transparent",
  },
  {
    label: "未学习",
    value: 160,
    color: "text-destructive",
    borderColor: "border-transparent",
    bg: "bg-transparent",
  },
]

export function LearningStats() {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <BarChart3 className="size-4 text-primary" />
          学习统计
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center gap-1 rounded-xl border ${stat.borderColor} ${stat.bg} p-3`}
          >
            <span className={`text-3xl font-bold ${stat.color}`}>
              {stat.value}
            </span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
