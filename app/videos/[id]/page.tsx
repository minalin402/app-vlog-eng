/**
 * 视频详情页 - Server Component
 * 
 * 重构说明：
 * - 这是一个纯 Server Component，在服务端获取所有数据
 * - 数据通过 props 传递给客户端组件 VideoLearningClient
 * - 实现 SSR，首屏即可看到完整内容，无白屏
 * 
 * 性能优势：
 * - 消除客户端 useEffect 数据获取的等待时间
 * - 利用服务端直连数据库，速度更快
 * - SEO 友好，搜索引擎可以抓取完整内容
 */

import { notFound } from 'next/navigation'
import { getVideoPageData } from '@/lib/video-server-api'
import VideoLearningClient from './video-learning-client'
import type { LearningStatus } from '@/lib/learning-status-api'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VideoPage({ params }: PageProps) {
  // 在服务端获取路由参数
  const { id: videoId } = await params

  // 在服务端并行获取所有数据
  const { videoData, learningStatus, favoriteIds } = await getVideoPageData(videoId)

  // 如果视频不存在，返回 404
  if (!videoData) {
    notFound()
  }

  // 将数据传递给客户端组件
  return (
    <VideoLearningClient
      videoId={videoId}
      initialVideoData={videoData}
      initialLearningStatus={learningStatus.status}
      initialFavoriteIds={favoriteIds}
    />
  )
}

/**
 * 生成静态参数（可选）
 * 如果你想在构建时预渲染某些视频页面，可以实现这个函数
 */
// export async function generateStaticParams() {
//   const supabase = await createClient()
//   const { data: videos } = await supabase
//     .from('videos')
//     .select('id')
//     .limit(10) // 只预渲染前 10 个视频
//   
//   return videos?.map((video) => ({
//     id: video.id,
//   })) || []
// }

/**
 * 元数据生成（可选）
 * 为每个视频页面生成动态的 SEO 元数据
 */
// export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
//   const { id: videoId } = await params
//   const { videoData } = await getVideoPageData(videoId)
//   
//   if (!videoData) {
//     return {
//       title: '视频不存在',
//     }
//   }
//   
//   return {
//     title: `${videoData.title} - EngVlogLab`,
//     description: videoData.description || '通过优质英语视频内容提升听说能力',
//   }
// }
