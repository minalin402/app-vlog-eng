"use client"

import { Volume2, Bookmark } from "lucide-react"

// 🎙️ 独立的文本转语音助手
const playTTS = (text: string, e?: React.MouseEvent) => {
  if (e) e.stopPropagation()
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel() // 打断正在播放的语音
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-US" // 美式发音
    utterance.rate = 0.85    // 稍微放慢语速，更适合学习听音
    window.speechSynthesis.speak(utterance)
  }
}

export function WordCard({ item, hideChinese, isFavorited, onToggleFav }: { item: any; hideChinese: boolean; isFavorited: boolean; onToggleFav: () => void }) {
  const wordText = item.word || item.title

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden">
      {/* 顶部绿色装饰条 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#22c55e]" />
      
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-2xl font-bold text-foreground">{wordText}</h4>
        <button onClick={onToggleFav} className={`p-1.5 rounded-lg transition-colors ${isFavorited ? "text-amber-500 bg-amber-50" : "text-muted-foreground hover:bg-accent"}`}>
          <Bookmark className="size-5" fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          {/* ✨ 新增：醒目的词性展示 */}
          {item.pos && (
            <span className="text-xs font-semibold text-grey-100  px-.5 py-0 rounded italic">
              {item.pos}
            </span>
          )}
          {item.phonetic && (
            <span className="text-sm text-muted-foreground font-mono">{item.phonetic}</span>
          )}
        </div>
        {/* ✨ 新增：绑定发音事件 */}
        <button 
          onClick={(e) => playTTS(wordText, e)} 
          className="p-1.5 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors group"
          title="点击发音"
        >
          <Volume2 className="size-4 text-blue-500 group-hover:text-blue-600" />
        </button>
      </div>

      <div className="space-y-4 mt-auto flex-1">
        <div>
          <p className="text-xs text-muted-foreground mb-1 font-medium">中文释义</p>
          <p className={`text-base text-foreground leading-relaxed font-medium transition-all duration-300 ${hideChinese ? "blur-sm select-none opacity-50" : ""}`}>
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

        {item.examples && item.examples.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {item.examples.map((ex: any, i: number) => (
              <div key={i} className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/30 rounded-r-lg px-3 py-2">
                <p className="text-sm text-foreground italic">{ex.en}</p>
                <p className={`text-xs text-muted-foreground mt-1 transition-all duration-300 ${hideChinese ? "blur-sm select-none opacity-50" : ""}`}>{ex.zh}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}