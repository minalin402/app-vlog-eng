// TypeScript 接口定义
export interface Video {
  id: string
  title: string
  status: "learned" | "unlearned"
  difficulty: string
  duration: string
  creator: string
  topic: string
}

// 15 条覆盖不同维度组合的测试数据
export const mockVideos: Video[] = [
  {
    id: "v001",
    title: "谷爱凌：霸气回应质疑",
    status: "learned",
    difficulty: "⭐⭐",
    duration: "1分钟内",
    creator: "谷爱凌",
    topic: "励志",
  },
  {
    id: "v002",
    title: "谷爱凌：为热爱去赢，为外婆勇敢",
    status: "learned",
    difficulty: "⭐⭐",
    duration: "2分钟内",
    creator: "谷爱凌",
    topic: "人物故事",
  },
  {
    id: "v003",
    title: "体验新加坡\"国民早餐\"",
    status: "unlearned",
    difficulty: "⭐",
    duration: "2分钟内",
    creator: "Tom Scott",
    topic: "美食",
  },
  {
    id: "v004",
    title: "夜游新加坡滨海湾花园",
    status: "learned",
    difficulty: "⭐",
    duration: "2分钟内",
    creator: "Travel Max",
    topic: "旅行",
  },
  {
    id: "v005",
    title: "洗头与理发准备",
    status: "unlearned",
    difficulty: "⭐",
    duration: "2分钟内",
    creator: "Lucy",
    topic: "日常生活",
  },
  {
    id: "v006",
    title: "科技大会英语演讲精选",
    status: "unlearned",
    difficulty: "⭐⭐⭐⭐",
    duration: "5分钟内",
    creator: "TechTalk",
    topic: "科技",
  },
  {
    id: "v007",
    title: "咖啡馆英语：点单与闲聊",
    status: "unlearned",
    difficulty: "⭐",
    duration: "5分钟内",
    creator: "Emma",
    topic: "日常生活",
  },
  {
    id: "v008",
    title: "如何用英语介绍中国美食",
    status: "unlearned",
    difficulty: "⭐⭐⭐",
    duration: "5分钟内",
    creator: "Chris",
    topic: "美食",
  },
  {
    id: "v009",
    title: "英语面试必备口语技巧",
    status: "unlearned",
    difficulty: "⭐⭐⭐⭐",
    duration: "10分钟以上",
    creator: "Career Pro",
    topic: "职场",
  },
  {
    id: "v010",
    title: "BBC 纪录片：大堡礁的秘密",
    status: "unlearned",
    difficulty: "⭐⭐⭐⭐⭐",
    duration: "10分钟以上",
    creator: "BBC Earth",
    topic: "自然",
  },
  {
    id: "v011",
    title: "London Vlog：一日游探店",
    status: "learned",
    difficulty: "⭐⭐",
    duration: "5分钟内",
    creator: "Travel Max",
    topic: "旅行",
  },
  {
    id: "v012",
    title: "TED Talk：改变思维的五个方法",
    status: "unlearned",
    difficulty: "⭐⭐⭐⭐⭐",
    duration: "10分钟以上",
    creator: "TED",
    topic: "励志",
  },
  {
    id: "v013",
    title: "日常口语：怎么礼貌拒绝邀请",
    status: "learned",
    difficulty: "⭐⭐",
    duration: "2分钟内",
    creator: "Emma",
    topic: "日常生活",
  },
  {
    id: "v014",
    title: "硅谷创业英语：Pitch 精华片段",
    status: "unlearned",
    difficulty: "⭐⭐⭐⭐",
    duration: "5分钟内",
    creator: "TechTalk",
    topic: "科技",
  },
  {
    id: "v015",
    title: "Tom Scott：世界上最奇怪的边境",
    status: "unlearned",
    difficulty: "⭐⭐⭐",
    duration: "5分钟内",
    creator: "Tom Scott",
    topic: "旅行",
  },
]
