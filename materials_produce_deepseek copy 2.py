import os
import json
import pysrt
import csv
import math
import re  # ✨ 新增：引入正则表达式库，用于精准时间戳匹配
from openai import OpenAI
from datetime import datetime
import time # ✨ 确保文件顶部有 import time

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


def call_deepseek_with_retry(messages, response_format=None, temperature=0.2):
    max_retries = 5
    retry_delay = 5
    
    for i in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="deepseek-v3.2", 
                messages=messages,
                response_format=response_format,
                temperature=temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            err_msg = str(e)
            if "429" in err_msg or "rate limit" in err_msg.lower():
                print(f"⚠️  DeepSeek 拥挤 (429)，第 {i+1} 次重试，等待 {retry_delay} 秒...")
                time.sleep(retry_delay)
                retry_delay *= 2 
            else:
                print(f"❌ API 致命错误: {e}")
                return None
    return None

# ----------------- AI 车间 1：翻译专员 -----------------
# ----------------- AI 车间 1：字幕重构与翻译专员 -----------------
def ai_rebuild_and_translate_subtitles(subtitles_array):
    """【革命性升级】不仅翻译，还能将无标点的破碎字幕按语义缝合成完整句子，并重算时间戳"""
    mini_subs = [{"id": s["id"], "text": s["en"]} for s in subtitles_array]
    
    prompt = f"""
    角色：资深英语教研员与专业字幕编辑。
    
    【核心任务】
    用户提供的字幕是机器识别的碎片，缺乏标点和大小写，且经常把一个完整的句子拦腰截断。
    请你将这些碎片按“完整的语法语义”和“适合英语学习者跟读的长度”进行合并，添加正确的标点，并提供自然流畅的中文翻译。
    
    【严格规则】
    1. 标点恢复：必须在英文 `en` 字段中补全正确的逗号、句号、问号等，并修正大小写。
    2. 绝不遗漏：必须包含传入的所有碎片内容，不能随意删减、修改原词。
    3. 断句要求
        【🚨 致命红线：绝对不允许的断句方式 🚨】
        大语言模型在合并长文本时容易犯错，请你必须遵守以下“强制意群边界法则”：
        1)严禁主谓分离：绝对不能在主语和谓语之间断开。
        2)严禁切断介词短语/动词短语：绝对不能以 in, on, at, of, with 等介词结尾。
        3) 严禁以冠词或连词结尾：绝对不能以 a, the, and, but, or, because, so 等词结尾。
        4) 严禁以助动词/系动词结尾：绝对不能以 is, are, have, has, been 等结尾。

        【✅ 推荐的断句位置（意群交接处）】
        如果一个句子过长（超过12个词），请优先在以下位置断开：
        1) 标点符号处（逗号、句号、问号）。
        2) 并列连词前（在 and, but, or 之前断开，让连词作为下一句的开头）。
        3) 从句引导词前（在 that, which, who, where, because, when, if, although 之前断开）。
        4) 较长的状语短语前或后。

        【Few-Shot 示例对比】
        🔴 Bad Case (机器乱断的，绝对禁止)：
        {{
        "data": [
            {{ "merged_ids": ["s1"], "en": "I have just been getting some work done, answering some emails, finishing up a video, and I've", "zh": "我刚才一直在处理一些工作，回复一些邮件，完成一个视频，而且我还" }},
            {{ "merged_ids": ["s2"], "en": "also been planning the week ahead because today is Friday", "zh": "在规划接下来的一周，因为今天是星期五" }}
        ]
        }}
        🟢 Good Case (基于意群的完美断句)：
        {{
        "data": [
            {{ "merged_ids": ["s1"], "en": "I have just been getting some work done, answering some emails, finishing up a video,", "zh": "我刚才一直在处理一些工作，回复一些邮件，完成一个视频，" }},
            {{ "merged_ids": ["s2"], "en": "and I've also been planning the week ahead", "zh": "并且我也在规划接下来的一周，" }},
            {{ "merged_ids": ["s3"], "en": "because today is Friday.", "zh": "因为今天是星期五。" }}
        ]
        }}
    4.防止重复结语：严格按照提供的原始碎片进行翻译。在处理完最后一个碎片后，立即停止输出。绝对不要在最后自行添加任何总结性或重复性的废话。
    
    
    【语气指导】
    1. 自然且专业：中文应听起来自然地像母语者，但不要使用俚语或过于随意的表达（除非原文使用了俚语）。
    2. 避免“网络流行语”：除非英文明确使用了Z世代俚语，否则不要使用诸如“绝绝子”“咱们就是说”之类的网络用语。
    3. 功能等效：继续以意义为主进行翻译而非逐字翻译（例如“run a business” -> “经营公司”），但保持标准语气。
    4. 翻译：在 `zh` 字段给出自然流畅的中文翻译。

    ⛔ 严格格式：只输出合法 JSON，格式必须如下：
    {{
      "data": [
        {{
          "merged_ids": ["s1", "s2"], // 包含被合并碎片的 ID 数组
          "en": "All right guys, here is what we're making today.", // 缝合后加好标点大小写的英文
          "zh": "好了各位，这就是我们今天要做的。" // 中文翻译
        }},
        {{
          "merged_ids": ["s3"],
          "en": "Let's get started!",
          "zh": "我们开始吧！"
        }}
      ]
    }}

    待处理的原始碎片：
    {json.dumps(mini_subs, ensure_ascii=False)}
    """
    
    content = call_deepseek_with_retry(
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"} if "deepseek" not in BASE_URL else None,
        temperature=0.1
    )
    
    if not content: return subtitles_array # 如果失败，返回原碎片兜底
    
    try:
        # 🧹 强力清洗：剥离 AI 可能带上的 Markdown 外壳和首尾空格
        content = content.replace("```json", "").replace("```", "").strip()
        
        # ✨ 强制清理 AI 废话：暴力截取 JSON 部分，丢弃所有前后废话
        start_idx = content.find('{')
        end_idx = content.rfind('}')
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            content = content[start_idx:end_idx+1]
            
        res_json = json.loads(content)
        ai_merged_data = res_json.get("data", [])
        
        # =========================================================
        # 🛡️ 终极物理防弹装甲 3.0：【绝对时间轴 + 精准漏句打捞】
        # =========================================================
        rebuilt_subtitles = []
        last_processed_idx = -1 
        
        for item in ai_merged_data:
            en_text = item.get("en", "")
            if not en_text: continue
            
            raw_ids_str = str(item.get("merged_ids", ""))
            # 1. 暴力提取所有的数字
            nums = [int(n) - 1 for n in re.findall(r'\d+', raw_ids_str)]
            
            # 2. 严格过滤：必须存在，且必须严格大于上一次处理的下标（斩杀重复废话）
            valid_nums = sorted(list(set([n for n in nums if n < len(subtitles_array) and n > last_processed_idx])))
            
            # 🚨 如果这句话连一个没用过的合法数字都没有，说明是重复废话或幻觉，直接斩杀
            if not valid_nums:
                continue
                
            first_idx = valid_nums[0]
            last_idx = valid_nums[-1]

            # 🚑 核心漏句打捞：如果在当前这句话之前，有被 AI 偷偷漏掉的碎片（gap）
            # 我们原封不动地把漏掉的碎片捡回来，插进原位！绝对不硬扯时间戳！
            if first_idx > last_processed_idx + 1:
                for i in range(last_processed_idx + 1, first_idx):
                    rebuilt_subtitles.append({
                        "id": f"s{len(rebuilt_subtitles)+1}",
                        "startTime": subtitles_array[i]["startTime"],
                        "endTime": subtitles_array[i]["endTime"],
                        "en": subtitles_array[i]["en"],
                        "zh": "" # AI 漏翻的，中文留空
                    })
            
            # 🚀 正常装载 AI 合并的这句话，时间戳严格取它自己拥有的物理碎片
            start_time = subtitles_array[first_idx]["startTime"]
            end_time = subtitles_array[last_idx]["endTime"]
            
            rebuilt_subtitles.append({
                "id": f"s{len(rebuilt_subtitles)+1}",
                "startTime": start_time,
                "endTime": end_time,
                "en": en_text,
                "zh": item.get("zh", "")
            })
            
            # 推进锁死指针
            last_processed_idx = last_idx

        # 🚑 结尾兜底机制：如果 AI 罢工，漏掉了视频结尾的碎片，全部原样打捞回来
        if last_processed_idx < len(subtitles_array) - 1:
            for i in range(last_processed_idx + 1, len(subtitles_array)):
                rebuilt_subtitles.append({
                    "id": f"s{len(rebuilt_subtitles)+1}",
                    "startTime": subtitles_array[i]["startTime"],
                    "endTime": subtitles_array[i]["endTime"],
                    "en": subtitles_array[i]["en"],
                    "zh": ""
                })
                
        return rebuilt_subtitles if rebuilt_subtitles else subtitles_array
              
    except Exception as e:
        print(f"❌ 字幕重构解析失败: {e}")
        return subtitles_array
    

# ----------------- AI 车间 2：教研专家 (化整为零+串行黑名单) -----------------
def _call_deepseek_json(prompt, step_name):
    """通用的 AI 请求工具，自带强力清洗和照妖镜功能"""
    try:
        # ✨ 替换成带重试的调用
        content = call_deepseek_with_retry(
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        
        if not content: return {}

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
【选词铁血军规（质量底线与深度挖掘并重）】
1. 难度锚定 (A2-B2级别)：重点提取 CEFR A2、B1、B2 级别的词汇和短语。排除基础简单词（A1级别）和生僻学术词（C1-C2级别）。
2. 转化痛点：优先提取学习者的“被动词汇”（能看懂但自己说不出口的词），以及极其容易被写成“中式英语”的地道表达。
3. 地毯式挖掘（油门）：请放弃保守策略，进行地毯式搜索。只要真正符合 A2-B2 难度和痛点标准，请尽可能多地悉数提取，以丰满学习卡片
4. 绝对宁缺毋滥（刹车与最高底线）：质量永远大于数量！如果视频本身极短或内容口语化严重，没有足够的达标词汇，请仅提取实际符合的数量（哪怕只有 2 个）。【绝对禁止】为了凑数而强行提取 A1 级别的基础词汇（如 make, go, good）或无意义的口水话。

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
4. 提取数量：请在 B1-B2 难度范围内，尽可能多地提取有价值的实词（动词、名词、形容词）。（预期目标,2min内的可达 8-25 个，5分钟内的可达10-45个，10分钟以上的则更多）。
5. 近义词扩展：`synonyms` 字段请务必提供 1-2 个纯英文近义词，用逗号隔开。
6. 简介文风（极其重要）：简介必须自然、流畅、有吸引力，像人类编辑写的一样。
   ⛔ 绝对不要使用“视频中”、“作者分享了”这种生硬口吻，也【绝不要使用博主全名】！
   ✅ 请直接使用博主的亲切称呼“{first_name}”作为主语。如：“{first_name} 分享了她...” 或 “跟着 {first_name} 看看...”。
7. 🚨 标题文风（极其重要）：标题（title）必须精炼（12字内），且【绝对不能包含博主的名字】！请直接总结视频的核心内容。
   ❌ 错误示范：{first_name}的年末反思与行动 / {first_name}的搬迁计划
   ✅ 正确示范：年末反思与行动 / 搬迁与未来计划

【指定topics pool】
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
    if not data_vocab: return None 

    # ✨ 修改 1：生成仅针对“短语车间”的单词黑名单（包含单词原型和视频里的变形）
    words_blacklist_items = []
    if data_vocab:
        for v in data_vocab.get("vocabularies", []):
            words_blacklist_items.extend([v.get("word", ""), v.get("original_form_in_video", "")])
    words_blacklist_items = list(set([str(i).lower() for i in words_blacklist_items if i]))
    words_blacklist_str = ", ".join(words_blacklist_items) if words_blacklist_items else "无"


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
3. 适度泛化：`phrase` 字段必须提取出短语的原型。对于有介词强绑定的搭配使用 sb./sth.(要缩写，不要直接写somebody/something)，但对于纯动词短语（如 fill out），直接提取 fill out 即可，绝不要画蛇添足加上 sth.。
   ✅ 例子：原文 "following you around" -> 提取为 `follow sb. around`
   ✅ 例子：原文 "wrapped his head around the idea" -> 提取为 `wrap one's head around sth.`
   ✅ 例子：原文 "is on fire" -> 提取为 `be on fire`
4. 原文形态留存但要极其精简（极其重要）：请在 `original_form_in_video` 字段中填入该短语在视频字幕中实际出现的完整形态（例如：following you around），但只能保留最核心的几个词（一般2-6个），绝不准抄写多余的宾语！（这对于前端高亮匹配至关重要！）
    ✅ 必须这样做：原文 "fill out my self-reflection journal" -> 只能提取 `fill out`。
    ❌ 绝不能这样做：提取 "fill out my self-reflection journal"（这会导致前端满屏都是高亮）
5. 提取数量：重点挖掘 A2-B1 级别的常见口语搭配、介词短语（如 end up doing, reach out to）。（预期目标,2min内的可达 8-25 个，5分钟内的可达10-45个，10分钟以上的则更多）。
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
    
    # ✨ 修改 2：生成仅针对“金句车间”的短语黑名单（不再把单词加进来了！）
    phrases_blacklist_items = []
    if data_phrases:
        for p in data_phrases.get("phrases", []):
            phrases_blacklist_items.extend([p.get("phrase", ""), p.get("original_form_in_video", "")])
            
    # 去重并过滤空值
    phrases_blacklist_items = list(set([str(i).lower() for i in phrases_blacklist_items if i]))
    phrases_blacklist_str = ", ".join(phrases_blacklist_items) if phrases_blacklist_items else "无"

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
2. 词数红线（最高警告）：提取的 `expression` 和 `original_form_in_video` 绝对不能是一整句完整的话！这两个字段的长度尽量不要超过8个字（除非实在必要）。
3. 泛化提取，且必须提炼骨架（极其重要）：必须提炼骨架，严禁照抄陈述句：绝不允许提取带有具体主语（如 I, We, My mom）或具体时间地点的完整句子。必须将其泛化为公式框架！如果是 🅰️ 类半固定句式，请务必将其泛化（使用 sth./sb./do sth.）。如果是 🅱️ 或 🅲 类，则保留其完整自然句式。
   ❌ 错误示例（你经常犯的错）："I found myself feeling really disheartened." (带了具体主语和语境，绝对禁止！)
   ✅ 正确提炼："find oneself doing/feeling sth." (这才是可以举一反三的通用框架！)
   ❌ 错误示例："we're always striving to achieve to get to the next step." (一整句废话，没有提炼)
   ✅ 正确提炼："strive to do sth." 或 "get to the next step"
4. 原文切片（精简且准确）：`original_form_in_video` 必须只保留触发该框架的核心连续词组，多一个词都不行。并且100% 忠实原文，必须是字幕原文中【连续且未经任何修改的直接子串】！绝对不允许擅自改变时态、单复数或增加/删除单词！
   示例：如果原句是 "I found myself feeling really disheartened"，那么这里只能填 "found myself feeling"。  
   示例：原文是 "spending a couple wonderful hours"，不能提取为 "spent a couple wonderful hours"（绝对禁止擅自改写！）。必须老老实实提取为 "spending a couple wonderful" 或 "spending a couple"。
5. 提取数量：预期目标,2min内长度的视频可达 2-7 个，5分钟内长度的可达5-15个，10分钟以上的则更多。如果没有足够的地道表达，提取 1-2 个甚至不提取都可以，坚决不要把普通的寒暄废话当作金句！
6. 【致命红线：排他黑名单】：以下短语已经在前面的环节提取过了，【绝对禁止】在本环节以任何形式（包括原词、变体、包含这些词的衍生组合）再次出现！
   如果视频太短找不到不重复的金句，请直接返回空数组 []，宁缺毋滥，绝不准用黑名单里的词凑数交差！违者任务彻底失败！
   当前黑名单：[{phrases_blacklist_str}]
7. 【重点】HTML 排版规则：`expression_explanation` 字段必须严格使用下方示例中的 HTML 模板！特别是“💡 表达解析”部分，必须严谨地分为【1) 结构解析】（介绍公式或功能）和【2) 举一反三】（包含2个带中文翻译的例句）。并且使用场景必须简明扼要，控制在 20 字以内。相似表达请务必提供 1-2 个纯英文相似表达，用逗号隔开。

【JSON 结构要求】
{{
  "expressions": [
    {{
      "expression": "<english_expression>",
      "original_form_in_video": "<exact_english_substring_from_video>",
      "expression_explanation": "<p>📝 <b>字幕原句：</b><english_sentence_from_video></p>\\n<p>🇨🇳 <b>中文翻译：</b><中文翻译></p>\\n<p>💡 <b>表达解析：</b><br>1) 结构解析<br>公式：<提取的公式><br>功能：<详细解释功能、语境和感情色彩><br><br>2) 举一反三<br>例1：<纯英文例句1>（<中文翻译1>）<br>例2：<纯英文例句2>（<中文翻译2>）</p>\\n<p>🎯 <b>使用场景：</b><br><20字以内的中文场景描述></p>\\n<p>🔄 <b>相似表达：</b><br><1到2个纯英文相似表达></p>"
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
def process_folder(folder_path, csv_info):
    folder_name = os.path.basename(folder_path)
    cf_base_url = "https://cdn.spoken-eng-planet.com" 
    
    pure_clip_id = csv_info['clip_id']
    
    srt_files = [f for f in os.listdir(folder_path) if f.endswith('.srt')]
    if not srt_files: 
        print(f"⚠️  跳过 '{folder_name}'：找不到 .srt 文件")
        return
    
    print(f"\n🚀 开始处理: {folder_name} (提取纯ID: {pure_clip_id})")
    
    # 1. 解析基础数据（拿到碎片）
    print("  -> 解析物理 SRT 碎片...")
    raw_subtitles, _, duration_sec = parse_srt_to_array(os.path.join(folder_path, srt_files[0]))
    
    # 2. 调度车间 1：语义缝合与翻译
    print("  -> [AI 车间 1] 正在按语义缝合完整句子、恢复标点并翻译...")
    subtitles = ai_rebuild_and_translate_subtitles(raw_subtitles)
    
    # ✨ 把缝合好、带标点的完整英文句子拼接起来，喂给后面的知识提取车间
    # 这样做的好处是后面的提取逻辑会因为有了正确的标点，准确率大幅提升！
    text_for_ai_array = [f"[{format_duration(s['startTime'])}] {s['en']}" for s in subtitles]
    text_for_ai = " ".join(text_for_ai_array)
    
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

# ... 前面代码保持不变 ...

def main():
    # 1. ✨ 这里定义你想要跑的指定文件夹列表（直接粘贴我之前给你的那个列表）
    SPECIFIC_FOLDERS = [
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

    
    current_work_dir = os.getcwd()
    print(f"📍 当前脚本运行路径: {current_work_dir}")

    base_dir = "public/content"
    csv_file_path = "clips.csv"
    
    if not os.path.exists(base_dir):
        print(f"❌ 找不到目录: {os.path.abspath(base_dir)}")
        return

    # 2. ✨ 加载 CSV 配置文件
    clips_csv_data = load_clips_csv(csv_file_path)
    if not clips_csv_data:
        print("❌ CSV 数据加载失败！")
        return

    print(f"🚀 开始处理指定的 {len(SPECIFIC_FOLDERS)} 个文件夹...")

    processed_count = 0
    # 3. ✨ 核心修改：只遍历 SPECIFIC_FOLDERS 列表
    for folder_name in SPECIFIC_FOLDERS:
        folder_path = os.path.join(base_dir, folder_name)
        
        # 检查该文件夹是否真的存在
        if not os.path.exists(folder_path):
            print(f"⚠️  跳过: 目录 {folder_name} 不存在")
            continue

        # 提取 ID (例如从 A040_michelle_Choi 中提取 A040)
        matched_cid = folder_name.split('_')[0]
        
        if matched_cid in clips_csv_data:
            print(f"\n🎬 [开始处理] {folder_name}")
            process_folder(folder_path, clips_csv_data[matched_cid]) # ✨ 加了 [matched_cid]
            processed_count += 1
        else:
            print(f"⚠️  跳过 {folder_name}: 在 clips.csv 中找不到 ID {matched_cid}")

    print(f"\n✨ 任务完成！共处理了 {processed_count} 个文件夹。")

if __name__ == "__main__":
    main()