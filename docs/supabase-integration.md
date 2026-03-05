# Supabase SDK 接入指南

## 1. 初始化设置

```typescript
// lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from './types' // 将从 Supabase 生成的类型放在这里

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

## 2. 视频 API 适配

```typescript
// lib/video-api.ts
import { supabase } from './supabase-client'
import type { VideoDetail } from './types'

export async function getVideoDetail(id: string): Promise<VideoDetail | null> {
  // 1. 获取视频基本信息
  const { data: video, error: videoError } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single()
  
  if (videoError) throw videoError
  if (!video) return null

  // 2. 获取字幕
  const { data: subtitles } = await supabase
    .from('subtitles')
    .select('*')
    .eq('video_id', id)
    .order('start_time')

  // 3. 获取词汇（按类型分组）
  const { data: vocabItems } = await supabase
    .from('vocabulary_items')
    .select('*')
    .eq('video_id', id)
    .order('first_appearance_time')

  // 4. 转换数据格式以匹配前端接口
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    duration: video.duration,
    difficulty: video.difficulty,
    videoUrl: video.video_url,
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
        phonetic: v.phonetic,
        chinese_definition: v.definition_zh,
        english_definition: v.definition_en,
        example_from_video: v.example_en,
        example_translation: v.example_zh,
        first_appearance_time: v.first_appearance_time
      })) ?? [],
    phrases: vocabItems
      ?.filter(v => v.type === 'phrase')
      .map(v => ({
        id: v.id,
        phrase: v.content,
        phonetic: v.phonetic,
        chinese_definition: v.definition_zh,
        context: v.example_en,
        context_translation: v.example_zh,
        first_appearance_time: v.first_appearance_time
      })) ?? [],
    expressions: vocabItems
      ?.filter(v => v.type === 'expression')
      .map(v => ({
        id: v.id,
        expression: v.content,
        expression_explanation: v.analysis,
        first_appearance_time: v.first_appearance_time
      })) ?? []
  }
}
```

## 3. 收藏功能适配

```typescript
// lib/favorite-api.ts
import { supabase } from './supabase-client'

export async function fetchUserFavorites(videoId: string): Promise<string[]> {
  const { data: favorites } = await supabase
    .from('user_favorites')
    .select('vocabulary_items(id, video_id)')
    .eq('vocabulary_items.video_id', videoId)
  
  return favorites?.map(f => f.vocabulary_items.id) ?? []
}

export async function toggleFavoriteAPI(
  itemId: string,
  itemType: "word" | "phrase" | "expression",
  isFav: boolean
): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) throw new Error('User not authenticated')

  if (isFav) {
    await supabase
      .from('user_favorites')
      .insert({ user_id: userId, item_id: itemId })
  } else {
    await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('item_id', itemId)
  }
}
```

## 4. 学习进度适配

```typescript
// lib/learning-status-api.ts
import { supabase } from './supabase-client'
import type { LearningStatus, LearningStatusResponse } from './types'

export async function fetchLearningStatus(videoId: string): Promise<LearningStatusResponse> {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) throw new Error('User not authenticated')

  const { data } = await supabase
    .from('user_learning_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .single()

  return {
    videoId,
    status: data?.status ?? 'unlearned',
    progress: data?.progress ?? 0,
    lastLearnedAt: data?.last_learned_at
  }
}

export async function markAsLearned(videoId: string, progress: number = 100): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) throw new Error('User not authenticated')

  await supabase
    .from('user_learning_progress')
    .upsert({
      user_id: userId,
      video_id: videoId,
      status: 'learned',
      progress,
      last_learned_at: new Date().toISOString()
    })
}

export async function updateLearningProgress(videoId: string, progress: number): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) throw new Error('User not authenticated')

  await supabase
    .from('user_learning_progress')
    .upsert({
      user_id: userId,
      video_id: videoId,
      status: progress >= 99 ? 'learned' : 'learning',
      progress,
      last_learned_at: progress >= 99 ? new Date().toISOString() : null
    })
}
```

## 5. 错误处理建议

```typescript
// lib/error-handling.ts
import { PostgrestError } from '@supabase/supabase-js'

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public originalError?: PostgrestError
  ) {
    super(message)
  }
}

export function handleSupabaseError(error: PostgrestError): never {
  // 处理常见的 Supabase 错误
  switch (error.code) {
    case '23505': // 唯一约束冲突
      throw new ApiError('Resource already exists', 409, error)
    case '23503': // 外键约束失败
      throw new ApiError('Referenced resource not found', 404, error)
    case '42501': // RLS 策略拒绝
      throw new ApiError('Permission denied', 403, error)
    default:
      throw new ApiError('Internal server error', 500, error)
  }
}
```

## 6. 性能优化建议

1. **批量获取数据**：
   ```typescript
   // 使用 .in() 替代多次单独查询
   const { data: videos } = await supabase
     .from('videos')
     .select(`
       *,
       subtitles(*),
       vocabulary_items(*)
     `)
     .in('id', videoIds)
   ```

2. **缓存策略**：
   ```typescript
   // 使用 SWR 或 React Query 进行客户端缓存
   import useSWR from 'swr'

   export function useVideo(id: string) {
     return useSWR(
       id ? `videos/${id}` : null,
       () => getVideoDetail(id),
       {
         revalidateOnFocus: false,
         revalidateOnReconnect: false
       }
     )
   }
   ```

3. **乐观更新**：
   ```typescript
   // 收藏功能的乐观更新示例
   const toggleFavorite = async (itemId: string) => {
     // 立即更新 UI
     mutate(
       `/api/favorites/${videoId}`,
       (current: string[]) => {
         return current.includes(itemId)
           ? current.filter(id => id !== itemId)
           : [...current, itemId]
       },
       false // 不重新验证
     )

     // 后台同步到服务器
     try {
       await toggleFavoriteAPI(itemId)
     } catch (error) {
       // 发生错误时回滚 UI
       mutate(`/api/favorites/${videoId}`)
     }
   }
   ```

## 7. 类型安全

建议使用 Supabase CLI 生成类型定义：

```bash
supabase gen types typescript --project-id your-project-id > lib/types.ts
```

然后在代码中使用这些类型：

```typescript
import type { Database } from './types'

type Video = Database['public']['Tables']['videos']['Row']
type Subtitle = Database['public']['Tables']['subtitles']['Row']
type VocabularyItem = Database['public']['Tables']['vocabulary_items']['Row']