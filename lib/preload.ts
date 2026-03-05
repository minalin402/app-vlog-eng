import { logger } from './logger'
import { fallback } from './fallback'

interface PreloadConfig {
  priority: 'high' | 'medium' | 'low'
  condition?: () => boolean
  ttl?: number // 缓存时间（秒）
}

interface PreloadQueueItem {
  key: string
  loader: () => Promise<any>
  config: PreloadConfig
  retries: number
}

export class PreloadService {
  private static instance: PreloadService
  private queue: Map<string, PreloadQueueItem>
  private processing: boolean
  private maxConcurrent: number
  private maxRetries: number

  private constructor() {
    this.queue = new Map()
    this.processing = false
    this.maxConcurrent = 3 // 最大并发预加载数
    this.maxRetries = 2 // 最大重试次数
    this.initializeProcessing()
  }

  static getInstance(): PreloadService {
    if (!PreloadService.instance) {
      PreloadService.instance = new PreloadService()
    }
    return PreloadService.instance
  }

  /**
   * 添加预加载任务
   */
  addPreloadTask<T>(
    key: string,
    loader: () => Promise<T>,
    config: PreloadConfig
  ) {
    if (this.queue.has(key)) {
      logger.debug(`Preload task already queued: ${key}`)
      return
    }

    this.queue.set(key, {
      key,
      loader,
      config,
      retries: 0
    })

    logger.debug(`Added preload task: ${key}`, { priority: config.priority })
    this.startProcessing()
  }

  /**
   * 初始化处理循环
   */
  private initializeProcessing() {
    if (typeof window === 'undefined') return

    // 在空闲时处理队列
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => this.startProcessing())
    } else {
      setTimeout(() => this.startProcessing(), 1000)
    }

    // 监听网络状态变化
    window.addEventListener('online', () => {
      logger.info('Network is online, resuming preload tasks')
      this.startProcessing()
    })

    window.addEventListener('offline', () => {
      logger.warn('Network is offline, pausing preload tasks')
      this.processing = false
    })
  }

  /**
   * 开始处理队列
   */
  private async startProcessing() {
    if (this.processing || this.queue.size === 0) return
    this.processing = true

    try {
      // 按优先级排序任务
      const sortedTasks = Array.from(this.queue.values()).sort((a, b) => {
        const priorityMap = { high: 3, medium: 2, low: 1 }
        return priorityMap[b.config.priority] - priorityMap[a.config.priority]
      })

      // 并发处理任务
      while (sortedTasks.length > 0) {
        const batch = sortedTasks.splice(0, this.maxConcurrent)
        const promises = batch.map(task => this.processTask(task))
        await Promise.allSettled(promises)

        // 检查是否应该继续处理
        if (!navigator.onLine) {
          logger.warn('Network is offline, stopping preload processing')
          break
        }
      }
    } catch (error) {
      logger.error('Error in preload processing', error instanceof Error ? error : new Error(String(error)))
    } finally {
      this.processing = false

      // 如果队列还有任务，继续处理
      if (this.queue.size > 0) {
        this.startProcessing()
      }
    }
  }

  /**
   * 处理单个预加载任务
   */
  private async processTask(task: PreloadQueueItem) {
    const { key, loader, config, retries } = task

    // 检查条件
    if (config.condition && !config.condition()) {
      logger.debug(`Skipping preload task ${key}: condition not met`)
      this.queue.delete(key)
      return
    }

    try {
      // 使用 fallback 服务执行加载
      const result = await fallback.executeWithFallback(
        key,
        loader,
        {
          defaultValue: null,
          maxRetries: this.maxRetries - retries,
          retryDelay: 1000,
          shouldRetry: (error) => {
            // 网络错误才重试
            return error.message.includes('network') || error.message.includes('timeout')
          }
        },
        {
          enabled: true,
          ttl: config.ttl || 300 // 默认5分钟缓存
        }
      )

      if (result !== null) {
        logger.info(`Successfully preloaded: ${key}`)
        this.queue.delete(key)
      } else if (retries < this.maxRetries) {
        // 重试失败的任务
        task.retries++
        logger.warn(`Preload retry ${task.retries} for: ${key}`)
      } else {
        logger.error(`Failed to preload after ${this.maxRetries} retries: ${key}`)
        this.queue.delete(key)
      }
    } catch (error) {
      logger.error(`Error preloading ${key}`, error instanceof Error ? error : new Error(String(error)))
      this.queue.delete(key)
    }
  }

  /**
   * 清除所有预加载任务
   */
  clearAll() {
    this.queue.clear()
    this.processing = false
    logger.info('Cleared all preload tasks')
  }

  /**
   * 获取当前队列状态
   */
  getStatus() {
    return {
      queueSize: this.queue.size,
      isProcessing: this.processing,
      tasks: Array.from(this.queue.values()).map(task => ({
        key: task.key,
        priority: task.config.priority,
        retries: task.retries
      }))
    }
  }
}

// 导出单例实例
export const preload = PreloadService.getInstance()

// 使用示例：
/*
// 预加载用户配置
preload.addPreloadTask(
  'user-settings',
  async () => {
    const response = await fetch('/api/settings')
    return response.json()
  },
  {
    priority: 'high',
    condition: () => isAuthenticated(), // 只在用户登录时预加载
    ttl: 600 // 10分钟缓存
  }
)

// 预加载视频数据
preload.addPreloadTask(
  'featured-videos',
  async () => {
    const response = await fetch('/api/videos/featured')
    return response.json()
  },
  {
    priority: 'medium',
    ttl: 300 // 5分钟缓存
  }
)
*/