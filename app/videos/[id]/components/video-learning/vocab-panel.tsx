"use client"

import { useState } from "react"
import { Volume2, Eye, EyeOff, Bookmark, PlayCircle } from "lucide-react"
import type { VocabItem, PhraseItem, ExpressionItem } from "@/lib/video-data"

// 🎙️ 全局发音助手
const playTTS = (text: string, e?: React.MouseEvent) => {
  if (e) e.stopPropagation()
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-US" // 默认美式口音
    utterance.rate = 0.9 // 稍微放慢，适合学习
    window.speechSynthesis.speak(utterance)
  }
}

interface VocabPanelProps {
  open: boolean
  onClose: () => void
  vocabularies?: VocabItem[]
  phrases?: PhraseItem[]
  expressions?: ExpressionItem[]
  onClickTimestamp?: (time: number) => void
  favState: Record<string, boolean>
  onToggleFav: (id: string, type: "word" | "phrase" | "expression") => void
}

export function VocabPanel({
  open,
  onClose,
  vocabularies = [],
  phrases = [],
  expressions = [],
  onClickTimestamp,
  favState,
  onToggleFav,
}: VocabPanelProps) {
  const [activeTab, setActiveTab] = useState<"word" | "phrase" | "expression">("word")
  const [hideChineseGlobal, setHideChineseGlobal] = useState(false)

  if (!open) return null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header: tabs row */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 shrink-0">
        {([
          { key: "word" as const, label: `单词 (${vocabularies.length})` },
          { key: "phrase" as const, label: `短语 (${phrases.length})` },
          { key: "expression" as const, label: `地道表达 (${expressions.length})` },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-[#3b82f6] text-white"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Second row: hide Chinese button */}
      <div className="px-3 pb-2 shrink-0 border-b border-border/40">
        <button
          onClick={() => setHideChineseGlobal(!hideChineseGlobal)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-accent transition-colors"
        >
          {hideChineseGlobal ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          隐藏中文
        </button>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {activeTab === "word" && vocabularies.map((vocab) => (
          <WordCard 
            key={vocab.id} 
            vocab={vocab} 
            hideChinese={hideChineseGlobal} 
            onClickTimestamp={onClickTimestamp} 
            isFavorited={!!favState[vocab.id]} 
            onToggleFav={() => onToggleFav(String(vocab.id), "word")} 
          />
        ))}
        {activeTab === "phrase" && phrases.map((phrase) => (
          <PhraseCard 
            key={phrase.id} 
            phrase={phrase} 
            hideChinese={hideChineseGlobal} 
            onClickTimestamp={onClickTimestamp} 
            isFavorited={!!favState[phrase.id]} 
            onToggleFav={() => onToggleFav(String(phrase.id), "phrase")} 
          />
        ))}
        {activeTab === "expression" && expressions.map((expr) => (
          <ExpressionCard 
            key={expr.id} 
            expression={expr} 
            hideChinese={hideChineseGlobal} 
            onClickTimestamp={onClickTimestamp} 
            isFavorited={!!favState[expr.id]} 
            onToggleFav={() => onToggleFav(String(expr.id), "expression")} 
          />
        ))}
        {activeTab === "word" && vocabularies.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">暂无单词</p>}
        {activeTab === "phrase" && phrases.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">暂无短语</p>}
        {activeTab === "expression" && expressions.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">暂无地道表达</p>}
      </div>
    </div>
  )
}

function WordCard({ vocab, hideChinese, onClickTimestamp, isFavorited, onToggleFav }: any) {
  return (
    <div className="bg-muted/40 rounded-xl p-4 hover:bg-muted/70 transition-colors">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h4 className="text-lg font-bold text-foreground">{vocab.word}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            {vocab.phonetic && <span className="text-sm text-muted-foreground">{vocab.phonetic}</span>}
            {/* ✨ 加入发音事件 */}
            <button onClick={(e) => playTTS(vocab.word, e)} className="p-0.5 rounded-full hover:bg-accent text-[#3b82f6] transition-colors" aria-label="发音">
              <Volume2 className="size-3.5" />
            </button>
          </div>
        </div>
        <button
          onClick={onToggleFav}
          className={`p-1.5 rounded-lg transition-colors ${isFavorited ? "text-amber-500" : "text-muted-foreground/30 hover:text-muted-foreground/50"}`}
        >
          <Bookmark className="size-4" fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="mt-2">
        {!hideChinese && (
          <p className="text-sm text-foreground mb-2">
            {/* ✨ 加上词性 */}
            {vocab.pos && <span className="text-muted-foreground mr-1.5 font-mono italic">{vocab.pos}</span>}
            {vocab.chinese_definition}
          </p>
        )}
        {/* ✨ 去掉英文释义，换成近义词 */}
        {vocab.synonyms && <div className="bg-green-50 text-green-700 px-2 py-1.5 rounded text-xs mt-1 font-medium">近义: {vocab.synonyms}</div>}
      </div>
      <div className="bg-muted/60 rounded-lg p-2.5 mt-2 border-l-3 border-green-500">
        <p className="text-xs text-foreground leading-relaxed">{'"'}{vocab.example_from_video}{'"'}</p>
        {!hideChinese && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{'"'}{vocab.example_translation}{'"'}</p>}
      </div>
      <div className="flex items-center justify-start mt-3">
        <button onClick={() => onClickTimestamp?.(vocab.first_appearance_time)} className="flex items-center gap-1 text-xs text-green-600 font-medium hover:underline border border-green-500 rounded-lg px-2.5 py-1.5">
          <PlayCircle className="size-3.5" /> 点读跳转
        </button>
      </div>
    </div>
  )
}

function PhraseCard({ phrase, hideChinese, onClickTimestamp, isFavorited, onToggleFav }: any) {
  return (
    <div className="bg-muted/40 rounded-xl p-4 hover:bg-muted/70 transition-colors">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h4 className="text-lg font-bold text-foreground">{phrase.phrase}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            {phrase.phonetic && <span className="text-sm text-muted-foreground">{phrase.phonetic}</span>}
            {/* ✨ 加入发音事件 */}
            <button onClick={(e) => playTTS(phrase.phrase, e)} className="p-0.5 rounded-full hover:bg-accent text-[#3b82f6] transition-colors" aria-label="发音">
              <Volume2 className="size-3.5" />
            </button>
          </div>
        </div>
        <button
          onClick={onToggleFav}
          className={`p-1.5 rounded-lg transition-colors ${isFavorited ? "text-amber-500" : "text-muted-foreground/30 hover:text-muted-foreground/50"}`}
        >
          <Bookmark className="size-4" fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="mt-2">
        {!hideChinese && <p className="text-sm text-foreground">{phrase.chinese_definition}</p>}
        {phrase.synonyms && <div className="bg-blue-50 text-blue-700 px-2 py-1.5 rounded text-xs mt-1 font-medium">近义: {phrase.synonyms}</div>}
      </div>
      <div className="bg-muted/60 rounded-lg p-2.5 mt-2 border-l-3 border-blue-500">
        <p className="text-xs text-foreground leading-relaxed">{'"'}{phrase.context}{'"'}</p>
        {!hideChinese && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{'"'}{phrase.context_translation}{'"'}</p>}
      </div>
      <div className="flex items-center justify-start mt-3">
        <button onClick={() => onClickTimestamp?.(phrase.first_appearance_time)} className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline border border-blue-500 rounded-lg px-2.5 py-1.5">
          <PlayCircle className="size-3.5" /> 点读跳转
        </button>
      </div>
    </div>
  )
}

function ExpressionCard({ expression, hideChinese, onClickTimestamp, isFavorited, onToggleFav }: any) {
  return (
    <div className="bg-muted/40 rounded-xl p-5 hover:bg-muted/70 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-bold text-foreground leading-snug">{expression.expression}</h4>
          {/* ✨ 加入发音事件 */}
          <button onClick={(e) => playTTS(expression.expression, e)} className="p-0.5 rounded-full hover:bg-accent text-[#3b82f6] transition-colors" aria-label="发音">
            <Volume2 className="size-4" />
          </button>
        </div>
        <button
          onClick={onToggleFav}
          className={`p-1.5 rounded-lg transition-colors shrink-0 ml-2 ${isFavorited ? "text-amber-500" : "text-muted-foreground/30 hover:text-muted-foreground/50"}`}
        >
          <Bookmark className="size-4" fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>
      {!hideChinese && (
        <div className="bg-amber-50 rounded-lg p-3 mb-3 text-sm text-gray-700 leading-relaxed [&>p]:mb-3 [&>b]:text-gray-900 [&>p>b]:text-gray-900" dangerouslySetInnerHTML={{ __html: expression.expression_explanation }} />
      )}
      <div className="flex items-center justify-start mt-3">
        <button onClick={() => onClickTimestamp?.(expression.first_appearance_time)} className="flex items-center gap-1 text-xs text-orange-600 font-medium hover:underline border border-orange-500 rounded-lg px-2.5 py-1.5">
          <PlayCircle className="size-3.5" /> 点读跳转
        </button>
      </div>
    </div>
  )
}