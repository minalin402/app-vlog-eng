import os
import json
import pysrt
import csv
import math
import re  # ✨ 新增：引入正则表达式库，用于精准时间戳匹配
from openai import OpenAI
from datetime import datetime

# ================= 配置区 =================
API_KEY = "sk-Nz3U2yrzWDvm6kFz0qHOImjGtK2xae6fXG1w49dNEItCZ1Na" 
BASE_URL = "https://crazyrouter.com/v1" # 中转站地址

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)
# ==========================================

def format_duration(seconds):
    """将秒数向上取整，并返回 'x分钟' 格式"""
    minutes = math.ceil(seconds / 60)
    return f"{minutes}分钟"

def load_clips_csv(csv_path):
    """读取 CSV 配置"""
    clips_info = {}
    if not os.path.exists(csv_path):
        print(f"❌ 找不到配置文件 {csv_path}")
        return clips_info
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cleaned_row = {k.strip() if isinstance(k, str) else k: v for k, v in row.items()}
            clip_id = cleaned_row.get('clip_id', '').strip()
            if clip_id:
                clips_info[clip_id] = {
                    'clip_id': clip_id,
                    'difficulty': str(cleaned_row.get('level', '3')).strip(),
                    'videoUrl': cleaned_row.get('video _url', cleaned_row.get('video_url', '')).strip(),
                    'creator': cleaned_row.get('uploader', '').strip(),
                    'note': cleaned_row.get('note', '').strip(),
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

# ✨ 核心重构：程序化精准查找第一次出现的时间（三级降级匹配）
# ✨ 核心重构：支持跨行字幕拼接的终极雷达
# ✨ 核心重构：彻底解决时间戳漂移和 0.0 的终极雷达
def find_exact_time(target_text, subtitles_array, context_text=""):
    if not target_text: return 0.0
    
    target_lower = target_text.lower().strip()
    escaped_target = re.escape(target_lower)
    pattern = rf"\b{escaped_target}\b"
    
    # --- 级别 1：全部单行精准匹配 ---
    # 🚨 必须先查完所有的单行！防止双行拼接时提前抢占了上一行的时间戳
    for sub in subtitles_array:
        if re.search(pattern, sub["en"].lower()):
            return sub["startTime"]
            
    # --- 级别 1.5：跨行滑动窗口匹配 (专治跨行短语) ---
    # 如果单行全军覆没，且是个短语（包含空格），我们才拼接相邻两行进行查找
    if " " in target_lower:
        for i in range(len(subtitles_array) - 1):
            combined_sub = subtitles_array[i]["en"].lower() + " " + subtitles_array[i+1]["en"].lower()
            if re.search(pattern, combined_sub):
                return subtitles_array[i]["startTime"]

    # --- 级别 2：利用 Context 原句宽泛兜底 ---
    if context_text:
        clean_context = re.sub(r'[^\w\s]', '', context_text.lower().strip())
        for sub in subtitles_array:
            clean_sub = re.sub(r'[^\w\s]', '', sub["en"].lower())
            if len(clean_sub) > 5 and (clean_sub in clean_context or clean_context in clean_sub):
                return sub["startTime"]

    # --- 级别 3：基础降级匹配 ---
    if len(target_lower) > 3: 
        for sub in subtitles_array:
            if target_lower in sub["en"].lower():
                return sub["startTime"]
                
    return 0.0

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
    1. 必须输出严格的 JSON 对象（Object），绝对不要包含任何额外的解释或 Markdown 标记。
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
        print(f"❌ 翻译字幕解析失败: {e}")
        print(f"⚠️ [Debug] 拦截到的 AI 原始返回内容如下:\n{content}\n")
        return []

# ----------------- AI 车间 2：教研专家 (化整为零+串行黑名单) -----------------
def _call_deepseek_json(prompt, step_name):
    """通用的 AI 请求工具，自带强力清洗和照妖镜功能"""
    content = ""
    try:
        response = client.chat.completions.create(
            model="deepseek-v3.2", 
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

def ai_extract_knowledge(text, creator_name="这位博主"):
    """采用串行架构 + 动态黑名单 + 数据视图剥离"""
    
    # ✨ 新增：提取博主的名（First Name），并将首字母大写（如 "jenn im" -> "Jenn"）
    first_name = creator_name.split()[0] if creator_name and creator_name != "这位博主" else "这位博主"
    if first_name != "这位博主":
        first_name = first_name.capitalize()

    base_rules = """
【选词铁血军规】
1. 实用至上：必须是日常口语、职场中高频使用的词汇或表达。
2. 避坑指南：优先挑选中国学生容易理解错、容易写成“中式英语”的内容。
3. 难度适中：不要提取小学生都会的词，聚焦在“看着眼熟但自己说不出口”的词。
4. 宁缺毋滥（最高优先级）：质量永远大于数量！如果字幕极短，或没有足够符合上述标准的词句，请仅提取实际符合的数量（甚至可以是1个）。绝对不要为了凑数而提取无意义的简单词汇或口水话！

⛔ 严格格式：必须且只能输出合法的 JSON 对象。绝对不要有任何 Markdown 代码块、开头或结尾的废话。
    """

    # ==========================================
    # --- 任务 2.1：基础信息与单词 ---
    # ==========================================
    print("    -> [子车间 2.1] 正在提取 基础信息 与 核心单词...")
    prompt_vocab = f"""
你是一个资深的英语教研专家。请阅读视频字幕，提取视频基础信息和核心单词。
{base_rules}
【单词提取严格边界约束】
1. 纯粹的单词：提取的 `word` 必须是单个英文单词，绝对不能包含空格。如果有空格（如 give up），请不要在这里提取。
2. 原型提取：请尽量还原为单词的原始形态（如将 running 还原为 run）。
3. 原文形态留存（极其重要）：请在 `original_form_in_video` 字段中，原封不动地填入该单词在视频字幕中实际出现的形态（比如字幕里是 running，这里就填 running）。这对于前端高亮匹配至关重要！
4. 提取数量：预期目标为 3-10 个。请严格遵守“宁缺毋滥”原则，实际符合多少就提取多少，达不到要求数量完全没关系。
5. 近义词扩展：`synonyms` 字段请务必提供 1-2 个纯英文近义词，用逗号隔开。
6. 简介文风（极其重要）：简介必须自然、流畅、有吸引力，像人类编辑写的一样。
   ⛔ 绝对不要使用“视频中”、“作者分享了”这种生硬口吻，也【绝不要使用博主全名】！
   ✅ 请直接使用博主的亲切称呼“{first_name}”作为主语。如：“{first_name} 分享了她...” 或 “跟着 {first_name} 看看...”。
7. 🚨 标题文风（极其重要）：标题（title）必须精炼（12字内），且【绝对不能包含博主的名字】！请直接总结视频的核心内容。
   ❌ 错误示范：{first_name}的年末反思与行动 / {first_name}的搬迁计划
   ✅ 正确示范：年末反思与行动 / 搬迁与未来计划

【指定话题池】
日常生活, 美食探店, 时尚穿搭, 运动健康, 科技数码, 个人成长, 职场工作, 校园学习, 城市旅行, 自然风光, 文化体验, 观点表达, 人生感悟, 社会观察, 人际交往, 娱乐影视
【JSON 结构要求】
{{
  "title": "一句话总结标题（12字内）",
  "topics": ["标签1", "标签2"], // ⛔️ 极其重要：必须且只能从【指定话题池】中挑选 1-2 个最贴合的标签。如果完全没有合适的，请输出 ["其他"]。
  "description": "1-2句话中文简介，需要用博主作主语，如：jenn分享了她年底自我反思的全过程，带你通过小步行动去接近那些看似遥不可及的目标，并重新找回对生活的热情。",
  "accent": "美音",
  "vocabularies": [
{{
      "word": "单词，需要保留原型，如：dishearten",
      "original_form_in_video": "原文，例如disheartening",
      "pos": "词性缩写（如： v., n., adj., adv.，必须包含此字段！）",
      "phonetic": "音标，如：/dɪsˈhɑːrtnɪŋ/",
      "synonyms": "1-2个纯英文的近义表达(仅输出英文)，逗号隔开，如：discouraging, depressing",
      "chinese_definition": "中文释义，如：令人沮丧的",
      "example_from_video": "视频原句，如：watching other creators can be disheartening.",
      "example_translation": "原句翻译，如：看着其他创作者的内容可能会让人感到沮丧。"
    }}
  ]
}}



字幕原文：{text}
"""
    data_vocab = _call_deepseek_json(prompt_vocab, "子车间 2.1 (单词)")
    if not data_vocab:
        return None 

    # 提取单词列表作为黑名单
    extracted_words = [v.get("word", "") for v in data_vocab.get("vocabularies", [])]
    words_blacklist_str = ", ".join(extracted_words) if extracted_words else "无"


    # ==========================================
    # --- 任务 2.2：短语提取 ---
    # ==========================================
    print("    -> [子车间 2.2] 正在提取 核心短语...")
    prompt_phrases = f"""
你是一个资深的英语教研专家。请阅读视频字幕，专注提取短语搭配。
{base_rules}
【短语提取严格边界约束】
1. 必须包含空格：提取的 `phrase` 必须包含至少两个单词。绝对不要提取单个单词！
2. 排除基础动宾：聚焦固定搭配（如 "out of reach"），排除毫无特殊含义的普通动宾组合。
3. 适度泛化：`phrase` 字段必须提取出短语的原型。对于有介词强绑定的搭配使用 sb./sth.，但对于纯动词短语（如 fill out），直接提取 fill out 即可，绝不要画蛇添足加上 sth.。
   ✅ 例子：原文 "following you around" -> 提取为 `follow sb. around`
   ✅ 例子：原文 "wrapped his head around the idea" -> 提取为 `wrap one's head around sth.`
   ✅ 例子：原文 "is on fire" -> 提取为 `be on fire`
4. 原文形态留存但要极其精简（极其重要）：请在 `original_form_in_video` 字段中填入该短语在视频字幕中实际出现的完整形态（例如：following you around），但只能保留最核心的几个词（一般2-6个），绝不准抄写多余的宾语！（这对于前端高亮匹配至关重要！）
    ✅ 必须这样做：原文 "fill out my self-reflection journal" -> 只能提取 `fill out`。
    ❌ 绝不能这样做：提取 "fill out my self-reflection journal"（这会导致前端满屏都是高亮）
5. 提取数量：预期目标为 3-10 个。请严格遵守“宁缺毋滥”原则，若视频中没有足够优质的短语搭配，请按实际情况提取，切勿凑数。
6. 近义词扩展：`synonyms` 字段请务必提供 1-2 个纯英文近义表达，用逗号隔开。
7. 【排他黑名单】：以下单词已在上一环节提取，请勿将它们或者直接包含它们的简单组合作为短语提取：[{words_blacklist_str}]。

【JSON 结构要求】
{{
  "phrases": [
    {{
      "phrase": "短语，如：follow sb. around",
      "original_form_in_video": "原文，如：following you around",
      "phonetic": "音标，如：/ˈfɑːloʊ sb. əˈraʊnd/",
      "synonyms": "1-2个纯英文的近义表达(仅输出英文)，逗号隔开，如：tail, shadow",
      "chinese_definition": "中文释义，如：到处跟着某人",
      "context": "视频原句，如：they are always following you around",
      "context_translation": "原句翻译，如：他们总是到处跟着你"
    }}
  ]
}}

字幕原文：{text}
"""
    data_phrases = _call_deepseek_json(prompt_phrases, "子车间 2.2 (短语)")
    
    # 追加短语列表到黑名单
    extracted_phrases = [p.get("phrase", "") for p in data_phrases.get("phrases", [])] if data_phrases else []
    phrases_blacklist_str = ", ".join(extracted_phrases) if extracted_phrases else "无"


    # ==========================================
    # --- 任务 2.3：地道表达与金句 ---
    # ==========================================
    print("    -> [子车间 2.3] 正在提取 地道表达与金句...")
    prompt_expressions = f"""
你是一个资深的英语口语教研专家。请阅读视频字幕，提取高复用性的【地道表达】。
{base_rules}
【地道表达严格边界约束】
1. 核心分类（必须符合以下三类之一）：
   - 🅰️ 半固定句式 (Sentence Stems)：像公式一样可以替换词汇的框架。如 `Time to do sth.` / `Let's move on to...` / `be craving sth.`
   - 🅱️ 高频交际响应 (Conversational Responses)：母语者常用来接话、表达态度或填补空白的整句。如 `I can relate to that.` / `how do I say this` / `Fair enough.`
   - 🅲 场景功能句 (Situational Sentences)：在特定生活场景（如旅行、点餐、酒店、职场）中极具实用价值的完整句子。如 `Can I check my bag in early?` / `Is breakfast included?`
2. 泛化提取（极其重要）：如果是 🅰️ 类半固定句式，请务必将其泛化（使用 sth./sb./do sth.）。如果是 🅱️ 或 🅲 类，则保留其完整自然句式。
3. 拒绝超长原句（极其重要）：绝不要把一整句几十个词的长难句当成表达提取！你必须提炼出里面的“核心功能骨架”。
   ❌ 错误例子："It's not that you can't have it. It's just that you actually want other things more."（太长，高亮灾难！）
   ✅ 正确提炼：提取为 `It's not that... It's just that...`。并且 `original_form_in_video` 只能截取最前面的触发词 `It's not that` 或 `It's just that`。
4. 原文切片留存但极简（极其重要）：`original_form_in_video` 必须只提取原文中代表该表达的【核心连续短切片】（通常 2-7 个词）。绝对不能把整句长句子抄下来！如果原句特别长，只保留触发该表达的最核心部分（例如原句是 "I'd like to get to a place where I'm really enjoying..."，这里只填 "get to a place where"）。
5. 提取数量：预期目标为 1-7 个。如果没有足够的地道长难句或金句，提取 1-2 个甚至不提取都可以，坚决不要把普通的寒暄废话当作金句！
6. 【排他黑名单】：以下单词和短语已在前面环节提取，绝不允许重复出现在本环节： {phrases_blacklist_str}。
7. 【重点】HTML 排版规则：`expression_explanation` 字段必须严格使用下方示例中的 HTML 模板！特别是“💡 表达解析”部分，必须严谨地分为【1) 结构解析】（介绍公式或功能）和【2) 举一反三】（包含2个带中文翻译的例句）。并且使用场景必须简明扼要，控制在 20 字以内。相似表达请务必提供 1-2 个纯英文相似表达，用逗号隔开。


【JSON 结构要求】（严格参考此示例的精简文风和排版）
{{
  "expressions": [
    {{
      "expression": "地道表达，如：be craving sth. for sth.",
      "original_form_in_video": "原句形式：I'm craving this for dinner",
      "expression_explanation": "<p>📝 <b>字幕原句：</b>and I was like, I'm craving this for dinner.</p>\\n<p>🇨🇳 <b>中文翻译：</b>我当时就想，我晚饭就想吃这个。</p>\\n<p>💡 <b>表达解析：</b><br>1) 结构解析<br>公式：be craving + 食物/东西<br>功能：表示当下非常想吃、很想来点某样东西。比 I want 更有“馋到了”的身体感，特别适合说宵夜、天气、路过餐厅时突然被勾起的食欲，口语里很自然。<br><br>2) 举一反三<br>例1：I'm craving noodles tonight.（我今晚特别想吃面。）<br>例2：例2：She's been craving spicy soup all day.（她一整天都特别想喝辣汤。）</p>\\n<p>🎯 <b>使用场景：</b><br>突然被某种食物勾起食欲时。</p>\\n<p>🔄 <b>相似表达：</b><br>really feel like / be in the mood for</p>"
    }}
  ]
}}

字幕原文：{text}
"""
    data_expressions = _call_deepseek_json(prompt_expressions, "子车间 2.3 (金句)")

    # ==========================================
    # --- 数据拼装与 HTML 渲染 ---
    # ==========================================
    print("    -> 正在组装最终数据并渲染卡片 HTML...")
    final_knowledge = data_vocab
    final_knowledge["phrases"] = data_phrases.get("phrases", []) if data_phrases else []
    
    raw_expressions = data_expressions.get("expressions", []) if data_expressions else []
    formatted_expressions = []
    
    for item in raw_expressions:
        # ✨ 直接使用 AI 输出的精美 HTML，并保留 original_form_in_video
        formatted_expressions.append({
            "expression": item.get("expression", ""),
            "original_form_in_video": item.get("original_form_in_video", ""),
            "expression_explanation": item.get("expression_explanation", "")
        })
        
    final_knowledge["expressions"] = formatted_expressions

    return final_knowledge

# ----------------- 主流水线 -----------------
def process_folder(folder_path, clips_csv_data):
    folder_name = os.path.basename(folder_path)
    cf_base_url = "https://cdn.spoken-eng-planet.com" 
    
    csv_info = None
    for cid, info in clips_csv_data.items():
        if folder_name.startswith(f"{cid}_"):
            csv_info = info
            break
            
    if not csv_info:
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
    
    # ✨✨✨ 修改这里 ✨✨✨
    # 从 csv_info 里安全地提取博主名字，传给 AI 函数
    creator_name = csv_info.get('creator', '这位博主') 
    ai_data = ai_extract_knowledge(text_for_ai, creator_name)
    
    if not ai_data: return
    
    # ✨ 核心修复：补齐精准时间戳，传入上下文兜底
    # ✨ 核心修复：单词、短语、金句统一使用 original_form_in_video 寻找时间戳！
    for i, item in enumerate(ai_data.get("vocabularies", [])): 
        item["id"] = f"v{i+1}"
        search_target = item.get("original_form_in_video", "") or item.get("word", "")
        item["first_appearance_time"] = find_exact_time(search_target, subtitles, item.get("example_from_video", ""))
        
    for i, item in enumerate(ai_data.get("phrases", [])): 
        item["id"] = f"p{i+1}"
        search_target = item.get("original_form_in_video", "") or item.get("phrase", "")
        item["first_appearance_time"] = find_exact_time(search_target, subtitles, item.get("context", ""))
        
    for i, item in enumerate(ai_data.get("expressions", [])): 
        item["id"] = f"e{i+1}"
        search_target = item.get("original_form_in_video", "") or item.get("expression", "")
        item["first_appearance_time"] = find_exact_time(search_target, subtitles, item.get("expression_explanation", ""))
    # 4. 组装终极数据
    print("  -> 正在融合 CSV 与 AI 数据...")
    final_data = {
        "id": pure_clip_id,
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
    
    current_work_dir = os.getcwd()
    print(f"📍 当前脚本运行路径: {current_work_dir}")

    base_dir = "public/content"
    csv_file_path = "clips.csv"
    
    if not os.path.exists(base_dir):
        print(f"❌ 找不到目录: {os.path.abspath(base_dir)}")
        print("💡 请确认你在项目根目录下运行脚本，或者检查文件夹拼写。")
        return
    
    all_folders = [item for item in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, item))]
    print(f"📂 在 {base_dir} 下找到了 {len(all_folders)} 个子文件夹")

    print(f"📖 正在尝试读取: {os.path.abspath(csv_file_path)}")
    clips_csv_data = load_clips_csv(csv_file_path)
    
    if not clips_csv_data:
        print("❌ CSV 数据为空！请检查 clips.csv 是否有内容，或者列名是否为 'clip_id'。")
        return
    
    print(f"✅ CSV 加载成功，包含以下 ID: {list(clips_csv_data.keys())[:10]}... (仅显示前10个)")

    print("\n--- 开始匹配检查 ---")
    processed_count = 0
    for folder_name in all_folders:
        matched_cid = None
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