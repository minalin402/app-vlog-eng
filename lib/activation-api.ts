import { supabase } from './supabase-client'
import type { Database } from './supabase-client'

type Profile = Database['public']['Tables']['profiles']['Row']
type ActivationCode = Database['public']['Tables']['activation_codes']['Row']

export interface UserStatus {
  isActive: boolean
  activatedAt: string | null
  expiryDate: string | null
  usedCode: string | null
}

/**
 * 获取用户的激活状态
 */
export async function getUserStatus(): Promise<UserStatus | null> {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return null
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single()

    if (error) {
      console.error('Error fetching user status:', error)
      return null
    }

    return {
      isActive: profile.is_active,
      activatedAt: profile.activated_at,
      expiryDate: profile.expiry_date,
      usedCode: profile.used_code
    }
  } catch (error) {
    console.error('Error in getUserStatus:', error)
    return null
  }
}

/**
 * 使用激活码
 */
export async function activateUser(code: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .rpc('activate_user', {
        user_id: user.user.id,
        activation_code: code
      })

    if (error) {
      console.error('Error activating user:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Error in activateUser:', error)
    return false
  }
}

/**
 * 生成新的激活码
 * 注意：此功能应该只在管理后台使用
 */
export async function generateActivationCode(durationDays: number): Promise<string | null> {
  try {
    // 生成随机激活码
    const code = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const { error } = await supabase
      .from('activation_codes')
      .insert({
        code,
        duration_days: durationDays
      })

    if (error) {
      console.error('Error generating activation code:', error)
      return null
    }

    return code
  } catch (error) {
    console.error('Error in generateActivationCode:', error)
    return null
  }
}

/**
 * 检查激活码是否有效
 */
export async function checkActivationCode(code: string): Promise<{
  isValid: boolean
  durationDays?: number
}> {
  try {
    const { data, error } = await supabase
      .from('activation_codes')
      .select('duration_days, is_used')
      .eq('code', code)
      .single()

    if (error || !data) {
      return { isValid: false }
    }

    return {
      isValid: !data.is_used,
      durationDays: data.duration_days
    }
  } catch (error) {
    console.error('Error in checkActivationCode:', error)
    return { isValid: false }
  }
}

/**
 * 获取用户的激活历史
 */
export async function getActivationHistory(): Promise<ActivationCode[]> {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return []
    }

    const { data, error } = await supabase
      .from('activation_codes')
      .select('*')
      .eq('used_by', user.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching activation history:', error)
      return []
    }

    return data
  } catch (error) {
    console.error('Error in getActivationHistory:', error)
    return []
  }
}