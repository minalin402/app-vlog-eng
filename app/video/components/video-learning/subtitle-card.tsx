"use client"

import { useState } from "react"
import { Play, Mic, SkipForward } from "lucide-react"
import type { SubtitleItem, ClickableWord, HighlightType } from "@/lib/video-data"

interface SubtitleCardProps {
  subtitle: SubtitleItem
  isActive: boolean
  subtitleMode: "bilingual" | "english" | "chinese"
  practiceMode: "none" | "shadowing" | "fill"
  fillBlankMode: boolean
  onClickWord: (word: ClickableWord, pos: { x: number; y: number }) => void
  onClickTimestamp: (time: number) => void
  fontSizeClass?: string
}

// Colors for different highlight types
const HIGHLIGHT_BORDER: Record<HighlightType, string> = {
  word: "border-[#22c55e]",
  phrase: "border-[#3b82f6]",
  expression: "border-[#f59e0b]",
}

const HIGHLIGHT_HOVER: Record<HighlightType, string> = {
  word: "hover:bg-[#dcfce7]",
  phrase: "hover:bg-[#dbeafe]",
  expression: "hover:bg-[#fef3c7]",
}

const BLANK_BG: Record<HighlightType, string> = {
  word: "bg-[#bbf7d0]",
  phrase: "bg-[#bfdbfe]",
  expression: "bg-[#fde68a]",
}

const BLANK_REVEAL_BG: Record<HighlightType, string> = {
  word: "bg-[#dcfce7]",
  phrase: "bg-[#dbeafe]",
  expression: "bg-[#fef3c7]",
}

function RenderEnglish({
  text,
  clickableWords,
  fillBlankMode,
  onClickWord,
  revealedBlanks,
  onToggleBlank,
}: {
  text: string
  clickableWords: ClickableWord[] | undefined
  fillBlankMode: boolean
  onClickWord: (word: ClickableWord, pos: { x: number; y: number }) => void
  revealedBlanks: Set<string>
  onToggleBlank: (word: string) => void
}) {
  if (!clickableWords || clickableWords.length === 0) {
    return <span>{text}</span>
  }

  const parts: React.ReactNode[] = []
  let remaining = text
  let keyIndex = 0

  const sorted = [...clickableWords].sort((a, b) => {
    const posA = text.toLowerCase().indexOf(a.word.toLowerCase())
    const posB = text.toLowerCase().indexOf(b.word.toLowerCase())
    return posA - posB
  })

  for (const cw of sorted) {
    const idx = remaining.toLowerCase().indexOf(cw.word.toLowerCase())
    if (idx === -1) continue

    if (idx > 0) {
      parts.push(<span key={`t-${keyIndex++}`}>{remaining.slice(0, idx)}</span>)
    }

    const matchedText = remaining.slice(idx, idx + cw.word.length)
    const ht = cw.highlightType || "word"

    if (fillBlankMode) {
      const isRevealed = revealedBlanks.has(cw.word)
      parts.push(
        <button
          key={`w-${keyIndex++}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleBlank(cw.word)
          }}
          className={`inline-block rounded px-1.5 py-0.5 mx-0.5 min-w-[50px] align-middle text-sm transition-colors cursor-pointer ${
            isRevealed ? `${BLANK_REVEAL_BG[ht]} text-foreground` : `${BLANK_BG[ht]} text-transparent select-none`
          }`}
          aria-label={isRevealed ? `隐藏: ${matchedText}` : "点击显示答案"}
        >
          {matchedText}
        </button>
      )
    } else {
      parts.push(
        <button
          key={`w-${keyIndex++}`}
          onClick={(e) => {
            e.stopPropagation()
            const rect = e.currentTarget.getBoundingClientRect()
            onClickWord(cw, { x: rect.left + rect.width / 2, y: rect.bottom })
          }}
          className={`inline-block border-b-2 ${HIGHLIGHT_BORDER[ht]} text-foreground ${HIGHLIGHT_HOVER[ht]} transition-colors rounded-sm px-0.5 cursor-pointer`}
        >
          {matchedText}
        </button>
      )
    }

    remaining = remaining.slice(idx + cw.word.length)
  }

  if (remaining) {
    parts.push(<span key={`t-${keyIndex++}`}>{remaining}</span>)
  }

  return <>{parts}</>
}

export function SubtitleCard({
  subtitle,
  isActive,
  subtitleMode,
  practiceMode,
  fillBlankMode,
  onClickWord,
  onClickTimestamp,
  fontSizeClass = "text-sm",
}: SubtitleCardProps) {
  const [revealedBlanks, setRevealedBlanks] = useState<Set<string>>(new Set())

  const handleToggleBlank = (word: string) => {
    setRevealedBlanks((prev) => {
      const next = new Set(prev)
      if (next.has(word)) {
        next.delete(word)
      } else {
        next.add(word)
      }
      return next
    })
  }

  return (
    <div
      className={`px-4 py-3 transition-colors border-l-3 ${
        isActive ? "bg-[#eff6ff] border-[#3b82f6]" : "border-transparent hover:bg-accent/40"
      }`}
    >
      <button
        onClick={() => onClickTimestamp(subtitle.startTime)}
        className={`text-xs font-mono mb-1 block ${
          isActive ? "text-[#3b82f6] font-semibold" : "text-muted-foreground"
        }`}
      >
        {subtitle.timeLabel}
      </button>

      {(subtitleMode === "bilingual" || subtitleMode === "english") && (
        <p className={`${fontSizeClass} font-medium text-foreground leading-relaxed`}>
          <RenderEnglish
            text={subtitle.english}
            clickableWords={subtitle.clickableWords}
            fillBlankMode={fillBlankMode}
            onClickWord={onClickWord}
            revealedBlanks={revealedBlanks}
            onToggleBlank={handleToggleBlank}
          />
        </p>
      )}

      {(subtitleMode === "bilingual" || subtitleMode === "chinese") && (
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {subtitle.chinese}
        </p>
      )}

      {/* Practice mode controls */}
      {practiceMode === "shadowing" && (
        <div className="flex items-center gap-2 mt-2">
          <button className="size-8 rounded-full bg-[#3b82f6] text-[#ffffff] flex items-center justify-center hover:bg-[#2563eb] transition-colors" aria-label="播放">
            <Play className="size-3.5" fill="#ffffff" />
          </button>
          <button className="size-8 rounded-full bg-[#ef4444] text-[#ffffff] flex items-center justify-center hover:bg-[#dc2626] transition-colors" aria-label="录音">
            <Mic className="size-3.5" />
          </button>
          <button className="size-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-accent transition-colors" aria-label="下一句">
            <SkipForward className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
