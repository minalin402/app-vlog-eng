import { logger } from './logger'

interface FallbackOptions<T> {
  defaultValue: T
  maxRetries?: number
  retryDelay?: number
  onError?: (error: Error) => void
  shouldRetry?: (error: Error) => boolean
}

interface CacheConfig {
  enabled: boolean
  ttl: number // 缓存时间（秒）
}

interface CacheEntry<T> {
  value: T
  timestamp: number
}

export class FallbackService {
  private static instance: FallbackService
  private cache: Map<string, CacheEntry<any>>
  private offlineData: Map<string, any>

  private constructor() {
    this.cache = new Map()
    this.offlineData = new Map()
    this.initOfflineStorage()
  }

  static getInstance(): FallbackService {
    if (!FallbackService.instance) {
      FallbackService.instance = new FallbackService()
    }
    return FallbackService.instance
  }

  private initOfflineStorage() {
    if (typeof window === 'undefined') return

    try {
      const offlineData = localStorage.getItem('offline_data')
      if (offlineData) {
        const parsed = JSON.parse(offlineData)
        Object.entries(parsed).forEach(([key, value]) => {
          this.offlineData.set(key, value)
        })
      }
    } catch (error) {
      logger.error('Failed to initialize offline storage', new Error(error instanceof Error ? error.message : String(error)))
    }
  }

  private saveOfflineData() {
    if (typeof window === 'undefined') return

    try {
      const data: Record<string, any> = {}
      this.offlineData.forEach((value, key) => {
        data[key] = value
      })
      localStorage.setItem('offline_data', JSON.stringify(data))
    } catch (error) {
      logger.error('Failed to save offline data', new Error(error instanceof Error ? error.message : String(error)))
    }
  }

  /**
   * 执行带有降级处理的异步操作
   */
  async executeWithFallback<T>(
    key: string,
    operation: () => Promise<T>,
    options: FallbackOptions<T>,
    cache?: CacheConfig
  ): Promise<T> {
    // 1. 首先尝试从缓存获取
    if (cache?.enabled) {
      const cachedValue = this.getFromCache<T>(key, cache.ttl)
      if (cachedValue !== null) {
        logger.info(`Cache hit for key: ${key}`)
        return cachedValue
      }
    }

    // 2. 尝试执行主要操作
    try {
      const result = await this.retryOperation(operation, options)
      
      // 成功后更新缓存和离线数据
      if (cache?.enabled) {
        this.setCache(key, result)
        logger.debug(`Updated cache for key: ${key}`)
      }
      this.offlineData.set(key, result)
      this.saveOfflineData()
      logger.debug(`Updated offline data for key: ${key}`)
      
      return result
    } catch (error) {
      const wrappedError = error instanceof Error ? error : new Error(String(error))
      logger.error(`Operation failed for key: ${key}`, wrappedError)
      
      // 3. 尝试从离线数据获取
      const offlineValue = this.offlineData.get(key)
      if (offlineValue !== undefined) {
        logger.info(`Using offline data for key: ${key}`)
        return offlineValue as T
      }
      
      // 4. 最后使用默认值
      logger.info(`Using default value for key: ${key}`)
      return options.defaultValue
    }
  }

  /**
   * 带重试的操作执行
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    options: FallbackOptions<T>
  ): Promise<T> {
    const maxRetries = options.maxRetries || 3
    const retryDelay = options.retryDelay || 1000
    const shouldRetry = options.shouldRetry || (() => true)

    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (!shouldRetry(lastError) || attempt === maxRetries - 1) {
          throw lastError
        }

        logger.warn(`Retry attempt ${attempt + 1} of ${maxRetries}`, {
          error: lastError.message,
          key: operation.name || 'anonymous'
        })

        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
      }
    }

    throw lastError || new Error('Unknown error occurred during retry')
  }

  /**
   * 从缓存获取数据
   */
  private getFromCache<T>(key: string, ttl: number): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > ttl * 1000) {
      this.cache.delete(key)
      logger.debug(`Cache expired for key: ${key}`)
      return null
    }

    return cached.value as T
  }

  /**
   * 设置缓存
   */
  private setCache<T>(key: string, value: T) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    })
  }

  /**
   * 清除特定键的所有数据（缓存和离线数据）
   */
  clearData(key: string) {
    this.cache.delete(key)
    this.offlineData.delete(key)
    this.saveOfflineData()
    logger.info(`Cleared all data for key: ${key}`)
  }

  /**
   * 清除所有数据
   */
  clearAllData() {
    this.cache.clear()
    this.offlineData.clear()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('offline_data')
    }
    logger.info('Cleared all cached and offline data')
  }
}

// 导出单例实例
export const fallback = FallbackService.getInstance()

// 使用示例：
/*
const result = await fallback.executeWithFallback(
  'user-profile',
  async () => {
    const response = await fetch('/api/profile')
    return response.json()
  },
  {
    defaultValue: { name: 'Guest', settings: {} },
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error) => {
      console.error('Failed to fetch profile:', error)
    },
    shouldRetry: (error) => {
      return error.message !== 'Invalid token'
    }
  },
  {
    enabled: true,
    ttl: 300 // 5分钟缓存
  }
)
*/