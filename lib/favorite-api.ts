import { supabase } from './supabase-client'
import type { Database } from './supabase-client'

type DbVocabularyItem = Database['public']['Tables']['vocabulary_items']['Row']

interface FavoriteVocabWord {
  id: string;
  type: 'word';
  word: string;
  phonetic?: string | null;
  chinese_definition: string;
  english_definition: string;
  example_from_video: string;
  example_translation: string;
  first_appearance_time: number;
}

interface FavoritePhrase {
  id: string;
  type: 'phrase';
  phrase: string;
  phonetic?: string | null;
  chinese_definition: string;
  synonyms?: string | null;
  context: string;
  context_translation: string;
  first_appearance_time: number;
}

interface FavoriteExpression {
  id: string;
  type: 'expression';
  expression: string;
  expression_explanation: string;
  first_appearance_time: number;
}

type FavoriteItem = FavoriteVocabWord | FavoritePhrase | FavoriteExpression;

interface UserFavoriteWithVocab {
  vocabulary_items: DbVocabularyItem | null;
}

/**
 * 获取用户在当前视频下收藏的所有词汇项 ID
 */
export async function fetchUserFavorites(videoId: string): Promise<string[]> {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      console.warn('User not authenticated')
      return []
    }

    const { data: favorites, error } = await supabase
      .from('user_favorites')
      .select(`
        vocabulary_id,
        vocabulary_items!inner (
          id,
          video_id
        )
      `)
      .eq('user_id', user.user.id)
      .eq('vocabulary_items.video_id', videoId)

    if (error) {
      console.error('Error fetching favorites:', error)
      return []
    }

    return favorites.map(f => f.vocabulary_id)
  } catch (error) {
    console.error('Error in fetchUserFavorites:', error)
    return []
  }
}

/**
 * 切换词汇项的收藏状态
 */
export async function toggleFavoriteAPI(
  itemId: string,
  itemType: "word" | "phrase" | "expression",
  isFav: boolean
): Promise<void> {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      throw new Error('User not authenticated')
    }

    if (isFav) {
      // 添加收藏
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.user.id,
          vocabulary_id: itemId
        })
      
      if (error) {
        // 如果是唯一约束冲突（已收藏），忽略错误
        if (error.code !== '23505') {
          throw error
        }
      }
    } else {
      // 取消收藏
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.user.id)
        .eq('vocabulary_id', itemId)

      if (error) throw error
    }
  } catch (error) {
    console.error('Error in toggleFavoriteAPI:', error)
    throw error
  }
}

/**
 * 获取用户的所有收藏词汇（跨视频）
 */
export async function fetchAllUserFavorites(): Promise<FavoriteItem[]> {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return []
    }

    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        vocabulary_items (*)
      `)
      .eq('user_id', user.user.id)
      .returns<UserFavoriteWithVocab[]>()

    if (error) {
      console.error('Error fetching all favorites:', error)
      return []
    }

    // 转换数据格式以匹配前端接口
    return data
      .filter((f): f is { vocabulary_items: NonNullable<DbVocabularyItem> } => 
        f.vocabulary_items !== null
      )
      .map(f => {
        const v = f.vocabulary_items
        switch (v.type) {
          case 'word':
            return {
              id: v.id,
              type: 'word' as const,
              word: v.content,
              phonetic: v.phonetic,
              chinese_definition: v.definition_zh,
              english_definition: v.definition_en,
              example_from_video: v.example_en || '',
              example_translation: v.example_zh || '',
              first_appearance_time: v.first_appearance_time || 0
            } satisfies FavoriteVocabWord
          case 'phrase':
            return {
              id: v.id,
              type: 'phrase' as const,
              phrase: v.content,
              phonetic: v.phonetic,
              chinese_definition: v.definition_zh,
              synonyms: v.similar_examples,
              context: v.example_en || '',
              context_translation: v.example_zh || '',
              first_appearance_time: v.first_appearance_time || 0
            } satisfies FavoritePhrase
          case 'expression':
            return {
              id: v.id,
              type: 'expression' as const,
              expression: v.content,
              expression_explanation: v.analysis || '',
              first_appearance_time: v.first_appearance_time || 0
            } satisfies FavoriteExpression
          default:
            throw new Error(`Unknown vocabulary type: ${v.type}`)
        }
      })
  } catch (error) {
    console.error('Error in fetchAllUserFavorites:', error)
    return []
  }
}
