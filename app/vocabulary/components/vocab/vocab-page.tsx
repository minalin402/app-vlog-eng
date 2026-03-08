"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"
import { VideoSidebar } from "./video-sidebar"
import { TabNav, type TabType } from "./tab-nav"
import { FilterBar, type FilterType } from "./filter-bar"
import { WordCard } from "./word-card"
import { PhraseCard } from "./phrase-card"
import { ExpressionCard } from "./expression-card"
import { Loader2, ChevronDown, ChevronLeft, MonitorPlay } from "lucide-react"
import { useRouter } from "next/navigation"
import { fetchUserFavorites, toggleFavoriteAPI } from "@/lib/favorite-api"

export function VocabPage() {
  const router = useRouter()
  
  const [sidebarVideos, setSidebarVideos] = useState<any[]>([])
  const [activeVideoId, setActiveVideoId] = useState("") 
  
  const [activeTab, setActiveTab] = useState<TabType>("words")
  const [activeFilter, setActiveFilter] = useState<FilterType | string>("all")
  const [hideChinese, setHideChinese] = useState(false)
  
  const [videoData, setVideoData] = useState<any>(null)
  const [favState, setFavState] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)

  // 1. 页面初次加载：获取左侧真实的视频列表
  useEffect(() => {
    async function fetchVideos() {
      const { data } = await supabase
        .from('videos')
        .select('id, title')
        .order('created_at', { ascending: false })
      
      if (data && data.length > 0) {
        setSidebarVideos(data)
        setActiveVideoId(data[0].id)
      } else {
        setIsLoading(false)
      }
    }
    fetchVideos()
  }, [])

  // 2. 当左侧切换视频时，拉取真实词汇数据
  useEffect(() => {
    if (!activeVideoId) return
    setIsLoading(true)

    async function loadRealData() {
      const { data: vocabData } = await supabase
        .from('vocabulary_items')
        .select('*')
        .eq('video_id', activeVideoId)

      const favoriteIds = await fetchUserFavorites(activeVideoId)

      const words = (vocabData || []).filter(v => v.type === 'word').map(v => ({
        id: v.id,
        word: v.content,
        phonetic: v.phonetic || "", 
        pos: v.pos || "",
        meaningZh: v.definition_zh || "",
        meaningEn: v.definition_en || "",
        examples: [{ en: v.example_en || "", zh: v.example_zh || "" }]
      }))

      const phrases = (vocabData || []).filter(v => v.type === 'phrase').map(v => ({
        id: v.id,
        phrase: v.content,
        phonetic: v.phonetic || "",
        meaningZh: v.definition_zh || "",
        meaningEn: v.definition_en || "",
        examples: [{ en: v.example_en || "", zh: v.example_zh || "" }]
      }))

      const expressions = (vocabData || []).filter(v => v.type === 'expression').map(v => ({
        id: v.id,
        expression: v.content,
        subtitleEn: v.example_en || "",
        subtitleZh: v.example_zh || "",
        analysis: v.analysis || "",
        timestamp: ""
      }))

      setVideoData({ vocabularies: words, phrases, expressions })

      const initialFavs: Record<string, boolean> = {}
      favoriteIds.forEach((id: string) => { initialFavs[id] = true })
      setFavState(initialFavs)
      setIsLoading(false)
    }

    loadRealData()
  }, [activeVideoId])

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

  const words = videoData?.vocabularies || []
  const phrases = videoData?.phrases || []
  const expressions = videoData?.expressions || []

  const filterList = (list: any[]) => {
    if (activeFilter === "bookmarked") return list.filter(item => favState[item.id])
    return list
  }

  const displayWords = filterList(words)
  const displayPhrases = filterList(phrases)
  const displayExpressions = filterList(expressions)

  return (
    <div className="flex h-screen bg-secondary/30 overflow-hidden">
      
      {/* 电脑端：左侧边栏 */}
      <div className="hidden md:block shrink-0 h-full">
        <VideoSidebar videos={sidebarVideos} activeVideoId={activeVideoId} onSelectVideo={setActiveVideoId} />
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
              {sidebarVideos.map((v) => (
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
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">加载词库中...</p>
          </div>
        ) : (
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
                    <WordCard key={word.id} item={word} hideChinese={hideChinese} isFavorited={!!favState[word.id]} onToggleFav={() => handleToggleFavorite(word.id, "word")} />
                  ))}
                </div>
              )}
              {activeTab === "phrases" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayPhrases.map((phrase: any) => (
                    <PhraseCard key={phrase.id} item={phrase} hideChinese={hideChinese} isFavorited={!!favState[phrase.id]} onToggleFav={() => handleToggleFavorite(phrase.id, "phrase")} />
                  ))}
                </div>
              )}
              {activeTab === "expressions" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayExpressions.map((expr: any) => (
                    <ExpressionCard key={expr.id} item={expr} hideChinese={hideChinese} isFavorited={!!favState[expr.id]} onToggleFav={() => handleToggleFavorite(expr.id, "expression")} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}