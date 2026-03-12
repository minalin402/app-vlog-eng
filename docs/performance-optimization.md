# 首页性能优化文档

## 优化背景

**优化前性能指标：**
- Lighthouse 性能评分：71 分
- LCP (Largest Contentful Paint)：4.5s ⚠️
- FCP (First Contentful Paint)：1.2s ✅

**核心问题：**
1. 首页使用客户端渲染 (CSR)，存在严重的请求瀑布流
2. 数据获取在客户端进行，导致白屏等待时间长
3. 首屏关键图片没有设置加载优先级
4. 图片 sizes 属性未配置，移动端可能加载过大的图片

---

## 优化方案

### 1. 首页数据获取重构为 SSR

#### 修改文件：`app/page.tsx`

**优化前：**
```tsx
"use client"

export default function DashboardPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    fetchAllVideoData().then((data) => {
      setVideos(data)
      setIsLoading(false)
    })
  }, [])
  
  // ...
}
```

**优化后：**
```tsx
// 移除 "use client"，改为服务端组件
import { createClient } from "@/lib/supabase-server"

async function fetchAllVideoData() {
  const supabase = await createClient()
  // 在服务端直接获取数据
  const [videosResult, favoritesResult] = await Promise.all([
    supabase.from('videos').select('*').order('created_at', { ascending: false }),
    supabase.from('user_favorites').select('video_id').eq('user_id', user.id)
  ])
  // ...
}

export default async function DashboardPage() {
  const initialVideos = await fetchAllVideoData()
  return <DashboardClient initialVideos={initialVideos} />
}
```

**优化效果：**
- ✅ 消除客户端请求瀑布流
- ✅ 数据在服务端并行获取，减少往返次数
- ✅ 首屏 HTML 直接包含数据，无白屏等待
- ✅ 更好的 SEO 支持

---

### 2. 创建客户端交互组件

#### 新增文件：`app/dashboard-client.tsx`

将需要客户端交互的部分（筛选、排序等）拆分到独立的客户端组件：

```tsx
"use client"

export function DashboardClient({ initialVideos }: { initialVideos: Video[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({...})
  // 客户端交互逻辑
}
```

**架构优势：**
- 服务端组件负责数据获取
- 客户端组件负责交互逻辑
- 最小化客户端 JavaScript 体积

---

### 3. 优化 LCP 关键图片加载

#### 修改文件：`app/components/video-card.tsx`

**优化前：**
```tsx
export function VideoCard({ video }: { video: Video }) {
  return (
    <Image 
      src={video.cover_url} 
      alt={video.title} 
      fill 
    />
  )
}
```

**优化后：**
```tsx
interface VideoCardProps {
  video: Video
  priority?: boolean  // 新增 priority 属性
}

export function VideoCard({ video, priority = false }: VideoCardProps) {
  return (
    <Image 
      src={video.cover_url} 
      alt={video.title} 
      fill 
      priority={priority}  // 首屏图片优先加载
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  )
}
```

---

### 4. 为首屏视频卡片设置优先级

#### 修改文件：`app/components/video-grid.tsx`

```tsx
export function VideoGrid({ initialVideos, ... }: VideoGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {displayedVideos.map((video, index) => (
        <VideoCard 
          key={video.id} 
          video={video}
          priority={index < 4}  // 前 4 个视频设置 priority
        />
      ))}
    </div>
  )
}
```

**优化效果：**
- ✅ 前 4 个封面图设置 `priority={true}`
- ✅ 浏览器在解析 HTML 时立即预加载这些图片
- ✅ `fetchPriority="high"` 自动应用
- ✅ 显著降低 LCP 时间

---

### 5. 配置响应式图片尺寸

#### sizes 属性说明

```tsx
sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
```

**含义：**
- 移动端 (≤640px)：图片宽度为视口的 100%
- 平板端 (641-1024px)：图片宽度为视口的 50%（2 列布局）
- 桌面端 (>1024px)：图片宽度为视口的 33%（3 列布局）

**优化效果：**
- ✅ 移动端不会加载 4K 原图
- ✅ 根据设备自动选择合适尺寸
- ✅ 减少带宽消耗和加载时间

---

## 预期性能提升

### 优化前后对比

| 指标 | 优化前 | 预期优化后 | 提升 |
|------|--------|------------|------|
| **Lighthouse 性能评分** | 71 分 | 85-95 分 | +14-24 分 |
| **LCP** | 4.5s | 1.5-2.0s | -2.5-3.0s |
| **FCP** | 1.2s | 0.8-1.0s | -0.2-0.4s |
| **首屏白屏时间** | ~3s | ~0s | 消除白屏 |
| **TTI (Time to Interactive)** | ~5s | ~2.5s | -2.5s |

### 关键改进点

1. **消除 CSR 瀑布流**
   - 原：HTML → JS → 认证 → 获取视频 → 获取收藏 → 渲染
   - 新：HTML（含数据）→ 渲染

2. **优化关键渲染路径**
   - 首屏图片立即开始加载
   - 减少阻塞渲染的 JavaScript

3. **响应式图片优化**
   - 移动端加载小尺寸图片
   - 减少不必要的带宽消耗

---

## 验证方法

### 1. 本地测试

```bash
npm run build
npm run start
```

在生产模式下测试，开发模式性能不具代表性。

### 2. Lighthouse 测试

1. 打开 Chrome DevTools
2. 切换到 Lighthouse 标签
3. 选择 "Performance" 模式
4. 点击 "Analyze page load"

### 3. 关键指标检查

- **LCP**：应该 < 2.5s（绿色）
- **FCP**：应该 < 1.8s（绿色）
- **CLS**：应该 < 0.1（绿色）
- **TTI**：应该 < 3.8s（绿色）

### 4. Network 面板验证

检查首屏图片是否设置了 `fetchpriority="high"`：

```html
<img 
  src="..." 
  fetchpriority="high"  <!-- 应该存在 -->
  loading="eager"       <!-- priority 图片应该是 eager -->
/>
```

---

## 注意事项

### 1. 服务端组件限制

- ❌ 不能使用 `useState`、`useEffect` 等 React Hooks
- ❌ 不能使用浏览器 API（`window`、`localStorage` 等）
- ✅ 可以直接访问数据库和文件系统
- ✅ 可以使用 `async/await`

### 2. 客户端组件使用场景

需要使用客户端组件的情况：
- 需要使用 React Hooks
- 需要事件监听（onClick、onChange 等）
- 需要使用浏览器 API
- 需要使用第三方客户端库

### 3. 图片优化最佳实践

- 首屏可见的图片：`priority={true}`
- 首屏不可见的图片：`loading="lazy"`（默认）
- 始终配置 `sizes` 属性
- 使用 WebP 格式（Next.js Image 自动处理）

### 4. 缓存策略

服务端组件默认会被缓存，如果需要动态数据：

```tsx
// 禁用缓存
export const dynamic = 'force-dynamic'

// 或设置重新验证时间
export const revalidate = 60 // 60 秒
```

---

## 后续优化建议

### 1. 图片 CDN 优化

- 使用 CDN 加速图片加载
- 配置 `next.config.ts` 的 `images.remotePatterns`

### 2. 预加载关键资源

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <link rel="preconnect" href="https://your-supabase-url.supabase.co" />
        <link rel="dns-prefetch" href="https://your-cdn.com" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 3. 实现增量静态生成 (ISR)

对于不经常变化的页面，可以使用 ISR：

```tsx
export const revalidate = 3600 // 每小时重新生成
```

### 4. 添加 Skeleton Loading

虽然 SSR 消除了白屏，但可以为客户端交互添加骨架屏：

```tsx
<Suspense fallback={<VideoGridSkeleton />}>
  <VideoGrid />
</Suspense>
```

---

## 相关文档

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)

---

## 更新日志

- **2026-03-09**：完成首页 SSR 重构和图片优化
  - 将 `app/page.tsx` 改造为服务端组件
  - 创建 `app/dashboard-client.tsx` 处理客户端交互
  - 为 `VideoCard` 添加 `priority` 和 `sizes` 属性
  - 为首屏前 4 个视频卡片设置优先加载
