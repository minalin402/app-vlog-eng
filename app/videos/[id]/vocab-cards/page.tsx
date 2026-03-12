import { notFound } from 'next/navigation'
import { getVideoPageData } from '@/lib/video-server-api'
import { VocabCardsClient } from './vocab-cards-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VocabCardsPage({ params }: PageProps) {
  // 1. 在服务端瞬间拿到路由参数
  const { id: videoId } = await params
  
  // 2. 利用我们优化过的并行查询接口，在 Vercel 内部极速拿到所有数据
  const data = await getVideoPageData(videoId)

  if (!data || !data.videoData) {
    notFound()
  }

  // 3. 把数据作为 props 喂给客户端组件，消灭转圈加载！
  return (
    <VocabCardsClient 
      videoId={videoId}
      videoTitle={data.videoData.title || '核心词汇卡片'}
      vocabularies={data.videoData.vocabularies || []}
      phrases={data.videoData.phrases || []}
      expressions={data.videoData.expressions || []}
      initialFavorites={data.favoriteIds || []}
    />
  )
}