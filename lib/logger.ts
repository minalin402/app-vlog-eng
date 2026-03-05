type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: Error
}

class Logger {
  private static instance: Logger
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isTest = process.env.NODE_ENV === 'test'

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private formatLogEntry(entry: LogEntry): string {
    const context = entry.context ? `\nContext: ${JSON.stringify(entry.context, null, 2)}` : ''
    const errorStack = entry.error?.stack ? `\nStack: ${entry.error.stack}` : ''
    
    return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${context}${errorStack}`
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error
    }

    const formattedLog = this.formatLogEntry(entry)

    // 开发环境下打印完整日志
    if (this.isDevelopment || this.isTest) {
      switch (level) {
        case 'debug':
          console.debug(formattedLog)
          break
        case 'info':
          console.info(formattedLog)
          break
        case 'warn':
          console.warn(formattedLog)
          break
        case 'error':
          console.error(formattedLog)
          break
      }
    }

    // 生产环境下发送到日志服务
    if (!this.isDevelopment && !this.isTest) {
      this.sendToLogService(entry)
    }
  }

  private async sendToLogService(entry: LogEntry) {
    // TODO: 集成外部日志服务，如 LogRocket、Sentry 等
    try {
      if (entry.level === 'error') {
        // 错误日志立即发送
        await this.sendErrorLog(entry)
      } else {
        // 其他日志批量发送
        this.queueLog(entry)
      }
    } catch (error) {
      // 降级到本地存储
      this.saveToLocalStorage(entry)
    }
  }

  private async sendErrorLog(entry: LogEntry) {
    // TODO: 实现错误日志的即时发送逻辑
    console.error('Production error:', entry)
  }

  private queueLog(entry: LogEntry) {
    // TODO: 实现日志队列和批量发送逻辑
    const queue = this.getLogQueue()
    queue.push(entry)
    
    if (queue.length >= 10) {
      this.flushLogQueue()
    }
  }

  private getLogQueue(): LogEntry[] {
    if (typeof window === 'undefined') return []
    const queue = localStorage.getItem('log_queue')
    return queue ? JSON.parse(queue) : []
  }

  private async flushLogQueue() {
    // TODO: 实现队列日志的批量发送逻辑
    localStorage.removeItem('log_queue')
  }

  private saveToLocalStorage(entry: LogEntry) {
    if (typeof window === 'undefined') return
    
    try {
      const logs = localStorage.getItem('offline_logs')
      const offlineLogs = logs ? JSON.parse(logs) : []
      offlineLogs.push(entry)
      
      // 限制本地存储的日志数量
      while (offlineLogs.length > 100) {
        offlineLogs.shift()
      }
      
      localStorage.setItem('offline_logs', JSON.stringify(offlineLogs))
    } catch (error) {
      console.error('Failed to save log to local storage:', error)
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, context, error)
  }

  // 用于测试的方法
  clearLocalStorage() {
    if (typeof window === 'undefined') return
    localStorage.removeItem('log_queue')
    localStorage.removeItem('offline_logs')
  }
}

export const logger = Logger.getInstance()