# 前端到数据库字段映射表

## 视频相关字段

| 前端字段 | 数据库字段 | 说明 |
|---------|------------|------|
| id | id | UUID 类型 |
| title | title | 视频标题 |
| description | description | 视频描述 |
| duration | duration | 视频时长，格式：MM:SS |
| difficulty | difficulty | 难度等级，单字符 |
| videoUrl | video_url | 视频文件 URL |

## 字幕相关字段

| 前端字段 | 数据库字段 | 说明 |
|---------|------------|------|
| id | id | UUID 类型 |
| startTime | start_time | 开始时间（秒） |
| endTime | end_time | 结束时间（秒） |
| en/english | content_en | 英文字幕内容 |
| zh/chinese | content_zh | 中文字幕内容 |

## 词汇相关字段

| 前端字段 | 数据库字段 | 说明 |
|---------|------------|------|
| id | id | UUID 类型 |
| word/phrase/expression | content | 词汇内容 |
| type | type | 类型：word/phrase/expression |
| phonetic | phonetic | 音标 |
| pos | pos | 词性 |
| chinese_definition/meaningCn | definition_zh | 中文释义 |
| english_definition/meaningEn | definition_en | 英文释义 |
| example_from_video/exampleEn | example_en | 英文示例 |
| example_translation/exampleCn | example_zh | 中文示例 |
| first_appearance_time | first_appearance_time | 首次出现时间（秒） |

### 表达式（Expression）特有字段

| 前端字段 | 数据库字段 | 说明 |
|---------|------------|------|
| analysis | analysis | 结构解析 |
| usageScene | usage_scene | 使用场景 |
| similar | similar_examples | 类似用法举例 |

## 用户交互相关字段

### 收藏记录

| 前端字段 | 数据库字段 | 说明 |
|---------|------------|------|
| itemId | item_id | 被收藏的词汇 ID |
| itemType | (通过关联词汇表获取) | 词汇类型 |
| isFav | (存在记录即为收藏) | 收藏状态 |

### 学习进度

| 前端字段 | 数据库字段 | 说明 |
|---------|------------|------|
| videoId | video_id | 视频 ID |
| status | status | 状态：unlearned/learning/learned |
| progress | progress | 学习进度（0-100） |
| lastLearnedAt | last_learned_at | 最后学习时间 |