"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, Volume2, Bookmark, Eye, EyeOff, Filter, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { toggleFavoriteAPI } from "@/lib/favorite-api"
import type { VocabItem, PhraseItem, ExpressionItem } from "@/lib/video-data"

interface VocabCardsClientProps {
  videoId: string
  videoTitle: string
  vocabularies: VocabItem[]
  phrases: PhraseItem[]
  expressions: ExpressionItem[]
  initialFavorites: string[]
}

export function VocabCardsClient({
  videoId,
  videoTitle,
  vocabularies,
  phrases,
  expressions,
  initialFavorites,
}: VocabCardsClientProps) {
  const router = useRouter()
  
  // 状态管理
  const [activeTab, setActiveTab] = useState<'word' | 'phrase' | 'expression'>('word')
  const [hideChinese, setHideChinese] = useState(false)
  const [filterSaved, setFilterSaved] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // 收藏状态（使用初始数据填充，实现本地乐观更新）
  const [favState, setFavState] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    initialFavorites.forEach(id => { map[id] = true })
    return map
  })

  // 语音播报
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

  // 切换收藏
  const handleToggleFavorite = async (id: string, type: "word" | "phrase" | "expression", e: React.MouseEvent) => {
    e.stopPropagation()
    const isFav = !!favState[id]
    const targetState = !isFav

    setFavState(prev => ({ ...prev, [id]: targetState })) // 乐观更新UI
    try {
      await toggleFavoriteAPI(id, type, targetState)
    } catch (error) {
      setFavState(prev => ({ ...prev, [id]: isFav })) // 失败回滚
    }
  }

  // 过滤数据
  const displayData = useMemo(() => {
    let data: any[] = []
    if (activeTab === 'word') data = vocabularies
    else if (activeTab === 'phrase') data = phrases
    else if (activeTab === 'expression') data = expressions

    return data.filter(item => {
      const matchSearch = (item.word || item.phrase || item.expression || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchFav = filterSaved ? favState[item.id] : true
      return matchSearch && matchFav
    })
  }, [activeTab, vocabularies, phrases, expressions, searchQuery, filterSaved, favState])

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-20 flex flex-col bg-card border-b border-border/50 shadow-sm">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => router.back()} className="p-1 -ml-2 rounded-md hover:bg-accent transition-colors">
            <ChevronLeft className="size-6" />
          </button>
          <h1 className="ml-2 text-base font-bold truncate flex-1">{videoTitle}</h1>
        </div>

        {/* Tab 切换 */}
        <div className="flex px-4 gap-6 border-b border-border/50">
          {[
            { id: 'word', label: `单词 (${vocabularies.length})` },
            { id: 'phrase', label: `短语 (${phrases.length})` },
            { id: 'expression', label: `表达 (${expressions.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* 工具栏 */}
        <div className="flex flex-col sm:flex-row gap-3 px-4 py-3 bg-muted/10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="搜索..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setHideChinese(!hideChinese)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${
                hideChinese ? "bg-primary/10 text-primary border-primary/20" : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {hideChinese ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {hideChinese ? "显中" : "遮中"}
            </button>
            <button
              onClick={() => setFilterSaved(!filterSaved)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${
                filterSaved ? "bg-orange-500/10 text-orange-600 border-orange-500/20" : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              <Filter className="size-4" />
              只看收藏
            </button>
          </div>
        </div>
      </header>

      {/* 卡片列表 */}
      <main className="flex-1 p-4 overflow-y-auto">
        {displayData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p className="text-sm">没有找到相关的{activeTab === 'word' ? '单词' : activeTab === 'phrase' ? '短语' : '表达'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayData.map((item) => {
              const content = item.word || item.phrase || item.expression
              const isFav = !!favState[item.id]
              
              return (
                <div key={item.id} className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-foreground">{content}</h3>
                        {item.phonetic && <span className="text-sm text-muted-foreground font-mono">{item.phonetic}</span>}
                        {item.pos && <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{item.pos}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-1">
                      <button onClick={(e) => playTTS(content, e)} className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/10">
                        <Volume2 className="size-4.5" />
                      </button>
                      <button onClick={(e) => handleToggleFavorite(item.id, activeTab, e)} className={`p-2 transition-colors rounded-full ${isFav ? "text-orange-500 hover:bg-orange-500/10" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                        <Bookmark className="size-4.5" fill={isFav ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>

                  <div className={`space-y-3 flex-1 ${hideChinese ? 'opacity-0 hover:opacity-100 transition-opacity duration-300' : ''}`}>
                    <p className="text-sm text-foreground/90 font-medium">
                      {item.chinese_definition || item.expression_explanation}
                    </p>
                    {item.english_definition && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.english_definition}</p>
                    )}
                    {(item.example_from_video || item.context) && (
                      <div className="mt-4 pt-4 border-t border-border/40 bg-muted/20 -mx-5 -mb-5 p-5 rounded-b-2xl">
                        <p className="text-sm text-foreground/80 italic mb-1.5">"{item.example_from_video || item.context}"</p>
                        <p className="text-xs text-muted-foreground">{item.example_translation || item.context_translation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}