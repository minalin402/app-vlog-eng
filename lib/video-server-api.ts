/**
 * 服务端视频数据获取 API
 * 用于 Server Components 中获取视频详情数据
 * 
 * 优势：
 * - 在服务端直接查询数据库，无需客户端等待
 * - 支持 SSR，首屏即可看到完整数据
 * - 减少客户端 JavaScript 体积
 */

import { createClient } from './supabase-server'
import type { VideoDetail } from './video-api'

export interface ServerVideoData extends VideoDetail {
  original_youtube_url: string
}

export interface ServerLearningStatus {
  status: 'unlearned' | 'learned'
  progress?: number
  last_position?: number
}

/**
 * 在服务端获取视频完整数据
 * @param videoId 视频 ID
 * @returns 视频详情数据，包含字幕、词汇等
 */
export async function getVideoDataServer(videoId: string): Promise<ServerVideoData | null> {
  const supabase = await createClient()

  try {
    // ✨ 核心性能优化：利用 Promise.all 并行发起查询，打破串行阻塞
    const [
      { data: videoRow, error: videoError },
      { data: subData },
      { data: vocabData }
    ] = await Promise.all([
      supabase.from('videos').select('*').eq('id', videoId).single(),
      supabase.from('subtitles').select('*').eq('video_id', videoId).order('start_time', { ascending: true }),
      supabase.from('vocabulary_items').select('*').eq('video_id', videoId)
    ])

    if (videoError || !videoRow) {
      console.error('视频不存在:', videoError)
      return null
    }

    // 类型断言以避免 TypeScript 错误
    const video = videoRow as any
    const subtitles = (subData || []) as any[]
    const vocabs = (vocabData || []) as any[]

    // 清洗 YouTube URL
    let cleanYoutubeUrl = video.original_youtube_url || ''
    if (cleanYoutubeUrl.endsWith('&t') || cleanYoutubeUrl.endsWith('&t=')) {
      cleanYoutubeUrl = cleanYoutubeUrl.split('&t')[0]
    }

    // 推算本地视频路径
    let localVideoUrl = ''
    if (video.cover_url) {
      localVideoUrl = video.cover_url.replace(/cover\.(jpg|png|jpeg)$/i, 'video.mp4')
    }

    // 格式化字幕
    const formattedSubtitles = subtitles.map(s => ({
      id: s.id,
      startTime: s.start_time,
      endTime: s.end_time,
      en: s.content_en,
      zh: s.content_zh,
    }))

    // 格式化词汇
    const vocabularies = vocabs
      .filter(v => v.type === 'word')
      .map(v => ({
        id: v.id,
        word: v.content,
        pos: v.pos,
        phonetic: v.phonetic,
        synonyms: v.synonyms,
        chinese_definition: v.definition_zh,
        english_definition: v.definition_en,
        example_from_video: v.example_en,
        example_translation: v.example_zh,
        first_appearance_time: v.first_appearance_time,
      }))

    // 格式化短语
    const phrases = vocabs
      .filter(v => v.type === 'phrase')
      .map(v => ({
        id: v.id,
        phrase: v.content,
        phonetic: v.phonetic,
        synonyms: v.synonyms,
        chinese_definition: v.definition_zh,
        context: v.example_en,
        context_translation: v.example_zh,
        first_appearance_time: v.first_appearance_time,
      }))

    // 格式化表达
    const expressions = vocabs
      .filter(v => v.type === 'expression')
      .map(v => ({
        id: v.id,
        expression: v.content,
        expression_explanation: v.analysis,
        first_appearance_time: v.first_appearance_time,
      }))

    return {
      id: video.id,
      title: video.title,
      description: video.description,
      duration: video.duration,
      difficulty: video.difficulty,
      videoUrl: localVideoUrl || video.video_url,
      original_youtube_url: cleanYoutubeUrl,
      subtitles: formattedSubtitles,
      vocabularies,
      phrases,
      expressions,
    }
  } catch (error) {
    console.error('获取视频数据失败:', error)
    return null
  }
}

/**
 * 在服务端获取用户学习状态
 * @param videoId 视频 ID
 * @returns 学习状态
 */
export async function getLearningStatusServer(videoId: string): Promise<ServerLearningStatus> {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { status: 'unlearned' }
    }

    const { data, error } = await supabase
      .from('user_learning_records')
      .select('status, progress, last_position')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .single()

    if (error || !data) {
      return { status: 'unlearned' }
    }

    const record = data as any

    return {
      status: record.status as 'unlearned' | 'learned',
      progress: record.progress,
      last_position: record.last_position,
    }
  } catch (error) {
    console.error('获取学习状态失败:', error)
    return { status: 'unlearned' }
  }
}

/**
 * 在服务端获取用户收藏列表
 * @returns 收藏的词汇 ID 列表
 */
export async function getUserFavoritesServer(): Promise<string[]> {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return []
    }

    const { data } = await supabase
      .from('user_favorites')
      .select('vocabulary_id')
      .eq('user_id', user.id)
      .not('vocabulary_id', 'is', null)

    const favorites = (data || []) as any[]
    return favorites.map(f => f.vocabulary_id).filter(Boolean)
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    return []
  }
}

/**
 * 一次性获取视频页面所需的所有数据
 * @param videoId 视频 ID
 * @returns 包含视频数据、学习状态、收藏列表的完整数据
 */
export async function getVideoPageData(videoId: string) {
  const [videoData, learningStatus, favoriteIds] = await Promise.all([
    getVideoDataServer(videoId),
    getLearningStatusServer(videoId),
    getUserFavoritesServer(),
  ])

  return {
    videoData,
    learningStatus,
    favoriteIds,
  }
}
