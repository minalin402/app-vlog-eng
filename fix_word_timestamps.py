import os
import json
import re
import difflib

# ================= 配置区 =================
base_dir = r"D:\DMy_Code_Projects\English_Factory\web_copy\engvloglab\public\content"
# 将你需要修复的 ID 填在这里
BAD_IDS = [
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

def normalize(text):
    return re.sub(r'[\W_]+', '', str(text)).lower()

def find_precise_start_time_with_preroll(target_text, whisper_asset):
    """✨ 激光对齐算法 + 智能声学预读缓冲（Pre-roll Buffer）"""
    if not target_text: return None
    clean_target = normalize(target_text)
    
    full_str = ""
    char_to_word_map = []
    for i, w in enumerate(whisper_asset):
        word_text = normalize(w["word"])
        if not word_text: continue
        start_char_pos = len(full_str)
        full_str += word_text
        for _ in range(start_char_pos, len(full_str)):
            char_to_word_map.append(i)
            
    matcher = difflib.SequenceMatcher(None, full_str, clean_target)
    match = matcher.find_longest_match(0, len(full_str), 0, len(clean_target))
    
    if match.size > 0:
        # 1. 找到该单词极其精准的发音瞬间
        first_word_idx = char_to_word_map[match.a]
        exact_start = whisper_asset[first_word_idx]["start"]
        
        # 2. ✨ 智能前置缓冲：为了给用户反应时间，往前寻找完整的单词边界
        # 规则：往前找，直到累计时间差达到 0.8 秒，或者最多往前退 4 个词（防止带入太多无关上下文）
        adjusted_idx = first_word_idx
        for i in range(1, 5):
            curr_idx = first_word_idx - i
            if curr_idx < 0:
                break
            adjusted_idx = curr_idx
            
            # 如果当前退回的这个词，距离目标词已经争取到了 >=0.8秒 的缓冲时间，完美停止！
            if exact_start - whisper_asset[curr_idx]["start"] >= 0.8:
                break
                
        return whisper_asset[adjusted_idx]["start"]
        
    return None

def main():
    for vid in BAD_IDS:
        target_folder = os.path.join(base_dir, vid)
        json_path = os.path.join(target_folder, "data.json")
        whisper_path = os.path.join(target_folder, "whisper_raw.json")

        if not os.path.exists(json_path) or not os.path.exists(whisper_path):
            print(f"⚠️ 跳过 {vid}: 缺少 data.json 或 whisper_raw.json")
            continue

        print(f"🚀 正在精准校正 {vid} 的单词与短语时间轴 (带智能预读缓冲)...")
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        with open(whisper_path, 'r', encoding='utf-8') as f:
            whisper_asset = json.load(f)

        # 1. 修复 Vocabularies
        for v in data.get("vocabularies", []):
            search_text = v.get("original_form_in_video") or v.get("word")
            exact_start = find_precise_start_time_with_preroll(search_text, whisper_asset)
            if exact_start is not None:
                v["first_appearance_time"] = round(exact_start, 2)

        # 2. 修复 Phrases
        for p in data.get("phrases", []):
            search_text = p.get("original_form_in_video") or p.get("phrase")
            exact_start = find_precise_start_time_with_preroll(search_text, whisper_asset)
            if exact_start is not None:
                p["first_appearance_time"] = round(exact_start, 2)

        # 3. 修复 Expressions
        for e in data.get("expressions", []):
            search_text = e.get("original_form_in_video") or e.get("expression")
            exact_start = find_precise_start_time_with_preroll(search_text, whisper_asset)
            if exact_start is not None:
                e["first_appearance_time"] = round(exact_start, 2)

        # 回填保存
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  ✅ {vid} 时间轴漂移修复完成！")

if __name__ == "__main__":
    main()