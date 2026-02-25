"use client"

import { useState } from "react"
import { Volume2, Eye, EyeOff, Bookmark, PlayCircle } from "lucide-react"
import { allVocab, type VocabWord } from "@/lib/video-data"

interface VocabPanelProps {
  open: boolean
  onClose: () => void
}

export function VocabPanel({ open, onClose }: VocabPanelProps) {
  const [activeTab, setActiveTab] = useState<"word" | "phrase" | "expression">("word")
  const [hideChinese, setHideChinese] = useState(false)
  const [favState, setFavState] = useState<Record<string, boolean>>({})

  if (!open) return null

  const words = allVocab.filter((v) => v.type === "word")
  const phrases = allVocab.filter((v) => v.type === "phrase")
  const expressions = allVocab.filter((v) => v.type === "expression")

  const currentList =
    activeTab === "word" ? words : activeTab === "phrase" ? phrases : expressions

  const toggleFav = (word: string) => {
    setFavState((prev) => ({ ...prev, [word]: !prev[word] }))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab header */}
      <div className="flex gap-2 px-3 pt-3 pb-2 shrink-0 z-10 border-b border-border/40">
        {(
          [
            { key: "word" as const, label: `单词 (${words.length})` },
            { key: "phrase" as const, label: `短语 (${phrases.length})` },
            { key: "expression" as const, label: `地道表达 (${expressions.length})` },
          ]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-[#3b82f6] text-[#ffffff]"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toggle controls */}
      <div className="flex gap-2 px-3 py-2 shrink-0">
        <button
          onClick={() => setHideChinese(!hideChinese)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            hideChinese ? "bg-[#eff6ff] text-[#3b82f6]" : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          {hideChinese ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
          隐藏标注
        </button>
      </div>

      {/* Scrollable word list */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {currentList.map((vocab) => (
          activeTab === "expression" ? (
            <ExpressionCard
              key={vocab.word}
              vocab={vocab}
              hideChinese={hideChinese}
              isFavorited={favState[vocab.word] || false}
              onToggleFav={toggleFav}
            />
          ) : (
            <WordCard
              key={vocab.word}
              vocab={vocab}
              hideChinese={hideChinese}
              isFavorited={favState[vocab.word] || false}
              onToggleFav={toggleFav}
            />
          )
        ))}
        {currentList.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">暂无内容</p>
        )}
      </div>
    </div>
  )
}

function WordCard({
  vocab,
  hideChinese,
  isFavorited,
  onToggleFav,
}: {
  vocab: VocabWord
  hideChinese: boolean
  isFavorited: boolean
  onToggleFav: (word: string) => void
}) {
  return (
    <div className="bg-muted/40 rounded-xl p-4 hover:bg-muted/70 transition-colors">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h4 className="text-lg font-bold text-foreground">{vocab.word}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            {vocab.phonetic && (
              <span className="text-sm text-muted-foreground">{vocab.phonetic}</span>
            )}
            <button className="p-0.5 rounded-full hover:bg-accent transition-colors" aria-label="发音">
              <Volume2 className="size-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
        <button
          onClick={() => onToggleFav(vocab.word)}
          className={`p-1.5 rounded-lg transition-colors ${
            isFavorited ? "text-[#f59e0b]" : "text-muted-foreground/30 hover:text-muted-foreground/50"
          }`}
          aria-label={isFavorited ? "取消收藏" : "收藏"}
        >
          <Bookmark className="size-4" fill={isFavorited ? "#f59e0b" : "none"} />
        </button>
      </div>

      <div className="mt-2">
        <p className="text-sm text-foreground">
          <span className="text-muted-foreground mr-1">{vocab.pos}</span>
          {!hideChinese && vocab.meaningCn}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{vocab.meaningEn}</p>
      </div>

      {vocab.examples.map((ex, i) => (
        <div key={i} className="bg-muted/60 rounded-lg p-2.5 mt-2 border-l-3 border-[#3b82f6]">
          <p className="text-xs text-foreground leading-relaxed">
            {'"'}{ex.en}{'"'}
          </p>
          {!hideChinese && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {'"'}{ex.cn}{'"'}
            </p>
          )}
        </div>
      ))}

      <div className="flex items-center mt-2">
        <button className="flex items-center gap-1 text-xs text-[#3b82f6] font-medium hover:underline">
          <PlayCircle className="size-3.5" />
          点读跳转
        </button>
      </div>
    </div>
  )
}

function ExpressionCard({
  vocab,
  hideChinese,
  isFavorited,
  onToggleFav,
}: {
  vocab: VocabWord
  hideChinese: boolean
  isFavorited: boolean
  onToggleFav: (word: string) => void
}) {
  return (
    <div className="bg-muted/40 rounded-xl p-5 hover:bg-muted/70 transition-colors">
      {/* Title row */}
      <div className="flex items-start justify-between mb-4">
        <h4 className="text-lg font-bold text-foreground leading-snug">{vocab.word}</h4>
        <button
          onClick={() => onToggleFav(vocab.word)}
          className={`p-1.5 rounded-lg transition-colors shrink-0 ml-2 ${
            isFavorited ? "text-[#f59e0b]" : "text-muted-foreground/30 hover:text-muted-foreground/50"
          }`}
          aria-label={isFavorited ? "取消收藏" : "收藏"}
        >
          <Bookmark className="size-4" fill={isFavorited ? "#f59e0b" : "none"} />
        </button>
      </div>

      {/* Source sentence */}
      {vocab.sourceEn && (
        <div className="mb-3">
          <p className="text-xs text-foreground leading-relaxed">
            <span className="inline-flex items-center justify-center size-4 rounded bg-[#dbeafe] text-[8px] font-bold text-[#3b82f6] mr-1.5 align-text-bottom">EN</span>
            <span className="text-muted-foreground">字幕原句：</span>
            {vocab.sourceEn}
          </p>
        </div>
      )}

      {/* Chinese translation */}
      {!hideChinese && vocab.sourceCn && (
        <div className="mb-3">
          <p className="text-xs text-foreground leading-relaxed">
            <span className="inline-flex items-center justify-center size-4 rounded bg-muted text-[8px] font-bold text-muted-foreground mr-1.5 align-text-bottom">CN</span>
            <span className="text-muted-foreground">中文翻译：</span>
            {vocab.sourceCn}
          </p>
        </div>
      )}

      {/* Analysis */}
      {vocab.analysis && (
        <div className="bg-[#fefce8] rounded-lg p-3 mb-3">
          <p className="text-xs font-medium text-[#92400e] mb-1">表达解析：</p>
          <p className="text-xs text-foreground leading-relaxed">{vocab.analysis}</p>
        </div>
      )}

      {/* Usage scene */}
      {vocab.usageScene && (
        <div className="bg-[#fdf2f8] rounded-lg p-3 mb-3">
          <p className="text-xs font-medium text-[#9d174d] mb-1">使用场景：</p>
          <p className="text-xs text-foreground leading-relaxed">{vocab.usageScene}</p>
        </div>
      )}

      {/* Similar expressions */}
      {vocab.similar && (
        <div className="bg-[#eff6ff] rounded-lg p-3 mb-3">
          <p className="text-xs font-medium text-[#1d4ed8] mb-1">相似表达：</p>
          <p className="text-xs text-foreground leading-relaxed">{vocab.similar}</p>
        </div>
      )}

      {/* Source sentence playback */}
      <div className="bg-muted/50 rounded-lg p-3 border-l-3 border-[#3b82f6]">
        <p className="text-xs text-foreground leading-relaxed italic">{vocab.sourceEn}</p>
        {!hideChinese && vocab.sourceCn && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{vocab.sourceCn}</p>
        )}
        <div className="flex items-center gap-1.5 mt-2">
          <button className="flex items-center justify-center size-6 rounded-full bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 transition-colors">
            <PlayCircle className="size-3.5 text-[#3b82f6]" />
          </button>
          <span className="text-[10px] text-muted-foreground">9.80s - 12.37s</span>
        </div>
      </div>

      {/* Click to jump */}
      <div className="flex items-center mt-3">
        <button className="flex items-center gap-1 text-xs text-[#3b82f6] font-medium hover:underline">
          <PlayCircle className="size-3.5" />
          点读跳转
        </button>
      </div>
    </div>
  )
}
