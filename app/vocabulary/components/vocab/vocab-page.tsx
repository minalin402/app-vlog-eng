"use client"

import { useState, useMemo, useRef, useEffect } from "react" // ✨ 增加 useRef 和 useEffectimport { VideoSidebar } from "./video-sidebar"
import { TabNav, type TabType } from "./tab-nav"
import { FilterBar, type FilterType } from "./filter-bar"
import { WordCard } from "./word-card"
import { PhraseCard } from "./phrase-card"
import { ExpressionCard } from "./expression-card"
import { Loader2, ChevronDown, ChevronLeft, MonitorPlay } from "lucide-react"
import { useRouter } from "next/navigation"
import { toggleFavoriteAPI } from "@/lib/favorite-api"
import type { VocabularyItemRow } from "@/lib/supabase-client"
import { VideoSidebar } from "./video-sidebar" // ✨ 就是这行丢了！把它加回来

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

  // ✨ 核心修复：建立状态镜像，永远记录当前这一毫秒的最新收藏状态
  const favStateRef = useRef(favState)
  useEffect(() => {
    favStateRef.current = favState
  }, [favState])

  // ✨ 修复 1：监听服务端传入的最新数据，并立刻覆盖本地的收藏状态
  useEffect(() => {
    const freshState: Record<string, boolean> = {}
    initialFavoriteIds.forEach(id => { freshState[id] = true })
    setFavState(freshState)
  }, [initialFavoriteIds])

  // ✨ 修复 2：每次回到该页面（挂载或屏幕重新获得焦点），触发 Next.js 后台静默刷新
  useEffect(() => {
    // 触发 Next.js 静默重新执行服务端的 page.tsx，获取最新数据
    router.refresh()
    
    // 额外加固：防止手机端从其他 App 切回浏览器时数据旧了
    const handleFocus = () => router.refresh()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [router])

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

  // 收藏切换逻辑（防弹版）
  const handleToggleFavorite = async (rawId: string | number, type: "word"|"phrase"|"expression") => {
    const id = String(rawId)
    // ✨ 直接从镜像中读取绝对真实的最新状态，彻底绕过闭包陷阱
    const originalState = !!favStateRef.current[id]
    const targetState = !originalState
    
    // 1. 瞬间乐观更新 UI
    setFavState(prev => ({ ...prev, [id]: targetState })) 
    
    // 2. 将正确的指令发送给后端
    try {
      await toggleFavoriteAPI(id, type, targetState) 
    } catch (error) {
      console.error("收藏同步失败，已回滚", error)
      // 3. 如果网络失败，精准回滚到原来的状态
      setFavState(prev => ({ ...prev, [id]: originalState })) 
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
            // ✨ 核心修复：让手机端跳转也带上完整参数！
            onClick={() => router.push(`/videos/${activeVideoId}?sort=desc&from=vocab`)}
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
