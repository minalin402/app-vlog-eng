"use client"

import { Bookmark, Volume2 } from "lucide-react"

// 🎙️ 独立的文本转语音助手
const playTTS = (text: string, e?: React.MouseEvent) => {
  if (e) e.stopPropagation()
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-US"
    utterance.rate = 0.85 
    window.speechSynthesis.speak(utterance)
  }
}

export function ExpressionCard({ item, hideChinese, isFavorited, onToggleFav }: { item: any; hideChinese: boolean; isFavorited: boolean; onToggleFav: () => void }) {
  return (
    // 将这行代码里的 p-6 替换为 p-4 md:p-6
    <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden">      {/* 顶部橙色装饰条 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#f97316]" />

      <div className="flex items-start justify-between mb-1">
        <div className="flex items-start gap-2">
          <h4 className="text-lg font-bold text-foreground leading-snug">{item.expression}</h4>
          {/* ✨ 新增：金句也加上发音按钮 */}
          <button 
            onClick={(e) => playTTS(item.expression, e)} 
            className="p-1 rounded-full bg-orange-50 hover:bg-orange-100 transition-colors shrink-0 mt-0.5 group"
            title="点击发音"
          >
            <Volume2 className="size-4 text-orange-500 group-hover:text-orange-600" />
          </button>
        </div>
        <button onClick={onToggleFav} className={`p-1.5 rounded-lg transition-colors shrink-0 ml-2 ${isFavorited ? "text-amber-500 bg-amber-50" : "text-muted-foreground hover:bg-accent"}`}>
          <Bookmark className="size-5" fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>

      {/* ===== 从这里开始覆盖，直到最后 ===== */}
      <div className="flex flex-col gap-3 flex-1 mt-1">
        <div>
          <p className="text-xs text-orange-800/70 mb-1.5 font-medium">地道表达解析</p>
          <div
            className={`bg-orange-50/80 text-orange-900 px-4 py-3.5 rounded-xl text-sm border border-orange-100 [&>p]:mb-2 last:[&>p]:mb-0 [&>b]:text-orange-950 leading-relaxed transition-all duration-300 ${hideChinese ? "blur-sm select-none opacity-50" : ""}`}
            dangerouslySetInnerHTML={{ __html: item.expression_explanation || item.analysis || '' }}
          />
        </div>
        
        {item.example && (
          <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/30 rounded-r-lg px-3 py-2.5">
            <p className="text-sm text-foreground italic leading-relaxed">{item.example.en}</p>
            <p className={`text-xs text-muted-foreground mt-1.5 leading-relaxed transition-all duration-300 ${hideChinese ? "blur-sm select-none opacity-50" : ""}`}>
              {item.example.zh}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}