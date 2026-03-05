"use client"

export type TabType = "words" | "phrases" | "expressions"

interface TabNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  wordCount: number
  phraseCount: number
  expressionCount: number
}

export function TabNav({ activeTab, onTabChange, wordCount, phraseCount, expressionCount }: TabNavProps) {
  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "words", label: "单词", count: wordCount },
    { key: "phrases", label: "短语", count: phraseCount },
    { key: "expressions", label: "地道表达", count: expressionCount },
  ]

  return (
    <div className="flex rounded-lg border border-border overflow-hidden">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex-1 py-2.5 px-4 text-sm font-medium transition-colors ${
            activeTab === tab.key
              ? "bg-blue-500 text-white"
              : "bg-card text-foreground hover:bg-accent"
          }`}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  )
}
