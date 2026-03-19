import { notFound } from "next/navigation"
import VideoLearningClient from "./video-learning-client"
import { getVideoPageData } from "@/lib/video-server-api"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ sort?: string }> // ✨ 捕获 URL 里的 sort 参数
}

export default async function VideoPage({ params, searchParams }: PageProps) {
  const { id: videoId } = await params
  
  // ✨ 解析 sort 参数，如果没有传，就默认降序 'desc'
  const resolvedSearchParams = await searchParams
  const currentSort = resolvedSearchParams.sort === 'asc' ? 'asc' : 'desc'

  // ✨ 将排序状态传给后端 API
  const { videoData, learningStatus, favoriteIds, prevVideoId, nextVideoId } = 
    await getVideoPageData(videoId, currentSort) as any

  if (!videoData) {
    notFound()
  }

  return (
    <VideoLearningClient
      videoId={videoId}
      initialVideoData={videoData}
      initialLearningStatus={learningStatus.status}
      initialFavoriteIds={favoriteIds}
      prevVideoId={prevVideoId}
      nextVideoId={nextVideoId}
      currentSort={currentSort} // ✨ 顺便传给前端客户端，让 Header 跳转时能记住这个状态
    />
  )
}