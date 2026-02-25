"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { subtitles } from "@/lib/video-data"

interface ExportModalProps {
  open: boolean
  onClose: () => void
}

export function ExportModal({ open, onClose }: ExportModalProps) {
  const [exportMode, setExportMode] = useState<"bilingual" | "english" | "chinese">("bilingual")

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#000000]/50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-2xl w-[90vw] max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-lg font-bold text-foreground">
            谷爱凌：霸气回应质疑 - 导出Word文档
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-accent transition-colors"
            aria-label="关闭"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-3 px-6 pb-4">
          {(
            [
              { key: "bilingual" as const, label: "双语" },
              { key: "english" as const, label: "仅英语" },
              { key: "chinese" as const, label: "仅中文" },
            ]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setExportMode(tab.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                exportMode === tab.key
                  ? "text-[#3b82f6] bg-[#eff6ff] shadow-sm"
                  : "text-muted-foreground bg-muted hover:bg-accent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="bg-muted/50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground text-center mb-4">
              谷爱凌：霸气回应质疑 - 学习笔记
            </h3>
            <div className="h-px bg-border/50" />
            {subtitles.map((sub) => (
              <div key={sub.id} className="py-4 border-b border-border/30 last:border-b-0">
                <p className="text-xs text-muted-foreground mb-2 font-mono">{sub.timeLabel}</p>
                {(exportMode === "bilingual" || exportMode === "english") && (
                  <p className="text-sm text-foreground leading-relaxed">{sub.english}</p>
                )}
                {(exportMode === "bilingual" || exportMode === "chinese") && (
                  <p className={`text-sm text-muted-foreground leading-relaxed ${exportMode === "bilingual" ? "mt-1" : ""}`}>
                    {sub.chinese}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-muted/30 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            取消
          </button>
          <button className="px-6 py-2 rounded-lg bg-[#22c55e] text-[#ffffff] text-sm font-medium hover:bg-[#16a34a] transition-colors">
            导出Word
          </button>
        </div>
      </div>
    </>
  )
}
