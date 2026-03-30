// app/demo/page.tsx
import { notFound } from "next/navigation"
import VideoLearningClient from "@/app/videos/[id]/video-learning-client"
import { getVideoPageData } from "@/lib/video-server-api"

export default async function DemoPage() {
  const demoId = "A010"
  const data = await getVideoPageData(demoId, 'desc') as any

  if (!data || !data.videoData) return notFound()

  return (
    <VideoLearningClient
      videoId={demoId}
      initialVideoData={data.videoData}
      initialLearningStatus={data.learningStatus?.status || 'unlearned'}
      initialFavoriteIds={data.favoriteIds || []} 
      prevVideoId={null} 
      nextVideoId={null} 
      currentSort="desc"
      from="demo"
      isDemo={true} // ✨ 加上这个，开启无敌防御模式
    />
  )
}