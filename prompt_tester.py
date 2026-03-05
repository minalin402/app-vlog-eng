import os
import json
import pysrt
from openai import OpenAI
from datetime import datetime

# ================= 配置区 =================
API_KEY = "sk-Nz3U2yrzWDvm6kFz0qHOImjGtK2xae6fXG1w49dNEItCZ1Na" 
BASE_URL = "https://crazyrouter.com/v1"
client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

# 🎯 在这里填写你想测试的文件夹名称
TEST_FOLDERS = [
    "A001_Tyson_Liberto",
    "A002_Tyson_Liberto",
    "A004_jenn_im"
]

# ================= 提示词配置库 =================

# 🔴 车间 1：字幕逐句翻译
PROMPT_TRANSLATE = """
角色：教育内容专家翻译（出版标准）
任务：将文本翻译成自然、流畅且准确的简体中文。

🎯 语气指导：
1. 自然且专业：中文应听起来自然地像母语者，但不要使用网络流行语。
2. 功能等效：以意义为主进行翻译而非逐字翻译，保持标准语气。

⛔ 严格输出规则（极其重要）：
必须输出严格的 JSON 对象（Object），绝对不要包含任何额外的解释、问候或 Markdown 标记。
格式必须完全如下所示：
{
  "data": [
    {"id": "s1", "zh": "中文翻译"},
    {"id": "s2", "zh": "中文翻译"}
  ]
}

待翻译字幕：
[TEXT]
"""

# 🔵 车间 2：教研核心通用军规
BASE_RULES = """
【选词铁血军规】
1. 实用至上：必须是日常口语、职场中高频使用的词汇或短语。
2. 避坑指南：优先挑选中国学生容易理解错、容易写成“中式英语”的内容。
3. 难度适中：不要提取小学生都会的基础词，聚焦在“看着眼熟但自己说不出口”的词。
4. 宁缺毋滥（最高优先级）：质量永远大于数量！如果字幕极短，或没有足够符合上述标准的词句，请仅提取实际符合的数量（甚至可以是 0 个）。绝对不要为了凑数而提取无意义的简单词汇或口水话！
⛔ 你必须且只能输出合法的 JSON 对象。绝对不要有任何 Markdown 代码块或开场白废话。
"""

# 🔵 子车间 2.1：单词
PROMPT_VOCAB = """
你是一个资深的英语教研专家。请阅读视频字幕，提取信息和核心单词。
[BASE_RULES]
【JSON 结构要求】
{
  "title": "用一句话总结视频标题（英文）",
  "description": "用1-2句话写一段中文的视频简介",
  "accent": "美音/英音/澳音/综合",
  "vocabularies": [
    {
      "word": "单词拼写",
      "phonetic": "音标，如 /tɛst/",
      "synonyms": "1-2个纯英文的近义表达(仅输出英文)，逗号隔开",
      "chinese_definition": "中文释义",
      "english_definition": "简短的英文释义",
      "example_from_video": "视频原句",
      "example_translation": "原句翻译",
      "first_appearance_time": 1.2
    }
  ]
}
【提取数量】：预期目标为 10-25 个。请严格遵守“宁缺毋滥”原则，实际符合多少就提取多少，达不到要求数量完全没关系。
字幕原文：[TEXT]
"""

# 🔵 子车间 2.2：短语
PROMPT_PHRASES = """
你是一个资深的英语教研专家。请阅读视频字幕，专注提取短语搭配。
[BASE_RULES]
【JSON 结构要求】
{
  "phrases": [
    {
      "phrase": "短语",
      "phonetic": "音标",
      "synonyms": "1-2个纯英文的近义表达(仅输出英文)，逗号隔开",
      "chinese_definition": "中文释义",
      "context": "视频原句",
      "context_translation": "原句翻译",
      "first_appearance_time": 1.2
    }
  ]
}
【提取数量】：预期目标为 10-25 个。请严格遵守“宁缺毋滥”原则，若视频中没有足够优质的短语搭配，请按实际情况提取，切勿凑数。
字幕原文：[TEXT]
"""

# 🔵 子车间 2.3：金句与地道表达
PROMPT_EXPRESSIONS = """
你是一个资深的英语教研专家。请阅读视频字幕，专注提取长难句或地道口语表达。
[BASE_RULES]
【JSON 结构要求】
{
  "expressions": [
    {
      "expression": "提取出的核心地道表达或金句",
      "expression_explanation": "<p>📝 <b>字幕原句：</b>[填入包含该表达的视频原句]</p>\\n<p>🇨🇳 <b>中文翻译：</b>[填入原句的自然中文翻译]</p>\\n<p>💡 <b>表达解析：</b><br>[解释该表达的精妙之处、底层逻辑，以及如何避免中式英语]</p>\\n<p>🎯 <b>使用场景：</b><br>[简明扼要说明适用场景，如：非正式至半正式/点餐、购物、服务场所]</p>\\n<p>🔄 <b>相似表达：</b><br>[1-2个纯英文的相似表达，如 I'll have / Can I get]</p>",
      "first_appearance_time": 1.2
    }
  ]
}
【提取数量】：预期目标为 4-10 个。如果没有足够的地道长难句或金句，提取 1-2 个甚至不提取都可以，坚决不要把普通的寒暄废话当作金句！
字幕原文：[TEXT]
"""

# ================= 运行逻辑 =================

def get_srt_data(folder_path):
    """同时获取用于翻译的 JSON 数组结构，和用于教研提取的纯文本结构"""
    srt_files = [f for f in os.listdir(folder_path) if f.endswith('.srt')]
    if not srt_files: return "", ""
    
    subs = pysrt.open(os.path.join(folder_path, srt_files[0]))
    
    # 提取纯文本（给教研车间用）
    text_for_ai = " ".join([sub.text.replace('\n', ' ') for sub in subs])
    
    # 提取数组结构（给翻译车间用，为了测试速度，只截取前 15 句）
    mini_subs = [{"id": f"s{i+1}", "en": sub.text.replace('\n', ' ')} for i, sub in enumerate(subs[:15])]
    json_for_translation = json.dumps(mini_subs, ensure_ascii=False)
    
    return text_for_ai, json_for_translation

def execute_prompt(prompt_template, input_data, task_name, md_file):
    """执行单个测试任务并写入报告"""
    print(f"    ⏳ 正在测试: {task_name}...")
    
    final_prompt = prompt_template.replace("[BASE_RULES]", BASE_RULES).replace("[TEXT]", input_data)
    md_file.write(f"### 🧪 提取任务: {task_name}\n")
    
    content = ""
    try:
        response = client.chat.completions.create(
            model="deepseek-v3.2",
            messages=[{"role": "user", "content": final_prompt}],
            response_format={"type": "json_object"},
            temperature=0.1 if "翻译" in task_name else 0.2 # 翻译任务需要更严谨，温度调低
        )
        content = response.choices[0].message.content
        content = content.replace("```json", "").replace("```", "").strip()
        
        parsed_json = json.loads(content)
        pretty_json = json.dumps(parsed_json, ensure_ascii=False, indent=2)
        
        md_file.write("```json\n")
        md_file.write(pretty_json)
        md_file.write("\n```\n\n")
        
    except Exception as e:
        print(f"    ❌ {task_name} 失败: {e}")
        md_file.write(f"> **❌ 提取报错**: `{e}`\n>\n> **原始脏数据**: \n```\n{content}\n```\n\n")


def run_test():
    print(f"\n🚀 启动全量 Prompt 调优沙盒 (含翻译)...")
    base_dir = "public/content"
    output_file = f"prompt_test_{datetime.now().strftime('%m%d_%H%M')}.md"

    with open(output_file, 'w', encoding='utf-8') as md:
        md.write("# 📊 核心教研提取效果测试报告\n\n")
        md.write(f"**测试生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        md.write("---\n\n")

        for folder_name in TEST_FOLDERS:
            folder_path = os.path.join(base_dir, folder_name)
            if not os.path.exists(folder_path):
                print(f"❌ 找不到文件夹: {folder_name}")
                continue

            print(f"\n🎬 正在处理视频: {folder_name}")
            text_for_ai, json_for_translation = get_srt_data(folder_path)
            if not text_for_ai:
                print(f"⚠️ {folder_name} 中没有 SRT 文件，已跳过")
                continue

            md.write(f"## 🎬 视频样本: `{folder_name}`\n\n")
            md.write("<details>\n<summary>👉 点击展开/折叠字幕原文</summary>\n\n")
            md.write(f"> {text_for_ai[:800]}... *(剩余原文已折叠)*\n\n") 
            md.write("</details>\n\n")

            # 🔴 增加的车间 1：翻译测试（注入的是 JSON 数组文本）
            execute_prompt(PROMPT_TRANSLATE, json_for_translation, "0. 逐句字幕翻译 (测试截取前15句)", md)
            
            # 🔵 原有的车间 2：教研提取测试（注入的是纯文本原文）
            execute_prompt(PROMPT_VOCAB, text_for_ai, "1. 基础信息与核心单词", md)
            execute_prompt(PROMPT_PHRASES, text_for_ai, "2. 核心短语搭配", md)
            execute_prompt(PROMPT_EXPRESSIONS, text_for_ai, "3. 地道表达与金句", md)
            
            md.write("---\n\n")
            print(f"  ✅ {folder_name} 全量测试完成！")

    print(f"\n🎉 验收报告已生成！请在 VS Code 中打开预览 `{output_file}` 文件。")

if __name__ == "__main__":
    run_test()