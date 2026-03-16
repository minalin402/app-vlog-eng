import { supabase } from './supabase-client'

export interface VideoDetail {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  videoUrl: string;
  original_youtube_url?: string;
  subtitles: SubtitleItem[];
  vocabularies?: VocabItem[];
  phrases?: PhraseItem[];
  expressions?: ExpressionItem[];
}

export interface SubtitleItem {
  id: string;
  startTime: number;
  endTime: number;
  en: string;
  zh: string;
}

export interface VocabItem {
  id: string;
  word: string;
  original_form_in_video?:string;
  phonetic?: string;
  pos?: string;
  chinese_definition: string;
  english_definition: string;
  synonyms?: string;
  example_from_video: string;
  example_translation: string;
  first_appearance_time: number;
}

export interface PhraseItem {
  id: string;
  phrase: string;
  original_form_in_video?:string;
  phonetic?: string;
  chinese_definition: string;
  synonyms?: string;
  context: string;
  context_translation: string;
  first_appearance_time: number;
}

export interface ExpressionItem {
  id: string;
  expression: string;
  original_form_in_video?:string;
  expression_explanation: string;
  first_appearance_time: number;
}

export async function getVideoDetail(id: string): Promise<VideoDetail | null> {
  try {
    // 1. 获取视频基本信息
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single()

    if (videoError) throw videoError
    if (!video) return null

    // 2. 获取字幕数据
    const { data: subtitles, error: subtitlesError } = await supabase
      .from('subtitles')
      .select('*')
      .eq('video_id', id)
      .order('start_time')

    if (subtitlesError) throw subtitlesError

    // 3. 获取词汇数据
    const { data: vocabItems, error: vocabError } = await supabase
      .from('vocabulary_items')
      .select('*')
      .eq('video_id', id)
      .order('first_appearance_time')

    if (vocabError) throw vocabError

    // 4. 转换数据格式以匹配前端接口
    const videoDetail: VideoDetail = {
      id: video.id,
      title: video.title,
      description: video.description || '',
      duration: video.duration,
      difficulty: video.difficulty,
      videoUrl: video.video_url,
      original_youtube_url: video.original_youtube_url,
      subtitles: subtitles?.map(s => ({
        id: s.id,
        startTime: s.start_time,
        endTime: s.end_time,
        en: s.content_en,
        zh: s.content_zh
      })) ?? [],
      vocabularies: vocabItems
        ?.filter(v => v.type === 'word')
        .map(v => ({
          id: v.id,
          word: v.content,
          original_form_in_video: v.original_form_in_video || undefined, // ✨ 新增映射
          pos: v.pos || undefined, // ✨ 补充映射词性
          phonetic: v.phonetic || undefined,
          chinese_definition: v.definition_zh,
          english_definition: v.definition_en,
          synonyms: v.synonyms || undefined, // ✨ 补充映射近义词
          example_from_video: v.example_en || '',
          example_translation: v.example_zh || '',
          first_appearance_time: v.first_appearance_time || 0
        })) ?? [],
      phrases: vocabItems
        ?.filter(v => v.type === 'phrase')
        .map(v => ({
          id: v.id,
          phrase: v.content,
          original_form_in_video: v.original_form_in_video || undefined, // ✨ 新增映射
          phonetic: v.phonetic || undefined,
          chinese_definition: v.definition_zh,
          synonyms: v.synonyms || undefined, // ✨ 修复映射字段
          context: v.example_en || '',
          context_translation: v.example_zh || '',
          first_appearance_time: v.first_appearance_time || 0
        })) ?? [],
      expressions: vocabItems
        ?.filter(v => v.type === 'expression')
        .map(v => ({
          id: v.id,
          expression: v.content,
          original_form_in_video: v.original_form_in_video || undefined, // ✨ 新增这一行
          expression_explanation: v.analysis || '',
          first_appearance_time: v.first_appearance_time || 0
        })) ?? []
    }

    // ==========================================
    // ✨ 终极跨行高亮引擎：在服务端预渲染全部高亮标签
    // ==========================================
    const targets = [
      ...videoDetail.vocabularies!.map(v => ({ text: (v.original_form_in_video || v.word).trim(), id: v.id, type: 'w' })),
      ...videoDetail.phrases!.map(p => ({ text: (p.original_form_in_video || p.phrase).trim(), id: p.id, type: 'p' })),
      ...videoDetail.expressions!.map(e => ({ text: (e.original_form_in_video || e.expression).trim(), id: e.id, type: 'e' }))
    ].filter(t => t.text.length > 0);

    // 按长度倒序，长词/长句优先高亮，防止被短词截断
    targets.sort((a, b) => b.text.length - a.text.length);

    // 1. 展开所有字幕字符，构建带索引的全局地图
    interface CharNode {
      char: string; subIdx: number; localIdx: number; openTag?: string; closeTag?: string;
    }
    const charsMap: CharNode[] = [];

    videoDetail.subtitles.forEach((sub, subIdx) => {
      const text = sub.en || "";
      for (let i = 0; i < text.length; i++) {
        charsMap.push({ char: text[i], subIdx, localIdx: i });
      }
      // 插入虚拟空格作为换行连接符
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
        
        // 智能边界判断 (防误伤机制)
        const prevChar = start > 0 ? globalString[start - 1] : "";
        const nextChar = end < globalString.length ? globalString[end] : "";
        const startsWithWordChar = /^\w/.test(match[0]);
        const endsWithWordChar = /\w$/.test(match[0]);
        const validStart = startsWithWordChar ? !prevChar || /\W/.test(prevChar) : true;
        const validEnd = endsWithWordChar ? !nextChar || /\W/.test(nextChar) : true;
        
        if (!validStart || !validEnd) continue;

        // 检查是否已被覆盖
        let isOverlap = false;
        for (let i = start; i < end; i++) {
          if (highlighted[i]) { isOverlap = true; break; }
        }
        if (isOverlap) continue;

        // 执行跨行打标
        for (let i = start; i < end; i++) {
          highlighted[i] = true;
          if (charsMap[i].localIdx === -1) continue; // 虚拟空格不打标签

          // 是否需要打开标签？(当前是匹配起点，或者上一个字符是虚拟换行符)
          if (i === start || charsMap[i - 1].localIdx === -1) {
            charsMap[i].openTag = `{{${target.type}|${target.id}|`;
          }
          // 是否需要关闭标签？(当前是匹配终点，或者下一个字符是虚拟换行符)
          if (i === end - 1 || charsMap[i + 1].localIdx === -1) {
            charsMap[i].closeTag = `}}`;
          }
        }
      }
    });

    // 2. 将标签完美组装回各个独立的字幕中
    videoDetail.subtitles.forEach((sub, subIdx) => {
      let newEn = "";
      const subChars = charsMap.filter(c => c.subIdx === subIdx && c.localIdx !== -1);
      for (const c of subChars) {
        if (c.openTag) newEn += c.openTag;
        newEn += c.char;
        if (c.closeTag) newEn += c.closeTag;
      }
      if (newEn.includes("{{")) sub.en = newEn;
    });
    // ==========================================

    return videoDetail

  } catch (error) {
    console.error('Error fetching video detail:', error)
    return null
  }
}
