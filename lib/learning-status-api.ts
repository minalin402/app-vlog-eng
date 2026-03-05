import { supabase } from "@/lib/supabase-client"

export type LearningStatus = "learned" | "unlearned"

/**
 * 查询视频学习状态
 */
export async function fetchLearningStatus(videoId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { videoId, status: "unlearned", progress: 0 }

  const { data, error } = await supabase
    .from('user_learning_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('video_id', videoId)
    .maybeSingle()

  if (error || !data) return { videoId, status: "unlearned", progress: 0 }

  return {
    videoId,
    status: data.status as LearningStatus,
    progress: data.progress || 0,
    lastLearnedAt: data.last_learned_at // ✨ 修正：使用数据库真实的 last_learned_at 字段
  }
}

/**
 * 更新学习进度 (自动存盘逻辑)
 */
/**
 * 更新学习进度 (由视频页定时调用)
 */
export async function updateLearningProgress(videoId: string, progress: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const targetStatus = progress >= 99 ? "learned" : "unlearned"
  const now = new Date().toISOString()

  // 1. 先查到底有没有记录
  const { data: existing, error: searchError } = await supabase
    .from('user_learning_progress')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('video_id', videoId)
    .maybeSingle()

  if (searchError) console.error("查询进度异常:", searchError)

  // 2. 稳妥地分开执行 Update 或 Insert
  if (existing) {
    if (existing.status !== "learned") {
      const { error: updateError } = await supabase
        .from('user_learning_progress')
        .update({ 
          status: targetStatus, 
          progress, 
          last_learned_at: now 
        })
        .eq('id', existing.id)
        
      if (updateError) console.error("更新进度失败:", updateError)
    }
  } else {
    const { error: insertError } = await supabase
      .from('user_learning_progress')
      .insert({ 
        user_id: user.id, 
        video_id: videoId, 
        status: targetStatus, 
        progress,
        last_learned_at: now 
      })
      
    if (insertError) console.error("插入进度失败:", insertError)
  }
}

/**
 * 标记为已学完
 */
export async function markAsLearned(videoId: string, progress: number = 100): Promise<void> {
  await updateLearningProgress(videoId, progress)
}

/**
 * 重置学习状态 (修复：改为更新进度为 0，而不是物理删除数据)
 */
export async function resetLearningStatus(videoId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('user_learning_progress')
    .update({ 
      status: 'unlearned', 
      progress: 0, 
      last_learned_at: new Date().toISOString() 
    })
    .eq('user_id', user.id)
    .eq('video_id', videoId)
}