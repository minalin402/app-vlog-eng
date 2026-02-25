"use client"

import { useState, useRef, useEffect } from "react"
import {
  RotateCcw,
  Languages,
  Repeat,
  AlignJustify,
  BookOpen,
  FileDown,
  Check,
  PlayCircle,
  RefreshCw,
  Mic,
  X,
  FileText,
} from "lucide-react"

interface SubtitleToolbarProps {
  subtitleMode: "bilingual" | "english" | "chinese"
  onSubtitleModeChange: (mode: "bilingual" | "english" | "chinese") => void
  playbackMode: "single" | "singleLoop"
  sentenceMode: "continuous" | "sentenceLoop"
  onPlaybackModeChange: (mode: "single" | "singleLoop") => void
  onSentenceModeChange: (mode: "continuous" | "sentenceLoop") => void
  onOpenVocabPanel: () => void
  onOpenExport: () => void
  practiceMode: "none" | "shadowing" | "fill"
  onPracticeModeChange: (mode: "none" | "shadowing" | "fill") => void
  onReset: () => void
}

function ToolbarButton({
  onClick,
  label,
  tooltip,
  active,
  className,
  children,
}: {
  onClick: () => void
  label: string
  tooltip: string
  active?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={
          className ||
          `p-2 rounded-lg transition-colors ${
            active ? "bg-[#3b82f6] text-[#ffffff]" : "text-muted-foreground hover:bg-accent"
          }`
        }
        aria-label={label}
      >
        {children}
      </button>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded bg-[#1e293b] text-[#ffffff] text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-40">
        {tooltip}
      </div>
    </div>
  )
}

export function SubtitleToolbar({
  subtitleMode,
  onSubtitleModeChange,
  playbackMode,
  sentenceMode,
  onPlaybackModeChange,
  onSentenceModeChange,
  onOpenVocabPanel,
  onOpenExport,
  practiceMode,
  onPracticeModeChange,
  onReset,
}: SubtitleToolbarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name)
  }

  return (
    <div className="hidden md:flex items-center justify-between px-4 py-3 shrink-0 z-10 border-b border-border/40" ref={dropdownRef}>
      <h2 className="font-semibold text-foreground text-base">动态字幕</h2>
      <div className="flex items-center gap-1">
        {/* Reset */}
        <ToolbarButton
          onClick={onReset}
          label="重新学习"
          tooltip="重新学习"
          className="p-2 rounded-lg text-[#ef4444] hover:bg-accent transition-colors"
        >
          <RotateCcw className="size-4" />
        </ToolbarButton>

        {/* Translate dropdown */}
        <div className="relative">
          <ToolbarButton
            onClick={() => toggleDropdown("translate")}
            label="字幕"
            tooltip="字幕"
          >
            <Languages className="size-4" />
          </ToolbarButton>
          {openDropdown === "translate" && (
            <div className="absolute right-0 top-full mt-1 bg-card rounded-xl shadow-xl z-30 w-40 py-1">
              <p className="px-3 py-1.5 text-xs text-muted-foreground font-medium">字幕</p>
              {(
                [
                  { key: "bilingual" as const, icon: <Languages className="size-4" />, label: "双语" },
                  { key: "english" as const, icon: <span className="text-xs font-bold w-4 text-center">EN</span>, label: "英文" },
                  { key: "chinese" as const, icon: <span className="text-xs font-bold w-4 text-center">中</span>, label: "中文" },
                ]
              ).map((item) => (
                <button
                  key={item.key}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                  onClick={() => {
                    onSubtitleModeChange(item.key)
                    setOpenDropdown(null)
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {subtitleMode === item.key && <Check className="size-4 text-[#22c55e] ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loop dropdown */}
        <div className="relative">
          <ToolbarButton
            onClick={() => toggleDropdown("loop")}
            label="循环"
            tooltip="循环"
          >
            <Repeat className="size-4" />
          </ToolbarButton>
          {openDropdown === "loop" && (
            <div className="absolute right-0 top-full mt-1 bg-card rounded-xl shadow-xl z-30 w-44 py-1">
              <p className="px-3 py-1.5 text-xs text-muted-foreground font-medium">视频</p>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                onClick={() => { onPlaybackModeChange("single") }}
              >
                <PlayCircle className="size-4" />
                <span>单集播放</span>
                {playbackMode === "single" && <Check className="size-4 text-[#22c55e] ml-auto" />}
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                onClick={() => { onPlaybackModeChange("singleLoop") }}
              >
                <RefreshCw className="size-4" />
                <span>单集循环</span>
                {playbackMode === "singleLoop" && <Check className="size-4 text-[#22c55e] ml-auto" />}
              </button>
              <p className="px-3 py-1.5 text-xs text-muted-foreground font-medium mt-1">句子</p>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                onClick={() => { onSentenceModeChange("continuous") }}
              >
                <PlayCircle className="size-4" />
                <span>连续播放</span>
                {sentenceMode === "continuous" && <Check className="size-4 text-[#22c55e] ml-auto" />}
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                onClick={() => { onSentenceModeChange("sentenceLoop") }}
              >
                <RefreshCw className="size-4" />
                <span>单句循环</span>
                {sentenceMode === "sentenceLoop" && <Check className="size-4 text-[#22c55e] ml-auto" />}
              </button>
            </div>
          )}
        </div>

        {/* Practice dropdown */}
        <div className="relative">
          <ToolbarButton
            onClick={() => toggleDropdown("practice")}
            label="练习"
            tooltip="练习"
            active={openDropdown === "practice"}
          >
            <AlignJustify className="size-4" />
          </ToolbarButton>
          {openDropdown === "practice" && (
            <div className="absolute right-0 top-full mt-1 bg-card rounded-xl shadow-xl z-30 w-36 py-1">
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                onClick={() => {
                  onPracticeModeChange("shadowing")
                  setOpenDropdown(null)
                }}
              >
                <Mic className="size-4" />
                <span>跟读练习</span>
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                onClick={() => {
                  onPracticeModeChange("fill")
                  setOpenDropdown(null)
                }}
              >
                <FileText className="size-4" />
                <span>填空练习</span>
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                onClick={() => {
                  onPracticeModeChange("none")
                  setOpenDropdown(null)
                }}
              >
                <X className="size-4" />
                <span>关闭练习</span>
              </button>
            </div>
          )}
        </div>

        {/* Vocab panel (Book icon) */}
        <ToolbarButton
          onClick={onOpenVocabPanel}
          label="精读"
          tooltip="精读"
        >
          <BookOpen className="size-4" />
        </ToolbarButton>

        {/* Export */}
        <ToolbarButton
          onClick={onOpenExport}
          label="导出"
          tooltip="导出"
        >
          <FileDown className="size-4" />
        </ToolbarButton>
      </div>
    </div>
  )
}
