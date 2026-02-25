"use client"

import { Volume2, Bookmark } from "lucide-react"
import type { WordItem } from "@/lib/vocab-data"

interface WordCardProps {
  item: WordItem
  hideChinese: boolean
}

export function WordCard({ item, hideChinese }: WordCardProps) {
  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <h3 className="text-xl font-bold text-foreground">{item.word}</h3>
        <button className="text-muted-foreground hover:text-blue-500 transition-colors" aria-label="收藏">
          <Bookmark className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground italic">{item.phonetic}</span>
        <button className="text-muted-foreground hover:text-blue-500 transition-colors" aria-label="播放发音">
          <Volume2 className="h-4 w-4" />
        </button>
      </div>

      <div>
        <span className="font-bold text-foreground">{item.pos}</span>{" "}
        <span className={`text-foreground ${hideChinese ? "blur-sm select-none" : ""}`}>
          {item.meaningZh}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">{item.meaningEn}</p>

      <div className="flex flex-col gap-2 mt-1">
        {item.examples.map((ex, i) => (
          <div
            key={i}
            className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30 rounded-r-lg px-3 py-2.5"
          >
            <p className="text-sm text-foreground italic leading-relaxed">{ex.en}</p>
            <p
              className={`text-sm text-muted-foreground mt-1 leading-relaxed ${
                hideChinese ? "blur-sm select-none" : ""
              }`}
            >
              {ex.zh}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
