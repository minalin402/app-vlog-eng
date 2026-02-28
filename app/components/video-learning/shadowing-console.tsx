"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Play, Mic, Headphones } from "lucide-react"

// ─── Recording timeout (30 seconds max) ───────────────────────────────────────
const MAX_RECORDING_DURATION_MS = 30000

// ─── localStorage helpers ─────────────────────────────────────────────────────
function getStorageKey(videoId: string) {
  return `shadowing_progress_${videoId}`
}

function getCompletedIds(videoId: string): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(getStorageKey(videoId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function markAsCompleted(videoId: string, subtitleId: string) {
  if (typeof window === "undefined") return
  try {
    const ids = getCompletedIds(videoId)
    if (!ids.includes(subtitleId)) {
      ids.push(subtitleId)
      localStorage.setItem(getStorageKey(videoId), JSON.stringify(ids))
    }
  } catch {
    // Ignore storage errors
  }
}

interface ShadowingConsoleProps {
  videoId: string
  subtitleId: string | number
  startTime: number
  endTime: number
  onPlayOriginal: (startTime: number, endTime: number) => void
  onPauseVideo?: () => void  // For mutual exclusion: pause video before recording
}

/**
 * ShadowingConsole — Isolated recording component for each subtitle row.
 * 
 * All state (isRecording, audioUrl, etc.) is LOCAL to this component.
 * This ensures that recording activity never triggers parent re-renders,
 * protecting the rAF-based highlight and scroll logic from crashes.
 * 
 * LocalStorage persistence:
 * - On recording complete, marks subtitle as "completed" in localStorage
 * - On mount, checks localStorage for previously completed status
 * - Shows "已读" badge if completed (even without audioUrl after refresh)
 * - Playback button stays disabled without audioUrl (audio blob is not cached)
 */
export function ShadowingConsole({
  videoId,
  subtitleId,
  startTime,
  endTime,
  onPlayOriginal,
  onPauseVideo,
}: ShadowingConsoleProps) {
  // ── Local state (isolated from parent) ─────────────────────────────────
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  // "Completed" means user has recorded this sentence before (persisted in localStorage)
  const [isCompleted, setIsCompleted] = useState(false)

  // ── Refs for MediaRecorder and auto-stop timer ─────────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // ── Check localStorage on mount for previously completed status ────────
  useEffect(() => {
    const ids = getCompletedIds(videoId)
    if (ids.includes(String(subtitleId))) {
      setIsCompleted(true)
    }
  }, [videoId, subtitleId])

  // ── Cleanup on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Stop any active recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
      // Clear auto-stop timer
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current)
      }
      // Stop media stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      // Revoke audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  // ── Start recording ────────────────────────────────────────────────────
  const handleStartRecording = useCallback(async () => {
    // ── CRITICAL: Pause video FIRST to prevent recording video audio ──────
    // This MUST be the first line before any async operations
    onPauseVideo?.()

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setPermissionDenied(false)

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Generate Blob URL
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        const url = URL.createObjectURL(blob)

        // Revoke old URL if exists
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl)
        }

        setAudioUrl(url)
        setIsRecording(false)
        setIsCompleted(true)

        // ── Persist "completed" status to localStorage ─────────────────
        markAsCompleted(videoId, String(subtitleId))

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())

        // Clear auto-stop timer
        if (autoStopTimerRef.current) {
          clearTimeout(autoStopTimerRef.current)
          autoStopTimerRef.current = null
        }
      }

      // Start recording
      mediaRecorder.start()
      setIsRecording(true)

      // ── Auto-stop after 30 seconds (memory protection) ─────────────────
      autoStopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop()
          // Could show a toast here: "录音已达单句时长上限"
        }
      }, MAX_RECORDING_DURATION_MS)

    } catch (error) {
      console.error("[v0] Microphone permission denied:", error)
      setPermissionDenied(true)
    }
  }, [audioUrl, onPauseVideo, videoId, subtitleId])

  // ── Stop recording manually ────────────────────────────────────────────
  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    // Clear auto-stop timer since user stopped manually
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current)
      autoStopTimerRef.current = null
    }
  }, [])

  // ── Toggle recording ───────────────────────────────────────────────────
  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      handleStopRecording()
    } else {
      handleStartRecording()
    }
  }, [isRecording, handleStartRecording, handleStopRecording])

  // ── Play recorded audio ────────────────────────────────────────────────
  const handlePlayRecording = useCallback(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play().catch((err) => console.error("[v0] Playback error:", err))
    }
  }, [audioUrl])

  // ── Play original video segment ────────────────────────────────────────
  const handlePlayOriginalClick = useCallback(() => {
    onPlayOriginal(startTime, endTime)
  }, [onPlayOriginal, startTime, endTime])

  // Stop propagation to prevent triggering parent's onClickTimestamp
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <div className="flex items-center gap-3 mt-2 rounded-lg bg-gray-50 p-2" onClick={stopPropagation}>
      {/* Play Original */}
      <button
        onClick={(e) => { e.stopPropagation(); handlePlayOriginalClick() }}
        className="size-9 rounded-full bg-[#3b82f6] text-white flex items-center justify-center hover:bg-[#2563eb] transition-colors shadow-sm"
        aria-label="播放原音"
      >
        <Play className="size-4" fill="white" />
      </button>

      {/* Record */}
      <button
        onClick={(e) => { e.stopPropagation(); handleToggleRecording() }}
        className={`size-9 rounded-full flex items-center justify-center transition-all shadow-sm ${
          isRecording
            ? "bg-[#ef4444] text-white animate-pulse"
            : "bg-white border-2 border-[#ef4444] text-[#ef4444] hover:bg-red-50"
        }`}
        aria-label={isRecording ? "停止录音" : "开始录音"}
      >
        <Mic className="size-4" />
      </button>

      {/* Playback */}
      <button
        onClick={(e) => { e.stopPropagation(); handlePlayRecording() }}
        disabled={!audioUrl}
        className={`size-9 rounded-full flex items-center justify-center transition-colors shadow-sm ${
          audioUrl
            ? "bg-[#22c55e] text-white hover:bg-[#16a34a]"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
        aria-label="播放录音"
      >
        <Headphones className="size-4" />
      </button>

      {/* Status label — shows if completed (even without audioUrl after refresh) */}
      {isCompleted && (
        <span className="ml-auto text-xs font-medium text-white bg-[#22c55e] px-2 py-0.5 rounded">
          已读
        </span>
      )}

      {/* Permission denied warning */}
      {permissionDenied && (
        <span className="ml-auto text-xs text-red-500">
          请授权麦克风
        </span>
      )}
    </div>
  )
}
