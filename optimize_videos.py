import os
import subprocess

# 指向你的内容文件夹
CONTENT_DIR = "public/content"

# ✨ 在这里写死你想测试的几个文件夹名字（记得带引号和逗号）
TARGET_FOLDERS = [
    "A001_Tyson_Liberto",
    "A002_Tyson_Liberto",
    "A004_jenn_im",
    "A005_jenn_im"
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