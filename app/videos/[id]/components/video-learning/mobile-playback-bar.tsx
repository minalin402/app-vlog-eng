"use client"

import { useState } from "react"
import {
  Languages,
  Play,
  Pause,
  Repeat,
  BookOpen,
  PlayCircle,
  RefreshCw,
  Mic,
  FileText,
  X,
  ChevronRight,
  Check,
} from "lucide-react"
import Link from "next/link"

interface MobilePlaybackBarProps {
  isPlaying: boolean
  playbackSpeed: number
  subtitleMode: "bilingual" | "english" | "chinese"
  playbackMode: "single" | "singleLoop"
  sentenceMode: "continuous" | "sentenceLoop"
  practiceMode: "none" | "shadowing" | "fill"
  fontSize: "small" | "medium" | "large"
  loopCount: number
  autoNext: boolean
  onPlayPause: () => void
  onSpeedChange: (speed: number) => void
  onSubtitleModeChange: (mode: "bilingual" | "english" | "chinese") => void
  onPlaybackModeChange: (mode: "single" | "singleLoop") => void
  onSentenceModeChange: (mode: "continuous" | "sentenceLoop") => void
  onPracticeModeChange: (mode: "none" | "shadowing" | "fill") => void
  onFontSizeChange: (size: "small" | "medium" | "large") => void
  onLoopCountChange: (count: number) => void
  onAutoNextChange: (val: boolean) => void
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]

type SheetType = "subtitle" | "speed" | "loop" | "practice" | null

function GreenCheck() {
  return (
    <span className="flex items-center justify-center size-5 rounded-full bg-[#22c55e] ml-auto shrink-0">
      <Check className="size-3 text-[#ffffff]" strokeWidth={3} />
    </span>
  )
}

export function MobilePlaybackBar({
  isPlaying,
  playbackSpeed,
  subtitleMode,
  playbackMode,
  sentenceMode,
  practiceMode,
  fontSize,
  loopCount,
  autoNext,
  onPlayPause,
  onSpeedChange,
  onSubtitleModeChange,
  onPlaybackModeChange,
  onSentenceModeChange,
  onPracticeModeChange,
  onFontSizeChange,
  onLoopCountChange,
  onAutoNextChange,
}: MobilePlaybackBarProps) {
  const [activeSheet, setActiveSheet] = useState<SheetType>(null)

  const toggleSheet = (sheet: SheetType) => {
    setActiveSheet(activeSheet === sheet ? null : sheet)
  }

  const closeSheet = () => setActiveSheet(null)

  const subtitleLabel = subtitleMode === "bilingual" ? "双语" : subtitleMode === "english" ? "英文" : "中文"

  return (
    <>
      {/* Backdrop */}
      {activeSheet && (
        <div
          className="fixed inset-0 z-40 bg-[#000000]/30 md:hidden"
          onClick={closeSheet}
        />
      )}

      {/* ======= SHEETS - flush from page bottom, bar overlays on top ======= */}

      {/* Subtitle sheet */}
      {activeSheet === "subtitle" && (
        <div className="fixed left-0 right-0 bottom-0 z-40 md:hidden bg-card rounded-t-2xl shadow-xl pb-20">
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="px-5 pb-5">
            <div className="flex items-center gap-3 py-3">
              <Languages className="size-5 text-foreground shrink-0" />
              <span className="text-sm text-foreground font-medium shrink-0">字幕切换</span>
              <div className="flex items-center gap-1 ml-auto">
                {([
                  { key: "bilingual" as const, label: "双语" },
                  { key: "english" as const, label: "英文" },
                  { key: "chinese" as const, label: "中文" },
                ]).map((item) => (
                  <button
                    key={item.key}
                    onClick={() => onSubtitleModeChange(item.key)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      subtitleMode === item.key
                        ? "bg-[#22c55e] text-[#ffffff]"
                        : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 py-3 mt-1 rounded-xl bg-muted/50 px-3">
              <svg className="size-5 text-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
              <span className="text-sm text-foreground font-medium shrink-0">字体大小</span>
              <div className="flex-1 mx-2">
                <input
                  type="range"
                  min="0"
                  max="2"
                  value={fontSize === "small" ? 0 : fontSize === "medium" ? 1 : 2}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    onFontSizeChange(val === 0 ? "small" : val === 1 ? "medium" : "large")
                  }}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted accent-[#22c55e]"
                />
              </div>
              <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">
                {fontSize === "small" ? "小号" : fontSize === "medium" ? "中号" : "大号"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Speed sheet */}
      {activeSheet === "speed" && (
        <div className="fixed left-0 right-0 bottom-0 z-40 md:hidden bg-card rounded-t-2xl shadow-xl pb-20">
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="px-3 pb-4">
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { onSpeedChange(s); closeSheet() }}
                className={`flex items-center justify-between w-full px-4 py-3 text-sm rounded-lg transition-colors ${
                  playbackSpeed === s ? "text-[#22c55e] font-semibold" : "text-foreground hover:bg-accent"
                }`}
              >
                <span>{s}x</span>
                {playbackSpeed === s && <GreenCheck />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loop sheet */}
      {activeSheet === "loop" && (
        <div className="fixed left-0 right-0 bottom-0 z-40 md:hidden bg-card rounded-t-2xl shadow-xl pb-20">
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="px-5 pb-5">
            <p className="text-xs text-muted-foreground font-medium py-2">视频</p>
            <button
              onClick={() => onPlaybackModeChange("single")}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-muted/50 mb-2 transition-colors"
            >
              <PlayCircle className="size-5 text-muted-foreground" />
              <span className="text-sm text-foreground">单集播放</span>
              {playbackMode === "single" ? <GreenCheck /> : <ChevronRight className="size-4 text-muted-foreground ml-auto" />}
            </button>
            <button
              onClick={() => onPlaybackModeChange("singleLoop")}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-muted/50 mb-2 transition-colors"
            >
              <RefreshCw className="size-5 text-muted-foreground" />
              <span className="text-sm text-foreground">单集循环</span>
              {playbackMode === "singleLoop" ? <GreenCheck /> : <ChevronRight className="size-4 text-muted-foreground ml-auto" />}
            </button>

            <p className="text-xs text-muted-foreground font-medium py-2 mt-2">句子</p>
            <button
              onClick={() => onSentenceModeChange("continuous")}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-muted/50 mb-2 transition-colors"
            >
              <PlayCircle className="size-5 text-muted-foreground" />
              <span className="text-sm text-foreground">连续播放</span>
              {sentenceMode === "continuous" ? <GreenCheck /> : <ChevronRight className="size-4 text-muted-foreground ml-auto" />}
            </button>
            <button
              onClick={() => onSentenceModeChange("sentenceLoop")}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-muted/50 transition-colors"
            >
              <RefreshCw className="size-5 text-muted-foreground" />
              <span className="text-sm text-foreground">单句循环</span>
              {sentenceMode === "sentenceLoop" ? <GreenCheck /> : <ChevronRight className="size-4 text-muted-foreground ml-auto" />}
            </button>

            {/* Sentence loop config — shown when sentenceLoop is active */}
            {sentenceMode === "sentenceLoop" && (
              <div className="mt-3 pt-3 border-t border-border/40 flex flex-col gap-4">
                {/* Loop count slider */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-foreground shrink-0">单句循环次数</span>
                  <div className="flex-1 mx-1">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={loopCount === 0 ? 5 : loopCount}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        onLoopCountChange(v)
                      }}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted accent-[#22c55e]"
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground shrink-0 w-8 text-right">
                    {loopCount === 0 ? "∞" : `${loopCount}次`}
                  </span>
                </div>
                {/* Auto next toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">自动播放下句</span>
                  <button
                    role="switch"
                    aria-checked={autoNext}
                    onClick={() => onAutoNextChange(!autoNext)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      autoNext ? "bg-[#22c55e]" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
                        autoNext ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Practice sheet */}
      {activeSheet === "practice" && (
        <div className="fixed left-0 right-0 bottom-0 z-40 md:hidden bg-card rounded-t-2xl shadow-xl pb-20">
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="px-4 pb-4 flex flex-col gap-2">
            <Link
              href="/vocab-cards"
              onClick={closeSheet}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl bg-muted/50 transition-colors hover:bg-accent"
            >
              <BookOpen className="size-5 text-muted-foreground" />
              <span className="text-sm text-foreground">英语卡片</span>
              <ChevronRight className="size-4 text-muted-foreground ml-auto" />
            </Link>
            <button
              onClick={() => { onPracticeModeChange("shadowing"); closeSheet() }}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl bg-muted/50 transition-colors hover:bg-accent"
            >
              <Mic className="size-5 text-muted-foreground" />
              <span className="text-sm text-foreground">跟读练习</span>
              <ChevronRight className="size-4 text-muted-foreground ml-auto" />
            </button>
            <button
              onClick={() => { onPracticeModeChange("fill"); closeSheet() }}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl bg-muted/50 transition-colors hover:bg-accent"
            >
              <FileText className="size-5 text-muted-foreground" />
              <span className="text-sm text-foreground">填空练习</span>
              <ChevronRight className="size-4 text-muted-foreground ml-auto" />
            </button>
            {practiceMode !== "none" && (
              <button
                onClick={() => { onPracticeModeChange("none"); closeSheet() }}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl bg-muted/50 transition-colors hover:bg-accent"
              >
                <X className="size-5 text-muted-foreground" />
                <span className="text-sm text-foreground">关闭精读</span>
                <ChevronRight className="size-4 text-muted-foreground ml-auto" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ======= BOTTOM TAB BAR - always on top ======= */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card shadow-[0_-2px_12px_rgba(0,0,0,0.08)] md:hidden safe-area-bottom">
        <div className="flex items-center justify-around px-4 py-2">
          {/* 双语 */}
          <button
            onClick={() => toggleSheet("subtitle")}
            className="flex flex-col items-center gap-0.5 py-1"
          >
            <Languages className={`size-5 ${activeSheet === "subtitle" ? "text-[#22c55e]" : "text-muted-foreground"}`} />
            <span className={`text-[10px] ${activeSheet === "subtitle" ? "text-[#22c55e] font-medium" : "text-muted-foreground"}`}>
              {subtitleLabel}
            </span>
          </button>

          {/* 倍速 */}
          <button
            onClick={() => toggleSheet("speed")}
            className="flex flex-col items-center gap-0.5 py-1"
          >
            <span className={`text-sm font-bold leading-5 ${
              activeSheet === "speed" ? "text-[#22c55e]" : "text-muted-foreground"
            }`}>
              {playbackSpeed === 1 ? "1x" : `${playbackSpeed}x`}
            </span>
            <span className={`text-[10px] ${activeSheet === "speed" ? "text-[#22c55e] font-medium" : "text-muted-foreground"}`}>
              倍速
            </span>
          </button>

          {/* Center play button */}
          <button
            onClick={onPlayPause}
            className="flex items-center justify-center size-14 -mt-4 rounded-full bg-[#22c55e] text-[#ffffff] shadow-lg active:scale-95 transition-transform"
            aria-label={isPlaying ? "暂停" : "播放"}
          >
            {isPlaying ? <Pause className="size-6" /> : <Play className="size-6 ml-0.5" fill="#ffffff" />}
          </button>

          {/* 循环 */}
          <button
            onClick={() => toggleSheet("loop")}
            className="flex flex-col items-center gap-0.5 py-1"
          >
            <Repeat className={`size-5 ${activeSheet === "loop" ? "text-[#22c55e]" : "text-muted-foreground"}`} />
            <span className={`text-[10px] ${activeSheet === "loop" ? "text-[#22c55e] font-medium" : "text-muted-foreground"}`}>
              循环
            </span>
          </button>

          {/* 精读 */}
          <button
            onClick={() => toggleSheet("practice")}
            className="flex flex-col items-center gap-0.5 py-1"
          >
            <BookOpen className={`size-5 ${activeSheet === "practice" || practiceMode !== "none" ? "text-[#22c55e]" : "text-muted-foreground"}`} />
            <span className={`text-[10px] ${activeSheet === "practice" || practiceMode !== "none" ? "text-[#22c55e] font-medium" : "text-muted-foreground"}`}>
              精读
            </span>
          </button>
        </div>
      </div>
    </>
  )
}
