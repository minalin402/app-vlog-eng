import { MessageSquare, ChevronUp, CheckSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"

export function LearningGuide() {
  return (
    <Card className="w-full border-border shadow-sm">
      <CardHeader className="pb-0 -mt-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1 text-sm font-semibold text-foreground">
            <MessageSquare className="size-4 text-primary" />
            学习指南
          </CardTitle>
          <ChevronUp className="size-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-start gap-2.5">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start gap-1.5">
                <CheckSquare className="mt-0.5 size-3.5 shrink-0 text-success" />
                
                {/* ✨ 修改区域：将单段纯文本拆分为带有样式的结构化内容 */}
                <div className="text-xs leading-relaxed text-muted-foreground flex flex-col gap-1.5">
                  <p className="font-medium text-foreground">建议用3遍法来学习：</p>
                  
                  <p>1️⃣ <span className="font-semibold text-primary">【无字幕盲听】</span>试试看能听懂多少。能理解70-80%说明本期材料难度适合你，否则建议换其他期简单的材料~</p>
                  
                  <p>2️⃣ <span className="font-semibold text-primary">【有字幕降速听】</span>深度理解。配合重点词汇的讲解，借助降速和字幕尽量听懂；</p>
                  
                  <p>3️⃣ <span className="font-semibold text-primary">【无字幕精听】</span>感受进步。再次回到原速无字幕，感受听力练习，以及感受自己的进步。</p>
                  
                  <div className="mt-1 pt-2 border-t border-primary/10">
                    （学习交流&问题反馈，添加微信号：<span className="font-bold text-foreground select-all tracking-wide">toSeeBrightFuture</span>，备注"油管"）
                  </div>
                </div>
                {/* ✨ 修改区域结束 */}

              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}