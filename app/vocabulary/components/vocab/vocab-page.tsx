"use client"

import { useState } from "react"
import { VideoSidebar } from "./video-sidebar"
import { TabNav, type TabType } from "./tab-nav"
import { FilterBar, type FilterType } from "./filter-bar"
import { WordCard } from "./word-card"
import { PhraseCard } from "./phrase-card"
import { ExpressionCard } from "./expression-card"
import { videos, words, phrases, expressions } from "@/lib/vocab-data"

export function VocabPage() {
  const [activeVideoId, setActiveVideoId] = useState("1")
  const [activeTab, setActiveTab] = useState<TabType>("words")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [hideChinese, setHideChinese] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Sidebar */}
      <VideoSidebar
        videos={videos}
        activeVideoId={activeVideoId}
        onSelectVideo={setActiveVideoId}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 flex flex-col gap-4 overflow-hidden flex-1">
          {/* Tab Navigation */}
          <TabNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            wordCount={words.length}
            phraseCount={phrases.length}
            expressionCount={expressions.length}
          />

          {/* Filter Bar */}
          <FilterBar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            hideChinese={hideChinese}
            onToggleChinese={() => setHideChinese(!hideChinese)}
            totalCount={
              activeTab === "words"
                ? words.length
                : activeTab === "phrases"
                  ? phrases.length
                  : expressions.length
            }
          />

          {/* Card Grid */}
          <div className="flex-1 overflow-y-auto -mx-1 px-1 pb-4">
            {activeTab === "words" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {words.map((word, i) => (
                  <WordCard key={i} item={word} hideChinese={hideChinese} />
                ))}
              </div>
            )}

            {activeTab === "phrases" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {phrases.map((phrase, i) => (
                  <PhraseCard key={i} item={phrase} hideChinese={hideChinese} />
                ))}
              </div>
            )}

            {activeTab === "expressions" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expressions.map((expr, i) => (
                  <ExpressionCard key={i} item={expr} hideChinese={hideChinese} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
