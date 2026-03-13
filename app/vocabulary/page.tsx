import { createClient } from "@/lib/supabase-server"
import { VocabPage } from "./components/vocab/vocab-page"
import type { VocabularyItemRow } from "@/lib/supabase-client"

export default async function Page() {
  const supabase = await createClient()
  
  // 获取当前用户
  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. 获取所有视频列表
  const { data: videos } = await supabase
    .from('videos')
    .select('id, title')
    .order('created_at', { ascending: false })
  
  // 2. 获取所有词汇项
  const { data: vocabularyItems } = await supabase
    .from('vocabulary_items')
    .select('*')
    .order('created_at', { ascending: false })
  
  // 3. 使用连表查询一次性获取用户的所有收藏（避免 .in() 防爆）
  let favoriteIds: string[] = []
  if (user) {
    const { data: favorites } = await supabase
      .from('user_favorites')
      .select('item_id')
      .eq('user_id', user.id)
    
    if (favorites) {
      favoriteIds = favorites.map((f: any) => f.item_id)
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
