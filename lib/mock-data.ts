import type { VideoCardData } from "@/components/video-card"

export const allVideos: VideoCardData[] = [
  {
    id: 1,
    title: "谷爱凌：霸气回应质疑",
    thumbnail: "/images/thumb-1.jpg",
    duration: "1分钟",
    progress: "看至9%",
    date: "学习于今天",
    completed: true,
    favorited: false,
  },
  {
    id: 2,
    title: "谷爱凌：为热爱去赢，为奶奶勇敢",
    thumbnail: "/images/thumb-2.jpg",
    duration: "2分钟",
    progress: "看至0%",
    date: "学习于今天",
    completed: true,
    favorited: false,
  },
  {
    id: 3,
    title: "体验新加坡\u201C国民早餐\u201D",
    thumbnail: "/images/thumb-3.jpg",
    duration: "2分钟",
    progress: "看至0%",
    date: "学习于今天",
    completed: false,
    favorited: false,
  },
  {
    id: 4,
    title: "夜游新加坡滨海湾花园",
    thumbnail: "/images/thumb-4.jpg",
    duration: "2分钟",
    progress: "看至100%",
    date: "学习于今天",
    completed: true,
    favorited: false,
  },
  {
    id: 5,
    title: "洗头与理发准备",
    thumbnail: "/images/thumb-5.jpg",
    duration: "2分钟",
    progress: "看至0%",
    date: "学习于今天",
    completed: false,
    favorited: true,
  },
]

export function getRecentVideos() {
  return allVideos
}

export function getCompletedVideos() {
  return allVideos.filter((v) => v.completed).map((v) => ({
    ...v,
    date: "完成于今天",
  }))
}


