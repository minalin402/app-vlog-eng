"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { subtitles, type ClickableWord } from "@/lib/video-data"
import { VideoHeader } from "./components/video-learning/video-header"
import { VideoPlayer } from "./components/video-learning/video-player"
import { VideoDescription } from "./components/video-learning/video-description"
import { SubtitleToolbar } from "./components/video-learning/subtitle-toolbar"
import { SubtitleCard } from "./components/video-learning/subtitle-card"
import { DictionaryPopup } from "./components/video-learning/dictionary-modal"
import { ExportModal } from "./components/video-learning/export-modal"
import { ResetDialog } from "./components/video-learning/reset-dialog"
import { VocabPanel } from "./components/video-learning/vocab-panel"
import { MobilePlaybackBar } from "./components/video-learning/mobile-playback-bar"
import { Clapperboard, X } from "lucide-react"

export default function VideoLearningPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const duration = 48

  const [subtitleMode, setSubtitleMode] = useState<"bilingual" | "english" | "chinese">("bilingual")
  const [practiceMode, setPracticeMode] = useState<"none" | "shadowing" | "fill">("none")
  const [playbackMode, setPlaybackMode] = useState<"single" | "singleLoop">("single")
  const [sentenceMode, setSentenceMode] = useState<"continuous" | "sentenceLoop">("continuous")
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium")

  const [mobileVideoMode, setMobileVideoMode] = useState<"full" | "mini" | "hidden">("full")

  const [showVocabPanel, setShowVocabPanel] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [selectedWord, setSelectedWord] = useState<ClickableWord | null>(null)
  const [wordAnchorPos, setWordAnchorPos] = useState<{ x: number; y: number } | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const subtitleRefs = useRef<(HTMLDivElement | null)[]>([])

  const activeSubtitleIndex = subtitles.findIndex(
    (sub) => currentTime >= sub.startTime && currentTime < sub.endTime
  )

  const handlePracticeModeChange = useCallback((mode: "none" | "shadowing" | "fill") => {
    setPracticeMode(mode)
    if (mode !== "none") {
      setMobileVideoMode("mini")
    } else {
      setMobileVideoMode("full")
    }
  }, [])

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.5 * playbackSpeed
          if (next >= duration) {
            if (playbackMode === "singleLoop") return 0
            setIsPlaying(false)
            return duration
          }
          return next
        })
      }, 500)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, playbackMode, duration, playbackSpeed])

  useEffect(() => {
    if (activeSubtitleIndex >= 0 && subtitleRefs.current[activeSubtitleIndex]) {
      subtitleRefs.current[activeSubtitleIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [activeSubtitleIndex])

  const handlePlayPause = useCallback(() => setIsPlaying((prev) => !prev), [])
  const handleSeek = useCallback((time: number) => setCurrentTime(Math.max(0, Math.min(time, duration))), [duration])
  const handleClickTimestamp = useCallback((time: number) => { setCurrentTime(time); setIsPlaying(true) }, [])
  const handleReset = useCallback(() => { setCurrentTime(0); setIsPlaying(false); setPracticeMode("none"); setMobileVideoMode("full"); setShowResetDialog(false) }, [])
  const handleClickWord = useCallback((word: ClickableWord, pos: { x: number; y: number }) => { setSelectedWord(word); setWordAnchorPos(pos) }, [])
  const handleCloseWord = useCallback(() => { setSelectedWord(null); setWordAnchorPos(null) }, [])

  const fontSizeClass = fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-base" : "text-sm"

  return (
    <div className="h-screen flex flex-col bg-muted/40 overflow-hidden">
      <VideoHeader />

      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left Column: Video + Description - FIXED, no scroll */}
        <div className="w-[50%] shrink-0 flex flex-col p-4 overflow-hidden">
          <div className="shrink-0 rounded-2xl overflow-hidden shadow-md">
            <VideoPlayer
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              playbackSpeed={playbackSpeed}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
            />
          </div>
          <div className="mt-3 shrink-0">
            <VideoDescription />
          </div>
        </div>

        {/* Middle Column: Dynamic Subtitles - wrapped in one card */}
        <div className={`flex flex-col overflow-hidden transition-all py-3 pr-3 ${
          showVocabPanel ? "w-[25%]" : "w-[50%]"
        }`}>
          <div className="flex flex-col flex-1 overflow-hidden bg-card rounded-2xl shadow-md">
            <SubtitleToolbar
              subtitleMode={subtitleMode}
              onSubtitleModeChange={setSubtitleMode}
              playbackMode={playbackMode}
              sentenceMode={sentenceMode}
              onPlaybackModeChange={setPlaybackMode}
              onSentenceModeChange={setSentenceMode}
              onOpenVocabPanel={() => setShowVocabPanel(!showVocabPanel)}
              onOpenExport={() => setShowExportModal(true)}
              practiceMode={practiceMode}
              onPracticeModeChange={setPracticeMode}
              onReset={() => setShowResetDialog(true)}
            />
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col">
                {subtitles.map((sub, i) => (
                  <div
                    key={sub.id}
                    ref={(el) => { subtitleRefs.current[i] = el }}
                  >
                    <SubtitleCard
                      subtitle={sub}
                      isActive={i === activeSubtitleIndex}
                      subtitleMode={subtitleMode}
                      practiceMode={practiceMode}
                      fillBlankMode={practiceMode === "fill"}
                      onClickWord={handleClickWord}
                      onClickTimestamp={handleClickTimestamp}
                      fontSizeClass={fontSizeClass}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Vocab Panel - wrapped in one card */}
        {showVocabPanel && (
          <div className="w-[25%] shrink-0 overflow-hidden py-3 pr-3">
            <div className="h-full bg-card rounded-2xl shadow-md overflow-hidden">
              <VocabPanel open={showVocabPanel} onClose={() => setShowVocabPanel(false)} />
            </div>
          </div>
        )}
      </div>

      {/* ===== MOBILE LAYOUT ===== */}
      <div className="flex-1 flex flex-col md:hidden overflow-y-auto pb-20">
        {mobileVideoMode === "full" && (
          <div className="sticky top-0 z-30 bg-background shrink-0">
            <VideoPlayer
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              playbackSpeed={playbackSpeed}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
            />
          </div>
        )}

        {mobileVideoMode === "mini" && (
          <div className="fixed top-14 right-3 z-40 w-40 rounded-lg overflow-hidden shadow-xl border border-border/50">
            <VideoPlayer
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              playbackSpeed={playbackSpeed}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              mini
            />
            <button
              onClick={() => setMobileVideoMode("hidden")}
              className="absolute top-1 right-1 z-50 size-6 rounded-full bg-[#000000]/60 text-[#ffffff] flex items-center justify-center"
              aria-label="收起视频"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {mobileVideoMode === "hidden" && (
          <button
            onClick={() => setMobileVideoMode("mini")}
            className="fixed top-14 right-3 z-40 size-12 rounded-full bg-[#22c55e]/90 text-[#ffffff] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            aria-label="打开视频"
          >
            <Clapperboard className="size-5" />
          </button>
        )}

        <div className="flex-1 p-3 flex flex-col gap-2.5">
          {subtitles.map((sub, i) => (
            <SubtitleCard
              key={sub.id}
              subtitle={sub}
              isActive={i === activeSubtitleIndex}
              subtitleMode={subtitleMode}
              practiceMode={practiceMode}
              fillBlankMode={practiceMode === "fill"}
              onClickWord={handleClickWord}
              onClickTimestamp={handleClickTimestamp}
              fontSizeClass={fontSizeClass}
            />
          ))}
        </div>
      </div>

      <MobilePlaybackBar
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        subtitleMode={subtitleMode}
        playbackMode={playbackMode}
        sentenceMode={sentenceMode}
        practiceMode={practiceMode}
        fontSize={fontSize}
        onPlayPause={handlePlayPause}
        onSpeedChange={setPlaybackSpeed}
        onSubtitleModeChange={setSubtitleMode}
        onPlaybackModeChange={setPlaybackMode}
        onSentenceModeChange={setSentenceMode}
        onPracticeModeChange={handlePracticeModeChange}
        onFontSizeChange={setFontSize}
      />

      <DictionaryPopup word={selectedWord} anchorPos={wordAnchorPos} onClose={handleCloseWord} />
      <ExportModal open={showExportModal} onClose={() => setShowExportModal(false)} />
      <ResetDialog open={showResetDialog} onConfirm={handleReset} onCancel={() => setShowResetDialog(false)} />
    </div>
  )
}
