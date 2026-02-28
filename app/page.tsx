"use client"

import { useState, useRef, useEffect, useCallback, memo } from "react"
import { fetchMockVideoData, type VideoData, type SubtitleItem, type ClickableWord } from "@/lib/video-data"
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className ?? ""}`} />
}
function PageSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-muted/40 overflow-hidden">
      <div className="h-14 bg-card shadow-sm shrink-0" />
      <div className="hidden md:flex flex-1 overflow-hidden p-4 gap-4">
        <div className="w-[50%] flex flex-col gap-3">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-12 rounded-xl" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SubtitleList: static render, NEVER re-renders due to time changes ────────
// All active-highlight logic is handled purely via DOM classList — no state.
// Each row gets data-start / data-end / class="subtitle-line" for rAF to target.
const SubtitleList = memo(function SubtitleList({
  subtitles,
  subtitleMode,
  practiceMode,
  fontSizeClass,
  onClickWord,
  onClickTimestamp,
  onPlaySegment,
  onPauseVideo,
  videoId,
  vocabularies,
  phrases,
  expressions,
}: {
  subtitles: SubtitleItem[]
  subtitleMode: "bilingual" | "english" | "chinese"
  practiceMode: "none" | "shadowing" | "fill"
  fontSizeClass: string
  onClickWord: (word: ClickableWord, pos: { x: number; y: number }) => void
  onClickTimestamp: (time: number) => void
  onPlaySegment?: (startTime: number, endTime: number) => void
  onPauseVideo?: () => void
  videoId?: string
  vocabularies?: import("@/lib/video-data").VocabItem[]
  phrases?: import("@/lib/video-data").PhraseItem[]
  expressions?: import("@/lib/video-data").ExpressionItem[]
}) {
  return (
    <>
      {subtitles.map((sub) => (
        <div
          key={sub.id}
          className="subtitle-line"
          data-start={sub.startTime}
          data-end={sub.endTime}
          data-id={sub.id}
        >
          <SubtitleCard
            subtitle={sub}
            isActive={false}         // never driven by React state
            subtitleMode={subtitleMode}
            practiceMode={practiceMode}
            fillBlankMode={practiceMode === "fill"}
            onClickWord={onClickWord}
            onClickTimestamp={onClickTimestamp}
            onPlaySegment={onPlaySegment}
            onPauseVideo={onPauseVideo}
            fontSizeClass={fontSizeClass}
            videoId={videoId}
            vocabularies={vocabularies}
            phrases={phrases}
            expressions={expressions}
          />
        </div>
      ))}
    </>
  )
})

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VideoLearningPage() {

  // ── Data loading ──────────────────────────────────────────────────────
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMockVideoData("test_video_01").then((data) => {
      setVideoData(data)
      setIsLoading(false)
    })
  }, [])

  // ── Video element ref ─────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null)

  // ── Player UI state (only things that drive layout / controls) ────────
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // ── Loop / sentence settings ──────────────────────────────────────────
  const [subtitleMode, setSubtitleMode] = useState<"bilingual" | "english" | "chinese">("bilingual")
  const [playbackMode, setPlaybackMode] = useState<"single" | "singleLoop">("single")
  const [sentenceMode, setSentenceMode] = useState<"continuous" | "sentenceLoop">("continuous")
  const [loopCount, setLoopCount] = useState(2)
  const [autoNext, setAutoNext] = useState(true)
  const [practiceMode, setPracticeMode] = useState<"none" | "shadowing" | "fill">("none")
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium")
  const [mobileVideoMode, setMobileVideoMode] = useState<"full" | "mini" | "hidden">("full")
  const [showVocabPanel, setShowVocabPanel] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [selectedWord, setSelectedWord] = useState<ClickableWord | null>(null)
  const [wordAnchorPos, setWordAnchorPos] = useState<{ x: number; y: number } | null>(null)

  // ── Ref mirrors for rAF loop ──────────────────────────────────────────
  // The rAF callback is created once and reads these refs, never re-created.
  const subtitlesRef     = useRef<SubtitleItem[]>([])
  const playbackModeRef  = useRef(playbackMode)
  const sentenceModeRef  = useRef(sentenceMode)
  const loopCountRef     = useRef(loopCount)
  const autoNextRef      = useRef(autoNext)

  // Current loop state for sentence loop
  const currentLoopCountRef = useRef(0)      // how many times current sentence has looped
  const isSeekingRef        = useRef(false)  // debounce guard to prevent re-entry



  useEffect(() => { playbackModeRef.current = playbackMode }, [playbackMode])
  useEffect(() => { sentenceModeRef.current = sentenceMode }, [sentenceMode])
  useEffect(() => { loopCountRef.current = loopCount }, [loopCount])
  useEffect(() => { autoNextRef.current = autoNext }, [autoNext])

  // Keep subtitlesRef in sync without a useEffect (safe — render phase only)
  subtitlesRef.current = videoData?.subtitles ?? []

  // ── Sync play/pause — imperative, no useEffect ───────────────────────
  // Previously a useEffect drove play/pause via isPlaying state. That caused
  // a microtask-delay race where the effect's video.pause() fired AFTER the
  // brake scanner's video.pause(), resulting in a net re-play. Now play/pause
  // is commanded directly at the call site; isPlaying is UI-only state.

  // ── Sync speed ────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = playbackSpeed
  }, [playbackSpeed])

  // ── Sync muted ────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = muted
  }, [muted])

  // ─────────────────────────────────────────────────────────────────────
  // CORE ENGINE: requestAnimationFrame loop
  //
  // Architecture guarantees (per spec):
  //   1. No onTimeUpdate binding at all — rAF polling instead
  //   2. Highlight = pure DOM classList mutation, zero React setState
  //   3. Auto-scroll = gated by lastHighlightedIdRef change (fires once per switch)
  //   4. Segment playback trap: segmentEndRef checked at HIGHEST PRIORITY each frame
  //
  // The loop function is created once (empty deps []) and stored in rafCallbackRef.
  // start/stop helpers read it via ref — no stale closures anywhere.
  // ─────────────────────────────────────────────────────────────────────
  const rafIdRef             = useRef<number | null>(null)
  const lastHighlightedIdRef = useRef<string | number | null>(null)
  const shadowingEndTimeRef  = useRef<number | null>(null)  // Single-sentence brake target

  // setIsPlaying lives in state but we need to call it from inside the rAF
  // callback (which has empty deps []). Bridge it via a stable ref.
  const setIsPlayingRef = useRef<(v: boolean) => void>(() => {})

  // The actual per-frame work — stable, created once
  const rafCallback = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const time = video.currentTime

    // ── HIGHEST PRIORITY: single-sentence brake radar ────────────────────
    if (shadowingEndTimeRef.current !== null) {
      if (time >= shadowingEndTimeRef.current - 0.05) {
        video.pause()
        shadowingEndTimeRef.current = null
        setIsPlayingRef.current(false)
      }
    }

    const subs = subtitlesRef.current

    // Binary search: O(log n) — avoids scanning all rows every frame
    let lo = 0, hi = subs.length - 1, activeSub: SubtitleItem | null = null
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      const s = subs[mid]
      if (time < s.startTime)      { hi = mid - 1 }
      else if (time >= s.endTime)  { lo = mid + 1 }
      else                         { activeSub = s; break }
    }

    const activeId = activeSub?.id ?? null

    // Gate: only touch DOM when the active sentence actually changes
    if (activeId !== lastHighlightedIdRef.current) {
      lastHighlightedIdRef.current = activeId

      // Raw DOM sweep — zero React involvement
      const rows = document.querySelectorAll<HTMLElement>(".subtitle-line")
      let activeEl: HTMLElement | null = null

      rows.forEach((row) => {
        const isActive = activeSub !== null && row.dataset.id === String(activeSub.id)
        if (isActive) {
          row.classList.add("is-subtitle-active")
          activeEl = row
        } else {
          row.classList.remove("is-subtitle-active")
        }
      })

      // Scroll active row into view — once per sentence switch
      if (activeEl) {
        (activeEl as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" })
      }

      // Reset loop counter when switching to a new sentence
      currentLoopCountRef.current = 0
    }

    // ── Sentence Loop Logic ─────────────────────────────────────────────
    // Yields to single-sentence brake when shadowingEndTimeRef is armed
    if (
      sentenceModeRef.current === "sentenceLoop" &&
      activeSub !== null &&
      !isSeekingRef.current &&
      shadowingEndTimeRef.current === null  // yield to single-sentence brake
    ) {
      const nearEnd = time >= activeSub.endTime - 0.15
      if (nearEnd) {
        const maxLoops = loopCountRef.current === 0 ? Infinity : loopCountRef.current

        if (currentLoopCountRef.current < maxLoops - 1) {
          isSeekingRef.current = true
          currentLoopCountRef.current += 1
          const video = videoRef.current
          if (video) {
            video.currentTime = activeSub.startTime
            setTimeout(() => { isSeekingRef.current = false }, 300)
          }
        } else {
          isSeekingRef.current = true
          currentLoopCountRef.current = 0

          if (!autoNextRef.current) {
            const video = videoRef.current
            if (video) video.pause()
          }

          setTimeout(() => { isSeekingRef.current = false }, 500)
        }
      }
    }

    // Schedule next frame
    rafIdRef.current = requestAnimationFrame(rafCallback)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — reads everything via refs

  // Store the callback in a ref so start/stop helpers can access it
  const rafCallbackRef = useRef(rafCallback)
  useEffect(() => { rafCallbackRef.current = rafCallback }, [rafCallback])

  // Keep setIsPlaying accessible inside checkTime without closure capture.
  // Re-assigned every render so it's always the latest dispatcher.
  useEffect(() => { setIsPlayingRef.current = setIsPlaying })



  const startRaf = useCallback(() => {
    if (rafIdRef.current !== null) return // already running
    rafIdRef.current = requestAnimationFrame(rafCallbackRef.current)
  }, [])

  const stopRaf = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
  }, [])

  // Start/stop rAF when isPlaying changes
  useEffect(() => {
    if (isPlaying) { startRaf() }
    else           { stopRaf() }
    return stopRaf // cleanup on unmount
  }, [isPlaying, startRaf, stopRaf])

  // ── Video ended ──────────────────────��────────────────────────────────
  const handleEnded = useCallback(() => {
    stopRaf()
    if (playbackModeRef.current === "singleLoop") {
      const video = videoRef.current
      if (video) { video.currentTime = 0; video.play().catch(() => {}) }
    } else {
      setIsPlaying(false)
    }
  }, [stopRaf])

  // ──��──────────────────────────────────────────────────────────────────
  // 点读跳转 — seek + autoplay, reset rAF
  // ─────────────────────────────────────────────────────────────────────
  const handleClickTimestamp = useCallback((time: number) => {
    shadowingEndTimeRef.current = null  // disarm brake
    const video = videoRef.current
    if (!video) return
    // Reset highlight gate so the new sentence is immediately highlighted
    // Reset loop state for new sentence
    currentLoopCountRef.current = 0
    isSeekingRef.current = false
    video.currentTime = Math.max(0, time)
    video.play().catch(() => {})
    setIsPlaying(true)
  }, [])

  const handleSeek = useCallback((time: number) => {
    shadowingEndTimeRef.current = null  // disarm brake
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(time, video.duration || 0))
  }, [])

  // ── Other handlers ──────────��─────────��───────────────────────────��───
  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev
      if (next) {
        videoRef.current?.play().catch(() => setIsPlaying(false))
      } else {
        shadowingEndTimeRef.current = null  // disarm brake
        videoRef.current?.pause()
      }
      return next
    })
  }, [])

  const handleReset = useCallback(() => {
    shadowingEndTimeRef.current = null  // disarm brake
    stopRaf()
    const video = videoRef.current
    if (video) video.currentTime = 0
    lastHighlightedIdRef.current = null
    currentLoopCountRef.current = 0
    isSeekingRef.current = false
    // Clear all DOM highlights immediately
    document.querySelectorAll<HTMLElement>(".subtitle-line").forEach((row) => {
      row.classList.remove("is-subtitle-active")
    })
    setIsPlaying(false)
    setPracticeMode("none")
    setMobileVideoMode("full")
    setShowResetDialog(false)
  }, [stopRaf])

  const handlePracticeModeChange = useCallback((mode: "none" | "shadowing" | "fill") => {
    setPracticeMode(mode)
    setMobileVideoMode(mode !== "none" ? "mini" : "full")
  }, [])

  const handleClickWord = useCallback((word: ClickableWord, pos: { x: number; y: number }) => {
    setSelectedWord(word)
    setWordAnchorPos(pos)
  }, [])

  const handleCloseWord = useCallback(() => {
    setSelectedWord(null)
    setWordAnchorPos(null)
  }, [])

  // ── Play single sentence (shadowing) — uses rafCallback brake radar ──
  const handlePlaySegment = useCallback((startTime: number, endTime: number) => {
    const video = videoRef.current
    if (!video) return

    // Arm the brake target (monitored by rafCallback at highest priority)
    shadowingEndTimeRef.current = endTime
    video.currentTime = startTime
    video.play().catch((e) => {
      console.error("单句播放被阻止:", e)
      shadowingEndTimeRef.current = null
    })
    setIsPlaying(true)
  }, [])

  // ── Pause video (recording mutual exclusion + safety cleanup) ─────────
  const handlePauseVideo = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    shadowingEndTimeRef.current = null  // disarm brake
    video.pause()
    stopRaf()
    setIsPlaying(false)
  }, [stopRaf])

  // ── Seeked handler — disarm brake when user drags progress bar ─────
  const handleSeeked = useCallback(() => {
  }, [])

  const fontSizeClass = fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-base" : "text-sm"
  const subtitles: SubtitleItem[] = videoData?.subtitles ?? []

  // ── Render ────────────────────────────────────────────────────────────
  if (isLoading) return <PageSkeleton />

  return (
    <div className="h-screen flex flex-col bg-muted/40 overflow-hidden">
      <VideoHeader />

      {/* ===== DESKTOP ===== */}
      <div className="hidden md:flex flex-1 overflow-hidden">

        {/* Left: Video + Description */}
        <div className="w-[50%] shrink-0 flex flex-col p-4 overflow-hidden">
          <div className="shrink-0 rounded-2xl overflow-hidden shadow-md">
            <VideoPlayer
              videoRef={videoRef}
              videoUrl={videoData?.videoUrl}
              isPlaying={isPlaying}
              duration={duration}
              playbackSpeed={playbackSpeed}
              muted={muted}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              onDurationChange={setDuration}
              onToggleMute={() => setMuted((m) => !m)}
              onEnded={handleEnded}
              onSeeked={handleSeeked}
            />
          </div>
          <div className="mt-3 shrink-0">
            <VideoDescription />
          </div>
        </div>

        {/* Middle: Subtitles */}
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
              loopCount={loopCount}
              autoNext={autoNext}
              onLoopCountChange={setLoopCount}
              onAutoNextChange={setAutoNext}
              onOpenVocabPanel={() => setShowVocabPanel((v) => !v)}
              onOpenExport={() => setShowExportModal(true)}
              practiceMode={practiceMode}
              onPracticeModeChange={setPracticeMode}
              onReset={() => setShowResetDialog(true)}
            />
            <div className="flex-1 overflow-y-auto">
              <SubtitleList
                subtitles={subtitles}
                subtitleMode={subtitleMode}
                practiceMode={practiceMode}
                fontSizeClass={fontSizeClass}
                onClickWord={handleClickWord}
                onClickTimestamp={handleClickTimestamp}
                onPlaySegment={handlePlaySegment}
                onPauseVideo={handlePauseVideo}
                videoId={videoData?.id}
                vocabularies={videoData?.vocabularies}
                phrases={videoData?.phrases}
                expressions={videoData?.expressions}
              />
            </div>
          </div>
        </div>

        {/* Right: Vocab Panel */}
        {showVocabPanel && (
          <div className="w-[25%] shrink-0 overflow-hidden py-3 pr-3">
            <div className="h-full bg-card rounded-2xl shadow-md overflow-hidden">
              <VocabPanel
                open={showVocabPanel}
                onClose={() => setShowVocabPanel(false)}
                vocabularies={videoData?.vocabularies}
                phrases={videoData?.phrases}
                expressions={videoData?.expressions}
                onClickTimestamp={handleClickTimestamp}
              />
            </div>
          </div>
        )}
      </div>

      {/* ===== MOBILE ===== */}
      <div className="flex-1 flex flex-col md:hidden pb-20">
        {mobileVideoMode === "full" && (
          <div className="sticky top-0 z-30 bg-background shrink-0">
            <VideoPlayer
              videoRef={videoRef}
              videoUrl={videoData?.videoUrl}
              isPlaying={isPlaying}
              duration={duration}
              playbackSpeed={playbackSpeed}
              muted={muted}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              onDurationChange={setDuration}
              onToggleMute={() => setMuted((m) => !m)}
              onEnded={handleEnded}
              onSeeked={handleSeeked}
            />
          </div>
        )}

        {mobileVideoMode === "mini" && (
          <div className="flex justify-center py-2 shrink-0">
            <div className="relative w-48 rounded-xl overflow-hidden shadow-xl border border-border/50">
              <VideoPlayer
                videoRef={videoRef}
                videoUrl={videoData?.videoUrl}
                isPlaying={isPlaying}
                duration={duration}
                playbackSpeed={playbackSpeed}
                muted={muted}
                onPlayPause={handlePlayPause}
                onSeek={handleSeek}
                onDurationChange={setDuration}
                onToggleMute={() => setMuted((m) => !m)}
                onEnded={handleEnded}
                onSeeked={handleSeeked}
                mini
              />
              <button
                onClick={() => setMobileVideoMode("hidden")}
                className="absolute top-1 right-1 z-50 size-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                aria-label="收起视频"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        {mobileVideoMode === "hidden" && (
          <button
            onClick={() => setMobileVideoMode("mini")}
            className="fixed top-14 right-3 z-40 size-12 rounded-full bg-[#22c55e]/90 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            aria-label="打开视频"
          >
            <Clapperboard className="size-5" />
          </button>
        )}

        <div className="flex-1 p-3">
          <SubtitleList
            subtitles={subtitles}
            subtitleMode={subtitleMode}
            practiceMode={practiceMode}
            fontSizeClass={fontSizeClass}
            onClickWord={handleClickWord}
            onClickTimestamp={handleClickTimestamp}
            onPlaySegment={handlePlaySegment}
            onPauseVideo={handlePauseVideo}
            videoId={videoData?.id}
            vocabularies={videoData?.vocabularies}
            phrases={videoData?.phrases}
            expressions={videoData?.expressions}
          />
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
        loopCount={loopCount}
        autoNext={autoNext}
        onPlayPause={handlePlayPause}
        onSpeedChange={setPlaybackSpeed}
        onSubtitleModeChange={setSubtitleMode}
        onPlaybackModeChange={setPlaybackMode}
        onSentenceModeChange={setSentenceMode}
        onPracticeModeChange={handlePracticeModeChange}
        onFontSizeChange={setFontSize}
        onLoopCountChange={setLoopCount}
        onAutoNextChange={setAutoNext}
      />

      <DictionaryPopup word={selectedWord} anchorPos={wordAnchorPos} onClose={handleCloseWord} />
      <ExportModal open={showExportModal} onClose={() => setShowExportModal(false)} />
      <ResetDialog 
        open={showResetDialog} 
        onConfirm={handleReset} 
        onCancel={() => setShowResetDialog(false)} 
        onOpenChange={setShowResetDialog} 
      />
    </div>
  )
}
