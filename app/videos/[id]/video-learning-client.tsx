"use client"

import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react"
import dynamic from "next/dynamic"
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso"
import { type VideoDetail } from "@/lib/video-api"
import { type SubtitleItem, type ClickableWord } from "@/lib/video-data"
import {
  markAsLearned,
  resetLearningStatus,
  updateLearningProgress,
  type LearningStatus
} from "@/lib/learning-status-api"
import { VideoHeader } from "./components/video-learning/video-header"
import { VideoPlayer } from "./components/video-learning/video-player"
import { VideoDescription } from "./components/video-learning/video-description"
import { SubtitleToolbar } from "./components/video-learning/subtitle-toolbar"
import { SubtitleCard } from "./components/video-learning/subtitle-card"
import { MobilePlaybackBar } from "./components/video-learning/mobile-playback-bar"
import { Clapperboard, X, Youtube } from "lucide-react"
import { fetchUserFavorites, toggleFavoriteAPI } from "@/lib/favorite-api"
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels"
import { useRouter } from "next/navigation"

// 动态加载弹窗和面板组件，优化首屏加载性能
const VocabPanel = dynamic(
  () => import("./components/video-learning/vocab-panel").then((mod) => mod.VocabPanel),
  { ssr: false }
)

const ExportModal = dynamic(
  () => import("./components/video-learning/export-modal").then((mod) => mod.ExportModal),
  { ssr: false }
)

const ResetDialog = dynamic(
  () => import("./components/video-learning/reset-dialog").then((mod) => mod.ResetDialog),
  { ssr: false }
)


// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className ?? ""}`} />
}
function PageSkeleton() {
  return (
    <div className="h-[100dvh] flex flex-col bg-muted/20 overflow-hidden">
      <div className="h-14 bg-card shadow-sm shrink-0" />
      {/* 电脑端骨架 */}
      <div className="hidden md:flex flex-1 overflow-hidden p-4 gap-4">
        <div className="w-[50%] flex flex-col gap-3">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-12 rounded-xl mb-4" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
      {/* 手机端骨架 */}
      <div className="flex md:hidden flex-1 flex-col">
        <Skeleton className="aspect-video w-full rounded-none" />
        <div className="p-4 flex flex-col gap-3 flex-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SubtitleList: 使用虚拟列表优化长字幕渲染性能 ────────────────────────
// 所有高亮逻辑仍通过 DOM classList 处理，不触发 React 重渲染
// 每行保留 data-start / data-end / class="subtitle-line" 供 rAF 定位
// ─────────────────────────────────────────────────────────────────────────
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
  favState,
  onToggleFav,
  virtuosoRef,
  youtubeUrl,
  activeSubtitleId
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
  favState: Record<string, boolean>
  onToggleFav: (id: string, type: "word" | "phrase" | "expression") => void
  virtuosoRef?: React.RefObject<VirtuosoHandle | null>
  youtubeUrl?: string
  activeSubtitleId: string | number | null 
}) {
  // ✨ 核心修复 1：使用 useMemo 缓存 context，确保引用稳定
  const listContext = useMemo(() => ({
    activeSubtitleId, subtitleMode, practiceMode, fontSizeClass, favState
  }), [activeSubtitleId, subtitleMode, practiceMode, fontSizeClass, favState])

  // ✨ 核心修复 2：使用 useCallback 缓存渲染函数！
  // 这样 Virtuoso 就会乖乖在原地更新样式，绝不会再把你的 DOM 连根拔起！
  const renderItem = useCallback((index: number, sub: SubtitleItem, context: any) => (
    <div
      key={sub.id}
      className={`subtitle-line mb-4 transition-colors duration-300 ${context.activeSubtitleId === sub.id ? 'is-subtitle-active' : ''}`}
      data-start={sub.startTime}
      data-end={sub.endTime}
      data-id={sub.id}
    >
      <SubtitleCard
        subtitle={sub}
        isActive={context.activeSubtitleId === sub.id}
        subtitleMode={context.subtitleMode}
        practiceMode={context.practiceMode}
        fillBlankMode={context.practiceMode === "fill"}
        fontSizeClass={context.fontSizeClass}
        favState={context.favState}
        
        onClickWord={onClickWord}
        onClickTimestamp={onClickTimestamp}
        onPlaySegment={onPlaySegment}
        onPauseVideo={onPauseVideo}
        videoId={videoId}
        vocabularies={vocabularies}
        phrases={phrases}
        expressions={expressions}
        onToggleFav={onToggleFav}
      />
    </div>
  ), [
    onClickWord, onClickTimestamp, onPlaySegment, onPauseVideo,
    videoId, vocabularies, phrases, expressions, onToggleFav
  ])

  return (
    <Virtuoso
      ref={virtuosoRef}
      data={subtitles}
      className="hide-scrollbar"
      style={{ height: "100%" }}
      context={listContext}
      components={{
        Footer: () => youtubeUrl ? (
          <div className="mt-4 mb-[60vh] flex justify-center pb-safe">
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0 px-4 py-1.5 rounded-full bg-muted/40 text-[11px] text-muted-foreground/70 hover:bg-muted hover:text-primary transition-colors active:scale-95">
              <Youtube className="size-4 opacity-70" />
              <span className="tracking-wider font-medium">查看 YouTube 原视频</span>
            </a>
          </div>
        ) : <div className="h-[60vh]" />
      }}
      itemContent={renderItem} // ✨ 传入缓存好的神级渲染函数
    />
  )
})

// ─── Main Page (Client Component) ────────────────────────────────────────────
interface VideoLearningClientProps {
  videoId: string
  initialVideoData: VideoDetail & { original_youtube_url: string }
  initialLearningStatus: LearningStatus
  initialFavoriteIds: string[]
}

export default function VideoLearningClient({
  videoId,
  initialVideoData,
  initialLearningStatus,
  initialFavoriteIds,
}: VideoLearningClientProps) {
  const router = useRouter()

  // ── Data state (从 props 初始化，无需 loading) ──────────────────────────
  const lastSaveTimeRef = useRef(0)
  const lastSavedProgressRef = useRef(0)
  const [videoData] = useState<VideoDetail>(initialVideoData)
  const [learningStatus, setLearningStatus] = useState<LearningStatus>(initialLearningStatus)
  const [showResetButton, setShowResetButton] = useState(initialLearningStatus === "learned")
  const [activeSubtitleId, setActiveSubtitleId] = useState<string | number | null>(null)

  // ── 防抖进度更新：每10秒最多触发一次 ──────────────────────────
  const debouncedUpdateProgress = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null
    return (videoId: string, progress: number) => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        updateLearningProgress(videoId, progress).then(() => {
          lastSavedProgressRef.current = progress
        })
      }, 10000) // 10秒防抖
    }
  }, [])
  
  // 初始化收藏状态
  const [favState, setFavState] = useState<Record<string, boolean>>(() => {
    const initialFavs: Record<string, boolean> = {}
    initialFavoriteIds.forEach(id => { initialFavs[id] = true })
    return initialFavs
  })

  // ✨ 核心修复：建立状态镜像
  const favStateRef = useRef(favState)
  useEffect(() => {
    favStateRef.current = favState
  }, [favState])

  // ==========================================
  // 👇 请将以下两段代码粘贴到这里 👇
  // ==========================================

// ==========================================
  // 👇 将这里的旧逻辑替换为全新的客户端静默同步逻辑 👇
  // ==========================================

  useEffect(() => {
    // 定义一个专属的同步函数，只拉取收藏数据，不刷新整个页面
    const syncFavorites = async () => {
      try {
        // 直接调用你在顶部引入的 fetchUserFavorites 接口
        const latestFavs = await fetchUserFavorites(videoId) // ✨ 加上 videoId 参数
        
        // 如果成功拿到数据，立刻更新当前页面的状态
        if (Array.isArray(latestFavs)) {
          const freshState: Record<string, boolean> = {}
          latestFavs.forEach((id: string) => { freshState[id] = true })
          setFavState(freshState)
        }
      } catch (error) {
        console.error("静默同步收藏状态失败", error)
      }
    }

    // 1. 监听窗口获得焦点（比如从卡片页返回、或者手机切后台再切回来）
    window.addEventListener('focus', syncFavorites)
    // 2. 监听路由弹栈（拦截所有的返回操作）
    window.addEventListener('popstate', syncFavorites)

    // 组件挂载时主动触发一次兜底
    syncFavorites()

    return () => {
      window.removeEventListener('focus', syncFavorites)
      window.removeEventListener('popstate', syncFavorites)
    }
  }, [])
  
  // ==========================================

  // ── Video element ref ─────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null)
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const subtitleScrollRef = useRef<HTMLDivElement>(null) // ✨ 独立的字幕滚动容器锁（移动端使用）
  const virtuosoRef = useRef<VirtuosoHandle>(null) // ✨ 虚拟列表 ref（桌面端使用）

  // ── Player UI state (only things that drive layout / controls) ────────
  const [isPlaying, setIsPlaying] = useState(false)
  const isPlayingRef = useRef(false)
  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])
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
 

// ✨ 1. 拖拽引擎重构（解决卡顿与图标跟随问题）
  const [miniPos, setMiniPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const posRef = useRef({ x: 0, y: 0 }) // 核心：用 Ref 存储实时位置，绕过 React 渲染
  const dragStartRef = useRef({ x: 0, y: 0, initX: 0, initY: 0 })
  const dragContainerRef = useRef<HTMLDivElement>(null) // 核心：直接操作 DOM 节点

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (mobileVideoMode === "full") return // 只要不是全屏，小窗和图标都可以被拖拽
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    isDraggingRef.current = true
    setIsDragging(true)
    dragStartRef.current = { x: clientX, y: clientY, initX: posRef.current.x, initY: posRef.current.y }
  }, [mobileVideoMode])

  const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current || mobileVideoMode === "full") return
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    const dx = clientX - dragStartRef.current.x
    const dy = clientY - dragStartRef.current.y

    const screenWidth = typeof window !== "undefined" ? window.innerWidth : 400
    const screenHeight = typeof window !== "undefined" ? window.innerHeight : 800
    const maxLeft = -(screenWidth - 200)
    const maxRight = 16
    const maxTop = -16
    const maxBottom = screenHeight - 200

    const newX = Math.max(maxLeft, Math.min(dragStartRef.current.initX + dx, maxRight))
    const newY = Math.max(maxTop, Math.min(dragStartRef.current.initY + dy, maxBottom))

    posRef.current = { x: newX, y: newY } // 更新内存位置

    // ✨ 绝对核心：直接通过原生 JS 修改 DOM，避免触发 React 渲染，实现 60fps 丝滑拖拽
    if (dragContainerRef.current) {
      dragContainerRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`
    }
  }, [mobileVideoMode])

  const handleTouchEnd = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      setIsDragging(false)
      setMiniPos(posRef.current) // 拖拽结束才同步给 React，保存记忆
    }
  }, [])

  const handleCaptureClick = useCallback((e: React.MouseEvent) => {
    if (mobileVideoMode !== "full") {
      const dx = Math.abs(posRef.current.x - dragStartRef.current.initX)
      const dy = Math.abs(posRef.current.y - dragStartRef.current.initY)
      if (dx > 5 || dy > 5) {
        e.stopPropagation()
        e.preventDefault()
      }
    }
  }, [mobileVideoMode])
  // ✨ 拖拽逻辑结束



  // === 新增：物理隔离桌面端与移动端 ===
  // === 新增：物理隔离桌面端与移动端 ===
  const [isMounted, setIsMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile() 
    setIsMounted(true) // ✨ 标记已渲染，允许显示真实界面
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])


  // ==================================
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
  const hasMarkedLearnedRef  = useRef(false) // 防止重复标记

  // setIsPlaying lives in state but we need to call it from inside the rAF
  // callback (which has empty deps []). Bridge it via a stable ref.
  const setIsPlayingRef = useRef<(v: boolean) => void>(() => {})

  // The actual per-frame work — stable, created once
  // The actual per-frame work — stable, created once
const rafCallback = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const time = video.currentTime
    const dur = video.duration
    const now = Date.now()

    // —— 1. 智能进度同步逻辑 ——————————————————————
    if (dur > 0) {
      const currentProgress = Math.floor((time / dur) * 100)

      // A. 99% 自动完成
      if (currentProgress >= 99 && !hasMarkedLearnedRef.current) {
        hasMarkedLearnedRef.current = true
        markAsLearned(videoId, 100).then(() => {
          setLearningStatus("learned")
          setShowResetButton(true)
          lastSavedProgressRef.current = 100
        })
      } 
      // B. 防抖进度更新：使用防抖函数，避免频繁触发
      else if (
        isPlayingRef.current &&
        currentProgress !== lastSavedProgressRef.current &&
        !hasMarkedLearnedRef.current
      ) {
        debouncedUpdateProgress(videoId, currentProgress)
      }
    }
    
    // ── 2. HIGHEST PRIORITY: single-sentence brake radar ────────────────────
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
      // ✨ 通知 React 更新高亮状态
      setActiveSubtitleId(activeId)

      // 智能滚动到第一行（包含平滑上推）
      if (activeId !== null) {
        const activeIndex = subs.findIndex(s => s.id === activeId)
        if (activeIndex >= 0 && virtuosoRef.current) {
          virtuosoRef.current.scrollToIndex({
            index: activeIndex,
            align: "start", // ✨ 结合 footer 留白，绝对推到屏幕正顶端
            behavior: "smooth"
          })
        }
      }
      currentLoopCountRef.current = 0
    }

    // ── 3. 逻辑跳转拦截 (修复引擎假死) ──────────────────────────────────
    if (isSeekingRef.current) {
      rafIdRef.current = requestAnimationFrame(rafCallback)
      return 
    }

    // ── 4. 单句循环逻辑 ────────────────────────────────────────────────
    if (
      sentenceModeRef.current === "sentenceLoop" &&
      activeSub !== null &&
      shadowingEndTimeRef.current === null  // yield to single-sentence brake
    ) {
      const nearEnd = time >= activeSub.endTime - 0.15
      if (nearEnd) {
        const maxLoops = loopCountRef.current === 0 ? Infinity : loopCountRef.current

        if (currentLoopCountRef.current < maxLoops - 1) {
          if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current)
          isSeekingRef.current = true
          currentLoopCountRef.current += 1
          const video = videoRef.current
          if (video) {
            video.currentTime = activeSub.startTime
            seekTimeoutRef.current = setTimeout(() => {
              isSeekingRef.current = false
            }, 300)
          }
        } else {
          if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current)
          isSeekingRef.current = true
          currentLoopCountRef.current = 0

          if (!autoNextRef.current) {
            const video = videoRef.current
            if (video) video.pause()
          }

          seekTimeoutRef.current = setTimeout(() => {
            isSeekingRef.current = false
          }, 500)
        }
      }
    }

    // Schedule next frame
    rafIdRef.current = requestAnimationFrame(rafCallback)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, debouncedUpdateProgress])
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

  // ── Video ended ──────────────────────────────────────────────────────
// ── Video ended ──────────────────────────────────────────────────────
  const handleEnded = useCallback(() => {
    if (playbackModeRef.current === "singleLoop") {
      // ✨ 核心修复 1：单集循环时，千万不要调用 stopRaf() 杀掉引擎！
      // 而是要强制清空所有的“高亮记忆”和“循环锁”，让它宛如新生
      shadowingEndTimeRef.current = null
      lastHighlightedIdRef.current = null
      setActiveSubtitleId(null) // ✨ 加这一行，清理 React 的高亮缓存，让第一句宛若初见！
      currentLoopCountRef.current = 0
      isSeekingRef.current = false
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current)

      const video = videoRef.current
      if (video) {
        video.currentTime = 0
        video.play().catch(() => {
          setIsPlaying(false)
        }).then(() => {
          setIsPlaying(true)
          startRaf() // ✨ 核心修复 2：强行补一枪，确保雷达引擎绝对在运转
        })
      }
    } else {
      // 正常播放结束，彻底停掉雷达
      stopRaf()
      setIsPlaying(false)
    }
  }, [stopRaf, startRaf]) // ✨ 记得把 startRaf 加进依赖数组

  // ──��──────────────────────────────────────────────────────────────────
  // 点读跳转 — seek + autoplay, reset rAF
  // ─────────────────────────────────────────────────────────────────────
  // ── 点读跳转 — seek + autoplay, reset rAF ──────────────────────────
  const handleClickTimestamp = useCallback((time: number) => {
    shadowingEndTimeRef.current = null  // disarm brake
    const video = videoRef.current
    if (!video) return
    
    // 修复：强制清空上次的高亮记录，确保即便点击正在播放的这句，也能触发滚动和重绘
    lastHighlightedIdRef.current = null
    setActiveSubtitleId(null) // ✨ 加这一行，清理 React 的高亮缓存，让第一句宛若初见！
    currentLoopCountRef.current = 0
    
    // 修复：强行解除所有锁定状态，防止与循环逻辑打架
    isSeekingRef.current = false
    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current)
    
    video.currentTime = Math.max(0, time)
    video.play().catch(() => {})
    setIsPlaying(true)
  }, [])

  const handleSeek = useCallback((time: number) => {
    shadowingEndTimeRef.current = null  // disarm brake
    const video = videoRef.current
    if (!video) return

    // === 核心修复：和点击字幕一样，强制解除所有锁定状态和高亮缓存 ===
    lastHighlightedIdRef.current = null
    setActiveSubtitleId(null) // ✨ 加这一行，清理 React 的高亮缓存，让第一句宛若初见！
    currentLoopCountRef.current = 0
    isSeekingRef.current = false
    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current)
    // ===============================================================

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
  const handleToggleFavorite = async (rawId: string | number, type: "word" | "phrase" | "expression") => {
    const id = String(rawId)
    
    // ✨ 从镜像中同步读取最新状态
    const originalState = !!favStateRef.current[id]
    const targetState = !originalState

    setFavState(prev => ({ ...prev, [id]: targetState }))

    try {
      await toggleFavoriteAPI(id, type, targetState)
    } catch (error) {
      console.error("收藏同步失败，回滚状态", error)
      setFavState(prev => ({ ...prev, [id]: originalState })) 
    }
  }

  const handleReset = useCallback(() => {
    // 调用后端API重置学习状态
    resetLearningStatus(videoId).then(() => {
      setLearningStatus("unlearned")
      setShowResetButton(false)
      hasMarkedLearnedRef.current = false
      console.log("学习状态已重置")
    }).catch(err => {
      console.error("重置学习状态失败:", err)
    })

    // 重置播放状态
    shadowingEndTimeRef.current = null  // disarm brake
    stopRaf()
    const video = videoRef.current
    if (video) video.currentTime = 0
    lastHighlightedIdRef.current = null
    setActiveSubtitleId(null) // ✨ 加这一行，清理 React 的高亮缓存，让第一句宛若初见！
    currentLoopCountRef.current = 0
    isSeekingRef.current = false

    setIsPlaying(false)
    setPracticeMode("none")
    setMobileVideoMode("full")
    setShowResetDialog(false)
  }, [stopRaf, videoId])

  const handlePracticeModeChange = useCallback((mode: "none" | "shadowing" | "fill") => {
    setPracticeMode(mode)
    setMobileVideoMode(mode !== "none" ? "mini" : "full")
  }, [])

  const handleClickWord = useCallback((word: ClickableWord, pos: { x: number; y: number }) => {
    setSelectedWord(word)
    setWordAnchorPos(pos)
  }, [])
  
  // ── 用 useCallback 包裹传给 SubtitleCard 的回调，避免 memo 失效 ──
  const handleToggleFavoriteCallback = useCallback((id: string, type: "word" | "phrase" | "expression") => {
    handleToggleFavorite(id, type)
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

  // ✨ 在 hook 声明之后，直接拦截：在客户端准备好之前，只显示骨架屏
  if (!isMounted) return <PageSkeleton />

  // ── Render ────────────────────────────────────────────────────────────
  // SSR 模式下无需 loading 状态，数据已在服务端获取

  return (
    <div className="h-[100dvh] flex flex-col bg-muted/40 overflow-hidden">
      <VideoHeader video={videoData} />

      {/* ===== DESKTOP (仅在电脑端渲染，彻底消灭冲突) ===== */}
      {!isMobile && (
        <PanelGroup orientation="horizontal" className="flex-1">
          {/* Left Panel: Video + Description */}
          <Panel
            defaultSize={showVocabPanel ? 40 : 50}
            minSize={30}
            className="flex flex-col p-4 overflow-hidden"
          >
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
                onSpeedChange={setPlaybackSpeed}
              />
            </div>
            <div className="mt-3 shrink-0">
              <VideoDescription video={videoData} />
            </div>
          </Panel>

          {/* Resize Handle 1 */}
          <PanelResizeHandle className="group flex w-4 cursor-col-resize items-center justify-center outline-none">
            {/* iPad 分屏同款：中间的小胶囊提示器 */}
            <div className="h-8 w-[4px] rounded-full bg-border/80 transition-all duration-200 group-hover:h-10 group-hover:bg-blue-400 group-active:bg-blue-600" />
          </PanelResizeHandle>

          {/* Middle Panel: Subtitles */}
          <Panel
            defaultSize={showVocabPanel ? 30 : 50}
            minSize={20}
            className="flex flex-col overflow-hidden py-3 pr-3"
          >
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
                showResetButton={showResetButton}
              />
              <div className="flex-1 p-3 overflow-hidden relative">
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
                  favState={favState}
                  onToggleFav={handleToggleFavoriteCallback}
                  virtuosoRef={virtuosoRef}
                  activeSubtitleId={activeSubtitleId} // ✨ 新增这一行传参
                />
              </div>
            </div>
          </Panel>

          {/* Resize Handle 2 & Right Panel: Vocab Panel (条件渲染) */}
          {showVocabPanel && (
            <>
              <PanelResizeHandle className="group flex w-4 cursor-col-resize items-center justify-center outline-none">
                {/* iPad 分屏同款：中间的小胶囊提示器 */}
                <div className="h-8 w-[4px] rounded-full bg-border/80 transition-all duration-200 group-hover:h-10 group-hover:bg-blue-400 group-active:bg-blue-600" />
              </PanelResizeHandle>

              <Panel
                defaultSize={30}
                minSize={20}
                className="overflow-hidden py-3 pr-3"
              >
                <div className="h-full bg-card rounded-2xl shadow-md overflow-hidden">
                  <VocabPanel
                    open={showVocabPanel}
                    onClose={() => setShowVocabPanel(false)}
                    vocabularies={videoData?.vocabularies}
                    phrases={videoData?.phrases}
                    expressions={videoData?.expressions}
                    onClickTimestamp={handleClickTimestamp}
                    favState={favState}
                    onToggleFav={handleToggleFavoriteCallback}
                  />
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      )}

      {/* ===== MOBILE (仅在手机端渲染) ===== */}
      {isMobile && (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* ✨ 核心修复：全屏/小窗/恢复按钮 大融合！ */}
          <div
            ref={dragContainerRef}
            className={`z-40 ${isDragging ? "" : "transition-all duration-300"} ${
              mobileVideoMode === "full" ? "sticky top-0 bg-background shrink-0 px-3 pt-0 -mt-2 pb-1 w-full" :
              "fixed top-4 right-4 w-48" // 小窗和隐藏模式，共享同样的宽高和定位基础
            }`}
            style={
              mobileVideoMode !== "full"
                ? {
                    transform: `translate3d(${miniPos.x}px, ${miniPos.y}px, 0)`,
                    touchAction: "none"
                  }
                : { transform: "none", touchAction: "auto" }
            }
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
            onClickCapture={handleCaptureClick}
          >
            {/* 视频主体 */}
            <div className={`transition-all duration-300 origin-top-right ${
              mobileVideoMode === "full" ? "rounded-xl overflow-hidden shadow-sm border border-border/40" :
              mobileVideoMode === "mini" ? "rounded-xl overflow-hidden shadow-2xl border border-border/60 bg-black" :
              "opacity-0 pointer-events-none scale-50" // 收起时，缩小并隐藏
            }`}>
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
                mini={mobileVideoMode === "mini"}
                onSpeedChange={setPlaybackSpeed}
              />
              {mobileVideoMode === "mini" && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMobileVideoMode("hidden") }}
                  className="absolute top-1 right-1 z-50 size-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* 恢复按钮：现在它和视频待在同一个盒子里，位置永远同步！ */}
            <div className={`absolute top-0 right-0 transition-all duration-300 origin-top-right ${
              mobileVideoMode === "hidden" ? "opacity-100 scale-100" : "opacity-0 pointer-events-none scale-50"
            }`}>
              <button
                onClick={(e) => { e.stopPropagation(); setMobileVideoMode("mini") }}
                className="size-11 rounded-full bg-[#3b82f6]/90 text-white flex items-center justify-center shadow-lg active:scale-95 backdrop-blur-sm"
              >
                <Clapperboard className="size-5" />
              </button>
            </div>
          </div>

          {/* 4. 手机端字幕区：统一交给 Virtuoso 虚拟列表接管，彻底消除重叠和乱跑 */}
          <div className="flex-1 p-3 overflow-hidden relative">
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
              favState={favState}
              onToggleFav={handleToggleFavoriteCallback}
              virtuosoRef={virtuosoRef}
              youtubeUrl={(videoData as any)?.original_youtube_url}
              activeSubtitleId={activeSubtitleId} // ✨ 新增这一行传参
            />
          </div>
        </div>
      )}

      {/* ===== 找回丢失的手机端底部操作栏 ===== */}
      {isMobile && (
        <div className="w-full shrink-0 z-50 bg-background border-t border-border/50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
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
        </div>
      )}

      
      <ExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        subtitles={videoData?.subtitles || []}
        title={videoData?.title || ''}
      />
      
      <ResetDialog 
        open={showResetDialog} 
        onConfirm={handleReset} 
        onCancel={() => setShowResetDialog(false)} 
      />
      
    </div>
  )
}