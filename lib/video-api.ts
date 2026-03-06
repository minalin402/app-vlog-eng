import { supabase } from './supabase-client'

export interface VideoDetail {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  videoUrl: string;
  original_youtube_url?: string;
  subtitles: SubtitleItem[];
  vocabularies?: VocabItem[];
  phrases?: PhraseItem[];
  expressions?: ExpressionItem[];
}

export interface SubtitleItem {
  id: string;
  startTime: number;
  endTime: number;
  en: string;
  zh: string;
}

export interface VocabItem {
  id: string;
  word: string;
  phonetic?: string;
  pos?: string;
  chinese_definition: string;
  english_definition: string;
  synonyms?: string;
  example_from_video: string;
  example_translation: string;
  first_appearance_time: number;
}

export interface PhraseItem {
  id: string;
  phrase: string;
  phonetic?: string;
  chinese_definition: string;
  synonyms?: string;
  context: string;
  context_translation: string;
  first_appearance_time: number;
}

export interface ExpressionItem {
  id: string;
  expression: string;
  expression_explanation: string;
  first_appearance_time: number;
}

export async function getVideoDetail(id: string): Promise<VideoDetail | null> {
  try {
    // 1. 获取视频基本信息
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single()

    if (videoError) throw videoError
    if (!video) return null

    // 2. 获取字幕数据
    const { data: subtitles, error: subtitlesError } = await supabase
      .from('subtitles')
      .select('*')
      .eq('video_id', id)
      .order('start_time')

    if (subtitlesError) throw subtitlesError

    // 3. 获取词汇数据
    const { data: vocabItems, error: vocabError } = await supabase
      .from('vocabulary_items')
      .select('*')
      .eq('video_id', id)
      .order('first_appearance_time')

    if (vocabError) throw vocabError

    // 4. 转换数据格式以匹配前端接口
    const videoDetail: VideoDetail = {
      id: video.id,
      title: video.title,
      description: video.description || '',
      duration: video.duration,
      difficulty: video.difficulty,
      videoUrl: video.video_url,
      original_youtube_url: video.original_youtube_url,
      subtitles: subtitles?.map(s => ({
        id: s.id,
        startTime: s.start_time,
        endTime: s.end_time,
        en: s.content_en,
        zh: s.content_zh
      })) ?? [],
      vocabularies: vocabItems
        ?.filter(v => v.type === 'word')
        .map(v => ({
          id: v.id,
          word: v.content,
          phonetic: v.phonetic || undefined,
          chinese_definition: v.definition_zh,
          english_definition: v.definition_en,
          example_from_video: v.example_en || '',
          example_translation: v.example_zh || '',
          first_appearance_time: v.first_appearance_time || 0
        })) ?? [],
      phrases: vocabItems
        ?.filter(v => v.type === 'phrase')
        .map(v => ({
          id: v.id,
          phrase: v.content,
          phonetic: v.phonetic || undefined,
          chinese_definition: v.definition_zh,
          synonyms: v.similar_examples,
          context: v.example_en || '',
          context_translation: v.example_zh || '',
          first_appearance_time: v.first_appearance_time || 0
        })) ?? [],
      expressions: vocabItems
        ?.filter(v => v.type === 'expression')
        .map(v => ({
          id: v.id,
          expression: v.content,
          expression_explanation: v.analysis || '',
          first_appearance_time: v.first_appearance_time || 0
        })) ?? []
    }

    return videoDetail

  } catch (error) {
    console.error('Error fetching video detail:', error)
    return null
  }
}
