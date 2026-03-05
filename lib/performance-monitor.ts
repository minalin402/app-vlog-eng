import { logger } from './logger'

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags: Record<string, string>
}

interface ResourceTiming {
  name: string
  initiatorType: string
  duration: number
  size: number
}

interface PerformanceConfig {
  sampleRate: number // 采样率 0-1
  reportingInterval: number // 上报间隔（毫秒）
  maxBufferSize: number // 最大缓存指标数
  errorThresholds: {
    responseTime: number // 响应时间阈值（毫秒）
    errorRate: number // 错误率阈值 0-1
    memoryUsage: number // 内存使用阈值（字节）
  }
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[]
  private config: PerformanceConfig
  private isMonitoring: boolean
  private reportingTimer: NodeJS.Timeout | null
  private errorCount: number
  private requestCount: number

  private constructor() {
    this.metrics = []
    this.config = {
      sampleRate: 0.1, // 默认采样 10% 的用户
      reportingInterval: 60000, // 每分钟上报一次
      maxBufferSize: 1000, // 最多缓存 1000 条指标
      errorThresholds: {
        responseTime: 3000, // 3 秒
        errorRate: 0.05, // 5%
        memoryUsage: 500 * 1024 * 1024 // 500MB
      }
    }
    this.isMonitoring = false
    this.reportingTimer = null
    this.errorCount = 0
    this.requestCount = 0

    // 初始化监控
    if (typeof window !== 'undefined') {
      this.initializeMonitoring()
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * 初始化性能监控
   */
  private initializeMonitoring() {
    // 随机采样
    if (Math.random() > this.config.sampleRate) {
      logger.debug('Performance monitoring skipped due to sampling')
      return
    }

    this.isMonitoring = true

    // 监听性能指标
    this.observePerformanceMetrics()

    // 监听错误
    this.observeErrors()

    // 监听网络请求
    this.observeNetworkRequests()

    // 定期上报数据
    this.startReporting()

    logger.info('Performance monitoring initialized')
  }

  /**
   * 观察性能指标
   */
  private observePerformanceMetrics() {
    // 观察核心 Web 指标
    if ('PerformanceObserver' in window) {
      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          this.recordMetric('fid', entry.duration, {
            type: 'web-vital'
          })
        })
      })
      fidObserver.observe({ type: 'first-input', buffered: true })

      // LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.recordMetric('lcp', lastEntry.startTime, {
          type: 'web-vital'
        })
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

      // CLS (Cumulative Layout Shift)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        list.getEntries().forEach(entry => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        })
        this.recordMetric('cls', clsValue, {
          type: 'web-vital'
        })
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })

      // 资源加载性能
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          const resource = entry as PerformanceResourceTiming
          this.recordResourceTiming({
            name: resource.name,
            initiatorType: resource.initiatorType,
            duration: resource.duration,
            size: resource.encodedBodySize
          })
        })
      })
      resourceObserver.observe({ type: 'resource', buffered: true })
    }

    // 监控内存使用
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        this.recordMetric('memory_usage', memory.usedJSHeapSize, {
          type: 'memory',
          total: String(memory.jsHeapSizeLimit)
        })
      }, 30000)
    }
  }

  /**
   * 观察错误
   */
  private observeErrors() {
    window.addEventListener('error', (event) => {
      this.errorCount++
      this.recordMetric('error', 1, {
        type: 'error',
        message: event.message,
        source: event.filename
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      this.errorCount++
      this.recordMetric('unhandled_rejection', 1, {
        type: 'error',
        message: String(event.reason)
      })
    })
  }

  /**
   * 观察网络请求
   */
  private observeNetworkRequests() {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      this.requestCount++
      const startTime = performance.now()
      
      try {
        const response = await originalFetch(...args)
        const duration = performance.now() - startTime
        
        this.recordMetric('fetch_duration', duration, {
          type: 'network',
          url: typeof args[0] === 'string' ? args[0] : 'unknown',
          status: String(response.status)
        })
        
        return response
      } catch (error) {
        this.errorCount++
        this.recordMetric('fetch_error', 1, {
          type: 'network',
          url: typeof args[0] === 'string' ? args[0] : 'unknown',
          error: error instanceof Error ? error.message : String(error)
        })
        throw error
      }
    }
  }

  /**
   * 记录性能指标
   */
  private recordMetric(name: string, value: number, tags: Record<string, string> = {}) {
    if (!this.isMonitoring) return

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    }

    this.metrics.push(metric)

    // 检查是否超过阈值
    this.checkThresholds(metric)

    // 控制缓存大小
    if (this.metrics.length > this.config.maxBufferSize) {
      this.metrics.shift()
    }
  }

  /**
   * 记录资源加载性能
   */
  private recordResourceTiming(timing: ResourceTiming) {
    if (!this.isMonitoring) return

    this.recordMetric('resource_load', timing.duration, {
      type: 'resource',
      name: timing.name,
      initiator: timing.initiatorType,
      size: String(timing.size)
    })
  }

  /**
   * 检查性能指标是否超过阈值
   */
  private checkThresholds(metric: PerformanceMetric) {
    const { errorThresholds } = this.config

    switch (metric.name) {
      case 'fetch_duration':
        if (metric.value > errorThresholds.responseTime) {
          logger.warn('Response time threshold exceeded', {
            value: metric.value,
            threshold: errorThresholds.responseTime,
            ...metric.tags
          })
        }
        break

      case 'memory_usage':
        if (metric.value > errorThresholds.memoryUsage) {
          logger.warn('Memory usage threshold exceeded', {
            value: metric.value,
            threshold: errorThresholds.memoryUsage,
            ...metric.tags
          })
        }
        break
    }

    // 检查错误率
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0
    if (errorRate > errorThresholds.errorRate) {
      logger.warn('Error rate threshold exceeded', {
        rate: errorRate,
        threshold: errorThresholds.errorRate,
        errors: this.errorCount,
        requests: this.requestCount
      })
    }
  }

  /**
   * 开始定期上报数据
   */
  private startReporting() {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer)
    }

    this.reportingTimer = setInterval(() => {
      this.reportMetrics()
    }, this.config.reportingInterval)
  }

  /**
   * 上报性能指标
   */
  private async reportMetrics() {
    if (this.metrics.length === 0) return

    try {
      const metrics = [...this.metrics]
      this.metrics = [] // 清空缓存

      // TODO: 发送到性能监控服务
      // await fetch('/api/metrics', {
      //   method: 'POST',
      //   body: JSON.stringify(metrics)
      // })

      logger.debug('Performance metrics reported', {
        count: metrics.length
      })
    } catch (error) {
      logger.error('Failed to report metrics', error instanceof Error ? error : new Error(String(error)))
      // 失败时恢复指标
      this.metrics.unshift(...this.metrics)
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PerformanceConfig>) {
    this.config = {
      ...this.config,
      ...config
    }
  }

  /**
   * 获取当前性能指标
   */
  getMetrics() {
    return {
      metrics: this.metrics,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      requestCount: this.requestCount,
      errorCount: this.errorCount
    }
  }

  /**
   * 停止监控
   */
  stop() {
    this.isMonitoring = false
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer)
      this.reportingTimer = null
    }
    logger.info('Performance monitoring stopped')
  }
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance()

// 使用示例：
/*
// 更新配置
performanceMonitor.updateConfig({
  sampleRate: 0.5, // 提高采样率到 50%
  reportingInterval: 30000 // 每 30 秒上报一次
})

// 获取性能指标
const metrics = performanceMonitor.getMetrics()
console.log('Performance metrics:', metrics)
*/