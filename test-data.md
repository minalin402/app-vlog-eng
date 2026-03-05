# 视频详情页测试数据

## API 接口

视频详情接口在 [`lib/video-api.ts`](lib/video-api.ts:1) 中定义：

```typescript
interface VideoDetail {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  videoUrl: string;
  subtitles: SubtitleItem[];
  vocabularies?: VocabItem[];
  phrases?: PhraseItem[];
  expressions?: ExpressionItem[];
}
```

## 测试数据

完整的测试数据已集成到 [`lib/video-api.ts`](lib/video-api.ts:17) 中，包含：

- **视频ID**: `test_video_long_01`
- **标题**: MVP 核心引擎暴力测试：1分钟连续滚动与精读解析
- **时长**: 9:56
- **难度**: B
- **视频URL**: BigBuckBunny 公共测试视频
- **字幕**: 15条带有高亮标记的字幕（0-60秒）
- **词汇**: 3个单词（immersive, transition, teleport）
- **短语**: 2个短语（single-sentence loop, scrollbar is working）
- **地道表达**: 2个表达（point-to-read functionality, approaching the one-minute mark）

## 修改的文件

1. **[`lib/video-api.ts`](lib/video-api.ts:1)** - 新建API接口和测试数据
2. **[`app/videos/[id]/page.tsx`](app/videos/[id]/page.tsx:3)** - 集成视频详情API调用
3. **[`app/videos/[id]/components/video-learning/video-header.tsx`](app/videos/[id]/components/video-learning/video-header.tsx:5)** - 显示标题、时长、难度
4. **[`app/videos/[id]/components/video-learning/video-description.tsx`](app/videos/[id]/components/video-learning/video-description.tsx:5)** - 显示视频简介

## 验收步骤

1. 访问视频详情页 `/videos/1`
2. 检查页面顶部 [`VideoHeader`](app/videos/[id]/components/video-learning/video-header.tsx:8) 组件是否显示：
   - 视频标题："MVP 核心引擎暴力测试：1分钟连续滚动与精读解析"
   - 视频时长："9:56"
   - 难度等级："B"
3. 检查 [`VideoDescription`](app/videos/[id]/components/video-learning/video-description.tsx:7) 组件是否显示完整的描述文本
4. 检查视频播放器是否正确加载 BigBuckBunny 视频
5. 检查字幕列表是否正确显示15条字幕并支持自动滚动
6. 检查词汇面板是否显示3个单词、2个短语、2个地道表达

## 后端接入说明

当需要接入真实后端API时，只需修改 [`getVideoDetail`](lib/video-api.ts:93) 函数：

```typescript
export async function getVideoDetail(id: string): Promise<VideoDetail | null> {
  // 替换为实际的API调用
  const response = await fetch(`/api/videos/${id}`);
  if (!response.ok) return null;
  return await response.json();
}
```

## 注意事项

- 视频ID在 [`page.tsx`](app/videos/[id]/page.tsx:117) 中硬编码为 "1"，实际使用时应从路由参数获取
- 所有数据加载前会显示占位符"加载中..."
- 难度字段现在支持任意字符串值（如 "A", "B", "C" 或 "初级", "中级", "高级"）
- 字幕数据包含 `{{w|id|text}}`, `{{p|id|text}}`, `{{e|id|text}}` 标记用于高亮显示
