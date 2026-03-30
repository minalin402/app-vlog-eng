import os
import json
import re
import pysrt  # ✨ 必须引入 pysrt，用于读取真实的字幕文件
from moviepy.editor import VideoFileClip
from openai import OpenAI

# ================= 配置区 =================
# 填入你的 API 配置
API_KEY = "sk-Nz3U2yrzWDvm6kFz0qHOImjGtK2xae6fXG1w49dNEItCZ1Na" 
BASE_URL = "https://crazyrouter.com/v1" 

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

# 基础路径配置
base_dir = r"D:\DMy_Code_Projects\English_Factory\web_copy\engvloglab\public\content"
src_clips_dir = r"D:\DMy_Code_Projects\English_Factory\clips_project\videos\clips"

# 今晚需要紧急抢救的视频 ID
BAD_IDS =BAD_IDS =[
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
# ==========================================

def deepseek_segment_and_translate(raw_text):
    print("  -> 正在调用 DeepSeek 进行完美意群断句...")
    prompt = f"""

    角色：资深英语教研员与专业字幕编辑。

    

    【核心任务】

    下面是一段【人工精心校对过】的连续英文文本（没有标点符号）。

    请你将其按“完整的语法语义”和“适合英语学习者跟读的长度”进行切分，添加正确的标点，并提供自然流畅的中文翻译。

    

    【严格规则】

    1. 标点恢复：必须在英文 `en` 字段中补全正确的逗号、句号、问号等，并修正大小写。

    2. 绝不遗漏与篡改：绝对不允许修改、增加、删减任何一个原文字母！原文是什么就输出什么，哪怕一个介词都不准改。

    3. 断句要求

        【🚨 致命红线 1：字数超载熔断】

        每句话【绝对不能超过 15 个单词】！如果遇到长句，必须果断在连词、从句引导词前切断！宁可句子短，也绝不能长！

        

        【🚨 致命红线 2：绝对不允许的断句方式】

        1) 严禁主谓分离：绝对不能在主语和谓语之间断开。

        2) 严禁切断介词短语/动词短语：绝对不能以 in, on, at, of, with 等介词结尾。

        3) 严禁以冠词或连词结尾：绝对不能以 a, the, and, but, or, because, so 等词结尾。

        4) 严禁以助动词/系动词结尾：绝对不能以 is, are, have, has, been 等结尾。



        【🚨 致命红线 3：严禁任何拼写/语法纠错与口语展开】（极其重要！！！）

        1) 口语中经常有缩略词（如 gonna, wanna, gotta, 'cause, 'em 等），【绝对禁止】将它们擅自展开为 going to, want to, because 等标准形式！

        2) 提供的原文是极其真实的口语，可能存在语法错误、病句或错词（比如本该是 plan 却说了 play），你【绝对不准】自作主张去“修复”、“润色”或“猜词”！原文错，你就错着输出，你唯一的任务只是加标点和断句！



        【✅ 推荐的断句位置（意群交接处）】

        如果一个句子过长，请优先在以下位置断开：

        1) 标点符号处（逗号、句号、问号）。

        2) 并列连词前（在 and, but, or 之前断开，让连词作为下一句的开头）。

        3) 从句引导词前（在 that, which, who, where, because, when, if, although 之前断开）。

        4) 较长的状语短语前或后。



        【Few-Shot 示例对比】

        🔴 Bad Case (机器乱断的，绝对禁止)：

        {{

        "data": [

            {{ "en": "I have just been getting some work done, answering some emails, finishing up a video, and I've", "zh": "我刚才一直在处理一些工作，回复一些邮件，完成一个视频，而且我还" }},

            {{ "en": "also been planning the week ahead because today is Friday", "zh": "在规划接下来的一周，因为今天是星期五" }}

        ]

        }}

        🟢 Good Case (基于意群的完美断句)：

        {{

        "data": [

            {{ "en": "I have just been getting some work done, answering some emails, finishing up a video,", "zh": "我刚才一直在处理一些工作，回复一些邮件，完成一个视频，" }},

            {{ "en": "and I've also been planning the week ahead", "zh": "并且我也在规划接下来的一周，" }},

            {{ "en": "because today is Friday.", "zh": "因为今天是星期五。" }}

        ]

        }}

    4.防止重复结语：处理完最后一句文本后，立即停止输出。绝对不要在最后自行添加任何总结性或重复性的废话。

    

    【语气指导】

    1. 自然且专业：中文应听起来自然地像母语者，但不要使用俚语或过于随意的表达。

    2. 避免“网络流行语”：除非英文明确使用了Z世代俚语，否则不要使用网络用语。

    3. 功能等效：继续以意义为主进行翻译而非逐字翻译，但保持标准语气。



    ⛔ 严格格式：只输出合法 JSON，格式必须如下（注意：不再需要 merged_ids）：

    {{

      "data": [

        {{

          "en": "All right guys, here is what we're making today.",

          "zh": "好了各位，这就是我们今天要做的。"

        }},

        {{

          "en": "Let's get started!",

          "zh": "我们开始吧！"

        }}

      ]

    }}



    待处理文本：

    {raw_text}

    """
    
    try:
        response = client.chat.completions.create(
            model="deepseek-v3.2", 
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        content = response.choices[0].message.content
        
        # 🧹 强力清洗装甲
        content = content.replace("```json", "").replace("```", "").strip()
        start_idx = content.find('{')
        end_idx = content.rfind('}')
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            content = content[start_idx:end_idx+1]
            
        ds_sentences = json.loads(content).get("data", [])
        if not ds_sentences: return []

        # =====================================================================
        # 🛡️ 物理还原力场：用 Python 把 AI 潜在篡改的文本强行换回 SRT 原文！
        # =====================================================================
        print("  -> 正在启动物理还原力场，夺回原汁原味的 SRT 文本...")
        raw_words = raw_text.split()
        restored_sentences = []
        word_idx = 0
        total_words = len(raw_words)
        
        def normalize(w):
            return re.sub(r'[\W_]+', '', w).lower()

        for i in range(len(ds_sentences)):
            item = ds_sentences[i]
            
            # 1. 结尾兜底：如果是最后一句，直接把剩下的所有原文包圆
            if i == len(ds_sentences) - 1:
                exact_en = " ".join(raw_words[word_idx:])
                if exact_en.strip():
                    restored_sentences.append({"en": exact_en, "zh": item["zh"]})
                break
            
            # 2. 探路锚点：寻找下一句开头的前 3 个词
            next_en = ds_sentences[i+1]["en"]
            anchors = [normalize(w) for w in next_en.split() if normalize(w)][:3]
            
            found_boundary = False
            search_limit = min(word_idx + 40, total_words) # 往前最多找 40 个词
            
            for j in range(word_idx, search_limit):
                match_count = 0
                for k, anchor in enumerate(anchors):
                    if j + k < total_words and normalize(raw_words[j+k]) == anchor:
                        match_count += 1
                    else:
                        break
                
                # 如果锚点全中，说明找到了切分边界！
                if match_count > 0 and match_count == len(anchors):
                    # 🔪 物理切割：无视 AI 输出的英文拼写，直接从原始文本上切下这段
                    exact_en = " ".join(raw_words[word_idx:j])
                    restored_sentences.append({"en": exact_en, "zh": item["zh"]})
                    word_idx = j
                    found_boundary = True
                    break
            
            # 3. 极端兜底：如果 AI 瞎改导致锚点失效，按 AI 的输出单词数量硬切
            if not found_boundary:
                curr_word_count = len([w for w in item["en"].split() if normalize(w)])
                end_idx = min(word_idx + curr_word_count, total_words)
                exact_en = " ".join(raw_words[word_idx:end_idx])
                restored_sentences.append({"en": exact_en, "zh": item["zh"]})
                word_idx = end_idx

        return restored_sentences

    except Exception as e:
        print(f"❌ DeepSeek 断句解析失败: {e}")
        return []

def align_timestamps(ds_sentences, whisper_words):
    print("  -> 正在执行毫秒级单词时间轴锁定算法...")
    aligned_subtitles = []
    word_idx = 0
    total_words = len(whisper_words)
    seen_texts_norm = set()

    def normalize_text(t):
        return re.sub(r'[\W_]+', '', str(t)).lower()

    for item in ds_sentences:
        en_sentence = item["en"]
        norm_en = normalize_text(en_sentence)
        
        if norm_en in seen_texts_norm and len(norm_en) > 5:
            continue
        
        sentence_words = [w for w in re.split(r'[\s\-]+', en_sentence) if normalize_text(w)]
        if not sentence_words: continue
            
        start_time = None
        end_time = None
        
        temp_idx = word_idx
        for sw in sentence_words:
            norm_sw = normalize_text(sw)
            found = False
            for offset in range(15):
                if temp_idx + offset < total_words:
                    ww = whisper_words[temp_idx + offset]
                    ww_word = ww.get("word", "") if isinstance(ww, dict) else (ww.word if hasattr(ww, 'word') else ww["word"])
                    norm_ww = normalize_text(ww_word)
                    
                    if norm_sw == norm_ww or norm_sw in norm_ww or norm_ww in norm_sw:
                        if start_time is None: 
                            start_time = ww.get("start") if isinstance(ww, dict) else (ww.start if hasattr(ww, 'start') else ww["start"])
                        end_time = ww.get("end") if isinstance(ww, dict) else (ww.end if hasattr(ww, 'end') else ww["end"])
                        temp_idx = temp_idx + offset + 1
                        found = True
                        break
        
        if start_time is not None and end_time is not None:
            aligned_subtitles.append({
                "id": f"s{len(aligned_subtitles)+1}",
                "startTime": round(start_time, 2),
                "endTime": round(end_time, 2),
                "en": en_sentence,
                "zh": item["zh"]
            })
            seen_texts_norm.add(norm_en)
            word_idx = temp_idx

    return aligned_subtitles

def main():
    for folder_name in BAD_IDS:
        target_folder = os.path.join(base_dir, folder_name)
        json_path = os.path.join(target_folder, "data.json")

        if not os.path.exists(json_path):
            print(f"⚠️ 跳过 {folder_name}: 找不到 json")
            continue

        print(f"\n🚀 开始使用 Whisper 重构 {folder_name} 的字幕...")
        
        try:
            whisper_save_path = os.path.join(target_folder, "whisper_raw.json")
            
            if os.path.exists(whisper_save_path):
                print(f"  📦 发现本地已沉淀的 Whisper 资产，直接读取！")
                with open(whisper_save_path, 'r', encoding='utf-8') as f:
                    whisper_words = json.load(f)
            else:
                print(f"⚠️ 找不到 whisper_raw.json，请先运行主脚本生成资产。")
                continue
                
            # ==========================================
            # ✨ 核心修复：坚决从人工校对的 SRT 里读取带空格和标点的文本！
            # ==========================================
            srt_files = [f for f in os.listdir(target_folder) if f.endswith('.srt')]
            if not srt_files:
                print(f"⚠️ 找不到 {folder_name} 的 .srt 文件，跳过！")
                continue
                
            # 优先找同名的，没有就拿第一个
            expected_srt = os.path.join(target_folder, f"{folder_name}.srt")
            srt_path = expected_srt if os.path.exists(expected_srt) else os.path.join(target_folder, srt_files[0])
            
            subs = pysrt.open(srt_path)
            # 提取出完美的纯净文案（保留了你所有的空格、标点和 gonna）
            raw_text = re.sub(r'\s+', ' ', " ".join([sub.text.replace('\n', ' ') for sub in subs])).strip()

            # 2. 让 DeepSeek 放开手脚断句，然后用物理力场夺回原文！
            ds_sentences = deepseek_segment_and_translate(raw_text)
            
            # 3. 毫秒级锁定匹配
            new_subtitles = align_timestamps(ds_sentences, whisper_words)

            # 4. 安全写入
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            data["subtitles"] = new_subtitles
            
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                
            print(f"✅ {folder_name} Whisper 单词级重构成功！去看看 data.json 吧！")
            
        except Exception as e:
            print(f"❌ 处理失败: {e}")

if __name__ == "__main__":
    main()