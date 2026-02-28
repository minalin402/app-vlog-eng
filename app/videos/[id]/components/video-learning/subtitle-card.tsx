"use client"

import { useState, useMemo, useEffect } from "react"
import { X, Volume2, Bookmark } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { SubtitleItem, ClickableWord, HighlightType, SubtitleToken, TokenType, VocabItem, PhraseItem, ExpressionItem } from "@/lib/video-data"
import { parseSubtitleText } from "@/lib/video-data"
import { ShadowingConsole } from "./shadowing-console"

interface SubtitleCardProps {
  subtitle: SubtitleItem
  isActive: boolean
  subtitleMode: "bilingual" | "english" | "chinese"
  practiceMode: "none" | "shadowing" | "fill"
  fillBlankMode: boolean
  onClickWord: (word: ClickableWord, pos: { x: number; y: number }) => void
  onClickTimestamp: (time: number) => void
  onPlaySegment?: (startTime: number, endTime: number) => void
  onPauseVideo?: () => void
  fontSizeClass?: string
  videoId?: string
  // Data sources for popover lookup
  vocabularies?: VocabItem[]
  phrases?: PhraseItem[]
  expressions?: ExpressionItem[]
}

// ─── Underline color config for tokens ────────────────────────────────────────
// w = word (green), p = phrase (blue), e = expression (orange)
const TOKEN_UNDERLINE: Record<TokenType, string> = {
  w: "decoration-green-500",
  p: "decoration-blue-500",
  e: "decoration-orange-500",
}

// Cloze mode: hidden background (solid color block)
// w=word→green, p=phrase→blue, e=expression→orange  (matches underline colors)
const TOKEN_CLOZE_HIDDEN_BG: Record<TokenType, string> = {
  w: "bg-green-200",
  p: "bg-blue-200",
  e: "bg-orange-200",
}

// Cloze mode: revealed background (lighter tint)
const TOKEN_CLOZE_REVEALED_BG: Record<TokenType, string> = {
  w: "bg-green-100",
  p: "bg-blue-100",
  e: "bg-orange-100",
}

// Cloze mode: revealed text color
const TOKEN_CLOZE_REVEALED_TEXT: Record<TokenType, string> = {
  w: "text-green-700",
  p: "text-blue-700",
  e: "text-orange-700",
}

// Legacy highlight types for backward compatibility with clickableWords
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

// ─── Word Popover Card ────────────────────────────────────────────────────────
function WordPopoverCard({
  vocab,
  onClose,
}: {
  vocab: VocabItem
  onClose: () => void
}) {
  const [isFavorited, setIsFavorited] = useState(false)

  return (
    <div className="w-64 p-3">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-lg font-bold text-foreground">{vocab.word}</h4>
        <button onClick={onClose} className="p-0.5 text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      {/* Phonetic + speaker */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-muted-foreground">{vocab.phonetic}</span>
        <button className="p-0.5 rounded-full hover:bg-accent" aria-label="发音">
          <Volume2 className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Chinese definition */}
      <p className="text-sm text-foreground mb-2">{vocab.chinese_definition}</p>

      {/* English definition in green box */}
      <div className="bg-green-50 text-green-700 px-2 py-1.5 rounded text-xs mb-3">
        {vocab.english_definition}
      </div>

      {/* Bookmark */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsFavorited(!isFavorited)}
          className={`p-1 rounded transition-colors ${isFavorited ? "text-amber-500" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
          aria-label={isFavorited ? "取消收藏" : "收藏"}
        >
          <Bookmark className="size-4" fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  )
}

// ─── Phrase Popover Card ──────────────────────────────────────────────────────
function PhrasePopoverCard({
  phrase,
  onClose,
}: {
  phrase: PhraseItem
  onClose: () => void
}) {
  const [isFavorited, setIsFavorited] = useState(false)

  return (
    <div className="w-64 p-3">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-lg font-bold text-foreground">{phrase.phrase}</h4>
        <button onClick={onClose} className="p-0.5 text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        {phrase.phonetic && <span className="text-sm text-muted-foreground">{phrase.phonetic}</span>}
        <button className="p-0.5 rounded-full hover:bg-accent" aria-label="发音">
          <Volume2 className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      <p className="text-sm text-foreground mb-2">{phrase.chinese_definition}</p>

      <div className="bg-blue-50 text-blue-700 px-2 py-1.5 rounded text-xs mb-3">
        {phrase.synonyms && `近义: ${phrase.synonyms}`}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setIsFavorited(!isFavorited)}
          className={`p-1 rounded transition-colors ${isFavorited ? "text-amber-500" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
          aria-label={isFavorited ? "取消收藏" : "收藏"}
        >
          <Bookmark className="size-4" fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  )
}

// ─── Expression Popover Card ──────────────────────────────────────────────────
function ExpressionPopoverCard({
  expression,
  onClose,
}: {
  expression: ExpressionItem
  onClose: () => void
}) {
  const [isFavorited, setIsFavorited] = useState(false)

  return (
    <div className="w-72 p-3">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-base font-bold text-foreground leading-snug">{expression.expression}</h4>
        <button onClick={onClose} className="p-0.5 text-muted-foreground hover:text-foreground shrink-0 ml-2">
          <X className="size-4" />
        </button>
      </div>

      <div
        className="bg-orange-50 text-orange-900 px-2 py-2 rounded text-xs mb-3 [&>p]:mb-2 [&>b]:text-orange-950 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: expression.expression_explanation }}
      />

      <div className="flex justify-end">
        <button
          onClick={() => setIsFavorited(!isFavorited)}
          className={`p-1 rounded transition-colors ${isFavorited ? "text-amber-500" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
          aria-label={isFavorited ? "取消收藏" : "收藏"}
        >
          <Bookmark className="size-4" fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  )
}

// ─── Tokenized English with underline highlights and Popover ──────────────────
function RenderTokenizedEnglish({
  tokens,
  practiceMode,
  revealedTokens,
  onToggleToken,
  vocabularies = [],
  phrases = [],
  expressions = [],
}: {
  tokens: SubtitleToken[]
  practiceMode: "none" | "shadowing" | "fill"
  revealedTokens: Set<number>
  onToggleToken: (idx: number) => void
  vocabularies?: VocabItem[]
  phrases?: PhraseItem[]
  expressions?: ExpressionItem[]
}) {
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)
  const isCloze = practiceMode === "fill"

  return (
    <>
      {tokens.map((token, idx) => {
        if (!token.isHighlight || !token.type || !token.refId) {
          return <span key={idx}>{token.text}</span>
        }

        const refId = token.refId
        const tokenType = token.type

        // ── Cloze mode: show/hide block, NO popover ───────────────────
        if (isCloze) {
          const isRevealed = revealedTokens.has(idx)
          return (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation()
                onToggleToken(idx)
              }}
              className={`inline-block rounded px-1 mx-0.5 align-baseline cursor-pointer transition-colors ${
                isRevealed
                  ? `${TOKEN_CLOZE_REVEALED_BG[tokenType]} ${TOKEN_CLOZE_REVEALED_TEXT[tokenType]}`
                  : `${TOKEN_CLOZE_HIDDEN_BG[tokenType]} text-transparent select-none`
              }`}
              aria-label={isRevealed ? "点击隐藏" : "点击显示答案"}
            >
              {token.text}
            </button>
          )
        }

        // ── Normal mode: underline + popover ──────────────────────────
        const vocab = tokenType === "w" ? vocabularies.find((v) => v.id === refId) : null
        const phrase = tokenType === "p" ? phrases.find((p) => p.id === refId) : null
        const expr = tokenType === "e" ? expressions.find((e) => e.id === refId) : null

        return (
          <Popover
            key={idx}
            open={openPopoverId === `${refId}-${idx}`}
            onOpenChange={(open) => setOpenPopoverId(open ? `${refId}-${idx}` : null)}
          >
            <PopoverTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className={`inline underline decoration-2 ${TOKEN_UNDERLINE[tokenType]} underline-offset-2 cursor-pointer hover:bg-accent/50 rounded-sm px-0.5 transition-colors`}
              >
                {token.text}
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-auto" side="top" align="center">
              {vocab && <WordPopoverCard vocab={vocab} onClose={() => setOpenPopoverId(null)} />}
              {phrase && <PhrasePopoverCard phrase={phrase} onClose={() => setOpenPopoverId(null)} />}
              {expr && <ExpressionPopoverCard expression={expr} onClose={() => setOpenPopoverId(null)} />}
            </PopoverContent>
          </Popover>
        )
      })}
    </>
  )
}

// ─── Legacy English renderer (old format with clickableWords) ─────────────────
function RenderLegacyEnglish({
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
  onPlaySegment,
  onPauseVideo,
  fontSizeClass = "text-sm",
  videoId = "",
  vocabularies = [],
  phrases = [],
  expressions = [],
}: SubtitleCardProps) {
  // Legacy blank state (for old clickableWords format)
  const [revealedBlanks, setRevealedBlanks] = useState<Set<string>>(new Set())
  // Token blank state (for new {{type|id|text}} format)
  const [revealedTokens, setRevealedTokens] = useState<Set<number>>(new Set())

  // Reset revealed state whenever practiceMode changes
  useEffect(() => {
    setRevealedBlanks(new Set())
    setRevealedTokens(new Set())
  }, [practiceMode])

  const englishText = subtitle.en ?? subtitle.english ?? ""
  const chineseText = subtitle.zh ?? subtitle.chinese ?? ""
  const timeLabel = subtitle.timeLabel ?? formatTimeLabel(subtitle.startTime)

  // Parse tokens ONCE via useMemo
  const tokens = useMemo(() => {
    if (englishText.includes("{{")) {
      return parseSubtitleText(englishText)
    }
    return null
  }, [englishText])

  const handleToggleBlank = (word: string) => {
    setRevealedBlanks((prev) => {
      const next = new Set(prev)
      if (next.has(word)) { next.delete(word) } else { next.add(word) }
      return next
    })
  }

  const handleToggleToken = (idx: number) => {
    setRevealedTokens((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) { next.delete(idx) } else { next.add(idx) }
      return next
    })
  }
  const handlePlaybackClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // 如果是跟读或填空模式，就只播放这单独的一句
    if (practiceMode !== "none" && onPlaySegment) {
      onPlaySegment(subtitle.startTime, subtitle.endTime)
    } else {
      // 普通模式，正常跳转过去连续播放
      onClickTimestamp(subtitle.startTime)
  }
}

  return (
    <div
      className="px-4 py-3 transition-colors border-l-[3px] border-transparent cursor-pointer hover:bg-accent/40"
      onClick={handlePlaybackClick}  // <--- 替换成这样
    >
      <button
        onClick={handlePlaybackClick} // <--- 替换成这样
        className="text-xs font-mono mb-1 block text-muted-foreground"
      >
        {timeLabel}
      </button>

      {(subtitleMode === "bilingual" || subtitleMode === "english") && (
        <p className={`${fontSizeClass} font-medium text-foreground leading-relaxed`}>
          {tokens ? (
            <RenderTokenizedEnglish
              tokens={tokens}
              practiceMode={practiceMode}
              revealedTokens={revealedTokens}
              onToggleToken={handleToggleToken}
              vocabularies={vocabularies}
              phrases={phrases}
              expressions={expressions}
            />
          ) : (
            <RenderLegacyEnglish
              text={englishText}
              clickableWords={subtitle.clickableWords}
              fillBlankMode={fillBlankMode}
              onClickWord={onClickWord}
              revealedBlanks={revealedBlanks}
              onToggleBlank={handleToggleBlank}
            />
          )}
        </p>
      )}

      {(subtitleMode === "bilingual" || subtitleMode === "chinese") && (
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {chineseText}
        </p>
      )}

      {practiceMode === "shadowing" && onPlaySegment && (
        <ShadowingConsole
          videoId={videoId}
          subtitleId={subtitle.id}
          startTime={subtitle.startTime}
          endTime={subtitle.endTime}
          onPlayOriginal={onPlaySegment}
          onPauseVideo={onPauseVideo}
        />
      )}
    </div>
  )
}

function formatTimeLabel(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}
