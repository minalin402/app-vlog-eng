// app/demo/vocab-cards/page.tsx
import { notFound } from 'next/navigation'
import { getVideoPageData } from '@/lib/video-server-api'
import { VocabCardsClient } from '@/app/videos/[id]/vocab-cards/vocab-cards-client'

export default async function DemoVocabCardsPage() {
  // 固定为演示视频的 ID
  const demoId = "A010" 
  
  // 保持你原来获取数据的逻辑不变
  const data = await getVideoPageData(demoId, 'desc') as any

  if (!data || !data.videoData) {
    notFound()
  }

  return (
    <VocabCardsClient 
      videoId={demoId}
      vocabularies={data.videoData.vocabularies || []}
      phrases={data.videoData.phrases || []}
      expressions={data.videoData.expressions || []}
      initialFavorites={data.favoriteIds || []}
      isDemo={true} // ✨ 开启阻断模式
    />
  )
}