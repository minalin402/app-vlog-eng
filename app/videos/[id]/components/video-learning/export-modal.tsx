"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { type SubtitleItem } from "@/lib/video-data"

interface ExportModalProps {
  open: boolean
  onClose: () => void
  subtitles: SubtitleItem[]
  title: string
}

// 清洗文本中的标记符
function cleanMarkup(text: string): string {
  // 匹配 {{w|v1|word}}, {{p|p1|phrase}}, {{e|e1|expression}} 格式的标记
  return text.replace(/\{\{[wpe]\|[^|]+\|([^}]+)\}\}/g, '$1')
}

// 生成导出用的HTML
function generateExportHtml(
  subtitles: SubtitleItem[],
  title: string,
  mode: "bilingual" | "english" | "chinese"
): string {
  const html = `
    <html>
    <head>
      <meta charset="utf-8">
      <title>字幕导出</title>
    </head>
    <body>
      <h1 style="text-align:center; margin-bottom: 24px;">${title} - 学习笔记</h1>
      ${subtitles.map(sub => {
        const englishText = sub.english || sub.en || ''
        const chineseText = sub.chinese || sub.zh || ''
        
        return `
        <p style="color:#666; font-size:12px; margin-bottom:4px;">${sub.timeLabel || ''}</p>
        ${(mode === "bilingual" || mode === "english") && englishText ? 
          `<p style="margin-top:0; margin-bottom:${mode === "bilingual" ? "4" : "16"}px;">${cleanMarkup(englishText)}</p>` : 
          ''}
        ${(mode === "bilingual" || mode === "chinese") && chineseText ? 
          `<p style="margin-top:0; margin-bottom:16px; color:#666;">${cleanMarkup(chineseText)}</p>` : 
          ''}
      `
      }).join('')}
    </body>
    </html>
  `
  return html
}

// 触发下载
function downloadAsWord(html: string, title: string) {
  const blob = new Blob([html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${title} - 学习笔记.doc`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function ExportModal({ open, onClose, subtitles, title }: ExportModalProps) {
  const [exportMode, setExportMode] = useState<"bilingual" | "english" | "chinese">("bilingual")

  // === 核心修改：前端 DOM 兜底取标题 ===
  // 优先用传进来的 title。如果没传，直接去网页上抓取 <h1> 标签的文字
  const displayTitle = title || 
    (typeof document !== 'undefined' ? (document.querySelector('h1')?.textContent?.trim() || document.title) : '') 
    || '视频学习笔记'

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#000000]/50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-2xl w-[90vw] max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-lg font-bold text-foreground">
            {displayTitle} - 导出Word文档
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
              {displayTitle} - 学习笔记
            </h3>
            <div className="h-px bg-border/50" />
            {subtitles.map((sub) => {
              const englishText = sub.english || sub.en || ''
              const chineseText = sub.chinese || sub.zh || ''
              
              return (
                <div key={sub.id} className="py-4 border-b border-border/30 last:border-b-0">
                  <p className="text-xs text-muted-foreground mb-2 font-mono">{sub.timeLabel}</p>
                  {(exportMode === "bilingual" || exportMode === "english") && englishText && (
                    <p className="text-sm text-foreground leading-relaxed">{cleanMarkup(englishText)}</p>
                  )}
                  {(exportMode === "bilingual" || exportMode === "chinese") && chineseText && (
                    <p className={`text-sm text-muted-foreground leading-relaxed ${exportMode === "bilingual" ? "mt-1" : ""}`}>
                      {cleanMarkup(chineseText)}
                    </p>
                  )}
                </div>
              )
            })}
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
          <button 
            onClick={() => downloadAsWord(generateExportHtml(subtitles, displayTitle, exportMode), displayTitle)}
            className="px-6 py-2 rounded-lg bg-[#3b82f6] text-[#ffffff] text-sm font-medium hover:bg-[#16a34a] transition-colors"
          >
            导出Word
          </button>
        </div>
      </div>
    </>
  )
}