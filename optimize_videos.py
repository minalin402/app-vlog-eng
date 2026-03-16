import os
import subprocess

# 指向你的内容文件夹
CONTENT_DIR = "public/content"

# ✨ 在这里写死你想测试的几个文件夹名字（记得带引号和逗号）
TARGET_FOLDERS = [
    "A001_Tyson_Liberto",
    "A002_Tyson_Liberto",
    "A004_jenn_im"
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
        backup_path = os.path.join(folder_path, "video_original.mp4")
        
        if not os.path.exists(video_path):
            print(f"⚠️  跳过 {folder_name}: 里面没有 video.mp4")
            continue
            
        # 如果已经有备份了，说明之前跑过，防止重复覆盖
        if os.path.exists(backup_path):
            print(f"⏭️  跳过 {folder_name}: 已经存在 video_original.mp4 备份，说明已优化过")
            continue
            
        print(f"\n⏳ 正在优化: {folder_name}/video.mp4")
        
        # 1. 重命名备份旧视频
        os.rename(video_path, backup_path)
        
        # 2. 调用 ffmpeg 进行深度压制 + 秒开重组
        # -vcodec libx264 -crf 28: 使用高压缩比，画质肉眼几乎看不出区别，但体积能缩小 50%-80%
        # -vf scale=-2:720: 强制缩放到 720P 高清标准
        # -preset veryfast: 压制速度拉满
        # -c:a aac -b:a 128k: 统一音频格式，防止杂音
        # -movflags +faststart: 注入秒开基因
        command = [
            "ffmpeg", 
            "-i", backup_path, 
            "-vcodec", "libx264", 
            "-crf", "23", #改成23试试看，28押太狠变糊了
            "-vf", "scale=-2:720", 
            "-preset", "veryfast", 
            "-c:a", "aac", 
            "-b:a", "128k", 
            "-movflags", "+faststart", 
            video_path
        ]
        
        try:
            subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            print(f"  ✅ 成功！已生成支持 Web 秒开的新 video.mp4")
        except subprocess.CalledProcessError:
            print(f"  ❌ 失败！请检查是否安装了 FFmpeg。正在恢复原文件...")
            os.rename(backup_path, video_path)

if __name__ == "__main__":
    optimize_videos_for_web()
    print("\n🎉 全部处理完毕！快去把新的 video.mp4 上传到 R2 替换掉旧的吧！")