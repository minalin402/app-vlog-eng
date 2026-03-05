"use client"

import { Volume2, Bookmark } from "lucide-react"

export function WordCard({ item, hideChinese, isFavorited, onToggleFav }: { item: any; hideChinese: boolean; isFavorited: boolean; onToggleFav: () => void }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden">
      {/* 顶部绿色装饰条 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#22c55e]" />
      
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-2xl font-bold text-foreground">{item.word || item.title}</h4>
        <button onClick={onToggleFav} className={`p-1.5 rounded-lg transition-colors ${isFavorited ? "text-amber-500 bg-amber-50" : "text-muted-foreground hover:bg-accent"}`}>
          <Bookmark className="size-5" fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <span className="text-sm text-muted-foreground font-mono">{item.phonetic}</span>
        <button className="p-1.5 rounded-full bg-accent hover:bg-accent/80 transition-colors">
          <Volume2 className="size-4 text-foreground" />
        </button>
      </div>

      <div className="space-y-4 mt-auto flex-1">
        <div>
          <p className="text-xs text-muted-foreground mb-1 font-medium">中文释义</p>
          <p className={`text-base text-foreground leading-relaxed font-medium ${hideChinese ? "blur-sm select-none" : ""}`}>
            {item.chinese_definition || item.meaningZh}
          </p>
        </div>
        
        {(item.english_definition || item.meaningEn) && (
          <div>
            <p className="text-xs text-green-700/70 mb-1 font-medium">英文释义</p>
            <div className="bg-green-50 text-green-800 px-3 py-2.5 rounded-xl text-xs leading-relaxed border border-green-100">
              {item.english_definition || item.meaningEn}
            </div>
          </div>
        )}

        {/* 兼容旧版的例句，加上了长度校验防崩溃 */}
        {item.examples && item.examples.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {item.examples.map((ex: any, i: number) => (
              <div key={i} className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/30 rounded-r-lg px-3 py-2">
                <p className="text-sm text-foreground italic">{ex.en}</p>
                <p className={`text-xs text-muted-foreground mt-1 ${hideChinese ? "blur-sm select-none" : ""}`}>{ex.zh}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}