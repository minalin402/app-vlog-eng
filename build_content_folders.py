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
TARGET_FOLDERS =[
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