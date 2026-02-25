"use client"

import { useState, useRef, useEffect } from "react"
import { X, Volume2, Bookmark } from "lucide-react"
import type { ClickableWord } from "@/lib/video-data"

interface DictionaryPopupProps {
  word: ClickableWord | null
  anchorPos: { x: number; y: number } | null
  onClose: () => void
}

export function DictionaryPopup({ word, anchorPos, onClose }: DictionaryPopupProps) {
  const [favorited, setFavorited] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  useEffect(() => {
    if (!anchorPos || !popupRef.current) return
    const popup = popupRef.current
    const rect = popup.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    let top = anchorPos.y + 8
    let left = anchorPos.x - rect.width / 2

    // Keep within viewport horizontally
    if (left < 12) left = 12
    if (left + rect.width > vw - 12) left = vw - rect.width - 12

    // If overflows bottom, show above
    if (top + rect.height > vh - 12) {
      top = anchorPos.y - rect.height - 8
    }

    setPos({ top, left })
  }, [anchorPos, word])

  useEffect(() => {
    setFavorited(false)
  }, [word])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (word) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [word, onClose])

  if (!word || !anchorPos) return null

  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-72 bg-card rounded-xl shadow-2xl p-4"
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-foreground">{word.word}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            {word.phonetic && (
              <span className="text-xs text-muted-foreground">{word.phonetic}</span>
            )}
            <button className="p-0.5 rounded-full hover:bg-accent transition-colors" aria-label="发音">
              <Volume2 className="size-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-0.5 rounded-full hover:bg-accent transition-colors shrink-0"
          aria-label="关闭"
        >
          <X className="size-4 text-muted-foreground" />
        </button>
      </div>

      <p className="text-sm text-foreground mb-1">
        <span className="text-muted-foreground mr-1">{word.pos}</span>
        {word.meaningCn}
      </p>

      <div className="bg-[#f0fdf4] rounded-lg p-2.5 border-l-3 border-[#86efac]">
        <p className="text-xs text-muted-foreground leading-relaxed">{word.meaningEn}</p>
      </div>

      <div className="flex items-center justify-end mt-3">
        <button
          onClick={() => setFavorited(!favorited)}
          className={`p-1.5 rounded-lg transition-colors ${
            favorited
              ? "text-[#f59e0b]"
              : "text-muted-foreground/50 hover:text-muted-foreground"
          }`}
          aria-label={favorited ? "取消收藏" : "收藏"}
        >
          <Bookmark className="size-4" fill={favorited ? "#f59e0b" : "none"} />
        </button>
      </div>
    </div>
  )
}
