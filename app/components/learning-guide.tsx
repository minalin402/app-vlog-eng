import { MessageSquare, ChevronUp, CheckSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"

export function LearningGuide() {
  return (
    <Card className="w-full border-border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MessageSquare className="size-4 text-primary" />
            学习消息
          </CardTitle>
          <ChevronUp className="size-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-lg">🚩</span>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-foreground">
                学习指南
              </span>
              <div className="flex items-start gap-1.5">
                <CheckSquare className="mt-0.5 size-3.5 shrink-0 text-success" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {'学习交流&问题反馈，添加微信号：toSeeBrightFuture，备注"油管"'}
                </p>
              </div>
              <span className="text-[11px] text-primary/60">2025/12/14</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
