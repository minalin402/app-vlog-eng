"use client"

import { useRef, useEffect, useState } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react"
import Hls from "hls.js"

interface VideoPlayerProps {
  videoRef?: React.RefObject<HTMLVideoElement | null>
  videoUrl?: string
  poster?: string
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
  const hlsRef = useRef<Hls | null>(null)

  const [showControls, setShowControls] = useState(true)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false) // 画面是否真正准备好
  const [isBuffering, setIsBuffering] = useState(false)   // 是否正在缓冲转圈

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // ✨ 音量状态，0 到 1 之间
  const [volume, setVolume] = useState(1)

  const handleScreenClick = () => {
    if (showSpeedMenu) {
      setShowSpeedMenu(false)
      return
    }
    if (showVolumeSlider) {
      setShowVolumeSlider(false)
      return
    }
    onPlayPause()
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return

    // 每次 url 变化前，清理上一个实例
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    // 判断是否是 HLS 流媒体 (.m3u8)
    if (videoUrl.endsWith('.m3u8')) {
      // 方案 A：原生支持 HLS 的浏览器（如 iOS Safari）
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl
      }
      // 方案 B：不支持原生，但支持 MediaSource API（如 Chrome/Edge）
      else if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          // --- 新增下面两行预热调优参数 ---
          //startFragPrefetch: true,      // 强制在播放前就预取第一个分片
          //capLevelToPlayerSize: true,   // 限制初始分辨率，加快首屏速度（如果你有多码率的话）
        })
        hls.loadSource(videoUrl)
        hls.attachMedia(video)
        hlsRef.current = hls
      }
    } else {
      // 兼容旧的 .mp4 视频
      video.src = videoUrl
    }

    // 组件卸载时清理内存
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [videoUrl, videoRef])

  useEffect(() => {
    if (showControls && isPlaying && !showSpeedMenu && !showVolumeSlider) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
        setShowVolumeSlider(false) 
      }, 3000)
    }
    return () => {
      if (controlsTimeoutRef.current) controlsTimeoutRef.current && clearTimeout(controlsTimeoutRef.current)
    }
  }, [showControls, isPlaying, showSpeedMenu, showVolumeSlider])

  useEffect(() => {
    if (!isPlaying) setShowControls(true)
  }, [isPlaying])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = muted ? 0 : volume
    }
  }, [volume, muted, videoRef])

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
  }, [videoRef]) 

  return (
    <div className="relative w-full group/video rounded-lg overflow-hidden">
      <div className="relative aspect-video bg-[#1a1a2e] overflow-hidden">
        
        <div 
          className="absolute inset-0 z-10" 
          onClick={mini ? onPlayPause : handleScreenClick}
        />

        <video
          ref={videoRef}
          poster={poster}
          className="w-full h-full object-cover relative z-0"
          playsInline
          preload="auto"
          onCanPlay={() => setIsVideoReady(true)}
          onPlaying={() => setIsBuffering(false)}
          onWaiting={() => setIsBuffering(true)}
          onLoadedMetadata={(e) => onDurationChange?.((e.target as HTMLVideoElement).duration)}
          onEnded={onEnded}
          onSeeked={onSeeked}
        />

        {/* 1. 自定义坚不可摧的封面图层（只有当画面没准备好，或者还没开始播放且在 0 秒时才显示） */}
        {(!isVideoReady || (!isPlaying && videoRef.current?.currentTime === 0)) && poster && (
          <img 
            src={poster} 
            alt="cover" 
            className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" 
          />
        )}
        
        {/* 2. 缓冲时的 Loading 转圈动画（选加，体验更好） */}
        {isPlaying && isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 pointer-events-none">
            <div className="size-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {!isPlaying && (
          <button
            onClick={(e) => { e.stopPropagation(); onPlayPause(); }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 z-20"
            aria-label="播放"
          >
            <div className={`rounded-full bg-black/50 flex items-center justify-center ${mini ? 'size-8' : 'size-16'}`}>
              <Play className={`text-white ml-1 ${mini ? 'size-4' : 'size-8'}`} fill="white" />
            </div>
          </button>
        )}

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
                  >
                    {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" fill="white" />}
                  </button>

                  {/* ✨ YouTube 1:1 复刻级联动音量控制：完全自定义进度条 */}
                  <div 
                    className="group/volume flex items-center relative"
                    onMouseLeave={() => setShowVolumeSlider(false)}
                    // ✨ 核心技巧：通过 CSS 变量驱动填充效果。
                    // 计算出音量百分比，直接通过 inline style 传给 CSS，供下方填充层使用。
                    style={{ '--volume-pct': `${muted ? 0 : volume * 100}%` } as React.CSSProperties}
                  >
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
                        if (isTouch) {
                          if (!showVolumeSlider) {
                            setShowVolumeSlider(true); 
                          } else {
                            onToggleMute?.(); 
                          }
                        } else {
                          onToggleMute?.(); 
                        }
                      }}
                      className="p-0.5 text-white hover:text-white/80 transition-colors z-10"
                    >
                      {muted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                    </button>
                    
                    {/* ✨ 自定义抽屉式音量进度条容器 */}
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out flex items-center ${
                        showVolumeSlider 
                          ? 'w-[72px] ml-2' // 展开时的宽度
                          : 'w-0 ml-0 group-hover/volume:w-[72px] group-hover/volume:ml-2' // Hover 时的宽度
                      }`}
                    >
                      {/* 1:1 复刻的关键：通过 div 自定义轨道和填充 */}
                      <div 
                        className="w-[72px] h-[3.5px] bg-white/30 rounded-full cursor-pointer relative group/track"
                        role="slider"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={muted ? 0 : volume * 100}
                        aria-label="音量"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const val = (e.clientX - rect.left) / rect.width;
                          const clampedVal = Math.max(0, Math.min(1, val)); // 钳制在 0 到 1 之间
                          setVolume(clampedVal);
                          // 交互逻辑同步：滑过非 0 区域取消静音，滑到 0 区域开启静音
                          if (clampedVal > 0 && muted) onToggleMute?.();
                          if (clampedVal === 0 && !muted) onToggleMute?.();
                        }}
                      >
                        {/* 浅灰色底层轨道 */}
                        <div className="absolute inset-0 bg-white/20 rounded-full"></div>
                        {/* 蓝色填充层：其宽度直接使用上方父容器计算好的 CSS 变量 --volume-pct */}
                        <div className="absolute inset-y-0 left-0 bg-[#3b82f6] rounded-full transition-all duration-75" style={{ width: 'var(--volume-pct)' }}></div>
                        {/* YouTube 经典的隐形滑块点：只在 hover 时放大出现 */}
                        <div className="absolute top-1/2 -translate-y-1/2 size-[11px] rounded-full bg-white opacity-0 group-hover/track:opacity-100 transition-opacity transition-transform group-hover/track:scale-100 scale-50" style={{ left: 'calc(var(--volume-pct) - 5.5px)' }}></div>
                      </div>
                    </div>
                  </div>

                  <span ref={timeDisplayRef} className="text-xs text-white/80 font-mono">
                    0:00 / 0:00
                  </span>
                </div>
                <div className="flex items-center gap-2">

                  <div className="relative flex items-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(prev => !prev) }}
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