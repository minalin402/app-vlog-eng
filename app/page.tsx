import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { DashboardClient } from "@/app/dashboard-client"
import type { Video } from "@/lib/types"

/**
 * 🚀 服务端全量获取视频及状态数据
 * @param sortOrder 从 URL 传进来的排序方向
 */
async function fetchAllVideoData(sortOrder: 'asc' | 'desc' = 'desc') {
  const supabase = await createClient()
  
  // ✨ 修复 1：定义 isAsc 变量，否则执行到这一行必报错
  const isAsc = sortOrder === 'asc'
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }
  
  const [
    { data: videosData, error: videosError },
    { data: learningData },
    { data: favoritesData }
  ] = await Promise.all([
    supabase.from('videos')
      .select('id, title, description, duration, difficulty, cover_url, video_url, creator, topics, accent, created_at, updated_at')
      .order('created_at', { ascending: isAsc }) // 一级排序：随用户选择
      .order('id', { ascending: !isAsc }),       // ✨ 核心修复：二级排序永远与一级相反！
    supabase.from('user_learning_progress').select('video_id, status, progress').eq('user_id', user.id),
    supabase.from('user_favorites').select('video_id').eq('user_id', user.id)
  ])

  if (videosError) {
    console.error('Failed to fetch videos:', videosError)
    return []
  }

  const learningMap = new Map((learningData || []).map((record: any) => [record.video_id, record]))
  const favoriteSet = new Set((favoritesData || []).map((fav: any) => fav.video_id))

  const videos: Video[] = (videosData || []).map((v: any) => ({
    id: v.id,
    title: v.title,
    description: v.description || '',
    duration: v.duration,
    difficulty: v.difficulty,
    video_url: v.video_url, // 现在 select 里有了，不会报错了
    cover_url: v.cover_url,
    creator: v.creator || 'Unknown',
    topics: Array.isArray(v.topics) ? v.topics : [],
    accent: v.accent || 'General',
    created_at: v.created_at,
    updated_at: v.updated_at,
    status: learningMap.get(v.id)?.status || 'unlearned', 
    progress: learningMap.get(v.id)?.progress || 0,
    isFavorite: favoriteSet.has(v.id), 
  }))

  return videos
}

/**
 * ✨ 修复 3：异步组件需要接收参数并传递给 fetch 函数
 */
async function VideoListLoader({ sortOrder }: { sortOrder: 'asc' | 'desc' }) {
  const initialVideos = await fetchAllVideoData(sortOrder)
  return <DashboardClient initialVideos={initialVideos} />
}

/**
 * 首页主入口
 * ✨ 修复 4：必须是 async 且接收 { searchParams } 参数，这是 Next.js 15 的规范
 */
export default async function DashboardPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ sort?: string }> 
}) {
  // ✨ 修复 5：必须 await 参数，否则无法读取 sort 值
  const resolvedParams = await searchParams
  const currentSort = resolvedParams.sort === 'asc' ? 'asc' : 'desc'

  return (
    <Suspense 
      key={currentSort} // ✨ 关键：排序变了就重新显示 loading，体验才好
      fallback={
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground animate-pulse">
          <div className="h-8 w-8 mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm">正在获取视频列表...</p>
        </div>
      }
    >
      <VideoListLoader sortOrder={currentSort} /> 
    </Suspense>
  )
}