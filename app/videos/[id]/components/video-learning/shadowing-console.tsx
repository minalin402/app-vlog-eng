"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Play, Mic, Headphones, Square } from "lucide-react"

// ✨ 核心优化 1：全局单例音频播放器，彻底干掉那几百个隐藏的 <audio> 标签！
let globalAudioPlayer: HTMLAudioElement | null = null;

// ─── Recording timeout (30 seconds max) ───────────────────────────────────────
const MAX_RECORDING_DURATION_MS = 30000

// ─── 浏览器的“隐藏大硬盘”：IndexedDB (用于永久存储本地录音文件) ───────────
const DB_NAME = "ShadowingDB"
const STORE_NAME = "audioRecordings"

async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveLocalAudio(id: string, blob: Blob) {
  if (typeof window === "undefined") return
  try {
    const db = await initDB()
    db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(blob, id)
  } catch (e) { console.error("保存录音到本地失败", e) }
}

async function loadLocalAudio(id: string): Promise<Blob | null> {
  if (typeof window === "undefined") return null
  try {
    const db = await initDB()
    return new Promise((resolve) => {
      const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => resolve(null)
    })
  } catch (e) { return null }
}

// ─── localStorage 依然保留，用于极速加载“已读”状态 ──────────────────────────
function getStorageKey(videoId: string) { return `shadowing_progress_${videoId}` }
function getCompletedIds(videoId: string): string[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(getStorageKey(videoId)) || "[]") } catch { return [] }
}
function markAsCompleted(videoId: string, subtitleId: string) {
  if (typeof window === "undefined") return
  try {
    const ids = getCompletedIds(videoId)
    if (!ids.includes(subtitleId)) {
      ids.push(subtitleId)
      localStorage.setItem(getStorageKey(videoId), JSON.stringify(ids))
    }
  } catch {}
}

interface ShadowingConsoleProps {
  videoId: string
  subtitleId: string | number
  startTime: number
  endTime: number
  onPlayOriginal: (startTime: number, endTime: number) => void
  onPauseVideo?: () => void
}

export function ShadowingConsole({
  videoId,
  subtitleId,
  startTime,
  endTime,
  onPlayOriginal,
  onPauseVideo,
}: ShadowingConsoleProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const uniqueRecordId = `${videoId}_${subtitleId}`

  // ── 1. 初始化时：瞬间加载状态，绝对不碰硬盘 ────────
  useEffect(() => {
    // ✨ 核心优化 2：只读取轻量的 localStorage 显示小绿标，绝对不在这里去加载几十MB的硬盘录音
    const ids = getCompletedIds(videoId)
    if (ids.includes(String(subtitleId))) setIsCompleted(true)
  }, [videoId, subtitleId])

  // ── 2. 清理机制 ────────
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop()
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  // ── 3. 开始录音 ────────
  const handleStartRecording = useCallback(async () => {
    onPauseVideo?.()
    if (globalAudioPlayer) { globalAudioPlayer.pause(); setIsPlayingAudio(false); }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setPermissionDenied(false)

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || "audio/webm"
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)

        if (audioUrl) URL.revokeObjectURL(audioUrl)
        setAudioUrl(url)
        setIsRecording(false)
        setIsCompleted(true)

        markAsCompleted(videoId, String(subtitleId))
        saveLocalAudio(uniqueRecordId, blob)

        stream.getTracks().forEach((track) => track.stop())
        if (autoStopTimerRef.current) { clearTimeout(autoStopTimerRef.current); autoStopTimerRef.current = null }
      }

      mediaRecorder.start()
      setIsRecording(true)

      autoStopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop()
      }, MAX_RECORDING_DURATION_MS)

    } catch (error) {
      console.error("[v0] 麦克风权限被拒:", error)
      setPermissionDenied(true)
    }
  }, [audioUrl, onPauseVideo, videoId, subtitleId, uniqueRecordId])

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop()
    if (autoStopTimerRef.current) { clearTimeout(autoStopTimerRef.current); autoStopTimerRef.current = null }
  }, [])

  const handleToggleRecording = useCallback(() => {
    isRecording ? handleStopRecording() : handleStartRecording()
  }, [isRecording, handleStartRecording, handleStopRecording])

  // ── 4. 播放录音 (✨ 核心优化 3：按需加载 + 单例播放) ────────
  const handleTogglePlay = useCallback(async () => {
    if (isPlayingAudio) {
      globalAudioPlayer?.pause()
      setIsPlayingAudio(false)
      return
    }

    let url = audioUrl

    // ✨ 如果内存里没有URL，但它是“已读”状态，我们才去硬盘(IndexedDB)里捞音频（懒加载）
    if (!url && isCompleted) {
      const blob = await loadLocalAudio(uniqueRecordId)
      if (blob) {
        url = URL.createObjectURL(blob)
        setAudioUrl(url) // 捞出来后存入内存，下次秒播
      }
    }

    if (!url) return // 如果硬盘里也没有，那就是真没录过

    if (globalAudioPlayer) {
      globalAudioPlayer.pause()
    }
    
    // 创建唯一的全局播放器
    const audio = new Audio(url)
    globalAudioPlayer = audio
    audio.onended = () => setIsPlayingAudio(false)
    audio.onpause = () => setIsPlayingAudio(false)
    audio.play().catch(err => console.error("音频播放失败", err))
    setIsPlayingAudio(true)
  }, [isPlayingAudio, audioUrl, isCompleted, uniqueRecordId])

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <div className="flex items-center gap-3 mt-2 rounded-lg bg-gray-50 p-2" onClick={stopPropagation}>
      {/* 原音按钮 */}
      <button
        onClick={(e) => { e.stopPropagation(); onPlayOriginal(startTime, endTime) }}
        className="size-9 rounded-full bg-[#3b82f6] text-white flex items-center justify-center hover:bg-[#2563eb] transition-colors shadow-sm"
        aria-label="播放原音"
      >
        <Play className="size-4" fill="white" />
      </button>

      {/* 录音按钮 */}
      <button
        onClick={(e) => { e.stopPropagation(); handleToggleRecording() }}
        className={`size-9 rounded-full flex items-center justify-center transition-all shadow-sm ${
          isRecording ? "bg-[#ef4444] text-white animate-pulse" : "bg-white border-2 border-[#ef4444] text-[#ef4444] hover:bg-red-50"
        }`}
        aria-label={isRecording ? "停止录音" : "开始录音"}
      >
        {isRecording ? <Square className="size-4" fill="white" /> : <Mic className="size-4" />}
      </button>

      {/* 回放按钮 (✨ 优化：只要录制过(isCompleted)，就可以点击回放) */}
      <button
        onClick={(e) => { e.stopPropagation(); handleTogglePlay() }}
        disabled={!audioUrl && !isCompleted}
        className={`size-9 rounded-full flex items-center justify-center transition-colors shadow-sm ${
          isPlayingAudio ? "bg-[#16a34a] text-white" : 
          (audioUrl || isCompleted) ? "bg-[#22c55e] text-white hover:bg-[#16a34a]" : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
        aria-label="回放录音"
      >
        {isPlayingAudio ? <Square className="size-4" fill="white" /> : <Headphones className="size-4" />}
      </button>

      {isCompleted && (
        <span className="ml-auto text-xs font-medium text-white bg-[#22c55e] px-2 py-0.5 rounded">
          已读
        </span>
      )}

      {permissionDenied && (
        <span className="ml-auto text-xs text-red-500">请授权麦克风</span>
      )}
    </div>
  )
}