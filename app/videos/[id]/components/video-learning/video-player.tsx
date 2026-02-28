"use client"

import { useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react"

interface VideoPlayerProps {
  videoRef?: React.RefObject<HTMLVideoElement | null>
  videoUrl?: string
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
  mini?: boolean
}

export function VideoPlayer({
  videoRef: externalRef,
  videoUrl,
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
  mini,
}: VideoPlayerProps) {
  const internalRef = useRef<HTMLVideoElement>(null)
  const videoRef = (externalRef ?? internalRef) as React.RefObject<HTMLVideoElement>

  // Direct DOM refs for progress bar — no React state, no re-renders
  const progressBarRef  = useRef<HTMLDivElement>(null)
  const progressThumbRef = useRef<HTMLDivElement>(null)
  const timeDisplayRef  = useRef<HTMLSpanElement>(null)

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  // Drive the progress bar by directly mutating DOM on timeupdate.
  // This is the key: zero React re-renders for progress updates.
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
  }, []) // stable: onTimeUpdate is a stable useCallback from parent

  if (mini) {
    return (
      <div className="relative w-full aspect-video bg-[#1a1a2e] overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => onDurationChange?.((e.target as HTMLVideoElement).duration)}
          onEnded={onEnded}
          onSeeked={onSeeked}
        />
        <button
          onClick={onPlayPause}
          className="absolute inset-0 flex items-center justify-center"
          aria-label={isPlaying ? "暂停" : "播放"}
        >
          {!isPlaying && (
            <div className="size-8 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="size-4 text-white ml-0.5" fill="white" />
            </div>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="relative w-full group/video rounded-lg overflow-hidden">
      <div className="relative aspect-video bg-[#1a1a2e] overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => onDurationChange?.((e.target as HTMLVideoElement).duration)}
          onEnded={onEnded}
          onSeeked={onSeeked}
        />

        {/* Play overlay when paused */}
        {!isPlaying && (
          <button
            onClick={onPlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/20"
            aria-label="播放"
          >
            <div className="size-16 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="size-8 text-white ml-1" fill="white" />
            </div>
          </button>
        )}

        {isPlaying && (
          <button onClick={onPlayPause} className="absolute inset-0" aria-label="暂停" />
        )}

        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover/video:opacity-100 transition-opacity duration-300 pointer-events-none group-hover/video:pointer-events-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="relative px-3 pb-2.5 pt-8">

            {/* Progress bar — DOM-driven, zero React re-renders */}
            <div
              className="relative h-1 bg-white/30 rounded-full cursor-pointer mb-2.5 group/bar"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                onSeek((e.clientX - rect.left) / rect.width * duration)
              }}
              role="slider"
              aria-label="进度条"
              aria-valuemin={0}
              aria-valuemax={duration}
              tabIndex={0}
            >
              <div
                ref={progressBarRef}
                className="absolute inset-y-0 left-0 bg-[#22c55e] rounded-full"
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
                  onClick={onPlayPause}
                  className="p-0.5 text-white hover:text-white/80 transition-colors"
                  aria-label={isPlaying ? "暂停" : "播放"}
                >
                  {isPlaying
                    ? <Pause className="size-5" />
                    : <Play className="size-5" fill="white" />
                  }
                </button>
                <button
                  onClick={onToggleMute}
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
                <span className="text-xs text-white/80 font-medium">{playbackSpeed}x</span>
                <button
                  className="p-1 text-white hover:text-white/80 transition-colors"
                  aria-label="全屏"
                  onClick={() => videoRef.current?.requestFullscreen?.()}
                >
                  <Maximize className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
