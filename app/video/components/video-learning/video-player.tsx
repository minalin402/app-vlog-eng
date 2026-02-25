"use client"

import { useState } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react"

interface VideoPlayerProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackSpeed?: number
  onPlayPause: () => void
  onSeek: (time: number) => void
  mini?: boolean
}

export function VideoPlayer({ isPlaying, currentTime, duration, playbackSpeed = 1, onPlayPause, onSeek, mini }: VideoPlayerProps) {
  const [muted, setMuted] = useState(false)
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  // Mini mode for mobile PIP
  if (mini) {
    return (
      <div className="relative w-full aspect-video bg-[#1a1a2e] overflow-hidden">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-yIadzdgxk7pZIHl8w7D9MlEDIx6oUh.png"
          alt="谷爱凌在新闻发布会上"
          className="w-full h-full object-cover object-top"
          crossOrigin="anonymous"
        />
        <button
          onClick={onPlayPause}
          className="absolute inset-0 flex items-center justify-center"
          aria-label={isPlaying ? "暂停" : "播放"}
        >
          {!isPlaying && (
            <div className="size-8 rounded-full bg-[#000000]/50 flex items-center justify-center">
              <Play className="size-4 text-[#ffffff] ml-0.5" fill="#ffffff" />
            </div>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="relative w-full group/video rounded-lg overflow-hidden">
      <div className="relative aspect-video bg-[#1a1a2e] overflow-hidden">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-yIadzdgxk7pZIHl8w7D9MlEDIx6oUh.png"
          alt="谷爱凌在新闻发布会上"
          className="w-full h-full object-cover object-top"
          crossOrigin="anonymous"
        />

        {/* Play center overlay - always visible when paused */}
        {!isPlaying && (
          <button
            onClick={onPlayPause}
            className="absolute inset-0 flex items-center justify-center bg-[#000000]/20"
            aria-label="播放"
          >
            <div className="size-16 rounded-full bg-[#000000]/50 flex items-center justify-center">
              <Play className="size-8 text-[#ffffff] ml-1" fill="#ffffff" />
            </div>
          </button>
        )}

        {/* Click to toggle play when playing */}
        {isPlaying && (
          <button
            onClick={onPlayPause}
            className="absolute inset-0"
            aria-label="暂停"
          />
        )}

        {/* Bottom controls overlay - only show on hover, no background */}
        <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover/video:opacity-100 transition-opacity duration-300 pointer-events-none group-hover/video:pointer-events-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/60 via-transparent to-transparent" />

          <div className="relative px-3 pb-2.5 pt-8">
            {/* Progress bar */}
            <div
              className="relative h-1 bg-[#ffffff]/30 rounded-full cursor-pointer mb-2.5 group/bar"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const pct = x / rect.width
                onSeek(pct * duration)
              }}
              role="slider"
              aria-label="进度条"
              aria-valuenow={currentTime}
              aria-valuemin={0}
              aria-valuemax={duration}
              tabIndex={0}
            >
              <div
                className="absolute inset-y-0 left-0 bg-[#22c55e] rounded-full"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 size-3 rounded-full bg-[#ffffff] shadow-sm opacity-0 group-hover/bar:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>

            <div className="flex items-center justify-between">
              {/* Left: play + volume + time */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onPlayPause}
                  className="p-0.5 text-[#ffffff] hover:text-[#ffffff]/80 transition-colors"
                  aria-label={isPlaying ? "暂停" : "播放"}
                >
                  {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" fill="#ffffff" />}
                </button>
                <button
                  onClick={() => setMuted(!muted)}
                  className="p-0.5 text-[#ffffff] hover:text-[#ffffff]/80 transition-colors"
                  aria-label={muted ? "取消静音" : "静音"}
                >
                  {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
                <span className="text-xs text-[#ffffff]/80 font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Right: speed display (read-only) + fullscreen */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#ffffff]/80 font-medium">
                  {playbackSpeed}x
                </span>
                <button className="p-1 text-[#ffffff] hover:text-[#ffffff]/80 transition-colors" aria-label="全屏">
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
