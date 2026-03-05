import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// 创建带有自定义配置的客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-app-version': process.env.npm_package_version || '1.0.0'
    }
  },
  db: {
    schema: 'public'
  }
})

// 定义错误代码类型
export type SupabaseErrorCode = 
  | 'PGRST301'
  | 'auth/invalid-email'
  | '23505'
  | string

// 定义错误响应类型
export interface SupabaseErrorResponse {
  code: SupabaseErrorCode
  message: string
  details?: string
}

// 错误处理中间件
export const handleSupabaseError = (error: unknown): Error => {
  console.error('Supabase operation failed:', error)
  
  // 类型守卫确保错误处理的类型安全
  const supabaseError = error as SupabaseErrorResponse
  
  // 根据错误类型返回用户友好的错误消息
  switch (supabaseError.code) {
    case 'PGRST301':
      return new Error('数据库连接失败，请稍后重试')
    case 'auth/invalid-email':
      return new Error('邮箱格式不正确')
    case '23505':
      return new Error('该记录已存在')
    default:
      return new Error('操作失败，请稍后重试')
  }
}

// 类型定义
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      videos: {
        Row: {
          id: string
          title: string
          description: string | null
          duration: string
          difficulty: string
          video_url: string
          cover_url: string | null
          created_at: string
          updated_at: string
        }
      }
      subtitles: {
        Row: {
          id: string
          video_id: string
          start_time: number
          end_time: number
          content_en: string
          content_zh: string
          created_at: string
        }
      }
      vocabulary_items: {
        Row: {
          id: string
          video_id: string
          type: 'word' | 'phrase' | 'expression'
          content: string
          phonetic: string | null
          pos: string | null
          definition_en: string
          definition_zh: string
          example_en: string | null
          example_zh: string | null
          first_appearance_time: number | null
          analysis: string | null
          usage_scene: string | null
          similar_examples: string | null
          created_at: string
        }
      }
      profiles: {
        Row: {
          id: string
          is_active: boolean
          activated_at: string | null
          expiry_date: string | null
          used_code: string | null
          created_at: string
          updated_at: string
        }
      }
      activation_codes: {
        Row: {
          code: string
          duration_days: number
          is_used: boolean
          used_by: string | null
          created_at: string
        }
      }
      user_favorites: {
        Row: {
          id: string
          user_id: string
          item_id: string
          created_at: string
        }
      }
      user_learning_progress: {
        Row: {
          id: string
          user_id: string
          video_id: string
          status: string
          progress: number
          last_learned_at: string | null
          created_at: string
          updated_at: string
        }
      }
    }
    Functions: {
      activate_user: {
        Args: {
          user_id: string
          activation_code: string
        }
        Returns: boolean
      }
      is_user_active: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
    }
  }
}

// 导出常用的类型别名
export type Tables = Database['public']['Tables']
export type VideoRow = Tables['videos']['Row']
export type SubtitleRow = Tables['subtitles']['Row']
export type VocabularyItemRow = Tables['vocabulary_items']['Row']
export type ProfileRow = Tables['profiles']['Row']
export type ActivationCodeRow = Tables['activation_codes']['Row']
export type UserFavoriteRow = Tables['user_favorites']['Row']
export type UserLearningProgressRow = Tables['user_learning_progress']['Row']

// 导出数据库函数类型
export type DbFunctions = Database['public']['Functions']
export type ActivateUserFn = DbFunctions['activate_user']
export type IsUserActiveFn = DbFunctions['is_user_active']