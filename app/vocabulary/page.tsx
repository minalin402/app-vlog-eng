import { createClient } from "@/lib/supabase-server"
import { VocabPage } from "./components/vocab/vocab-page"
import type { VocabularyItemRow } from "@/lib/supabase-client"

export default async function Page() {
  const supabase = await createClient()
  
  // 获取当前用户
  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. 获取所有视频列表
// 1. 获取所有视频列表
  const { data: videos } = await supabase
    .from('videos')
    .select('id, title')
    .order('created_at', { ascending: false }) // 最新发布（时间倒序）
    .order('id', { ascending: true })          // ✨ 新增：ID 永远正序（A001 在 A002 前）
  
  // 2. 获取所有词汇项
  const { data: vocabularyItems } = await supabase
    .from('vocabulary_items')
    .select('*')
    .order('created_at', { ascending: false })
  
  // 3. 使用连表查询一次性获取用户的所有收藏
  let favoriteIds: string[] = []
  if (user) {
    const { data: favorites } = await supabase
      .from('user_favorites')
      // ✨ 核心修复 1：严格对齐你的数据库列名 vocabulary_id
      .select('vocabulary_id')
      .eq('user_id', user.id)
      // ✨ 核心修复 2：过滤掉只收藏了视频（vocabulary_id 为 null）的无用记录
      .not('vocabulary_id', 'is', null)
    
    if (favorites) {
      // ✨ 核心修复 3：正确提取 vocabulary_id
      favoriteIds = favorites.map((f: any) => f.vocabulary_id).filter(Boolean)
    }
  }
  
  // 4. 将数据按视频分组
  const vocabularyByVideo: Record<string, VocabularyItemRow[]> = {}
  if (vocabularyItems) {
    vocabularyItems.forEach((item: any) => {
      if (!vocabularyByVideo[item.video_id]) {
        vocabularyByVideo[item.video_id] = []
      }
      vocabularyByVideo[item.video_id].push(item as VocabularyItemRow)
    })
  }
  
  return (
    <VocabPage 
      initialVideos={videos || []}
      initialVocabularyByVideo={vocabularyByVideo}
      initialFavoriteIds={favoriteIds}
    />
  )
}
