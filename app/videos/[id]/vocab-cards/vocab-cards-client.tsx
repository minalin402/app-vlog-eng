"use client"

import { useState } from "react"
import { ChevronLeft, Volume2, Bookmark, Eye, EyeOff, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { toggleFavoriteAPI } from "@/lib/favorite-api"
import type { VocabItem, PhraseItem, ExpressionItem } from "@/lib/video-data"

interface VocabCardsClientProps {
  videoId: string
  vocabularies: VocabItem[]
  phrases: PhraseItem[]
  expressions: ExpressionItem[]
  initialFavorites: string[]
}

export function VocabCardsClient({
  vocabularies,
  phrases,
  expressions,
  initialFavorites,
}: VocabCardsClientProps) {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"word" | "phrase" | "expression">("word")
  const [hideChinese, setHideChinese] = useState(false)
  const [onlyFav, setOnlyFav] = useState(false)

  // 收藏状态（使用初始数据填充，实现本地乐观更新）
  const [favState, setFavState] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    initialFavorites.forEach(id => { map[id] = true })
    return map
  })

  // 切换收藏
  const handleToggleFavorite = async (id: string, type: "word" | "phrase" | "expression") => {
    const isFav = !!favState[id]
    const targetState = !isFav

    setFavState(prev => ({ ...prev, [id]: targetState })) // 乐观更新UI
    try {
      await toggleFavoriteAPI(id, type, targetState)
    } catch (error) {
      setFavState(prev => ({ ...prev, [id]: isFav })) // 失败回滚
    }
  }

  // 根据当前 Tab 获取列表
  let currentList: any[] = activeTab === "word" ? vocabularies : activeTab === "phrase" ? phrases : expressions
  // 根据收藏开关过滤
  if (onlyFav) {
    currentList = currentList.filter(item => favState[item.id])
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* 1. 顶部导航栏 */}
      <header className="flex items-center px-4 py-3 border-b border-border bg-card sticky top-0 z-20 shadow-sm">
        <button onClick={() => router.back()} className="p-1 mr-2 rounded-full hover:bg-accent" aria-label="返回">
          <ChevronLeft className="size-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground flex-1 text-center mr-8">
          英语卡片
        </h1>
      </header>

      {/* 2. 操作栏 (Tabs + 控制开关) */}
      <div className="bg-card border-b border-border sticky top-[53px] z-10 px-4 py-3 flex flex-col gap-3 shadow-sm">
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          {([
            { key: "word" as const, label: `单词 (${vocabularies.length})` },
            { key: "phrase" as const, label: `短语 (${phrases.length})` },
            { key: "expression" as const, label: `地道表达 (${expressions.length})` },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-[#3b82f6] text-white shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 隐藏中文 & 仅看收藏 */}
        <div className="flex items-center justify-between mt-1">
          <button
            onClick={() => setHideChinese(!hideChinese)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors text-xs font-medium ${
              hideChinese ? "border-[#3b82f6] text-[#3b82f6] bg-blue-50/50" : "border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            {hideChinese ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            隐藏中文
          </button>

          <button
            onClick={() => setOnlyFav(!onlyFav)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors text-xs font-medium ${
              onlyFav ? "border-amber-500 text-amber-600 bg-amber-50/50" : "border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            <Filter className="size-3.5" />
            仅看收藏
          </button>
        </div>
      </div>

      {/* 3. 瀑布流卡片列表 */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-12">
        {currentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Bookmark className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">
              {onlyFav ? "该分类下暂无收藏" : "暂无数据"}
            </p>
          </div>
        ) : (
          currentList.map((item: any) => {
            if (activeTab === "word") {
              return <WordCard key={item.id} vocab={item} hideChinese={hideChinese} isFavorited={!!favState[item.id]} onToggleFav={() => handleToggleFavorite(item.id, "word")} />
            }
            if (activeTab === "phrase") {
              return <PhraseCard key={item.id} phrase={item} hideChinese={hideChinese} isFavorited={!!favState[item.id]} onToggleFav={() => handleToggleFavorite(item.id, "phrase")} />
            }
            if (activeTab === "expression") {
              return <ExpressionCard key={item.id} expression={item} hideChinese={hideChinese} isFavorited={!!favState[item.id]} onToggleFav={() => handleToggleFavorite(item.id, "expression")} />
            }
          })
        )}
      </div>
    </div>
  )
}

// 🎙️ 发音助手
const playTTS = (text: string, e?: React.MouseEvent) => {
  if (e) e.stopPropagation()
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-US"
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }
}

// ─── 卡片组件 (原汁原味还原) ─────────────────────────

function WordCard({ vocab, hideChinese, isFavorited, onToggleFav }: any) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h4 className="text-xl font-bold text-foreground">{vocab.word}</h4>
          <div className="flex items-center gap-2 mt-1">
            {vocab.phonetic && <span className="text-sm text-muted-foreground">{vocab.phonetic}</span>}
            <button onClick={(e) => playTTS(vocab.word, e)} className="p-1 rounded-full hover:bg-accent text-[#3b82f6] transition-colors" aria-label="发音">
              <Volume2 className="size-4" />
            </button>
          </div>
        </div>
        <button onClick={onToggleFav} className={`p-1.5 rounded-lg transition-colors ${isFavorited ? "text-amber-500 bg-amber-50" : "text-muted-foreground/40 hover:bg-accent"}`}>
          <Bookmark className="size-5" fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="mt-3">
        {!hideChinese && (
          <p className="text-base text-foreground mb-3">
            {vocab.pos && <span className="text-muted-foreground mr-2 font-mono italic">{vocab.pos}</span>}
            {vocab.chinese_definition}
          </p>
        )}
        {vocab.synonyms && <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium">近义: {vocab.synonyms}</div>}
      </div>
      <div className="bg-muted/50 rounded-xl p-3.5 mt-4 border-l-4 border-green-500">
        <p className="text-sm text-foreground leading-relaxed">{'"'}{vocab.example_from_video}{'"'}</p>
        {!hideChinese && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{'"'}{vocab.example_translation}{'"'}</p>}
      </div>
    </div>
  )
}

function PhraseCard({ phrase, hideChinese, isFavorited, onToggleFav }: any) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h4 className="text-xl font-bold text-foreground">{phrase.phrase}</h4>
          <div className="flex items-center gap-2 mt-1">
            {phrase.phonetic && <span className="text-sm text-muted-foreground">{phrase.phonetic}</span>}
            <button onClick={(e) => playTTS(phrase.phrase, e)} className="p-1 rounded-full hover:bg-accent text-[#3b82f6] transition-colors" aria-label="发音">
              <Volume2 className="size-4" />
            </button>
          </div>
        </div>
        <button onClick={onToggleFav} className={`p-1.5 rounded-lg transition-colors ${isFavorited ? "text-amber-500 bg-amber-50" : "text-muted-foreground/40 hover:bg-accent"}`}>
          <Bookmark className="size-5" fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="mt-3">
        {!hideChinese && <p className="text-base text-foreground mb-3">{phrase.chinese_definition}</p>}
        {phrase.synonyms && <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium">近义: {phrase.synonyms}</div>}
      </div>
      <div className="bg-muted/50 rounded-xl p-3.5 mt-4 border-l-4 border-blue-500">
        <p className="text-sm text-foreground leading-relaxed">{'"'}{phrase.context}{'"'}</p>
        {!hideChinese && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{'"'}{phrase.context_translation}{'"'}</p>}
      </div>
    </div>
  )
}

function ExpressionCard({ expression, hideChinese, isFavorited, onToggleFav }: any) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 pr-4">
          <h4 className="text-lg font-bold text-foreground leading-snug">{expression.expression}</h4>
          <button onClick={(e) => playTTS(expression.expression, e)} className="p-1 rounded-full hover:bg-accent text-[#3b82f6] transition-colors shrink-0" aria-label="发音">
            <Volume2 className="size-4" />
          </button>
        </div>
        <button onClick={onToggleFav} className={`p-1.5 rounded-lg transition-colors shrink-0 ${isFavorited ? "text-amber-500 bg-amber-50" : "text-muted-foreground/40 hover:bg-accent"}`}>
          <Bookmark className="size-5" fill={isFavorited ? "currentColor" : "none"} />
        </button>
      </div>
      {!hideChinese && (
        <div className="bg-amber-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed [&>p]:mb-3 last:[&>p]:mb-0 [&>b]:text-gray-900 [&>p>b]:text-gray-900" dangerouslySetInnerHTML={{ __html: expression.expression_explanation }} />
      )}
    </div>
  )
}