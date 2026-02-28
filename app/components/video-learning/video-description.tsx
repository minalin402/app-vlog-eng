"use client"

import { BookOpen } from "lucide-react"

export function VideoDescription() {
  return (
    <div className="bg-card rounded-2xl shadow-md p-4">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="size-5 text-[#3b82f6]" />
        <h2 className="font-semibold text-foreground">视频简介</h2>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        面对外界高期待，英语里怎么既直白又不失分寸？谷爱凌在这段采访里给了非常标准的示范。除了观点，你还能学到 to be quite frank with you、have never been done before 这类高频可迁移表达。
      </p>
    </div>
  )
}
