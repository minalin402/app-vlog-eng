import { logger } from './logger'
import { preload } from './preload'
import { fallback } from './fallback'

interface VideoMetadata {
  id: string
  duration: number
  resolution: string
  size: number
  format: string
}

interface VideoSegment {
  start: number
  end: number
  url: string
  loaded: boolean
}

interface VideoQuality {
  resolution: string
  bitrate: number
  format: string
}

interface VideoCache {
  buffer: ArrayBuffer
  timestamp: number
  size: number
}

export class VideoOptimizer {
  private static instance: VideoOptimizer
  private videoCache: Map<string, VideoCache>
  private metadataCache: Map<string, VideoMetadata>
  private segmentQueue: Map<string, VideoSegment[]>
  private activeDownloads: Set<string>
  private maxCacheSize: number // 字节
  private currentCacheSize: number
  private maxConcurrentDownloads: number

  private constructor() {
    this.videoCache = new Map()
    this.metadataCache = new Map()
    this.segmentQueue = new Map()
    this.activeDownloads = new Set()
    this.maxCacheSize = 500 * 1024 * 1024 // 500MB
    this.currentCacheSize = 0
    this.maxConcurrentDownloads = 3
    this.initializeOptimizer()
  }

  static getInstance(): VideoOptimizer {
    if (!VideoOptimizer.instance) {
      VideoOptimizer.instance = new VideoOptimizer()
    }
    return VideoOptimizer.instance
  }

  private initializeOptimizer() {
    if (typeof window === 'undefined') return

    // 监听网络状态变化
    window.addEventListener('online', () => {
      logger.info('Network is online, resuming video optimization')
      this.processQueue()
    })

    window.addEventListener('offline', () => {
      logger.warn('Network is offline, pausing video optimization')
      this.activeDownloads.clear()
    })

    // 监听设备内存状态
    if ('memory' in performance) {
      setInterval(() => {
        const memoryInfo = (performance as any).memory
        if (memoryInfo.usedJSHeapSize > memoryInfo.jsHeapSizeLimit * 0.8) {
          logger.warn('Memory usage high, clearing video cache')
          this.clearCache()
        }
      }, 30000)
    }
  }

  /**
   * 预加载视频元数据
   */
  async preloadVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
    try {
      const metadata = await fallback.executeWithFallback<VideoMetadata | null>(
        `video-metadata-${videoId}`,
        async () => {
          const response = await fetch(`/api/videos/${videoId}/metadata`)
          if (!response.ok) {
            throw new Error(`Failed to fetch video metadata: ${response.statusText}`)
          }
          return response.json()
        },
        {
          defaultValue: null,
          maxRetries: 2,
          retryDelay: 1000,
          shouldRetry: (error) => {
            return error.message.includes('network') || error.message.includes('timeout')
          }
        },
        {
          enabled: true,
          ttl: 3600 // 1小时缓存
        }
      )

      if (metadata) {
        this.metadataCache.set(videoId, metadata)
        // 预加载首个视频片段
        this.queueVideoSegment(videoId, 0, 10)
        return metadata
      }

      return null
    } catch (error) {
      logger.error(`Failed to preload video metadata: ${videoId}`, error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  /**
   * 根据网络状况选择最佳视频质量
   */
  private selectOptimalQuality(qualities: VideoQuality[]): VideoQuality {
    // 获取网络信息
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      const effectiveType = connection?.effectiveType || '4g'
      const downlink = connection?.downlink || 10 // Mbps

      // 根据网络状况选择质量
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          return qualities.find(q => q.bitrate <= 400) || qualities[0]
        case '3g':
          return qualities.find(q => q.bitrate <= 1000) || qualities[0]
        case '4g':
          return qualities.find(q => q.bitrate <= downlink * 1000) || qualities[0]
        default:
          return qualities[qualities.length - 1] // 最高质量
      }
    }

    // 默认返回中等质量
    return qualities[Math.floor(qualities.length / 2)]
  }

  /**
   * 将视频片段加入下载队列
   */
  private queueVideoSegment(videoId: string, start: number, duration: number) {
    const segments = this.segmentQueue.get(videoId) || []
    const newSegment: VideoSegment = {
      start,
      end: start + duration,
      url: `/api/videos/${videoId}/segment?start=${start}&duration=${duration}`,
      loaded: false
    }

    segments.push(newSegment)
    this.segmentQueue.set(videoId, segments)
    this.processQueue()
  }

  /**
   * 处理下载队列
   */
  private async processQueue() {
    if (!navigator.onLine || this.activeDownloads.size >= this.maxConcurrentDownloads) {
      return
    }

    for (const [videoId, segments] of this.segmentQueue) {
      const unloadedSegment = segments.find(s => !s.loaded)
      if (unloadedSegment && !this.activeDownloads.has(unloadedSegment.url)) {
        this.downloadSegment(videoId, unloadedSegment)
      }
    }
  }

  /**
   * 下载视频片段
   */
  private async downloadSegment(videoId: string, segment: VideoSegment) {
    if (this.activeDownloads.has(segment.url)) return

    this.activeDownloads.add(segment.url)

    try {
      const response = await fetch(segment.url)
      if (!response.ok) {
        throw new Error(`Failed to download segment: ${response.statusText}`)
      }

      const buffer = await response.arrayBuffer()
      const size = buffer.byteLength

      // 检查缓存大小限制
      if (this.currentCacheSize + size > this.maxCacheSize) {
        this.clearOldestCache()
      }

      this.videoCache.set(segment.url, {
        buffer,
        timestamp: Date.now(),
        size
      })
      
      this.currentCacheSize += size
      segment.loaded = true

      logger.debug(`Downloaded video segment: ${videoId} (${segment.start}s - ${segment.end}s)`)
    } catch (error) {
      logger.error(`Failed to download video segment: ${videoId}`, error instanceof Error ? error : new Error(String(error)))
    } finally {
      this.activeDownloads.delete(segment.url)
      this.processQueue()
    }
  }

  /**
   * 清除最旧的缓存内容
   */
  private clearOldestCache() {
    const entries = Array.from(this.videoCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)

    // 按时间顺序删除，直到缓存大小合适
    while (this.currentCacheSize > this.maxCacheSize * 0.8 && entries.length > 0) {
      const [url, cache] = entries.shift()!
      this.videoCache.delete(url)
      this.currentCacheSize -= cache.size
    }
  }

  /**
   * 清除所有缓存
   */
  clearCache() {
    this.videoCache.clear()
    this.currentCacheSize = 0
    logger.info('Cleared video cache')
  }

  /**
   * 获取缓存状态
   */
  getCacheStatus() {
    return {
      cacheSize: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      videosCount: this.videoCache.size,
      activeDownloads: Array.from(this.activeDownloads),
      memoryUsage: 'memory' in performance ? (performance as any).memory.usedJSHeapSize : 'unknown'
    }
  }
}

// 导出单例实例
export const videoOptimizer = VideoOptimizer.getInstance()

// 使用示例：
/*
// 预加载视频元数据
await videoOptimizer.preloadVideoMetadata('video-123')

// 获取缓存状态
const status = videoOptimizer.getCacheStatus()
console.log('Video cache status:', status)
*/