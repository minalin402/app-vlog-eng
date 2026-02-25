"use client"

import { Bookmark, Play } from "lucide-react"
import type { ExpressionItem } from "@/lib/vocab-data"

interface ExpressionCardProps {
  item: ExpressionItem
  hideChinese: boolean
}

export function ExpressionCard({ item, hideChinese }: ExpressionCardProps) {
  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <h3 className="text-xl font-bold text-foreground">{item.expression}</h3>
        <button className="text-muted-foreground hover:text-blue-500 transition-colors" aria-label="收藏">
          <Bookmark className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">EN</span>
          <span className="text-sm text-foreground">字幕原句：{item.subtitleEn}</span>
        </div>
        <div className={`flex items-center gap-2 ${hideChinese ? "blur-sm select-none" : ""}`}>
          <span className="text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">CN</span>
          <span className="text-sm text-foreground">中文翻译：{item.subtitleZh}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-bold text-orange-500 mb-1">表达解析：</h4>
          <p className={`text-sm text-foreground leading-relaxed ${hideChinese ? "blur-sm select-none" : ""}`}>
            {item.analysis}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-orange-500 mb-1">使用场景：</h4>
          <p className={`text-sm text-foreground leading-relaxed ${hideChinese ? "blur-sm select-none" : ""}`}>
            {item.usage}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-green-500 mb-1">相似表达：</h4>
          <p className="text-sm text-foreground">{item.similar}</p>
        </div>
      </div>

      <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30 rounded-r-lg px-3 py-2.5">
        <p className="text-sm text-foreground italic leading-relaxed">{item.example.en}</p>
        <p className={`text-sm text-muted-foreground mt-1 leading-relaxed ${hideChinese ? "blur-sm select-none" : ""}`}>
          {item.example.zh}
        </p>
        <div className="flex items-center gap-1.5 mt-2 text-blue-500">
          <Play className="h-3.5 w-3.5 fill-blue-500" />
          <span className="text-xs">{item.timestamp}</span>
        </div>
      </div>
    </div>
  )
}
