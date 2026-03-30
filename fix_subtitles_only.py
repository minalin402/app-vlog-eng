import os
import json
import pysrt
# 引入你主脚本里的工具（确保它们在同一个目录下）
from materials_produce_deepseek import parse_srt_to_array, ai_rebuild_and_translate_subtitles

# ================= 配置区 =================
base_dir = r"D:\DMy_Code_Projects\English_Factory\web_copy\engvloglab\public\content"
src_clips_dir = r"D:\DMy_Code_Projects\English_Factory\clips_project\videos\clips"

# 填写你在巡检时发现的“字幕稀烂”的坏孩子名单
BAD_IDS = ["A024_Birta_Hlin", "A054_Claudia_Sulewski","A069_Amanda_Ekstrand","A028_Annika"
           ,"A114_Noa_Maria","A016_Sydney_Serena","A017_Birta_Hlin","A020_Birta_Hlin"] 
# ==========================================

def main():
    for folder_name in BAD_IDS:
        target_folder = os.path.join(base_dir, folder_name)
        json_path = os.path.join(target_folder, "data.json")
        src_srt_path = os.path.join(src_clips_dir, folder_name + ".srt")

        if not os.path.exists(json_path) or not os.path.exists(src_srt_path):
            print(f"⚠️ 跳过 {folder_name}: 找不到 json 或原始 srt")
            continue

        print(f"\n🩺 正在为 {folder_name} 进行字幕外科手术...")
        
        # 1. 重新读取最原始的 SRT 碎片
        raw_subtitles, _, _ = parse_srt_to_array(src_srt_path)
        
        # 2. 呼叫 AI 重新缝合（你可以在主脚本里稍微把 12个词 放宽到 15个词，专门对付这些长难句）
        print("   -> 呼叫 AI 重新缝合字幕...")
        new_subtitles = ai_rebuild_and_translate_subtitles(raw_subtitles)

        # 3. 悄悄替换原 JSON 中的字幕节点，不碰词汇和金句
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        data["subtitles"] = new_subtitles
        
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print(f"✅ {folder_name} 字幕替换成功，词汇/短语毫发无损！")

if __name__ == "__main__":
    main()