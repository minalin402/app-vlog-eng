import type { VideoRow } from "./supabase-client"

export interface Video extends VideoRow {
  isFavorite?: boolean // 用户是否收藏
  status?: 'unlearned' | 'learning' | 'learned' // 学习状态
  topics: string[] // 话题标签
  accent: string // 口音类型
  creator?: string;
}

export type StatusFilter = "all" | "learned" | "unlearned"

export interface AdvancedFilters {
  difficulty: string[]
  duration: string[]
  creator: string[]
  topic: string[]
}