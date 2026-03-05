import { supabase } from './supabase-client'
import { logger } from './logger'
import { fallback } from './fallback'

export interface AuthUser {
  id: string
  email: string
  isActive: boolean
  activatedAt: string | null
  expiryDate: string | null
}

interface LoginOptions {
  email: string
  password: string
  remember?: boolean
}

interface SignupOptions {
  email: string
  password: string
  metadata?: Record<string, any>
}

interface LoginAttempt {
  count: number
  lastAttempt: number
}

export class AuthService {
  private static instance: AuthService
  private loginAttempts: Map<string, LoginAttempt>
  private maxLoginAttempts: number
  private lockoutDuration: number // 毫秒

  private constructor() {
    this.loginAttempts = new Map()
    this.maxLoginAttempts = Number(process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS) || 5
    this.lockoutDuration = 15 * 60 * 1000 // 15分钟
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  /**
   * 用户登录
   */
  async login({ email, password, remember = false }: LoginOptions): Promise<AuthUser> {
    try {
      // 检查登录尝试次数
      if (this.checkLockout(email)) {
        throw new Error('账号已被锁定，请稍后再试')
      }

      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        this.addLoginAttempt(email)
        throw error
      }

      if (!user) {
        throw new Error('登录失败')
      }

      // 获取用户档案
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile) {
        throw new Error('用户档案不存在')
      }

      // 检查账号状态
      if (!profile.is_active) {
        throw new Error('账号未激活')
      }

      if (profile.expiry_date && new Date(profile.expiry_date) < new Date()) {
        throw new Error('账号已过期')
      }

      // 清除登录尝试记录
      this.resetLoginAttempts(email)

      // 设置会话持久化
      if (remember) {
        const session = await supabase.auth.getSession()
        if (session.data.session) {
          // 通过刷新令牌更新会话
          await supabase.auth.refreshSession({
            refresh_token: session.data.session.refresh_token
          })
        }
      }

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email
      })

      return {
        id: user.id,
        email: user.email!,
        isActive: profile.is_active,
        activatedAt: profile.activated_at,
        expiryDate: profile.expiry_date
      }
    } catch (error) {
      logger.error('Login failed', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * 用户注册
   */
  async signup({ email, password, metadata }: SignupOptions): Promise<void> {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
        }
      })

      if (error) {
        throw error
      }

      logger.info('User signed up successfully', { email })
    } catch (error) {
      logger.error('Signup failed', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }

      logger.info('User logged out successfully')
    } catch (error) {
      logger.error('Logout failed', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * 获取当前用户
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return null
      }

      // 使用 fallback 服务获取用户档案
      const profile = await fallback.executeWithFallback(
        `user-profile-${user.id}`,
        async () => {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          return data
        },
        {
          defaultValue: null,
          maxRetries: 2
        },
        {
          enabled: true,
          ttl: 300 // 5分钟缓存
        }
      )

      if (!profile) {
        return null
      }

      return {
        id: user.id,
        email: user.email!,
        isActive: profile.is_active,
        activatedAt: profile.activated_at,
        expiryDate: profile.expiry_date
      }
    } catch (error) {
      logger.error('Failed to get current user', error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  /**
   * 激活用户账号
   */
  async activateUser(userId: string, activationCode: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc(
        'activate_user',
        {
          user_id: userId,
          activation_code: activationCode
        }
      )

      if (error) {
        throw error
      }

      logger.info('User activated successfully', { userId })
      return data
    } catch (error) {
      logger.error('User activation failed', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * 检查用户是否激活
   */
  async isUserActive(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc(
        'is_user_active',
        {
          user_id: userId
        }
      )

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      logger.error('Failed to check user status', error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
      })

      if (error) {
        throw error
      }

      logger.info('Password reset email sent', { email })
    } catch (error) {
      logger.error('Failed to send reset password email', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * 更新密码
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw error
      }

      logger.info('Password updated successfully')
    } catch (error) {
      logger.error('Failed to update password', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * 记录登录尝试
   */
  private addLoginAttempt(email: string): void {
    const attempt = this.loginAttempts.get(email) || { count: 0, lastAttempt: Date.now() }
    attempt.count++
    attempt.lastAttempt = Date.now()
    this.loginAttempts.set(email, attempt)

    if (attempt.count >= this.maxLoginAttempts) {
      logger.warn('Account locked due to too many login attempts', { email })
    }
  }

  /**
   * 重置登录尝试记录
   */
  private resetLoginAttempts(email: string): void {
    this.loginAttempts.delete(email)
  }

  /**
   * 检查是否被锁定
   */
  private checkLockout(email: string): boolean {
    const attempt = this.loginAttempts.get(email)
    if (!attempt) return false

    // 检查是否超过锁定时间
    if (Date.now() - attempt.lastAttempt > this.lockoutDuration) {
      this.resetLoginAttempts(email)
      return false
    }

    return attempt.count >= this.maxLoginAttempts
  }
}

// 导出单例实例
export const authService = AuthService.getInstance()

// 导出认证中间件
export function withAuth(handler: Function) {
  return async (req: any, res: any) => {
    try {
      const user = await authService.getCurrentUser()
      if (!user) {
        return res.status(401).json({ error: '未登录' })
      }

      if (!user.isActive) {
        return res.status(403).json({ error: '账号未激活' })
      }

      if (user.expiryDate && new Date(user.expiryDate) < new Date()) {
        return res.status(403).json({ error: '账号已过期' })
      }

      // 将用户信息添加到请求对象
      req.user = user
      return handler(req, res)
    } catch (error) {
      logger.error('Auth middleware error', error instanceof Error ? error : new Error(String(error)))
      return res.status(500).json({ error: '服务器错误' })
    }
  }
}