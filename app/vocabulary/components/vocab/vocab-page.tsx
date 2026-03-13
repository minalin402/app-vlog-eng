"use client"

import { useState, useMemo } from "react"
import { VideoSidebar } from "./video-sidebar"
import { TabNav, type TabType } from "./tab-nav"
import { FilterBar, type FilterType } from "./filter-bar"
import { WordCard } from "./word-card"
import { PhraseCard } from "./phrase-card"
import { ExpressionCard } from "./expression-card"
import { Loader2, ChevronDown, ChevronLeft, MonitorPlay } from "lucide-react"
import { useRouter } from "next/navigation"
import { toggleFavoriteAPI } from "@/lib/favorite-api"
import type { VocabularyItemRow } from "@/lib/supabase-client"

interface Video {
  id: string
  title: string
}

interface VocabPageProps {
  initialVideos: Video[]
  initialVocabularyByVideo: Record<string, VocabularyItemRow[]>
  initialFavoriteIds: string[]
}

export function VocabPage({ 
  initialVideos, 
  initialVocabularyByVideo, 
  initialFavoriteIds 
}: VocabPageProps) {
  const router = useRouter()
  
  const [activeVideoId, setActiveVideoId] = useState(initialVideos[0]?.id || "")
  const [activeTab, setActiveTab] = useState<TabType>("words")
  const [activeFilter, setActiveFilter] = useState<FilterType | string>("all")
  const [hideChinese, setHideChinese] = useState(false)
  const [favState, setFavState] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    initialFavoriteIds.forEach(id => { initial[id] = true })
    return initial
  })

  // 使用 useMemo 基于 activeVideoId 过滤当前视频的词汇数据
  const currentVideoData = useMemo(() => {
    const vocabItems = initialVocabularyByVideo[activeVideoId] || []
    
    const words = vocabItems
      .filter(v => v.type === 'word')
      .map(v => ({
        id: v.id,
        word: v.content,
        phonetic: v.phonetic || "", 
        pos: v.pos || "",
        meaningZh: v.definition_zh || "",
        meaningEn: v.definition_en || "",
        examples: [{ en: v.example_en || "", zh: v.example_zh || "" }]
      }))

    const phrases = vocabItems
      .filter(v => v.type === 'phrase')
      .map(v => ({
        id: v.id,
        phrase: v.content,
        phonetic: v.phonetic || "",
        meaningZh: v.definition_zh || "",
        meaningEn: v.definition_en || "",
        examples: [{ en: v.example_en || "", zh: v.example_zh || "" }]
      }))

    const expressions = vocabItems
      .filter(v => v.type === 'expression')
      .map(v => ({
        id: v.id,
        expression: v.content,
        subtitleEn: v.example_en || "",
        subtitleZh: v.example_zh || "",
        analysis: v.analysis || "",
        timestamp: ""
      }))

    return { words, phrases, expressions }
  }, [activeVideoId, initialVocabularyByVideo])

  // 使用 useMemo 基于 activeTab 和 activeFilter 过滤显示的数据
  const displayData = useMemo(() => {
    const { words, phrases, expressions } = currentVideoData
    
    const filterList = (list: any[]) => {
      if (activeFilter === "bookmarked") {
        return list.filter(item => favState[item.id])
      }
      return list
    }

    return {
      words: filterList(words),
      phrases: filterList(phrases),
      expressions: filterList(expressions)
    }
  }, [currentVideoData, activeFilter, favState])

  // 收藏切换逻辑
  const handleToggleFavorite = async (id: string, type: "word"|"phrase"|"expression") => {
    const isFav = !!favState[id]
    const targetState = !isFav
    setFavState(prev => ({ ...prev, [id]: targetState })) 
    try {
      await toggleFavoriteAPI(id, type, targetState) 
    } catch (error) {
      setFavState(prev => ({ ...prev, [id]: isFav })) 
    }
  }

  const { words, phrases, expressions } = currentVideoData
  const { words: displayWords, phrases: displayPhrases, expressions: displayExpressions } = displayData

  return (
    <div className="flex h-screen bg-secondary/30 overflow-hidden">
      
      {/* 电脑端：左侧边栏 */}
      <div className="hidden md:block shrink-0 h-full">
        <VideoSidebar 
          videos={initialVideos} 
          activeVideoId={activeVideoId} 
          onSelectVideo={setActiveVideoId} 
        />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* 手机端：顶部导航栏和原生视频选择器 */}
        <div className="md:hidden w-full bg-card border-b border-border p-3 flex items-center gap-2 shrink-0 z-10 shadow-sm">
          <button onClick={() => router.push("/")} className="p-1.5 -ml-1 text-muted-foreground hover:bg-accent rounded-md shrink-0">
            <ChevronLeft className="size-5" />
          </button>
          
          <div className="relative flex-1 min-w-0">
            <select
              value={activeVideoId}
              onChange={(e) => setActiveVideoId(e.target.value)}
              className="w-full appearance-none bg-muted/50 border border-border text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] text-foreground font-medium truncate"
            >
              {initialVideos.map((v) => (
                <option key={v.id} value={v.id}>{v.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          </div>

          <button
            onClick={() => router.push(`/videos/${activeVideoId}`)}
            className="p-1.5 bg-[#3b82f6]/10 text-[#3b82f6] hover:bg-[#3b82f6]/20 rounded-md shrink-0 transition-colors"
            title="去学习该视频"
          >
            <MonitorPlay className="size-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-4 md:p-6 flex flex-col gap-4 md:gap-5 overflow-hidden flex-1 max-w-7xl mx-auto w-full">
          <TabNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            wordCount={words.length}
            phraseCount={phrases.length}
            expressionCount={expressions.length}
          />

          <FilterBar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            hideChinese={hideChinese}
            onToggleChinese={() => setHideChinese(!hideChinese)}
            totalCount={
              activeTab === "words" ? words.length :
              activeTab === "phrases" ? phrases.length : expressions.length
            }
            favoriteCount={
              (activeTab === "words" ? words : activeTab === "phrases" ? phrases : expressions)
              .filter((item: any) => favState[item.id]).length
            }
          />

          <div className="flex-1 overflow-y-auto -mx-1 px-1 pb-4">
            {activeTab === "words" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayWords.map((word: any) => (
                  <WordCard 
                    key={word.id} 
                    item={word} 
                    hideChinese={hideChinese} 
                    isFavorited={!!favState[word.id]} 
                    onToggleFav={() => handleToggleFavorite(word.id, "word")} 
                  />
                ))}
              </div>
            )}
            {activeTab === "phrases" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayPhrases.map((phrase: any) => (
                  <PhraseCard 
                    key={phrase.id} 
                    item={phrase} 
                    hideChinese={hideChinese} 
                    isFavorited={!!favState[phrase.id]} 
                    onToggleFav={() => handleToggleFavorite(phrase.id, "phrase")} 
                  />
                ))}
              </div>
            )}
            {activeTab === "expressions" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayExpressions.map((expr: any) => (
                  <ExpressionCard 
                    key={expr.id} 
                    item={expr} 
                    hideChinese={hideChinese} 
                    isFavorited={!!favState[expr.id]} 
                    onToggleFav={() => handleToggleFavorite(expr.id, "expression")} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
