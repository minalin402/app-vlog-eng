"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client" // ✨ 1. 引入真实的 Supabase 客户端
import { VideoSidebar } from "./video-sidebar"
import { TabNav, type TabType } from "./tab-nav"
import { FilterBar, type FilterType } from "./filter-bar"
import { WordCard } from "./word-card"
import { PhraseCard } from "./phrase-card"
import { ExpressionCard } from "./expression-card"
import { Loader2 } from "lucide-react"

// 移除 Mock 引用，保留真实的收藏 API
import { fetchUserFavorites, toggleFavoriteAPI } from "@/lib/favorite-api"

export function VocabPage() {
  // ✨ 2. 左侧菜单改为动态真实数据
  const [sidebarVideos, setSidebarVideos] = useState<any[]>([])
  const [activeVideoId, setActiveVideoId] = useState("") 
  
  const [activeTab, setActiveTab] = useState<TabType>("words")
  const [activeFilter, setActiveFilter] = useState<FilterType | string>("all")
  const [hideChinese, setHideChinese] = useState(false)
  
  const [videoData, setVideoData] = useState<any>(null)
  const [favState, setFavState] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)

  // ✨ 3. 页面初次加载：获取左侧真实的视频列表
  useEffect(() => {
    async function fetchVideos() {
      const { data } = await supabase
        .from('videos')
        .select('id, title')
        .order('created_at', { ascending: false }) // 按最新排序
      
      if (data && data.length > 0) {
        setSidebarVideos(data)
        setActiveVideoId(data[0].id) // 默认选中数据库里的第一个视频
      } else {
        setIsLoading(false) // 如果连视频都没有，直接结束加载
      }
    }
    fetchVideos()
  }, [])

  // ✨ 4. 核心改造：当左侧切换视频时，拉取并“伪装”真实词汇数据
  useEffect(() => {
    if (!activeVideoId) return
    setIsLoading(true)

    async function loadRealData() {
      // A. 查真单词表
      const { data: vocabData } = await supabase
        .from('vocabulary_items')
        .select('*')
        .eq('video_id', activeVideoId)

      // B. 查真收藏状态
      const favoriteIds = await fetchUserFavorites(activeVideoId)

      // C. 数据洗牌：把数据库字段完美映射成你 UI 卡片期待的结构
      const words = (vocabData || []).filter(v => v.type === 'word').map(v => ({
        id: v.id,
        word: v.content,
        phonetic: v.phonetic || "", 
        pos: v.pos || "",
        meaningZh: v.definition_zh || "",
        meaningEn: v.definition_en || "",
        examples: [{ en: v.example_en || "", zh: v.example_zh || "" }] // 包装成你假数据里的数组结构
      }))

      const phrases = (vocabData || []).filter(v => v.type === 'phrase').map(v => ({
        id: v.id,
        phrase: v.content,
        pos: v.pos || "phr.",
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

      // 同步收藏状态
      const initialFavs: Record<string, boolean> = {}
      favoriteIds.forEach((id: string) => { initialFavs[id] = true })
      setFavState(initialFavs)
      setIsLoading(false)
    }

    loadRealData()
  }, [activeVideoId])

  // === 以下代码一字未动，完全保留你的 UI 交互和乐观更新逻辑 ===
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
      {/* 注入真实的视频列表 */}
      <VideoSidebar videos={sidebarVideos} activeVideoId={activeVideoId} onSelectVideo={setActiveVideoId} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">加载词库中...</p>
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-5 overflow-hidden flex-1 max-w-7xl mx-auto w-full">
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
                .filter(item => favState[item.id]).length
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