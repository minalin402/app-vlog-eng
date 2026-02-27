"use client"

import { VideoCard, type VideoData } from "@/components/video-card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

type FilterType = "all" | "completed" | "pending"

interface VideoGridProps {
  filter?: FilterType
}

const mockVideos: VideoData[] = [
  {
    id: 1,
    title: "谷爱凌：霸气回应质疑",
    description: "面对外界高期待，英语里怎么既直白又不失分寸地回应质疑？",
    thumbnail: "/images/thumb-1.jpg",
    duration: "1分钟",
    host: "Sydny Bill",
    accent: "美音",
    topics: ["观点表达", "个人成长"],
    difficulty: 2,
    date: "2026-02-24",
    completed: true,
    favorited: false,
  },
  {
    id: 2,
    title: "谷爱凌：为热爱去赢，为外婆勇敢",
    description: "分享谷爱凌的成长故事，她如何在中美两国文化中找到平衡与自信。",
    thumbnail: "/images/thumb-1.jpg",
    duration: "2分钟",
    host: "Sydny Bill",
    accent: "美音",
    topics: ["人物故事", "励志"],
    difficulty: 2,
    date: "2026-02-24",
    completed: true,
    favorited: false,
  },
  {
    id: 3,
    title: "体验新加坡\"国民早餐\"",
    description: "跟随旅行博主体验新加坡最地道的国民早餐——咖椰吐司和半熟鸡蛋。",
    thumbnail: "/images/thumb-2.jpg",
    duration: "2分钟",
    host: "Tom Scott",
    accent: "英音",
    topics: ["美食", "旅行"],
    difficulty: 1,
    date: "2026-02-24",
    completed: false,
    favorited: true,
  },
  {
    id: 4,
    title: "夜游新加坡滨海湾花园",
    description: "美轮美奂的灯光秀和超级树，这是新加坡最值得去的夜间景点。",
    thumbnail: "/images/thumb-3.jpg",
    duration: "2分钟",
    host: "Travel Max",
    accent: "美音",
    topics: ["旅行", "城市探索"],
    difficulty: 1,
    date: "2026-02-24",
    completed: true,
    favorited: false,
  },
  {
    id: 5,
    title: "洗头与理发准备",
    description: "美发沙龙中的日常英语对话场景，学习实用生活口语。",
    thumbnail: "/images/thumb-4.jpg",
    duration: "2分钟",
    host: "Lucy",
    accent: "英音",
    topics: ["日常生活", "口语"],
    difficulty: 1,
    date: "2026-02-24",
    completed: false,
    favorited: true,
  },
  {
    id: 6,
    title: "科技大会英语演讲精选",
    description: "从顶级科技大会中精选的英语演讲片段，学习专业表达和演讲技巧。",
    thumbnail: "/images/thumb-5.jpg",
    duration: "5分钟",
    host: "TechTalk",
    accent: "美音",
    topics: ["科技", "演讲"],
    difficulty: 4,
    date: "2026-02-23",
    completed: false,
    favorited: false,
  },
  {
    id: 7,
    title: "咖啡馆英语：点单与闲聊",
    description: "在咖啡馆场景中学习点单、闲聊等日常英语表达方式。",
    thumbnail: "/images/thumb-6.jpg",
    duration: "3分钟",
    host: "Emma",
    accent: "英音",
    topics: ["日常生活", "口语"],
    difficulty: 1,
    date: "2026-02-23",
    completed: false,
    favorited: false,
  },
  {
    id: 8,
    title: "如何用英语介绍中国美食",
    description: "学习用英语向外国朋友介绍火锅、饺子、北京烤鸭等经典中国美食。",
    thumbnail: "/images/thumb-2.jpg",
    duration: "4分钟",
    host: "Chris",
    accent: "美音",
    topics: ["美食", "文化"],
    difficulty: 3,
    date: "2026-02-22",
    completed: false,
    favorited: true,
  },
  {
    id: 9,
    title: "英语面试必备口语技巧",
    description: "面试场景中的高频英语句型和回答模板，助你自信应对英语面试。",
    thumbnail: "/images/thumb-5.jpg",
    duration: "6分钟",
    host: "Career Pro",
    accent: "美音",
    topics: ["职场", "口语"],
    difficulty: 4,
    date: "2026-02-21",
    completed: false,
    favorited: false,
  },
]

const ITEMS_PER_PAGE = 6

export function VideoGrid({ filter = "all" }: VideoGridProps) {
  const [page, setPage] = useState(1)
  
  // 根据筛选条件过滤视频
  const filteredVideos = mockVideos.filter(video => {
    if (filter === "all") return true
    if (filter === "completed") return video.completed
    if (filter === "pending") return !video.completed
    return true
  })

  // 计算分页
  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE)
  const displayedVideos = filteredVideos.slice(0, page * ITEMS_PER_PAGE)
  const hasMore = page * ITEMS_PER_PAGE < filteredVideos.length

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {displayedVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
      {hasMore && (
        <Button
          variant="outline"
          className="mx-auto"
          onClick={() => setPage(p => p + 1)}
        >
          加载更多
        </Button>
      )}
    </div>
  )
}
