"use client"

import { useRef, useEffect, useState } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react"

interface VideoPlayerProps {
  videoRef?: React.RefObject<HTMLVideoElement | null>
  videoUrl?: string
  poster?: string;  // ✨ 新增：允许接收外部传来的封面图
  isPlaying: boolean
  duration: number
  playbackSpeed?: number
  muted?: boolean
  onPlayPause: () => void
  onSeek: (time: number) => void
  onDurationChange?: (duration: number) => void
  onToggleMute?: () => void
  onEnded?: () => void
  onSeeked?: () => void
  onSpeedChange?: (speed: number) => void
  mini?: boolean
}

export function VideoPlayer({
  videoRef: externalRef,
  videoUrl,
  poster,
  isPlaying,
  duration,
  playbackSpeed = 1,
  muted = false,
  onPlayPause,
  onSeek,
  onDurationChange,
  onToggleMute,
  onEnded,
  onSeeked,
  onSpeedChange,
  mini,
}: VideoPlayerProps) {
  const internalRef = useRef<HTMLVideoElement>(null)
  const videoRef = (externalRef ?? internalRef) as React.RefObject<HTMLVideoElement>

  const [showControls, setShowControls] = useState(true)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

 // 手机端点击屏幕唤起/隐藏控制栏 + ✨ 点击视频直接播放/暂停
  const handleScreenClick = () => {
    if (showSpeedMenu) {
      setShowSpeedMenu(false)
      return
    }
    // ✨ 新增：点按直接触发播放暂停，体验拉平 YouTube
    onPlayPause()
  }

  // 每次显示控制栏时，如果是播放状态，3秒后自动隐藏
  useEffect(() => {
    if (showControls && isPlaying && !showSpeedMenu) { 
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }
  }, [showControls, isPlaying, showSpeedMenu])

  // 暂停时强制显示控制栏
  useEffect(() => {
    if (!isPlaying) setShowControls(true)
  }, [isPlaying])

  // Direct DOM refs for progress bar
  const progressBarRef  = useRef<HTMLDivElement>(null)
  const progressThumbRef = useRef<HTMLDivElement>(null)
  const timeDisplayRef  = useRef<HTMLSpanElement>(null)

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleUpdate = () => {
      const t = video.currentTime
      const d = video.duration || 0
      const pct = d > 0 ? (t / d) * 100 : 0

      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${pct}%`
      }
      if (progressThumbRef.current) {
        progressThumbRef.current.style.left = `calc(${pct}% - 6px)`
      }
      if (timeDisplayRef.current) {
        timeDisplayRef.current.textContent = `${formatTime(t)} / ${formatTime(d)}`
      }
    }

    video.addEventListener("timeupdate", handleUpdate, { passive: true })
    return () => video.removeEventListener("timeupdate", handleUpdate)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) 

  return (
    <div className="relative w-full group/video rounded-lg overflow-hidden">
      <div className="relative aspect-video bg-[#1a1a2e] overflow-hidden">
        
        {/* ✨ 兼容 mini 模式下的点击交互 */}
        <div 
          className="absolute inset-0 z-10" 
          onClick={mini ? onPlayPause : handleScreenClick}
        />

        <video
          ref={videoRef}
          src={videoUrl}
          poster={poster} // ✨ 绑定封面图
          className="w-full h-full object-cover relative z-0"
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => onDurationChange?.((e.target as HTMLVideoElement).duration)}
          onEnded={onEnded}
          onSeeked={onSeeked}
        />

        {/* Play overlay when paused */}
        {!isPlaying && (
          <button
            onClick={(e) => { e.stopPropagation(); onPlayPause(); }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 z-20"
            aria-label="播放"
          >
            {/* ✨ 根据 mini 模式调整播放按钮大小 */}
            <div className={`rounded-full bg-black/50 flex items-center justify-center ${mini ? 'size-8' : 'size-16'}`}>
              <Play className={`text-white ml-1 ${mini ? 'size-4' : 'size-8'}`} fill="white" />
            </div>
          </button>
        )}

        {/* ✨ 核心修复：小窗模式下隐藏控制栏，并且确保所有的 div 完美闭合 */}
        {!mini && (
          <div 
            className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${
              showControls 
                ? "opacity-100 pointer-events-auto" 
                : "opacity-0 pointer-events-none md:group-hover/video:opacity-100 md:group-hover/video:pointer-events-auto"
            }`}
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="relative px-3 pb-2.5 pt-8">
              
              {/* Progress bar */}
              <div
                className="relative h-1 bg-white/30 rounded-full cursor-pointer mb-2.5 group/bar"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const newTime = (e.clientX - rect.left) / rect.width * duration
                  
                  onSeek(newTime)
                  
                  const pct = duration > 0 ? (newTime / duration) * 100 : 0
                  if (progressBarRef.current) progressBarRef.current.style.width = `${pct}%`
                  if (progressThumbRef.current) progressThumbRef.current.style.left = `calc(${pct}% - 6px)`
                }}
                role="slider"
                aria-label="进度条"
                aria-valuemin={0}
                aria-valuemax={duration}
                tabIndex={0}
              >
                <div
                  ref={progressBarRef}
                  className="absolute inset-y-0 left-0 bg-[#3b82f6] rounded-full"
                  style={{ width: "0%" }}
                />
                <div
                  ref={progressThumbRef}
                  className="absolute top-1/2 -translate-y-1/2 size-3 rounded-full bg-white shadow-sm opacity-0 group-hover/bar:opacity-100 transition-opacity"
                  style={{ left: "-6px" }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); onPlayPause(); }}
                    className="p-0.5 text-white hover:text-white/80 transition-colors"
                    aria-label={isPlaying ? "暂停" : "播放"}
                  >
                    {isPlaying
                      ? <Pause className="size-5" />
                      : <Play className="size-5" fill="white" />
                    }
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleMute?.(); }}
                    className="p-0.5 text-white hover:text-white/80 transition-colors"
                    aria-label={muted ? "取消静音" : "静音"}
                  >
                    {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                  </button>
                  <span
                    ref={timeDisplayRef}
                    className="text-xs text-white/80 font-mono"
                  >
                    0:00 / 0:00
                  </span>
                </div>
                <div className="flex items-center gap-2">

                  {/* 倍速悬浮菜单 */}
                  <div className="relative flex items-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowSpeedMenu(prev => !prev)
                      }}
                      className="text-xs text-white/80 font-medium hover:text-white transition-colors px-1 py-1"
                    >
                      {playbackSpeed}x
                    </button>
                    
                    {showSpeedMenu && (
                      <div className="absolute bottom-full right-0 pb-2 z-50 origin-bottom-right animate-in zoom-in-95 duration-150">
                        <div className="flex flex-col bg-black/90 backdrop-blur-sm rounded-lg py-1 shadow-lg pointer-events-auto min-w-[55px]">
                          {[2, 1.5, 1.25, 1, 0.75, 0.5].map((s) => (
                            <button
                              key={s}
                              onClick={(e) => {
                                e.stopPropagation()
                                onSpeedChange?.(s)
                                setShowSpeedMenu(false)
                              }}
                              className={`px-3 py-1 text-[11px] leading-none text-center transition-colors ${
                                playbackSpeed === s 
                                  ? "text-[#3b82f6] font-bold bg-white/10" 
                                  : "text-white/80 hover:bg-white/20 hover:text-white"
                              }`}
                            >
                              {s}x
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>         

                  <button
                    className="p-1 text-white hover:text-white/80 transition-colors"
                    aria-label="全屏"
                    onClick={(e) => { e.stopPropagation(); videoRef.current?.requestFullscreen?.(); }}
                  >
                    <Maximize className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}