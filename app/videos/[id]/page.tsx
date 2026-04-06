import { notFound } from "next/navigation"
import VideoLearningClient from "./video-learning-client"
import { getVideoPageData } from "@/lib/video-server-api"
// 强制动态渲染，禁用当前页面的服务端缓存
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ 
    sort?: string; 
    from?: string; 
  }>
  
}

// app/videos/[id]/page.tsx
export default async function VideoPage({ params, searchParams }: PageProps) {
  const { id: videoId } = await params
  const resolvedSearchParams = await searchParams
  const currentSort = resolvedSearchParams.sort === 'asc' ? 'asc' : 'desc'
  
  // ✨ 1. 获取来源参数
  const from = resolvedSearchParams.from || 'home' 

  const { videoData, learningStatus, favoriteIds, prevVideoId, nextVideoId } = 
    await getVideoPageData(videoId, currentSort) as any

  if (!videoData) { notFound() }

  return (
    <VideoLearningClient
      videoId={videoId}
      initialVideoData={videoData}
      initialLearningStatus={learningStatus.status}
      initialFavoriteIds={favoriteIds}
      prevVideoId={prevVideoId}
      nextVideoId={nextVideoId}
      currentSort={currentSort}
      from={from} // ✨ 2. 传给客户端
    />
  )
}