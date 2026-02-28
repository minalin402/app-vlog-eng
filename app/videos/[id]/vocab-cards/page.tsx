"use client"

import { useState } from "react"
import { ChevronLeft, Volume2, Bookmark, PlayCircle, Star, ChevronRight } from "lucide-react"
import Link from "next/link"
import { allVocab, type VocabWord } from "@/lib/video-data"

type FilterType = "all" | "favorited"

const TYPE_COLORS = {
  word: { bg: "bg-[#dcfce7]", border: "border-[#bbf7d0]", hoverBg: "hover:bg-[#bbf7d0]", text: "text-[#166534]", label: "单词卡" },
  phrase: { bg: "bg-[#dbeafe]", border: "border-[#bfdbfe]", hoverBg: "hover:bg-[#bfdbfe]", text: "text-[#1e40af]", label: "短语卡" },
  expression: { bg: "bg-[#fce7f3]", border: "border-[#fbcfe8]", hoverBg: "hover:bg-[#fbcfe8]", text: "text-[#9d174d]", label: "表达卡" },
}

export default function VocabCardsPage() {
  const [filter, setFilter] = useState<FilterType>("all")
  const [activeType, setActiveType] = useState<"word" | "phrase" | "expression" | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [favState, setFavState] = useState<Record<string, boolean>>({})

  const words = allVocab.filter((v) => v.type === "word")
  const phrases = allVocab.filter((v) => v.type === "phrase")
  const expressions = allVocab.filter((v) => v.type === "expression")

  const toggleFav = (word: string) => {
    setFavState((prev) => ({ ...prev, [word]: !prev[word] }))
  }

  // Single card detail view (swipeable)
  if (activeType) {
    const allOfType = activeType === "word" ? words : activeType === "phrase" ? phrases : expressions
    const list = filter === "favorited" ? allOfType.filter((v) => favState[v.word]) : allOfType
    const current = list[currentCardIndex]

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="flex items-center px-4 py-3 border-b border-border bg-card shrink-0">
          <button onClick={() => { setActiveType(null); setCurrentCardIndex(0) }} className="p-1 mr-2" aria-label="返回">
            <ChevronLeft className="size-5 text-foreground" />
          </button>
          <h1 className="text-sm font-medium text-muted-foreground flex-1 text-center mr-7">
            {currentCardIndex + 1}/{list.length}
          </h1>
        </header>

        {list.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">暂无收藏内容</p>
          </div>
        ) : current ? (
          <div className="flex-1 overflow-y-auto p-4">
            {activeType === "expression" ? (
              <ExpressionDetailCard
                vocab={current}
                isFavorited={favState[current.word] || false}
                onToggleFav={toggleFav}
              />
            ) : (
              <WordDetailCard
                vocab={current}
                isFavorited={favState[current.word] || false}
                onToggleFav={toggleFav}
              />
            )}

            {/* Navigation arrows */}
            <div className="flex items-center justify-between px-4 mt-6">
              <button
                onClick={() => setCurrentCardIndex(Math.max(0, currentCardIndex - 1))}
                disabled={currentCardIndex === 0}
                className="flex items-center gap-1 text-sm text-muted-foreground disabled:opacity-30"
              >
                <ChevronLeft className="size-4" /> 上一个
              </button>
              <button
                onClick={() => setCurrentCardIndex(Math.min(list.length - 1, currentCardIndex + 1))}
                disabled={currentCardIndex >= list.length - 1}
                className="flex items-center gap-1 text-sm text-muted-foreground disabled:opacity-30"
              >
                下一个 <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  // Overview: filter + category cards
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center px-4 py-3 border-b border-border bg-card shrink-0">
        <Link href="/" className="p-1 mr-2" aria-label="返回">
          <ChevronLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="text-base font-bold text-foreground flex-1 text-center mr-7">
          英语卡片
        </h1>
      </header>

      <div className="flex-1 p-4">
        {/* Filter chips: only 全部 and 已收藏 */}
        <div className="flex gap-2 mb-5">
          {([
            { key: "all" as const, label: "全部" },
            { key: "favorited" as const, label: "已收藏" },
          ]).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === f.key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Type cards */}
        <div className="flex flex-col gap-3">
          {(["word", "phrase", "expression"] as const).map((type) => {
            const colors = TYPE_COLORS[type]
            const allOfType = type === "word" ? words : type === "phrase" ? phrases : expressions
            const count = filter === "favorited"
              ? allOfType.filter((v) => favState[v.word]).length
              : allOfType.length
            return (
              <button
                key={type}
                onClick={() => { setActiveType(type); setCurrentCardIndex(0) }}
                className={`flex items-center justify-between px-5 py-4 rounded-xl ${colors.bg} border ${colors.border} transition-colors ${colors.hoverBg}`}
              >
                <span className={`text-sm font-bold ${colors.text}`}>{colors.label}</span>
                <span className="size-8 rounded-full bg-card text-sm font-medium text-foreground flex items-center justify-center shadow-sm">
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function WordDetailCard({
  vocab,
  isFavorited,
  onToggleFav,
}: {
  vocab: VocabWord
  isFavorited: boolean
  onToggleFav: (word: string) => void
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-end gap-2 mb-2">
        <button
          onClick={() => onToggleFav(vocab.word)}
          className={`p-1 rounded-lg transition-colors ${
            isFavorited ? "text-[#f59e0b]" : "text-muted-foreground/30 hover:text-muted-foreground/60"
          }`}
          aria-label={isFavorited ? "取消收藏" : "收藏"}
        >
          <Star className="size-5" fill={isFavorited ? "#f59e0b" : "none"} />
        </button>
      </div>

      <h3 className="text-2xl font-bold text-foreground text-center">{vocab.word}</h3>
      <div className="flex items-center justify-center gap-2 mt-1 mb-3">
        {vocab.phonetic && <span className="text-sm text-muted-foreground font-mono">{vocab.phonetic}</span>}
        <button className="p-1 rounded-full hover:bg-accent transition-colors" aria-label="发音">
          <Volume2 className="size-4 text-muted-foreground" />
        </button>
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-sm font-semibold text-foreground">
          {vocab.pos} {vocab.meaningCn}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#dcfce7] text-[#166534] font-medium">同义词</span>
          <span className="text-xs text-muted-foreground">{vocab.meaningEn}</span>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs text-[#3b82f6] font-semibold mb-2">字幕例句</p>
        {vocab.examples.map((ex, i) => (
          <div key={i} className="bg-muted/50 rounded-lg p-3 mb-2 border-l-3 border-[#3b82f6]">
            <p className="text-xs text-foreground leading-relaxed">{ex.en}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ex.cn}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <PlayCircle className="size-3.5 text-[#3b82f6]" />
              <span className="text-[10px] text-[#3b82f6] font-medium">0.03s - 4.37s</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExpressionDetailCard({
  vocab,
  isFavorited,
  onToggleFav,
}: {
  vocab: VocabWord
  isFavorited: boolean
  onToggleFav: (word: string) => void
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-end gap-2 mb-3">
        <button
          onClick={() => onToggleFav(vocab.word)}
          className={`p-1 rounded-lg transition-colors ${
            isFavorited ? "text-[#f59e0b]" : "text-muted-foreground/30 hover:text-muted-foreground/60"
          }`}
          aria-label={isFavorited ? "取消收藏" : "收藏"}
        >
          <Star className="size-5" fill={isFavorited ? "#f59e0b" : "none"} />
        </button>
      </div>

      <h3 className="text-2xl font-bold text-foreground text-center mb-4">{vocab.word}</h3>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-semibold text-[#1e3a5f] mb-4">表达解析</p>

        {vocab.sourceEn && (
          <div className="mb-4">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="mr-1">{"📝"}</span>
              <span className="text-muted-foreground">字幕原句：</span>
              {vocab.sourceEn}
            </p>
          </div>
        )}

        {vocab.sourceCn && (
          <div className="mb-4">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="text-xs text-muted-foreground font-mono mr-1">CN</span>
              <span className="text-muted-foreground">中文翻译：</span>
              {vocab.sourceCn}
            </p>
          </div>
        )}

        {vocab.analysis && (
          <div className="mb-4">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="mr-1">{"💡"}</span>
              <span className="text-muted-foreground">表达解析：</span>
            </p>
            <p className="text-sm text-foreground leading-relaxed mt-1 pl-6">{vocab.analysis}</p>
          </div>
        )}

        {vocab.usageScene && (
          <div className="mb-4">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="mr-1">{"🎯"}</span>
              <span className="text-muted-foreground">使用场景：</span>
            </p>
            <p className="text-sm text-foreground leading-relaxed mt-1 pl-6">{vocab.usageScene}</p>
          </div>
        )}

        {vocab.similar && (
          <div className="mb-4">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="mr-1">{"🔄"}</span>
              <span className="text-muted-foreground">相似表达：</span>
            </p>
            <p className="text-sm text-foreground leading-relaxed mt-1 pl-6">{vocab.similar}</p>
          </div>
        )}
      </div>

      {/* 字幕原句 with playback */}
      <div className="border-t border-border pt-4 mt-2">
        <p className="text-sm font-semibold text-foreground mb-2">字幕原句</p>
        <div className="bg-muted/50 rounded-lg p-3 border-l-3 border-[#3b82f6]">
          <p className="text-sm text-foreground leading-relaxed italic">{vocab.sourceEn}</p>
          {vocab.sourceCn && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{vocab.sourceCn}</p>
          )}
          <div className="flex items-center gap-1.5 mt-2">
            <button className="flex items-center justify-center size-7 rounded-full bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 transition-colors">
              <PlayCircle className="size-4 text-[#3b82f6]" />
            </button>
            <span className="text-xs text-muted-foreground">9.80s - 12.37s</span>
          </div>
        </div>
      </div>
    </div>
  )
}
