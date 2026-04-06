/**
 * 服务端视频数据获取 API
 * 用于 Server Components 中获取视频详情数据
 * 
 * 优势：
 * - 在服务端直接查询数据库，无需客户端等待
 * - 支持 SSR，首屏即可看到完整数据
 * - 减少客户端 JavaScript 体积
 */

import { createClient } from './supabase-server'
import type { VideoDetail } from './video-api'

export interface ServerVideoData extends VideoDetail {
  original_youtube_url: string
  created_at?: string // ✨ 加上这一行，告诉 TS 我们有这个属性
}

export interface ServerLearningStatus {
  status: 'unlearned' | 'learned'
  progress?: number
  last_position?: number
}

/**
 * 在服务端获取视频完整数据
 * @param videoId 视频 ID
 * @returns 视频详情数据，包含字幕、词汇等
 */
export async function getVideoDataServer(videoId: string): Promise<ServerVideoData | null> {
  // ✨ 1. 幽灵请求拦截器：如果 ID 是 undefined 或者是静态文件后缀，直接返回，不查数据库！
  if (!videoId || videoId === 'undefined' || videoId.includes('.')) {
    return null
  }

  const supabase = await createClient()


  // ✨ 修改点：尝试获取用户，但如果不登录也不要报错崩溃
  const { data: { user } } = await supabase.auth.getUser()

  // 🔒 安全策略：如果是试用，只允许拿那几个特定的 ID
  const DEMO_IDS = ['A010', 'A069']; 
  const isRequestingDemo = DEMO_IDS.includes(videoId);

  // 如果没登录，且请求的不是演示视频，直接拦截
  if (!user && !isRequestingDemo) {
    return null;
  }
  
  try {
    // ✨ 2. 性能巅峰：并行查询三大数据表（打破 10 秒瓶颈）
    const [
      { data: videoRow, error: videoError },
      { data: subData },
      { data: vocabData }
    ] = await Promise.all([
      supabase.from('videos').select('*').eq('id', videoId).single(),
      supabase.from('subtitles').select('*').eq('video_id', videoId).order('start_time', { ascending: true }),
      supabase.from('vocabulary_items').select('*').eq('video_id', videoId)
    ])

    if (videoError || !videoRow) {
      // ✨ 3. 优雅提示：不再打印吓人的 {} 红字报错
      console.warn(`⚠️ 数据库未找到视频 ID: ${videoId}`)
      return null
    }

    // --- 下面的代码保持你原来的逻辑完全不变 ---
    // 类型断言以避免 TypeScript 错误
    const video = videoRow as any
    const subtitles = (subData || []) as any[]
    const vocabs = (vocabData || []) as any[]

    // 清洗 YouTube URL
    let cleanYoutubeUrl = video.original_youtube_url || ''
    if (cleanYoutubeUrl.endsWith('&t') || cleanYoutubeUrl.endsWith('&t=')) {
      cleanYoutubeUrl = cleanYoutubeUrl.split('&t')[0]
    }

    // 推算本地视频路径
    let localVideoUrl = ''
    if (video.cover_url) {
      localVideoUrl = video.cover_url.replace(/cover\.(jpg|png|jpeg)$/i, 'video.mp4')
    }

    // 格式化字幕
    const formattedSubtitles = subtitles.map(s => ({
      id: s.id,
      startTime: s.start_time,
      endTime: s.end_time,
      en: s.content_en,
      zh: s.content_zh,
    }))

    // 格式化词汇
    const vocabularies = vocabs
      .filter(v => v.type === 'word')
      .map(v => ({
        id: v.id,
        word: v.content,
        original_form_in_video: v.original_form_in_video || undefined, // 🚨 补上映射！
        pos: v.pos,
        phonetic: v.phonetic,
        synonyms: v.synonyms,
        chinese_definition: v.definition_zh,
        english_definition: v.definition_en,
        example_from_video: v.example_en,
        example_translation: v.example_zh,
        first_appearance_time: v.first_appearance_time,
      }))

    // 格式化短语
    const phrases = vocabs
      .filter(v => v.type === 'phrase')
      .map(v => ({
        id: v.id,
        phrase: v.content,
        original_form_in_video: v.original_form_in_video || undefined, // 🚨 补上映射！
        phonetic: v.phonetic,
        synonyms: v.synonyms,
        chinese_definition: v.definition_zh,
        context: v.example_en,
        context_translation: v.example_zh,
        first_appearance_time: v.first_appearance_time,
      }))

    // 格式化表达
    const expressions = vocabs
      .filter(v => v.type === 'expression')
      .map(v => ({
        id: v.id,
        expression: v.content,
        original_form_in_video: v.original_form_in_video || undefined, // 🚨 补上映射！
        expression_explanation: v.analysis,
        first_appearance_time: v.first_appearance_time,
      }))

// ==========================================
    // ✨ 1. 先把准备返回的对象存进变量 resultData
    // ==========================================
    const resultData = {
      id: video.id,
      title: video.title,
      description: video.description,
      duration: video.duration,
      difficulty: video.difficulty,
      videoUrl: video.video_url || '',
      coverUrl: video.cover_url || '',  // ✨ 新增：把数据库查到的 cover_url 传出去
      original_youtube_url: cleanYoutubeUrl,
      created_at: video.created_at, // ✨ 务必加上这行！让下面的函数能拿到时间戳
      updated_at: video.updated_at, // ✨ 必须加上这一行，否则下面拿不到值
      subtitles: formattedSubtitles,
      vocabularies,
      phrases,
      expressions,
    }

    // ==========================================
    // ✨ 2. 终极跨行高亮引擎：在服务端预渲染全部高亮标签
    // ==========================================
    const targets = [
      ...resultData.vocabularies.map(v => ({ text: (v.original_form_in_video || v.word).trim(), id: v.id, type: 'w' as const })),
      ...resultData.phrases.map(p => ({ text: (p.original_form_in_video || p.phrase).trim(), id: p.id, type: 'p' as const })),
      ...resultData.expressions.map(e => ({ text: (e.original_form_in_video || e.expression).trim(), id: e.id, type: 'e' as const }))
    ].filter(t => t.text.length > 0);

    // 按长度倒序，长词/长句优先高亮，防止被短词截断
    targets.sort((a, b) => b.text.length - a.text.length);

    const charsMap: { char: string; subIdx: number; localIdx: number; openTag?: string; closeTag?: string; }[] = [];

    resultData.subtitles.forEach((sub, subIdx) => {
      const text = sub.en || "";
      for (let i = 0; i < text.length; i++) {
        charsMap.push({ char: text[i], subIdx, localIdx: i });
      }
      charsMap.push({ char: ' ', subIdx, localIdx: -1 });
    });

    const globalString = charsMap.map(c => c.char).join('');
    const highlighted = new Array(globalString.length).fill(false);

    targets.forEach(target => {
      const escaped = target.text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      
      let match;
      while ((match = regex.exec(globalString)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        
        const prevChar = start > 0 ? globalString[start - 1] : "";
        const nextChar = end < globalString.length ? globalString[end] : "";
        const startsWithWordChar = /^\w/.test(match[0]);
        const endsWithWordChar = /\w$/.test(match[0]);
        const validStart = startsWithWordChar ? !prevChar || /\W/.test(prevChar) : true;
        const validEnd = endsWithWordChar ? !nextChar || /\W/.test(nextChar) : true;
        
        if (!validStart || !validEnd) continue;

        let isOverlap = false;
        for (let i = start; i < end; i++) {
          if (highlighted[i]) { isOverlap = true; break; }
        }
        if (isOverlap) continue;

        for (let i = start; i < end; i++) {
          highlighted[i] = true;
          if (charsMap[i].localIdx === -1) continue;

          if (i === start || charsMap[i - 1].localIdx === -1) {
            charsMap[i].openTag = `{{${target.type}|${target.id}|`;
          }
          if (i === end - 1 || charsMap[i + 1].localIdx === -1) {
            charsMap[i].closeTag = `}}`;
          }
        }
      }
    });

    resultData.subtitles.forEach((sub, subIdx) => {
      let newEn = "";
      const subChars = charsMap.filter(c => c.subIdx === subIdx && c.localIdx !== -1);
      for (const c of subChars) {
        if (c.openTag) newEn += c.openTag;
        newEn += c.char;
        if (c.closeTag) newEn += c.closeTag;
      }
      if (newEn.includes("{{")) sub.en = newEn;
    });

    // ✨ 3. 带着完美高亮标签返回数据！
    return resultData

  } catch (error) {
    console.error('获取视频数据失败:', error)
    return null
  }
}

/**
 * 在服务端获取用户学习状态
 * @param videoId 视频 ID
 * @returns 学习状态
 */
export async function getLearningStatusServer(videoId: string): Promise<ServerLearningStatus> {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { status: 'unlearned' }
    }

    const { data, error } = await supabase
      .from('user_learning_records')
      .select('status, progress, last_position')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .single()

    if (error || !data) {
      return { status: 'unlearned' }
    }

    const record = data as any

    return {
      status: record.status as 'unlearned' | 'learned',
      progress: record.progress,
      last_position: record.last_position,
    }
  } catch (error) {
    console.error('获取学习状态失败:', error)
    return { status: 'unlearned' }
  }
}

/**
 * 在服务端获取用户收藏列表
 * @returns 收藏的词汇 ID 列表
 */
export async function getUserFavoritesServer(): Promise<string[]> {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return []
    }

    const { data } = await supabase
      .from('user_favorites')
      .select('vocabulary_id')
      .eq('user_id', user.id)
      .not('vocabulary_id', 'is', null)

    const favorites = (data || []) as any[]
    return favorites.map(f => f.vocabulary_id).filter(Boolean)
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    return []
  }
}

/**
 * 一次性获取视频页面所需的所有数据 (包含上下期导航，全景数组游标法)
 * @param videoId 视频 ID
 * @param sortOrder 排序方向
 */
/**
 * ✨ 终极对齐版：精准定位上下期邻居（ID 始终正序逻辑）
 */
/**
 * ✨ 完美对齐版：基于“绝对镜像定律”的上下期导航
 */
export async function getVideoPageData(videoId: string, sortOrder: 'asc' | 'desc' = 'desc') {
  const [videoData, learningStatus, favoriteIds] = await Promise.all([
    getVideoDataServer(videoId),
    getLearningStatusServer(videoId),
    getUserFavoritesServer(),
  ])

  let prevVideoId = null;
  let nextVideoId = null;

  if (videoData && videoData.created_at) {
    const supabase = await createClient()
    const isAsc = sortOrder === 'asc';
    const curTime = videoData.created_at;
    const curId = videoData.id;

    // 🚀 获取上一期 (Prev)：找列表里排在它上面的
    const prevRes = await supabase.from('videos')
      .select('id')
      .or(isAsc 
        // 升序(最早): 找时间更早的，或时间相同但 ID 更大的
        ? `created_at.lt.${curTime},and(created_at.eq.${curTime},id.gt.${curId})` 
        // 降序(最新): 找时间更晚的，或时间相同但 ID 更小的
        : `created_at.gt.${curTime},and(created_at.eq.${curTime},id.lt.${curId})`
      )
      // 找距离当前视频最近的一个，所以排序要和列表完全反过来
      .order('created_at', { ascending: !isAsc })
      .order('id', { ascending: isAsc }) 
      .limit(1);

    // 🚀 获取下一期 (Next)：找列表里排在它下面的
    const nextRes = await supabase.from('videos')
      .select('id')
      .or(isAsc 
        // 升序(最早): 找时间更晚的，或时间相同但 ID 更小的
        ? `created_at.gt.${curTime},and(created_at.eq.${curTime},id.lt.${curId})` 
        // 降序(最新): 找时间更早的，或时间相同但 ID 更大的
        : `created_at.lt.${curTime},and(created_at.eq.${curTime},id.gt.${curId})`
      )
      // 找距离当前视频最近的一个，排序和列表一模一样
      .order('created_at', { ascending: isAsc })
      .order('id', { ascending: !isAsc }) 
      .limit(1);

    prevVideoId = (prevRes.data as any)?.[0]?.id || null;
    nextVideoId = (nextRes.data as any)?.[0]?.id || null;
  }

  return { videoData, learningStatus, favoriteIds, prevVideoId, nextVideoId }
}