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
  ChevronDown,
} from "lucide-react"

interface SubtitleToolbarProps {
  subtitleMode: "bilingual" | "english" | "chinese"
  onSubtitleModeChange: (mode: "bilingual" | "english" | "chinese") => void
  playbackMode: "single" | "singleLoop"
  sentenceMode: "continuous" | "sentenceLoop"
  onPlaybackModeChange: (mode: "single" | "singleLoop") => void
  onSentenceModeChange: (mode: "continuous" | "sentenceLoop") => void
  loopCount: number
  autoNext: boolean
  onLoopCountChange: (count: number) => void
  onAutoNextChange: (val: boolean) => void
  onOpenVocabPanel: () => void
  onOpenExport: () => void
  practiceMode: "none" | "shadowing" | "fill"
  onPracticeModeChange: (mode: "none" | "shadowing" | "fill") => void
  onReset: () => void
}

const LOOP_COUNT_OPTIONS = [1, 2, 3, 4, 5, 0] // 0 = infinite

function loopCountLabel(count: number) {
  return count === 0 ? "无限次" : `${count}次`
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

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
        checked ? "bg-[#22c55e]" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}

export function SubtitleToolbar({
  subtitleMode,
  onSubtitleModeChange,
  playbackMode,
  sentenceMode,
  onPlaybackModeChange,
  onSentenceModeChange,
  loopCount,
  autoNext,
  onLoopCountChange,
  onAutoNextChange,
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
    <div className="hidden md:block shrink-0 z-10 border-b border-border/40" ref={dropdownRef}>
      {/* Top toolbar row */}
      <div className="flex items-center justify-between px-4 py-3">
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
            <ToolbarButton onClick={() => toggleDropdown("translate")} label="字幕" tooltip="字幕">
              <Languages className="size-4" />
            </ToolbarButton>
            {openDropdown === "translate" && (
              <div className="absolute right-0 top-full mt-1 bg-card rounded-xl shadow-xl z-30 w-40 py-1">
                <p className="px-3 py-1.5 text-xs text-muted-foreground font-medium">字幕</p>
                {(
                  [
                    { key: "bilingual" as const, label: "双语" },
                    { key: "english" as const, label: "英文" },
                    { key: "chinese" as const, label: "中文" },
                  ]
                ).map((item) => (
                  <button
                    key={item.key}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                    onClick={() => { onSubtitleModeChange(item.key); setOpenDropdown(null) }}
                  >
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
              active={openDropdown === "loop" || sentenceMode === "sentenceLoop"}
            >
              <Repeat className="size-4" />
            </ToolbarButton>
            {openDropdown === "loop" && (
              <div className="absolute right-0 top-full mt-1 bg-card rounded-xl shadow-xl z-30 w-52 py-2">
                <p className="px-3 py-1.5 text-xs text-muted-foreground font-medium">视频</p>
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                  onClick={() => onPlaybackModeChange("single")}
                >
                  <PlayCircle className="size-4" />
                  <span>单集播放</span>
                  {playbackMode === "single" && <Check className="size-4 text-[#22c55e] ml-auto" />}
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                  onClick={() => onPlaybackModeChange("singleLoop")}
                >
                  <RefreshCw className="size-4" />
                  <span>单集循环</span>
                  {playbackMode === "singleLoop" && <Check className="size-4 text-[#22c55e] ml-auto" />}
                </button>

                <p className="px-3 py-1.5 text-xs text-muted-foreground font-medium mt-1">句子</p>
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                  onClick={() => onSentenceModeChange("continuous")}
                >
                  <PlayCircle className="size-4" />
                  <span>连续播放</span>
                  {sentenceMode === "continuous" && <Check className="size-4 text-[#22c55e] ml-auto" />}
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                  onClick={() => onSentenceModeChange("sentenceLoop")}
                >
                  <RefreshCw className="size-4" />
                  <span>单句循环</span>
                  {sentenceMode === "sentenceLoop" && <Check className="size-4 text-[#22c55e] ml-auto" />}
                </button>

                {/* Loop config — only when sentenceLoop is active */}
                {sentenceMode === "sentenceLoop" && (
                  <div className="mt-1 pt-2 border-t border-border/40 px-3 pb-1 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">循环次数</span>
                      <div className="relative">
                        <select
                          value={loopCount}
                          onChange={(e) => onLoopCountChange(Number(e.target.value))}
                          className="text-xs font-medium text-foreground bg-muted/60 rounded-lg px-2 py-1 pr-5 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
                        >
                          {LOOP_COUNT_OPTIONS.map((n) => (
                            <option key={n} value={n}>{loopCountLabel(n)}</option>
                          ))}
                        </select>
                        <ChevronDown className="size-3 text-muted-foreground absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">自动下句</span>
                      <Toggle checked={autoNext} onChange={onAutoNextChange} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Practice dropdown */}
          <div className="relative">
            <ToolbarButton
              onClick={() => toggleDropdown("practice")}
              label="练习"
              tooltip="练习"
              active={openDropdown === "practice" || practiceMode !== "none"}
            >
              <AlignJustify className="size-4" />
            </ToolbarButton>
            {openDropdown === "practice" && (
              <div className="absolute right-0 top-full mt-1 bg-card rounded-xl shadow-xl z-30 w-40 py-1">
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                  onClick={() => { onPracticeModeChange("shadowing"); setOpenDropdown(null) }}
                >
                  <Mic className="size-4" />
                  <span>跟读练习</span>
                  {practiceMode === "shadowing" && <Check className="size-4 text-[#22c55e] ml-auto" />}
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                  onClick={() => { onPracticeModeChange("fill"); setOpenDropdown(null) }}
                >
                  <FileText className="size-4" />
                  <span>填空练习</span>
                  {practiceMode === "fill" && <Check className="size-4 text-[#22c55e] ml-auto" />}
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                  onClick={() => { onPracticeModeChange("none"); setOpenDropdown(null) }}
                >
                  <X className="size-4" />
                  <span>关闭练习</span>
                  {practiceMode === "none" && <Check className="size-4 text-[#22c55e] ml-auto" />}
                </button>
              </div>
            )}
          </div>

          {/* Vocab panel */}
          <ToolbarButton onClick={onOpenVocabPanel} label="精读" tooltip="精读">
            <BookOpen className="size-4" />
          </ToolbarButton>

          {/* Export */}
          <ToolbarButton onClick={onOpenExport} label="导出" tooltip="导出">
            <FileDown className="size-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Loop count display bar — shown below toolbar when sentenceLoop is active */}
      {sentenceMode === "sentenceLoop" && (
        <div className="flex items-center gap-2 px-4 pb-2.5">
          <span className="text-xs text-muted-foreground">循环次数：</span>
          <div className="relative">
            <select
              value={loopCount}
              onChange={(e) => onLoopCountChange(Number(e.target.value))}
              className="text-xs font-semibold text-foreground bg-muted/60 rounded-lg px-2.5 py-1 pr-6 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
            >
              {LOOP_COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>{loopCountLabel(n)}</option>
              ))}
            </select>
            <ChevronDown className="size-3 text-muted-foreground absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  )
}
