import { logger } from './logger'

interface AlertRule {
  id: string
  name: string
  condition: (value: number) => boolean
  threshold: number
  severity: 'info' | 'warning' | 'error' | 'critical'
  cooldown: number // 冷却时间（毫秒）
  channel: AlertChannel
  description: string
}

interface AlertChannel {
  type: 'email' | 'slack' | 'webhook'
  config: {
    url?: string
    token?: string
    recipients?: string[]
  }
}

interface Alert {
  id: string
  ruleId: string
  message: string
  value: number
  threshold: number
  severity: AlertRule['severity']
  timestamp: number
  metadata?: Record<string, any>
}

export class AlertService {
  private static instance: AlertService
  private rules: Map<string, AlertRule>
  private alerts: Alert[]
  private lastAlerts: Map<string, number> // ruleId -> timestamp
  private maxAlertHistory: number
  private isEnabled: boolean

  private constructor() {
    this.rules = new Map()
    this.alerts = []
    this.lastAlerts = new Map()
    this.maxAlertHistory = 1000
    this.isEnabled = process.env.NODE_ENV === 'production'
    this.initializeDefaultRules()
  }

  static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService()
    }
    return AlertService.instance
  }

  /**
   * 初始化默认告警规则
   */
  private initializeDefaultRules() {
    // 响应时间告警
    this.addRule({
      id: 'high-response-time',
      name: '响应时间过高',
      condition: (value) => value > 3000,
      threshold: 3000,
      severity: 'warning',
      cooldown: 5 * 60 * 1000, // 5分钟
      channel: {
        type: 'webhook',
        config: {
          url: process.env.ALERT_WEBHOOK_URL
        }
      },
      description: '接口响应时间超过3秒'
    })

    // 错误率告警
    this.addRule({
      id: 'high-error-rate',
      name: '错误率过高',
      condition: (value) => value > 0.05,
      threshold: 0.05,
      severity: 'error',
      cooldown: 10 * 60 * 1000, // 10分钟
      channel: {
        type: 'webhook',
        config: {
          url: process.env.ALERT_WEBHOOK_URL
        }
      },
      description: '错误率超过5%'
    })

    // 内存使用告警
    this.addRule({
      id: 'high-memory-usage',
      name: '内存使用过高',
      condition: (value) => value > 0.9,
      threshold: 0.9,
      severity: 'critical',
      cooldown: 15 * 60 * 1000, // 15分钟
      channel: {
        type: 'webhook',
        config: {
          url: process.env.ALERT_WEBHOOK_URL
        }
      },
      description: '内存使用率超过90%'
    })

    // CPU使用告警
    this.addRule({
      id: 'high-cpu-usage',
      name: 'CPU使用过高',
      condition: (value) => value > 0.8,
      threshold: 0.8,
      severity: 'warning',
      cooldown: 5 * 60 * 1000, // 5分钟
      channel: {
        type: 'webhook',
        config: {
          url: process.env.ALERT_WEBHOOK_URL
        }
      },
      description: 'CPU使用率超过80%'
    })
  }

  /**
   * 添加告警规则
   */
  addRule(rule: AlertRule) {
    this.rules.set(rule.id, rule)
    logger.info(`Added alert rule: ${rule.name}`)
  }

  /**
   * 删除告警规则
   */
  removeRule(ruleId: string) {
    this.rules.delete(ruleId)
    logger.info(`Removed alert rule: ${ruleId}`)
  }

  /**
   * 检查指标是否触发告警
   */
  checkMetric(ruleId: string, value: number, metadata?: Record<string, any>) {
    if (!this.isEnabled) return

    const rule = this.rules.get(ruleId)
    if (!rule) {
      logger.warn(`Alert rule not found: ${ruleId}`)
      return
    }

    // 检查冷却时间
    const lastAlertTime = this.lastAlerts.get(ruleId) || 0
    if (Date.now() - lastAlertTime < rule.cooldown) {
      return
    }

    // 检查条件
    if (rule.condition(value)) {
      const alert: Alert = {
        id: `${ruleId}-${Date.now()}`,
        ruleId,
        message: rule.description,
        value,
        threshold: rule.threshold,
        severity: rule.severity,
        timestamp: Date.now(),
        metadata
      }

      this.triggerAlert(alert)
    }
  }

  /**
   * 触发告警
   */
  private async triggerAlert(alert: Alert) {
    try {
      // 记录告警
      this.alerts.push(alert)
      this.lastAlerts.set(alert.ruleId, alert.timestamp)

      // 控制历史记录大小
      if (this.alerts.length > this.maxAlertHistory) {
        this.alerts.shift()
      }

      // 获取规则
      const rule = this.rules.get(alert.ruleId)
      if (!rule) return

      // 发送告警
      await this.sendAlert(rule.channel, alert)

      logger.info(`Alert triggered: ${alert.message}`, {
        ruleId: alert.ruleId,
        value: alert.value,
        threshold: alert.threshold,
        severity: alert.severity
      })
    } catch (error) {
      logger.error('Failed to trigger alert', error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * 发送告警到指定渠道
   */
  private async sendAlert(channel: AlertChannel, alert: Alert) {
    const payload = {
      title: `[${alert.severity.toUpperCase()}] ${alert.message}`,
      value: alert.value,
      threshold: alert.threshold,
      timestamp: new Date(alert.timestamp).toISOString(),
      metadata: alert.metadata
    }

    try {
      switch (channel.type) {
        case 'webhook':
          if (channel.config.url) {
            await fetch(channel.config.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            })
          }
          break

        case 'slack':
          if (channel.config.url && channel.config.token) {
            await fetch(channel.config.url, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${channel.config.token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                text: `${payload.title}\nValue: ${payload.value}\nThreshold: ${payload.threshold}\nTime: ${payload.timestamp}`
              })
            })
          }
          break

        case 'email':
          if (channel.config.recipients?.length) {
            // TODO: 实现邮件发送逻辑
            logger.info('Email alert not implemented yet')
          }
          break
      }
    } catch (error) {
      logger.error(`Failed to send alert to ${channel.type}`, error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * 获取告警历史
   */
  getAlertHistory(options?: {
    ruleId?: string
    severity?: AlertRule['severity']
    startTime?: number
    endTime?: number
  }) {
    let filtered = [...this.alerts]

    if (options?.ruleId) {
      filtered = filtered.filter(a => a.ruleId === options.ruleId)
    }

    if (options?.severity) {
      filtered = filtered.filter(a => a.severity === options.severity)
    }

    if (options?.startTime) {
      filtered = filtered.filter(a => a.timestamp >= options.startTime!)
    }

    if (options?.endTime) {
      filtered = filtered.filter(a => a.timestamp <= options.endTime!)
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * 启用/禁用告警服务
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
    logger.info(`Alert service ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * 清除告警历史
   */
  clearHistory() {
    this.alerts = []
    this.lastAlerts.clear()
    logger.info('Alert history cleared')
  }
}

// 导出单例实例
export const alertService = AlertService.getInstance()

// 使用示例：
/*
// 添加自定义告警规则
alertService.addRule({
  id: 'custom-metric',
  name: '自定义指标告警',
  condition: (value) => value > 100,
  threshold: 100,
  severity: 'warning',
  cooldown: 300000,
  channel: {
    type: 'webhook',
    config: {
      url: 'https://api.example.com/alerts'
    }
  },
  description: '自定义指标超过阈值'
})

// 检查指标
alertService.checkMetric('high-error-rate', 0.08, {
  service: 'api',
  endpoint: '/users'
})

// 获取告警历史
const criticalAlerts = alertService.getAlertHistory({
  severity: 'critical',
  startTime: Date.now() - 24 * 60 * 60 * 1000 // 最近24小时
})
*/