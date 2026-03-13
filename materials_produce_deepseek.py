import os
import json
import pysrt
import csv
import math
from openai import OpenAI
from datetime import datetime
# ================= 配置区 =================
API_KEY = "sk-Nz3U2yrzWDvm6kFz0qHOImjGtK2xae6fXG1w49dNEItCZ1Na" 
BASE_URL = "https://crazyrouter.com/v1" # 中转站地址

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)
# ==========================================

def format_duration(seconds):
    """将秒数向上取整，并返回 'x分钟' 格式"""
    # math.ceil 会将 61秒 变为 2分钟，5秒 也变为 1分钟
    minutes = math.ceil(seconds / 60)
    return f"{minutes}分钟"

def load_clips_csv(csv_path):
    """读取 CSV 配置（严格遵循 PM 规定的表头）"""
    clips_info = {}
    if not os.path.exists(csv_path):
        print(f"❌ 找不到配置文件 {csv_path}")
        return clips_info
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # 清理表头可能存在的前后空格，以防万一
            cleaned_row = {k.strip() if isinstance(k, str) else k: v for k, v in row.items()}
            
            clip_id = cleaned_row.get('clip_id', '').strip()
            if clip_id:
                clips_info[clip_id] = {
                    'clip_id': clip_id,
                    'difficulty': str(cleaned_row.get('level', '3')).strip(),
                    'videoUrl': cleaned_row.get('video _url', cleaned_row.get('video_url', '')).strip(),
                    'creator': cleaned_row.get('uploader', '').strip(),
                    'note': cleaned_row.get('note', '').strip(),
                    # ✨ 新增：尝试从 CSV 读 'date' 列，读不到就用今天的日期
                    'publishDate': cleaned_row.get('date', datetime.now().strftime("%Y-%m-%d")).strip(),
                    'original_youtube_url': cleaned_row.get('original_youtube_url', '').strip(),
                }
    return clips_info

def parse_srt_to_array(file_path):
    """解析 SRT 为基础数组"""
    subs = pysrt.open(file_path)
    subtitles = []
    text_for_ai = []
    
    last_end_time = 0.0
    for i, sub in enumerate(subs):
        start_sec = sub.start.ordinal / 1000.0
        end_sec = sub.end.ordinal / 1000.0
        text = sub.text.replace('\n', ' ')
        
        subtitles.append({
            "id": f"s{i+1}",
            "startTime": round(start_sec, 2),
            "endTime": round(end_sec, 2),
            "en": text,
            "zh": "" # 预留给 AI 填空
        })
        text_for_ai.append(f"[{format_duration(start_sec)}] {text}")
        last_end_time = end_sec
        
    return subtitles, " ".join(text_for_ai), last_end_time

# ✨ 核心新增：程序化精准查找第一次出现的时间
def find_exact_time(target_text, subtitles_array):
    if not target_text: return 0.0
    target_lower = target_text.lower().strip()
    for sub in subtitles_array:
        if target_lower in sub["en"].lower():
            return sub["startTime"]
    return 0.0

# ----------------- AI 车间 1：翻译专员 -----------------
# ----------------- AI 车间 1：翻译专员 -----------------
def ai_translate_subtitles(subtitles_array):
    """专门负责精准翻译字幕"""
    mini_subs = [{"id": s["id"], "en": s["en"]} for s in subtitles_array]
    
    prompt = f"""
    角色：教育内容专家翻译（出版标准）
    任务：将文本翻译成自然、流畅且准确的简体中文。

    🎯 语气指导：
    1. 自然且专业：中文应听起来自然地像母语者，但不要使用俚语或过于随意的表达（除非原文使用了俚语）。
    2. 避免“网络流行语”：除非英文明确使用了Z世代俚语，否则不要使用诸如“绝绝子”“咱们就是说”之类的网络用语。
    3. 功能等效：继续以意义为主进行翻译而非逐字翻译（例如“run a business” -> “经营公司”），但保持标准语气。

    ⛔ 严格输出规则（极其重要）：
    1. 必须输出严格的 JSON 对象（Object），绝对不要包含任何额外的解释、问候或 Markdown 标记。
    格式必须完全如下所示：
    {{
      "data": [
        {{"id": "s1", "zh": "中文翻译"}},
        {{"id": "s2", "zh": "中文翻译"}}
      ]
    }}
    2. 仅输出翻译。
    3. 不要使用标题或标注，如“Translation:”或“**中文翻译**”。
    4. 不要添加脚注或解释，如“注：...”或附加说明。
    5. 不要自夸，不要写出类似“我严格遵守了规则”或“以下是自然翻译”的结论。

    待翻译字幕：
    {json.dumps(mini_subs, ensure_ascii=False)}
    """
    
    content = "" # 初始化 content，防止报错时未定义
    try:
        response = client.chat.completions.create(
            # 注意：请确保这里的模型名是你目前测试跑通的名字，比如 deepseek-v3.2
            model="deepseek-v3.2", 
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"} if "deepseek" not in BASE_URL else None,
            temperature=0.1 # 降低温度，让它不要太有创造力（废话少）
        )
        content = response.choices[0].message.content
        
        # 🧹 强力清洗：剥离 AI 可能带上的 Markdown 外壳和首尾空格
        content = content.replace("```json", "").replace("```", "").strip()
        
        res_json = json.loads(content)
        # 兼容处理：返回 data 数组
        return res_json.get("data", []) or res_json.get("subtitles", [])
        
    except Exception as e:
        print(f"翻译字幕解析失败: {e}")
        # 🔍 照妖镜功能：如果再报错，直接把 AI 吐出来的“脏数据”打印在屏幕上
        print(f"⚠️ [Debug] 拦截到的 AI 原始返回内容如下:\n{content}\n")
        return []

# ----------------- AI 车间 2：教研专家 -----------------
# ----------------- AI 车间 2：教研专家 -----------------
# ----------------- AI 车间 2：教研专家 (化整为零升级版) -----------------

def _call_deepseek_json(prompt, step_name):
    """通用的 AI 请求工具，自带强力清洗和照妖镜功能"""
    content = ""
    try:
        response = client.chat.completions.create(
            model="deepseek-v3.2", # 确保使用的是你刚才跑通的模型名
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        content = response.choices[0].message.content
        content = content.replace("```json", "").replace("```", "").strip()
        return json.loads(content)
    except Exception as e:
        print(f"❌ {step_name} 失败: {e}")
        print(f"⚠️ [Debug] {step_name} 拦截到的脏数据:\n{content}\n")
        return {}

def ai_extract_knowledge(text):
    """将庞大的提取任务拆分为 3 个独立的 API 请求，彻底解决超时断网问题"""
    
    base_rules = """
【选词铁血军规】
1. 实用至上：必须是日常口语、职场中高频使用的词汇或短语。
2. 避坑指南：优先挑选中国学生容易理解错、容易写成“中式英语”的内容。
3. 难度适中：不要提取小学生都会的词，聚焦在“看着眼熟但自己说不出口”的词。
4. 宁缺毋滥（最高优先级）：质量永远大于数量！如果字幕极短，或没有足够符合上述标准的词句，请仅提取实际符合的数量（甚至可以是1个）。绝对不要为了凑数而提取无意义的简单词汇或口水话！
⛔ 你必须且只能输出合法的 JSON 对象。绝对不要有任何 Markdown 代码块或开场白废话。
    """

    # --- 任务 1：基础信息与单词 ---
    print("    -> [子车间 2.1] 正在提取 基础信息 与 核心单词 (10-25个)...")
    prompt_vocab = f"""
你是一个资深的英语教研专家。请阅读视频字幕，提取信息和核心单词。
{base_rules}
【JSON 结构要求】
{{
  "title": "用一句话总结视频标题（简体中文，必须控制在12个字以内）",
  "topics": ["标签1", "标签2", "标签3"], #提取2-3个最核心的主题标签（简体中文，最多不超过4字以内）"
  "description": "用1-2句话写一段中文的视频简介",
  "accent": "美音/英音/澳音/综合",
  "vocabularies": [
    {{
      "word": "单词拼写",
      "pos": "词性缩写（如 v., n., adj., adv.，必须包含此字段！）",
      "phonetic": "音标，如 /tɛst/",
      "synonyms": "1-2个纯英文的近义表达(仅输出英文)，逗号隔开",
      "chinese_definition": "中文释义",
      "example_from_video": "视频原句",
      "example_translation": "原句翻译",
      "first_appearance_time": 首次出现的秒数(保留1位小数)
    }}
  ]
}}
【提取数量】：预期目标为 3-10 个。请严格遵守“宁缺毋滥”原则，实际符合多少就提取多少，达不到要求数量完全没关系。
字幕原文：{text}
"""
    data_vocab = _call_deepseek_json(prompt_vocab, "子车间 2.1 (单词)")

    # --- 任务 2：短语提取 ---
    print("    -> [子车间 2.2] 正在提取 核心短语 (10-25个)...")
    prompt_phrases = f"""
你是一个资深的英语教研专家。请阅读视频字幕，专注提取短语搭配。
{base_rules}
【JSON 结构要求】
{{
  "phrases": [
    {{
      "phrase": "短语",
      "phonetic": "音标",
      "synonyms": "1-2个纯英文的近义表达(仅输出英文)，逗号隔开",      
      "chinese_definition": "中文释义",
      "context": "视频原句",
      "context_translation": "原句翻译",
      "first_appearance_time": 秒数
    }}
  ]
}}
【提取数量】：预期目标为 3-10 个。请严格遵守“宁缺毋滥”原则，若视频中没有足够优质的短语搭配，请按实际情况提取，切勿凑数。
字幕原文：{text}
"""
    data_phrases = _call_deepseek_json(prompt_phrases, "子车间 2.2 (短语)")

# --- 任务 3：地道表达与金句 ---
    print("    -> [子车间 2.3] 正在提取 地道表达与金句 (4-10个)...")
    prompt_expressions = f"""
你是一个资深的英语教研专家。请阅读视频字幕，专注提取长难句或地道口语表达。
{base_rules}
【JSON 结构要求】
{{
  "expressions": [
    {{
      "expression": "提取出的地道表达或金句（如：I'd like）",
      "expression_explanation": "请严格使用以下 HTML 模板排版，将内容补充完整后作为字符串返回：\\n<p>📝 <b>字幕原句：</b>[填入包含该表达的视频原句]</p>\\n<p>🇨🇳 <b>中文翻译：</b>[填入原句的自然中文翻译]</p>\\n<p>💡 <b>表达解析：</b><br>[解释该表达的精妙之处、底层逻辑，以及如何避免中式英语]</p>\\n<p>🎯 <b>使用场景：</b><br>[简明扼要说明适用场景，如：非正式至半正式/点餐、购物、服务场所]</p>\\n<p>🔄 <b>相似表达：</b><br>[1-2个纯英文的相似表达，如 I'll have / Can I get]</p>",
      "first_appearance_time": 首次出现的秒数(保留1位小数)
    }}
  ]
}}
【提取数量】：预期目标为 1-7 个。如果没有足够的地道长难句或金句，提取 1-2 个甚至不提取都可以，坚决不要把普通的寒暄废话当作金句！
字幕原文：{text}
"""
    data_expressions = _call_deepseek_json(prompt_expressions, "子车间 2.3 (金句)")

    # --- 数据拼装组装 ---
    if not data_vocab:
        return None # 如果连最基础的标题和单词都失败了，直接重来

    print("    -> 正在将三个子车间的产物无缝组装...")
    final_knowledge = data_vocab
    final_knowledge["phrases"] = data_phrases.get("phrases", []) if data_phrases else []
    final_knowledge["expressions"] = data_expressions.get("expressions", []) if data_expressions else []

    return final_knowledge

# ----------------- 主流水线 -----------------
def process_folder(folder_path, clips_csv_data):
    folder_name = os.path.basename(folder_path)
    cf_base_url = "https://cdn.spoken-eng-planet.com" # 🌟 填入你专属的 Cloudflare R2 前缀 (不要带末尾的斜杠 /)
    # 【核心修改】：寻找以 clip_id_ 开头的文件夹进行匹配
    csv_info = None
    for cid, info in clips_csv_data.items():
        if folder_name.startswith(f"{cid}_"):
            csv_info = info
            break
            
    if not csv_info:
        # 如果在主循环中已经过滤过，这里其实不会触发，但作为安全检查保留
        print(f"⏭️  跳过 '{folder_name}'：无法在 CSV 中匹配到对应的 clip_id")
        return
        
    pure_clip_id = csv_info['clip_id']
    
    srt_files = [f for f in os.listdir(folder_path) if f.endswith('.srt')]
    if not srt_files: 
        print(f"⚠️  跳过 '{folder_name}'：找不到 .srt 文件")
        return
    
    print(f"\n🚀 开始处理: {folder_name} (提取纯ID: {pure_clip_id})")
    
    # 1. 解析基础数据
    print("  -> 解析物理 SRT...")
    subtitles, text_for_ai, duration_sec = parse_srt_to_array(os.path.join(folder_path, srt_files[0]))
    
    # 2. 调度车间 1：翻译
    print("  -> [AI 车间 1] 正在逐句翻译字幕...")
    translated_subs = ai_translate_subtitles(subtitles)
    if translated_subs:
        trans_dict = {item["id"]: item.get("zh", "") for item in translated_subs if "id" in item}
        for sub in subtitles:
            if sub["id"] in trans_dict:
                sub["zh"] = trans_dict[sub["id"]]
    
    # 3. 调度车间 2：知识提取
    print("  -> [AI 车间 2] 正在执行军规提取教研内容...")
    ai_data = ai_extract_knowledge(text_for_ai)
    if not ai_data: return
    
    # 分配 ID
# ✨ 核心修复：在这里统一补齐精准的时间戳，并分配 ID
    for i, item in enumerate(ai_data.get("vocabularies", [])): 
        item["id"] = f"v{i+1}"
        item["first_appearance_time"] = find_exact_time(item.get("word", ""), subtitles)
        
    for i, item in enumerate(ai_data.get("phrases", [])): 
        item["id"] = f"p{i+1}"
        item["first_appearance_time"] = find_exact_time(item.get("phrase", ""), subtitles)
        
    for i, item in enumerate(ai_data.get("expressions", [])): 
        item["id"] = f"e{i+1}"
        item["first_appearance_time"] = find_exact_time(item.get("expression", ""), subtitles)
        
    # 4. 组装终极数据
    print("  -> 正在融合 CSV 与 AI 数据...")
    final_data = {
        "id": pure_clip_id, # 🌟 保持数据库主键干净
        "title": ai_data.get("title", ""),
        "topics": ai_data.get("topics", ""),
        "creator": csv_info['creator'],
        "publishDate": csv_info['publishDate'], 
        "accent": ai_data.get("accent", "美音"),
        "duration": format_duration(duration_sec),
        "difficulty": csv_info['difficulty'],
        "description": ai_data.get("description", ""),
        "coverUrl": f"{cf_base_url}/{folder_name}/cover.jpg",
        "videoUrl": f"{cf_base_url}/{folder_name}/video.mp4",
        "original_youtube_url": csv_info.get('original_youtube_url', ''),
        "subtitles": subtitles,
        "vocabularies": ai_data.get("vocabularies", []),
        "phrases": ai_data.get("phrases", []),
        "expressions": ai_data.get("expressions", [])
    }
    
    with open(os.path.join(folder_path, 'data.json'), 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    print(f"  ✅ {folder_name} 生产完毕！")

def main():
    print("\n" + "="*30)
    print("🔍 启动深度诊断模式...")
    print("="*30)
    
    # 1. 检查当前运行路径
    current_work_dir = os.getcwd()
    print(f"📍 当前脚本运行路径: {current_work_dir}")

    base_dir = "public/content"
    csv_file_path = "clips.csv"
    
    # 2. 检查 public/content 目录
    if not os.path.exists(base_dir):
        print(f"❌ 找不到目录: {os.path.abspath(base_dir)}")
        print("💡 请确认你在项目根目录下运行脚本，或者检查文件夹拼写。")
        return
    
    all_folders = [item for item in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, item))]
    print(f"📂 在 {base_dir} 下找到了 {len(all_folders)} 个子文件夹")

    # 3. 加载 CSV 并汇报内容
    print(f"📖 正在尝试读取: {os.path.abspath(csv_file_path)}")
    clips_csv_data = load_clips_csv(csv_file_path)
    
    if not clips_csv_data:
        print("❌ CSV 数据为空！请检查 clips.csv 是否有内容，或者列名是否为 'clip_id'。")
        return
    
    print(f"✅ CSV 加载成功，包含以下 ID: {list(clips_csv_data.keys())[:10]}... (仅显示前10个)")

    # 4. 匹配逻辑诊断（更新为前缀匹配）
    print("\n--- 开始匹配检查 ---")
    processed_count = 0
    for folder_name in all_folders:
        matched_cid = None
        # 拿着 CSV 里的 ID 去匹配文件夹名
        for cid in clips_csv_data.keys():
            if folder_name.startswith(f"{cid}_"):
                matched_cid = cid
                break
                
        if matched_cid:
            print(f"✨ 匹配成功! 准备处理: {folder_name} (对应 ID: {matched_cid})")
            process_folder(os.path.join(base_dir, folder_name), clips_csv_data)
            processed_count += 1
        else:
            print(f"⏭️  跳过: '{folder_name}' (原因: 未能找到对应的 clip_id)")

    print(f"\n✅ 诊断结束。本次共尝试处理了 {processed_count} 个文件夹。")

if __name__ == "__main__":
    main()