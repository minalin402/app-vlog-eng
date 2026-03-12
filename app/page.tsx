import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { DashboardClient } from "@/app/dashboard-client"
import type { Video } from "@/lib/types"

/**
 * 🚀 服务端全量获取视频及状态数据
 * 彻底消除客户端的瀑布流请求和计算阻塞
 */
async function fetchAllVideoData() {
  const supabase = await createClient()
  
  // 1. 获取当前用户
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }
  
  // 2. ✨ 核心优化：使用 Promise.all 并行拉取 3 张表的数据
  // 这样只要花费最慢那一个请求的时间，而不是串行等待
const [
    { data: videosData, error: videosError },
    { data: learningData },
    { data: favoritesData }
  ] = await Promise.all([
    supabase.from('videos')
      .select('id, title, description, duration, difficulty, cover_url, creator, topics, accent, created_at')
      .order('created_at', { ascending: false }), // ✨ 删除了 .limit(20)，一次性拿全
    supabase.from('user_learning_progress').select('video_id, status, progress').eq('user_id', user.id),
    supabase.from('user_favorites').select('video_id').eq('user_id', user.id)
  ])

  if (videosError) {
    console.error('Failed to fetch videos:', videosError)
    return []
  }

  // ✨ 修复 2：把整个 record 存下来，而不只是 status
  const learningMap = new Map((learningData || []).map((record: any) => [record.video_id, record]))
  const favoriteSet = new Set((favoritesData || []).map((fav: any) => fav.video_id))

  // 4. 组装视频数据，在服务端直接把“已学习”和“已收藏”的标签打好
  const videos: Video[] = (videosData || []).map((v: any) => ({
    id: v.id,
    title: v.title,
    description: v.description || '',
    duration: v.duration,
    difficulty: v.difficulty,
    video_url: v.video_url,
    cover_url: v.cover_url,
    creator: v.creator || 'Unknown',
    topics: Array.isArray(v.topics) ? v.topics : [],
    accent: v.accent || 'General',
    created_at: v.created_at,
    updated_at: v.updated_at,
    // ✨ 修复 3：直接在这里把 status 和 progress 打包塞进视频数据里！
    status: learningMap.get(v.id)?.status || 'unlearned', 
    progress: learningMap.get(v.id)?.progress || 0,
    isFavorite: favoriteSet.has(v.id), 
  }))

  return videos
}

/**
 * 抽离的异步组件
 */
async function VideoListLoader() {
  const initialVideos = await fetchAllVideoData()
  
  // ✨ 删掉 filter 参数，只传视频数据
  return <DashboardClient initialVideos={initialVideos} />
}


/**
 * 首页主入口
 */
export default function DashboardPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground animate-pulse">
          <div className="h-8 w-8 mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm">正在获取最新视频列表...</p>
        </div>
      }
    >
      {/* ✨ 这里不要传参数 */}
      <VideoListLoader /> 
    </Suspense>
  )
}