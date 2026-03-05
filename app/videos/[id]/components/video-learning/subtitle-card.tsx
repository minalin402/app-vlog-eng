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
  vocabularies?: VocabItem[]
  phrases?: PhraseItem[]
  expressions?: ExpressionItem[]
  favState: Record<string, boolean>
  onToggleFav: (id: string, type: "word" | "phrase" | "expression") => void
}

const TOKEN_UNDERLINE: Record<TokenType, string> = {
  w: "decoration-green-500",
  p: "decoration-blue-500",
  e: "decoration-orange-500",
}
const TOKEN_CLOZE_HIDDEN_BG: Record<TokenType, string> = {
  w: "bg-green-200", p: "bg-blue-200", e: "bg-orange-200",
}
const TOKEN_CLOZE_REVEALED_BG: Record<TokenType, string> = {
  w: "bg-green-100", p: "bg-blue-100", e: "bg-orange-100",
}
const TOKEN_CLOZE_REVEALED_TEXT: Record<TokenType, string> = {
  w: "text-green-700", p: "text-blue-700", e: "text-orange-700",
}

// 🎙️ 新增：原生的 TTS 发音助手
export const playTTS = (text: string, e?: React.MouseEvent) => {
  if (e) e.stopPropagation()
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel() // 快速点击时打断上一句
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-US" // 默认美式口音
    utterance.rate = 0.9 // 语速稍微放慢一点点，适合学习
    window.speechSynthesis.speak(utterance)
  }
}

// ─── Word Popover Card ────────────────────────────────────────────────────────
function WordPopoverCard({ vocab, isFavorited, onToggleFav, onClose }: { vocab: VocabItem, isFavorited: boolean, onToggleFav: () => void, onClose: () => void }) {
  return (
    <div className="w-64 p-3">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-lg font-bold text-foreground">{vocab.word}</h4>
        <button onClick={onClose} className="p-0.5 text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-muted-foreground">{vocab.phonetic}</span>
        {/* ✨ 加入发音事件 */}
        <button onClick={(e) => playTTS(vocab.word, e)} className="p-0.5 rounded-full hover:bg-accent text-[#3b82f6]" aria-label="发音">
          <Volume2 className="size-3.5" />
        </button>
      </div>
      {/* ✨ 加入词性 POS */}
      <p className="text-sm text-foreground mb-2">
        {vocab.pos && <span className="text-muted-foreground mr-1.5 font-mono italic">{vocab.pos}</span>}
        {vocab.chinese_definition}
      </p>
      {/* ✨ 去掉英文释义，改为近义词 */}
      {vocab.synonyms && (
        <div className="bg-green-50 text-green-700 px-2 py-1.5 rounded text-xs mb-3 font-medium">
          近义: {vocab.synonyms}
        </div>
      )}
      <div className="flex justify-end">
        <button onClick={onToggleFav} className={`p-1 rounded transition-colors ${isFavorited ? "text-amber-500" : "text-muted-foreground hover:text-foreground"}`}>
          <Bookmark className="size-4" fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  )
}

// ─── Phrase Popover Card ──────────────────────────────────────────────────────
function PhrasePopoverCard({ phrase, isFavorited, onToggleFav, onClose }: { phrase: PhraseItem, isFavorited: boolean, onToggleFav: () => void, onClose: () => void }) {
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
        {/* ✨ 加入发音事件 */}
        <button onClick={(e) => playTTS(phrase.phrase, e)} className="p-0.5 rounded-full hover:bg-accent text-[#3b82f6]" aria-label="发音">
          <Volume2 className="size-3.5" />
        </button>
      </div>
      <p className="text-sm text-foreground mb-2">{phrase.chinese_definition}</p>
      {phrase.synonyms && (
        <div className="bg-blue-50 text-blue-700 px-2 py-1.5 rounded text-xs mb-3 font-medium">
          近义: {phrase.synonyms}
        </div>
      )}
      <div className="flex justify-end">
        <button onClick={onToggleFav} className={`p-1 rounded transition-colors ${isFavorited ? "text-amber-500" : "text-muted-foreground hover:text-foreground"}`}>
          <Bookmark className="size-4" fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  )
}

// ─── Expression Popover Card ──────────────────────────────────────────────────
function ExpressionPopoverCard({ expression, isFavorited, onToggleFav, onClose }: { expression: ExpressionItem, isFavorited: boolean, onToggleFav: () => void, onClose: () => void }) {
  return (
    <div className="w-72 p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
           <h4 className="text-base font-bold text-foreground leading-snug">{expression.expression}</h4>
           {/* ✨ 金句也加上发音喇叭 */}
           <button onClick={(e) => playTTS(expression.expression, e)} className="p-0.5 rounded-full hover:bg-accent text-[#3b82f6]" aria-label="发音">
             <Volume2 className="size-4" />
           </button>
        </div>
        <button onClick={onClose} className="p-0.5 text-muted-foreground hover:text-foreground shrink-0 ml-2">
          <X className="size-4" />
        </button>
      </div>
      <div className="bg-orange-50 text-orange-900 px-2 py-2 rounded text-xs mb-3 [&>p]:mb-2 [&>b]:text-orange-950 leading-relaxed" dangerouslySetInnerHTML={{ __html: expression.expression_explanation }} />
      <div className="flex justify-end">
        <button onClick={onToggleFav} className={`p-1 rounded transition-colors ${isFavorited ? "text-amber-500" : "text-muted-foreground hover:text-foreground"}`}>
          <Bookmark className="size-4" fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  )
}

// ─── Tokenized English with underline highlights and Popover ──────────────────
function RenderTokenizedEnglish({
  tokens, practiceMode, revealedTokens, onToggleToken, vocabularies = [], phrases = [], expressions = [],
  favState, onToggleFav
}: {
  tokens: SubtitleToken[], practiceMode: "none" | "shadowing" | "fill", revealedTokens: Set<number>, onToggleToken: (idx: number) => void,
  vocabularies?: VocabItem[], phrases?: PhraseItem[], expressions?: ExpressionItem[],
  favState: Record<string, boolean>, onToggleFav: (id: string, type: "word"| "phrase" | "expression") => void
}) {
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)
  const isCloze = practiceMode === "fill"

  return (
    <>
      {tokens.map((token, idx) => {
        if (!token.isHighlight || !token.type || !token.refId) return <span key={idx}>{token.text}</span>
        
        const refId = String(token.refId) // 确保类型安全
        const tokenType = token.type

        if (isCloze) {
          const isRevealed = revealedTokens.has(idx)
          return (
            <button key={idx} onClick={(e) => { e.stopPropagation(); onToggleToken(idx); }} className={`inline-block rounded px-1 mx-0.5 align-baseline cursor-pointer transition-colors ${isRevealed ? `${TOKEN_CLOZE_REVEALED_BG[tokenType]} ${TOKEN_CLOZE_REVEALED_TEXT[tokenType]}` : `${TOKEN_CLOZE_HIDDEN_BG[tokenType]} text-transparent select-none`}`}>
              {token.text}
            </button>
          )
        }

        const vocab = tokenType === "w" ? vocabularies.find((v) => String(v.id) === refId) : null
        const phrase = tokenType === "p" ? phrases.find((p) => String(p.id) === refId) : null
        const expr = tokenType === "e" ? expressions.find((e) => String(e.id) === refId) : null

        return (
          <Popover key={idx} open={openPopoverId === `${refId}-${idx}`} onOpenChange={(open) => setOpenPopoverId(open ? `${refId}-${idx}` : null)}>
            <PopoverTrigger asChild>
              <button onClick={(e) => e.stopPropagation()} className={`inline underline decoration-2 ${TOKEN_UNDERLINE[tokenType]} underline-offset-4 cursor-pointer hover:bg-accent/50 rounded-sm px-0.5 transition-colors`}>
                {token.text}
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-auto" side="top" align="center">
              {vocab && <WordPopoverCard vocab={vocab} isFavorited={!!favState[vocab.id]} onToggleFav={() => onToggleFav(String(vocab.id), "word")} onClose={() => setOpenPopoverId(null)} />}
              {phrase && <PhrasePopoverCard phrase={phrase} isFavorited={!!favState[phrase.id]} onToggleFav={() => onToggleFav(String(phrase.id), "phrase")} onClose={() => setOpenPopoverId(null)} />}
              {expr && <ExpressionPopoverCard expression={expr} isFavorited={!!favState[expr.id]} onToggleFav={() => onToggleFav(String(expr.id), "expression")} onClose={() => setOpenPopoverId(null)} />}
            </PopoverContent>
          </Popover>
        )
      })}
    </>
  )
}

function RenderLegacyEnglish({ text }: { text: string }) {
  return <span>{text}</span>
}

export function SubtitleCard({
  subtitle, isActive, subtitleMode, practiceMode, fillBlankMode, onClickWord, onClickTimestamp, onPlaySegment, onPauseVideo,
  fontSizeClass = "text-sm", videoId = "", vocabularies = [], phrases = [], expressions = [],
  favState, onToggleFav
}: SubtitleCardProps) {
  const [revealedBlanks, setRevealedBlanks] = useState<Set<string>>(new Set())
  const [revealedTokens, setRevealedTokens] = useState<Set<number>>(new Set())

  useEffect(() => {
    setRevealedBlanks(new Set())
    setRevealedTokens(new Set())
  }, [practiceMode])

  const englishText = subtitle.en ?? subtitle.english ?? ""
  const chineseText = subtitle.zh ?? subtitle.chinese ?? ""
  const timeLabel = subtitle.timeLabel ?? formatTimeLabel(subtitle.startTime)

  // ✨ 核心的高亮扫描雷达在这里
  const tokens = useMemo(() => {
    if (!englishText) return null

    if (englishText.includes("{{")) return parseSubtitleText(englishText)

    if (!vocabularies?.length && !phrases?.length && !expressions?.length) return null

    const targets: { text: string; id: string; type: TokenType }[] = []
    vocabularies.forEach(v => { if (v.word) targets.push({ text: v.word, id: String(v.id), type: 'w' }) })
    phrases.forEach(p => { if (p.phrase) targets.push({ text: p.phrase, id: String(p.id), type: 'p' }) })
    expressions.forEach(e => { if (e.expression) targets.push({ text: e.expression, id: String(e.id), type: 'e' }) })

    if (targets.length === 0) return null

    // 按词长倒序排列，优先标亮长短语
    targets.sort((a, b) => b.text.length - a.text.length)

    let resultTokens: SubtitleToken[] = [{ text: englishText, isHighlight: false }]

    targets.forEach(target => {
      const escapedText = target.text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
      const regex = new RegExp(`\\b(${escapedText})\\b`, 'gi')
      const nextTokens: SubtitleToken[] = []

      resultTokens.forEach(token => {
        if (token.isHighlight) {
          nextTokens.push(token)
        } else {
          const parts = token.text.split(regex)
          parts.forEach(part => {
            if (!part) return
            if (part.toLowerCase() === target.text.toLowerCase()) {
              nextTokens.push({ text: part, isHighlight: true, type: target.type, refId: target.id })
            } else {
              nextTokens.push({ text: part, isHighlight: false })
            }
          })
        }
      })
      resultTokens = nextTokens
    })

    if (resultTokens.length === 1 && !resultTokens[0].isHighlight) return null

    return resultTokens
  }, [englishText, vocabularies, phrases, expressions])

  const handlePlaybackClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    const target = e.currentTarget.tagName === 'BUTTON' ? e.currentTarget.parentElement : e.currentTarget
    if (target) {
      target.classList.remove("animate-click-flash")
      void target.offsetWidth
      target.classList.add("animate-click-flash")
    }
    if (practiceMode !== "none" && onPlaySegment) {
      onPlaySegment(subtitle.startTime, subtitle.endTime)
    } else {
      onClickTimestamp(subtitle.startTime)
    }
  }

  return (
    <div className="px-4 py-3 border-l-[3px] border-transparent cursor-pointer hover:bg-accent/40" onClick={handlePlaybackClick}>
      <button onClick={handlePlaybackClick} className="text-xs font-mono mb-1 block text-muted-foreground">{timeLabel}</button>
      {(subtitleMode === "bilingual" || subtitleMode === "english") && (
        <p className={`${fontSizeClass} font-medium text-foreground leading-relaxed`}>
          {tokens ? (
            <RenderTokenizedEnglish
              tokens={tokens} practiceMode={practiceMode} revealedTokens={revealedTokens} onToggleToken={(idx) => setRevealedTokens(p => { const n = new Set(p); n.has(idx) ? n.delete(idx) : n.add(idx); return n; })}
              vocabularies={vocabularies} phrases={phrases} expressions={expressions}
              favState={favState} onToggleFav={onToggleFav} 
            />
          ) : (
            <RenderLegacyEnglish text={englishText} />
          )}
        </p>
      )}
      {(subtitleMode === "bilingual" || subtitleMode === "chinese") && (
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{chineseText}</p>
      )}
      {practiceMode === "shadowing" && onPlaySegment && (
        <ShadowingConsole videoId={videoId} subtitleId={subtitle.id} startTime={subtitle.startTime} endTime={subtitle.endTime} onPlayOriginal={onPlaySegment} onPauseVideo={onPauseVideo} />
      )}
    </div>
  )
}

function formatTimeLabel(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}