import os

# 1. 替换为你本地 content 文件夹的真实路径
base_dir = r"D:\DMy_Code_Projects\English_Factory\web_copy\engvloglab\public\content"

# 2. 🚨 极其关键：替换为 Cloudflare 刚才分配给你的公网链接
# 就是那个你在 Public Development URL 点 Enable 后拿到的链接
# 格式类似：https://pub-xxxxxxxxxxxxxx.r2.dev (注意末尾不要加斜杠 /)
base_url = "https://pub-a825fbb95e6e4859a99b9ec4adf6cf55.r2.dev"

sql_statements = []

# 3. 遍历本地文件夹
for folder_name in os.listdir(base_dir):
    folder_path = os.path.join(base_dir, folder_name)
    
    # 确保它是个文件夹
    if os.path.isdir(folder_path):
        # 提取 A001 作为匹配数据库的 ID
        video_id = folder_name.split('_')[0] 
        
        # 拼接出 Cloudflare 的极速 CDN 完整链接
        # 因为我们直接拖进了桶里，所以中间不再有烦人的 /content/ 层级啦！
        video_url = f"{base_url}/{folder_name}/video.mp4"
        cover_url = f"{base_url}/{folder_name}/cover.jpg"
        
        # 生成 SQL 更新语句
        sql = f"UPDATE videos SET video_url = '{video_url}', cover_url = '{cover_url}' WHERE id = '{video_id}';"
        sql_statements.append(sql)

# 4. 写入 SQL 文件
with open("update_urls_cf.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql_statements))

print(f"✅ 大功告成！为你的 Next.js 前端生成了 {len(sql_statements)} 条数据库更新语句！")