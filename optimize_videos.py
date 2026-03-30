import os
import subprocess

# 指向你的内容文件夹
CONTENT_DIR = "public/content"

# ✨ 在这里写死你想测试的几个文件夹名字（记得带引号和逗号）
TARGET_FOLDERS = [
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

def optimize_videos_for_web():
    print(f"🔍 收到指令，准备优化 {len(TARGET_FOLDERS)} 个指定视频...")
    
    for folder_name in TARGET_FOLDERS:
        folder_path = os.path.join(CONTENT_DIR, folder_name)
        
        # 检查你写的文件夹存不存在
        if not os.path.isdir(folder_path):
            print(f"⚠️  跳过 {folder_name}: 找不到这个文件夹")
            continue
            
        video_path = os.path.join(folder_path, "video.mp4")
        temp_path = os.path.join(folder_path, "video_temp.mp4")
        marker_path = os.path.join(folder_path, ".optimized") # ✨ 新增：压缩完成标记
        
        if not os.path.exists(video_path):
            print(f"⚠️  跳过 {folder_name}: 里面没有 video.mp4")
            continue
            
        # 如果已经有 .optimized 标记，说明之前跑过，防止对已压缩视频进行“二次甚至多次压缩”导致画质崩坏
        if os.path.exists(marker_path):
            print(f"⏭️  跳过 {folder_name}: 检测到 .optimized 标记，说明已优化过")
            continue
            
        print(f"\n⏳ 正在优化: {folder_name}/video.mp4")
        
        # ✨ 使用上一轮为你调配的高画质+防卡顿参数
        command = [
            "ffmpeg", 
            "-i", video_path,          # 输入原视频
            "-vcodec", "libx264", 
            "-crf", "23",              # 黄金画质甜点区
            "-preset", "fast",         # 压制速度与体积的平衡
            "-maxrate", "2M",          # 限制最高码率，防止复杂画面导致码率飙升卡顿
            "-bufsize", "4M",          # 配合 maxrate 使用的缓冲区
            "-vf", "scale=-2:720",     # 限制为 720P 高清
            "-c:a", "aac", 
            "-b:a", "128k", 
            "-movflags", "+faststart", # 注入 Web 秒开基因
            "-y",                      # 自动覆盖询问
            temp_path                  # 先输出到临时文件 
        ]
        
        try:
            # 执行 FFmpeg 命令
            subprocess.run(command, check=True)
            
            # ✨ 核心文件替换逻辑：删旧换新
            os.remove(video_path)
            os.rename(temp_path, video_path)
            
            # 写入一个空白的标记文件，以后就不会重复处理这个文件夹了
            with open(marker_path, 'w') as f:
                f.write('done')
                
            print(f"✅ {folder_name} 优化完成，已完美替换原文件并生成保护标记！")
            
        except subprocess.CalledProcessError as e:
            print(f"❌ 压制出错 {folder_name}: {e}")
            # 如果中途报错或被人为中断，把损坏的临时文件删掉，保护原视频
            if os.path.exists(temp_path):
                os.remove(temp_path)

if __name__ == "__main__":
    optimize_videos_for_web()