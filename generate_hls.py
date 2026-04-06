import os
import subprocess
import shutil

# 指向你的核心内容文件夹
CONTENT_DIR = "public/content"
# ✨ 新增：指向你独立的备份文件夹（专门存放未压缩的原视频）
BACKUP_DIR = "public/backups"

# 今晚做测试的文件夹
TARGET_FOLDERS = [
    "A095_Karen_Napoly", 
    "A090_Hailey_Rhode_Bieber"
]

def generate_hls_for_web():
    print(f"🚀 收到指令，准备将 {len(TARGET_FOLDERS)} 个视频升级为 HLS 流媒体架构...")
    
    for folder_name in TARGET_FOLDERS:
        folder_path = os.path.join(CONTENT_DIR, folder_name)
        
        if not os.path.isdir(folder_path):
            print(f"⚠️  跳过 {folder_name}: 找不到这个文件夹")
            continue
            
        video_path = os.path.join(folder_path, "video.mp4")
        m3u8_path = os.path.join(folder_path, "index.m3u8")
        segment_pattern = os.path.join(folder_path, "seg_%03d.ts")
        
        # ✨ 新增：计算这个视频专属的备份目录路径
        backup_folder = os.path.join(BACKUP_DIR, folder_name)
        backup_path = os.path.join(backup_folder, "video_backup.mp4")
        
        if not os.path.exists(video_path):
            print(f"⚠️  跳过 {folder_name}: 找不到 video.mp4 (可能已经被处理过了)")
            continue
            
        print(f"\n⏳ 正在切片: {folder_name} (这可能需要一两分钟)")
        
        command = [
            "ffmpeg", 
            "-i", video_path,
            "-vcodec", "libx264", 
            "-profile:v", "main",
            "-level", "3.1",
            "-crf", "23",
            "-preset", "fast",
            "-maxrate", "2M",
            "-bufsize", "4M",          
            "-vf", "scale=-2:720",
            "-c:a", "aac", 
            "-b:a", "128k", 
            "-f", "hls",
            "-hls_time", "4",
            "-hls_playlist_type", "vod",
            "-hls_segment_filename", segment_pattern,
            m3u8_path
        ]
        
        try:
            # 执行 FFmpeg 命令
            subprocess.run(command, check=True)
            
            # ✨ 核心改动：创建独立的备份子文件夹，并把原视频“挪过去”
            os.makedirs(backup_folder, exist_ok=True)
            shutil.move(video_path, backup_path)
            
            print(f"✅ {folder_name} 切片完成！原视频已安全抽离至: {backup_path}")
            
        except subprocess.CalledProcessError as e:
            print(f"❌ 优化 {folder_name} 时发生错误: {e}")
        except Exception as e:
            print(f"❌ 发生未知错误: {e}")

if __name__ == "__main__":
    generate_hls_for_web()
    print("\n🎉 全部 HLS 切片任务执行完毕！现在你可以直接批量上传 content 文件夹了。")