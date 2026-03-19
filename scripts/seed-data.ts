import { config } from 'dotenv'
import { resolve } from 'path'
import * as fs from 'fs'
import * as path from 'path'
// 1. 暴力置顶加载环境变量 (必须在实例化 Supabase 之前执行)
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

// 2. 重新初始化独立的 supabase 客户端 (彻底避开前端依赖带来的污染)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ 找不到 Supabase 环境变量，请检查 .env.local')
}

// 初始化客户端
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedDatabase() {
  try {
    // 3. 直接扫描生产出来的真实物理文件
    const contentDir = path.resolve(process.cwd(), 'public/content')
    if (!fs.existsSync(contentDir)) {
      console.log('❌ 找不到 public/content 目录，请先运行 Python 生产数据')
      return
    }

    // 暂时只处理这两个文件夹进行验证
    const folders =  
[
 "A040_michelle_Choi", "A207_Steph_Bohrer", "A196_sydney_serena", "A194_sydney_serena", "A016_Sydney_Serena", 
"A114_Noa_Maria", "A108_Noa_Maria", "A189_Maddie_Borge", "A039_michelle_Choi", "A020_Birta_Hlin", 
 "A117_Noa_Maria", "A017_Birta_Hlin", "A200_Loepsie", "A021_Birta_Hlin", "A103_Karen_Napoly", 
 "A204_Loepsie", "A150_Taylor_R", "A101_Karen_Napoly", "A116_Noa_Maria", "A037_Jonna_Jinton", 
 "A152_Taylor_R", "A084_Hailey_Rhode_Bieber", "A087_Hailey_Rhode_Bieber", "A097_Karen_Napoly", "A085_Hailey_Rhode_Bieber", 
"A064_Taylor_Bell", "A024_Birta_Hlin", "A054_Claudia_Sulewski", "A208_Nil_Sani", "A125_Life_Of_Riza", 
 "A193_Maddie_Borge", "A100_Karen_Napoly", "A029_Annika", "A081_Allison_Anderson", "A080_Allison_Anderson", 
 "A069_Amanda_Ekstrand", "A089_Hailey_Rhode_Bieber", "A183_Maddie_Borge", "A083_Hailey_Rhode_Bieber", "A175_Amy_Cheah", 
"A141_julia_fei", "A187_Maddie_Borge", "A094_pearlieee", "A153_Taylor_R", "A192_Maddie_Borge", 
 "A058_Hannah_Elise", "A155_Eve_Bennett", "A157_Eve_Bennett", "A167_Lydia_Violeta", "A028_Annika"
]
    
    
    console.log(`📂 在本地找到 ${folders.length} 个指定的视频文件夹，准备开始同步...`)

    for (const folder of folders) {
      const jsonPath = path.join(contentDir, folder, 'data.json')
      if (!fs.existsSync(jsonPath)) {
        console.log(`⚠️ 跳过 ${folder}: 目录中没有 data.json`)
        continue
      }

      console.log(`\n⏳ 正在同步: ${folder}...`)
      // 读取真实 JSON
      const rawData = fs.readFileSync(jsonPath, 'utf-8')
      const mockData = JSON.parse(rawData)

      // 找封面图
      const folderPath = path.join(contentDir, folder)
      const files = fs.readdirSync(folderPath)
      const coverFile = files.find(f => f.startsWith('cover') && (f.endsWith('.jpg') || f.endsWith('.png')))
      const coverUrl = coverFile ? `/content/${folder}/${coverFile}` : null

      // --- 步骤 A：插入视频大盘信息 ---
      const { error: videoError } = await supabase
        .from('videos')
        .upsert({
          id: mockData.id,
          title: mockData.title,
          topics: mockData.topics || [], // 防止 topics 为空报错
          description: mockData.description,
          duration: mockData.duration,
          difficulty: mockData.difficulty,
          video_url: mockData.videoUrl,
          creator: mockData.creator, 
          accent: mockData.accent,
          cover_url: mockData.coverUrl,
          original_youtube_url: mockData.original_youtube_url,  // 👈 新增这一行！
          created_at: mockData.publishDate ? new Date(mockData.publishDate).toISOString() : new Date().toISOString()
        })

      if (videoError) throw videoError

      // --- 步骤 B：插入字幕信息 (帮你找回来了！) ---
      if (mockData.subtitles && mockData.subtitles.length > 0) {
        const subtitlesData = mockData.subtitles.map((s: any) => ({
          id: `${mockData.id}_sub_${s.id}`, // ✨ 完美前缀
          video_id: mockData.id,
          start_time: s.startTime,
          end_time: s.endTime,
          content_en: s.en || s.english || '',
          content_zh: s.zh || s.chinese || '',
        }))
        const { error: subtitlesError } = await supabase.from('subtitles').upsert(subtitlesData)
        if (subtitlesError) throw subtitlesError
      }

      // --- 步骤 C：插入教研词汇信息 (无损更新 + 精准清理) ---
      const vocabularyItems = [
        ...(mockData.vocabularies?.map((v: any) => ({
          id: `${mockData.id}_word_${v.id}`, 
          video_id: mockData.id,
          type: 'word',
          content: v.word || '',
          original_form_in_video: v.original_form_in_video || '', // ✨ 必须加这一行
          pos: v.pos || '',  
          phonetic: v.phonetic || '',
          definition_zh: v.chinese_definition || '',
          synonyms: v.synonyms || '',
          example_en: v.example_from_video || '',
          example_zh: v.example_translation || '',
          first_appearance_time: v.first_appearance_time || 0,
        })) || []),

        ...(mockData.phrases?.map((p: any) => ({
          id: `${mockData.id}_phrase_${p.id}`, 
          video_id: mockData.id,
          type: 'phrase',
          content: p.phrase || '',
          original_form_in_video: p.original_form_in_video || '', // ✨ 必须加这一行
          phonetic: p.phonetic || '',
          definition_zh: p.chinese_definition || '',
          synonyms: p.synonyms || '',
          example_en: p.context || '',
          example_zh: p.context_translation || '',
          first_appearance_time: p.first_appearance_time || 0,
        })) || []),

        ...(mockData.expressions?.map((e: any) => ({
          id: `${mockData.id}_exp_${e.id}`, 
          video_id: mockData.id,
          type: 'expression',
          content: e.expression || '',
          original_form_in_video: e.original_form_in_video || '', // ✨ 从 e.original_form_in_video 获取
          definition_zh: '',
          analysis: e.expression_explanation || '',
          first_appearance_time: e.first_appearance_time || 0,
        })) || [])
      ]

      if (vocabularyItems.length > 0) {
        // 1. 无损更新：直接 Upsert
        const { error: vocabError } = await supabase.from('vocabulary_items').upsert(vocabularyItems)
        if (vocabError) throw vocabError

        // 2. 精准除草：干掉多余的旧数据
        const validVocabIds = vocabularyItems.map(item => item.id)
        
        const { data: existingVocabs } = await supabase
          .from('vocabulary_items')
          .select('id')
          .eq('video_id', mockData.id)

        if (existingVocabs) {
          const ghostIds = existingVocabs
            .map(v => v.id)
            .filter(id => !validVocabIds.includes(id))

          if (ghostIds.length > 0) {
            const { error: deleteError } = await supabase
              .from('vocabulary_items')
              .delete()
              .in('id', ghostIds)
            
            if (deleteError) {
              console.error(`  ❌ [${mockData.id}] 清理废弃词汇失败:`, deleteError)
            } else {
              console.log(`  🧹 [${mockData.id}] 成功清理了 ${ghostIds.length} 条废弃的旧词汇/短语/金句！`)
            }
          }
        }
      }

      if (vocabularyItems.length > 0) {
        const { error: vocabError } = await supabase.from('vocabulary_items').upsert(vocabularyItems)
        if (vocabError) throw vocabError
      }

      console.log(`  ✅ 视频大盘、字幕、教研数据均已成功入库！`)
    }

    console.log('\n🎉 所有本地内容已全部完美同步至 Supabase！')

  } catch (error) {
    console.error('\n❌ 数据迁移在运行中发生中断:', error)
  }
}

// 启动点火
seedDatabase()