import os
import shutil
import glob

# ================= 配置区 =================
# 1. 源视频和字幕所在目录
src_clips_dir = r"D:\DMy_Code_Projects\English_Factory\clips_project\videos\clips"
# 2. 源封面图片所在目录
src_cover_dir = r"D:\DMy_Code_Projects\English_Factory\clips_project\videos\cover"
# 3. 目标生成目录 (content)
tgt_content_dir = r"D:\DMy_Code_Projects\English_Factory\web_copy\engvloglab\public\content"

# 4. ✨ 指定的构建白名单（只有在这个列表里的，才会被建房和搬运）
TARGET_FOLDERS = [
    "A045_jenn_im", "A053_Claudia_Sulewski", "A071_Amanda_Ekstrand", "A072_Amanda_Ekstrand", "A042_michelle_Choi", 
    "A019_Birta_Hlin", "A022_Birta_Hlin", "A025_Birta_Hlin", "A034_Sydney_Serena", "A041_michelle_Choi", 
    "A128_Life_Of_Riza", "A007_emma_chamberlain", "A009_emma_chamberlain", "A008_emma_chamberlain", "A005_jenn_im", 
    "A004_jenn_im", "A003_michelle_Choi", "A148_Taylor_R", "A149_Taylor_R", "A151_Taylor_R", 
    "A156_Eve_Bennett", "A163_Lydia_Violeta", "A095_Karen_Napoly", "A096_Karen_Napoly", "A098_Karen_Napoly", 
    "A099_Karen_Napoly", "A102_Karen_Napoly", "A104_Noa_Maria", "A105_Noa_Maria", "A109_Noa_Maria", 
    "A136_sarah_pan", "A129_Life_Of_Riza", "A049_jenn_im", "A043_emma_chamberlain", "A044_emma_chamberlain", 
    "A047_jenn_im", "A048_jenn_im", "A030_Annika", "A027_Annika", "A026_Annika", 
    "A002_Tyson_Liberto", "A050_jenn_im", "A051_jenn_im", "A052_jenn_im", "A059_Hannah_Elise", 
    "A060_Hannah_Elise", "A061_Hannah_Elise", "A063_Taylor_Bell", "A079_Allison_Anderson", "A090_Hailey_Rhode_Bieber"
]
# ==========================================

def main():
    # 确保目标主目录存在，没有就建一个
    os.makedirs(tgt_content_dir, exist_ok=True)
    print(f"🔍 准备为白名单中的 {len(TARGET_FOLDERS)} 个指定视频创建文件夹并搬运物料...\n")
    
    success_count = 0
    
    # 核心修改：不再扫描全盘，而是只遍历你给的名单
    for base_name in TARGET_FOLDERS:
        clip_id = base_name[:4] # 提取前4位 ID (例如 A045)
        
        # 目标子文件夹路径
        tgt_folder = os.path.join(tgt_content_dir, base_name)
        
        # 自动创建以【id+博主名字】命名的子文件夹
        os.makedirs(tgt_folder, exist_ok=True)
        print(f"📁 正在构建并填充: {base_name}")
        
        # --- 1. 搬运并重命名 Video ---
        src_mp4 = os.path.join(src_clips_dir, base_name + ".mp4")
        tgt_mp4 = os.path.join(tgt_folder, "video.mp4")
        if os.path.exists(src_mp4):
            shutil.copy2(src_mp4, tgt_mp4)
        else:
            print(f"  ⚠️ 警告: 找不到源视频文件 {src_mp4}")
            
        # --- 2. 搬运并重命名 Subtitle ---
        src_srt = os.path.join(src_clips_dir, base_name + ".srt")
        tgt_srt = os.path.join(tgt_folder, "subtitle.srt")
        if os.path.exists(src_srt):
            shutil.copy2(src_srt, tgt_srt)
        else:
            print(f"  ⚠️ 警告: 找不到源字幕文件 {src_srt}")
            
        # --- 3. 搬运并重命名 Cover ---
        # 模糊查找 cover 文件夹里所有以该 ID（如 A045）开头的文件
        cover_candidates = glob.glob(os.path.join(src_cover_dir, f"{clip_id}*.*"))
        
        if cover_candidates:
            src_cover = cover_candidates[0] # 取找到的第一个匹配图片
            ext = os.path.splitext(src_cover)[1] # 获取原图的后缀（.jpg 或 .png）
            tgt_cover = os.path.join(tgt_folder, f"cover{ext}")
            shutil.copy2(src_cover, tgt_cover)
        else:
            print(f"  ⚠️ 警告: 在 cover 文件夹找不到 ID 为 {clip_id} 的封面图")
            
        success_count += 1
        
    print(f"\n🎉 完美收工！共成功处理了 {success_count} 个白名单文件夹。")

if __name__ == "__main__":
    main()