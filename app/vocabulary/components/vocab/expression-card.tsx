"use client"

import { Bookmark } from "lucide-react"

export function ExpressionCard({ item, hideChinese, isFavorited, onToggleFav }: { item: any; hideChinese: boolean; isFavorited: boolean; onToggleFav: () => void }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden">
      {/* 顶部橙色装饰条 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#f97316]" />

      <div className="flex items-start justify-between mb-5">
        <h4 className="text-lg font-bold text-foreground leading-snug">{item.expression}</h4>
        <button onClick={onToggleFav} className={`p-1.5 rounded-lg transition-colors shrink-0 ml-2 ${isFavorited ? "text-amber-500 bg-amber-50" : "text-muted-foreground hover:bg-accent"}`}>
          <Bookmark className="size-5" fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="mt-auto flex-1 space-y-4">
        <div>
          <p className="text-xs text-orange-800/70 mb-2 font-medium">地道表达解析</p>
          <div
            className={`bg-orange-50/80 text-orange-900 px-4 py-4 rounded-xl text-sm border border-orange-100 [&>p]:mb-3 last:[&>p]:mb-0 [&>b]:text-orange-950 leading-relaxed ${hideChinese ? "blur-sm select-none" : ""}`}
            dangerouslySetInnerHTML={{ __html: item.expression_explanation || item.analysis || '' }}
          />
        </div>
        
        {/* 兼容旧版的例句 */}
        {item.example && (
          <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/30 rounded-r-lg px-3 py-2.5">
            <p className="text-sm text-foreground italic leading-relaxed">{item.example.en}</p>
            <p className={`text-sm text-muted-foreground mt-1 leading-relaxed ${hideChinese ? "blur-sm select-none" : ""}`}>
              {item.example.zh}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}