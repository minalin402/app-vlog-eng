import { notFound } from 'next/navigation'
import { getVideoPageData } from '@/lib/video-server-api'
import { VocabCardsClient } from './vocab-cards-client'

interface PageProps {
  params: Promise<{ id: string }> // 👈 必须是 Promise
}

export default async function VocabCardsPage({ params }: PageProps) {
  const { id: videoId } = await params // 👈 必须有 await
  
  const data = await getVideoPageData(videoId)

  if (!data || !data.videoData) {
    notFound()
  }

  return (
    <VocabCardsClient 
      videoId={videoId}
      //videoTitle={data.videoData.title || '核心词汇卡片'}
      vocabularies={data.videoData.vocabularies || []}
      phrases={data.videoData.phrases || []}
      expressions={data.videoData.expressions || []}
      initialFavorites={data.favoriteIds || []}
    />
  )
}