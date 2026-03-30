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
    // 3. 扫描本地真实物理文件
    const contentDir = path.resolve(process.cwd(), 'public/content')
    if (!fs.existsSync(contentDir)) {
      console.log('❌ 找不到 public/content 目录，请先运行 Python 生产数据')
      return
    }

    // ==========================================
    // 🔧 测试/全量 模式切换开关
    // ==========================================
    // 填写你今晚要紧急修复并测试的视频名单
    const TEST_FOLDERS =  [
  "A115_Noa_Maria", "A198_sydney_serena", "A205_Steph_Bohrer", "A202_Loepsie", 
  "A091_pearlieee", "A023_Birta_Hlin", "A131_sarah_pan", "A176_Zeliha_Akpinar", 
  "A135_sarah_pan", "A173_emmaxolouise", "A112_Noa_Maria", "A179_Zeliha_Akpinar", 
  "A209_Nil_Sani", "A169_Lydia_Violeta", "A195_sydney_serena", "A123_Life_Of_Riza", 
  "A133_sarah_pan", "A134_sarah_pan", "A180_Zeliha_Akpinar", "A032_Annika", 
  "A013_Sydney_Serena", "A177_Zeliha_Akpinar", "A132_sarah_pan", "A124_Life_Of_Riza", 
  "A082_Ali_Abdaal", "A147_michelle_Choi", "A184_Maddie_Borge", "A185_Maddie_Borge", 
  "A182_Maddie_Borge", "A010_Sydney_Serena", "A088_Hailey_Rhode_Bieber", "A121_alia_zaita", 
  "A086_Hailey_Rhode_Bieber", "A113_Noa_Maria", "A130_Life_Of_Riza", "A181_Zeliha_Akpinar", 
  "A201_Loepsie", "A197_sydney_serena", "A206_Steph_Bohrer", "A203_Loepsie", 
  "A178_Zeliha_Akpinar", "A210_Nil_Sani", "A191_Maddie_Borge", "A006_jenn_im", 
  "A011_Sydney_Serena", "A012_Sydney_Serena", "A014_Sydney_Serena", "A015_Sydney_Serena", 
  "A035_Sydney_Serena", "A038_michelle_Choi", "A046_jenn_im", "A055_Claudia_Sulewski", 
  "A056_Claudia_Sulewski", "A062_Taylor_Bell", "A065_Taylor_Bell", "A066_Amanda_Ekstrand", 
  "A067_Amanda_Ekstrand", "A068_Amanda_Ekstrand", "A070_Amanda_Ekstrand", "A073_Amanda_Ekstrand", 
  "A074_Amanda_Ekstrand", "A075_Allison_Anderson", "A076_Allison_Anderson", "A077_Allison_Anderson", 
  "A078_Allison_Anderson", "A092_pearlieee", "A093_pearlieee", "A119_Kelly_Kim", 
  "A120_Kelly_Kim", "A127_Life_Of_Riza", "A138_sarah_pan", "A139_julia_fei", 
  "A140_julia_fei", "A142_julia_fei", "A143_julia_fei", "A144_julia_fei", 
  "A145_Chloe_Shih", "A146_michelle_Choi", "A158_Eve_Bennett", "A159_Eve_Bennett", 
  "A160_Eve_Bennett", "A161_Eve_Bennett", "A164_Lydia_Violeta", "A166_Lydia_Violeta", 
  "A168_Lydia_Violeta", "A170_Lydia_Violeta", "A171_Lydia_Violeta", "A172_Lydia_Violeta", 
  "A186_Maddie_Borge", "A190_Maddie_Borge", "A126_Life_Of_Riza", "A137_sarah_pan", 
  "A165_Lydia_Violeta", "A136_sarah_pan", "A110_Noa_Maria", "A107_Noa_Maria"
]
    // 💡 开关在这里：true = 只跑测试名单，false = 自动扫描目录下所有视频全量同步
    const IS_TEST_MODE = true 

    let folders: string[] = []
    if (IS_TEST_MODE) {
      folders = TEST_FOLDERS
    } else {
      // 全量模式：自动读取目录下所有 A 开头的视频文件夹
      folders = fs.readdirSync(contentDir).filter(f => 
        f.startsWith('A') && fs.statSync(path.join(contentDir, f)).isDirectory()
      )
    }

    console.log(`📂 当前为 ${IS_TEST_MODE ? '【测试模式】' : '【全量模式】'}，准备开始同步 ${folders.length} 个视频文件夹...`)

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
          original_youtube_url: mockData.original_youtube_url, 
          created_at: mockData.publishDate ? new Date(mockData.publishDate).toISOString() : new Date().toISOString()
        })

      if (videoError) throw videoError

      // ==========================================
      // 🚀 步骤 B：插入字幕信息 (先全量删除，再干净插入)
      // ==========================================
      
      // 1. 先删光当前视频在数据库里的所有旧字幕，彻底消灭“幽灵尾巴”
      const { error: deleteSubError } = await supabase
        .from('subtitles')
        .delete()
        .eq('video_id', mockData.id)

      if (deleteSubError) {
         console.error(`  ❌ [${mockData.id}] 删除旧字幕失败:`, deleteSubError)
         throw deleteSubError
      }

      // 2. 插入最新的一整套字幕
      if (mockData.subtitles && mockData.subtitles.length > 0) {
        const subtitlesData = mockData.subtitles.map((s: any) => ({
          id: `${mockData.id}_sub_${s.id}`, // ✨ 完美前缀
          video_id: mockData.id,
          start_time: s.startTime,
          end_time: s.endTime,
          content_en: s.en || s.english || '',
          content_zh: s.zh || s.chinese || '',
        }))
        const { error: insertSubError } = await supabase.from('subtitles').insert(subtitlesData)
        if (insertSubError) throw insertSubError
        console.log(`  ✅ [${mockData.id}] 成功重置并插入 ${subtitlesData.length} 条字幕`)
      }

      // ==========================================
      // 🛡️ 步骤 C：插入教研词汇信息 (无损 Upsert + 精准清理)
      // ==========================================
      const vocabularyItems = [
        ...(mockData.vocabularies?.map((v: any) => ({
          id: `${mockData.id}_word_${v.id}`, 
          video_id: mockData.id,
          type: 'word',
          content: v.word || '',
          original_form_in_video: v.original_form_in_video || '', 
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
          original_form_in_video: p.original_form_in_video || '', 
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
          original_form_in_video: e.original_form_in_video || '', 
          definition_zh: '',
          analysis: e.expression_explanation || '',
          first_appearance_time: e.first_appearance_time || 0,
        })) || [])
      ]

      if (vocabularyItems.length > 0) {
        // 1. 无损更新：直接 Upsert，用户的收藏状态完全不受影响！
        const { error: vocabError } = await supabase.from('vocabulary_items').upsert(vocabularyItems)
        if (vocabError) throw vocabError

        // 2. 精准除草：找出被 AI 淘汰的旧知识点 ID 并删除
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

      console.log(`  🎉 视频大盘、字幕、教研数据均已成功入库！`)
    }

    console.log('\n🎉 所有本地内容已全部完美同步至 Supabase！')

  } catch (error) {
    console.error('\n❌ 数据迁移在运行中发生中断:', error)
  }
}

// 启动点火
seedDatabase()