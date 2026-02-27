// ─── 核心数据契约 ─────────────────────────────────────────────────────────────

export interface Video {
  /** 唯一标识（UUID 格式） */
  id: string
  /** 博主名字 */
  creator: string
  /** 口音 */
  accent: string
  /** 时长文字描述，如 "3:24" */
  duration: string
  /** 视频标题 */
  title: string
  /** 视频简介 */
  description: string
  /** 话题标签数组 */
  topics: string[]
  /** 难度（星号字符串） */
  difficulty: string
  /** 更新时间（ISO 字符串） */
  updateTime: string
  /** 封面图链接 */
  coverUrl: string
  /** 当前用户是否已收藏 */
  isFavorite: boolean
  /** 学习状态（供筛选使用） */
  status: "learned" | "unlearned"
}

// ─── 15 条真实感 Mock 数据 ────────────────────────────────────────────────────

export const mockVideos: Video[] = [
  {
    id: "83a86521-afec-4f04-a641-49530630eb22",
    creator: "谷爱凌",
    accent: "美音",
    duration: "1:02",
    title: "Eileen Gu: I ski to win, but more to inspire",
    description:
      "谷爱凌在接受 ESPN 专访时，分享了她对竞技体育与自我价值的深度思考，语速适中，词汇精准。",
    topics: ["励志", "体育"],
    difficulty: "⭐⭐",
    updateTime: "2024-02-14T08:00:00Z",
    coverUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=640&q=80",
    isFavorite: true,
    status: "learned",
  },
  {
    id: "c1f2e3d4-0001-4a5b-8c9d-111111111111",
    creator: "谷爱凌",
    accent: "美音",
    duration: "2:18",
    title: "Eileen Gu: Skiing for my grandmother",
    description:
      "她讲述了外婆对自己人生观的深远影响，情感真挚，是练习叙事英语的优质素材。",
    topics: ["励志", "人物故事"],
    difficulty: "⭐⭐",
    updateTime: "2024-03-01T10:00:00Z",
    coverUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80",
    isFavorite: false,
    status: "learned",
  },
  {
    id: "c1f2e3d4-0002-4a5b-8c9d-222222222222",
    creator: "Tom Scott",
    accent: "英音",
    duration: "2:45",
    title: "The Singaporean Breakfast You've Never Heard Of",
    description:
      "Tom Scott 实地探访新加坡街头早餐文化，口语地道，夹杂大量日常表达，适合中级学习者。",
    topics: ["美食", "旅行"],
    difficulty: "⭐",
    updateTime: "2024-01-20T09:00:00Z",
    coverUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=640&q=80",
    isFavorite: false,
    status: "unlearned",
  },
  {
    id: "c1f2e3d4-0003-4a5b-8c9d-333333333333",
    creator: "Travel Max",
    accent: "美音",
    duration: "2:33",
    title: "Singapore Night Safari: Gardens by the Bay",
    description:
      "旅行博主夜游滨海湾花园，全程英文解说，景色壮观，对话节奏舒缓，适合新手入门。",
    topics: ["旅行"],
    difficulty: "⭐",
    updateTime: "2024-01-15T12:00:00Z",
    coverUrl: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=640&q=80",
    isFavorite: true,
    status: "learned",
  },
  {
    id: "c1f2e3d4-0004-4a5b-8c9d-444444444444",
    creator: "Lucy",
    accent: "英音",
    duration: "2:05",
    title: "Getting Ready: Hair Wash and Salon Prep",
    description:
      "生活类 Vlog，Lucy 展示去理发店前的日常准备，词汇生活化，发音清晰，适合入门练耳。",
    topics: ["日常生活"],
    difficulty: "⭐",
    updateTime: "2024-04-10T07:30:00Z",
    coverUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=640&q=80",
    isFavorite: false,
    status: "unlearned",
  },
  {
    id: "c1f2e3d4-0005-4a5b-8c9d-555555555555",
    creator: "TechTalk",
    accent: "美音",
    duration: "5:14",
    title: "Highlights from CES 2024: AI Takes Center Stage",
    description:
      "精选 CES 大会中 AI 相关演讲片段，术语密集，适合科技方向高级学习者进行词汇强化。",
    topics: ["科技"],
    difficulty: "⭐⭐⭐⭐",
    updateTime: "2024-01-25T11:00:00Z",
    coverUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=640&q=80",
    isFavorite: false,
    status: "unlearned",
  },
  {
    id: "c1f2e3d4-0006-4a5b-8c9d-666666666666",
    creator: "Emma",
    accent: "英音",
    duration: "4:52",
    title: "English at the Café: Ordering and Small Talk",
    description:
      "模拟咖啡馆场景，涵盖点单、闲聊及礼貌拒绝的实用口语，是旅行英语的经典练习材料。",
    topics: ["日常生活"],
    difficulty: "⭐",
    updateTime: "2024-05-08T09:15:00Z",
    coverUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=640&q=80",
    isFavorite: false,
    status: "unlearned",
  },
  {
    id: "c1f2e3d4-0007-4a5b-8c9d-777777777777",
    creator: "Chris",
    accent: "澳音",
    duration: "4:30",
    title: "How to Talk About Chinese Food in English",
    description:
      "Chris 用幽默有趣的方式介绍如何用英文描述中华料理，融合文化对比，寓教于乐。",
    topics: ["美食"],
    difficulty: "⭐⭐⭐",
    updateTime: "2024-03-22T14:00:00Z",
    coverUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=640&q=80",
    isFavorite: false,
    status: "unlearned",
  },
  {
    id: "c1f2e3d4-0008-4a5b-8c9d-888888888888",
    creator: "Career Pro",
    accent: "美音",
    duration: "11:20",
    title: "10 English Phrases That Will Ace Your Job Interview",
    description:
      "系统梳理英文面试高频表达，每个短语配真实场景示例，是求职前的必备冲刺素材。",
    topics: ["职场"],
    difficulty: "⭐⭐⭐⭐",
    updateTime: "2024-02-28T16:00:00Z",
    coverUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=640&q=80",
    isFavorite: false,
    status: "unlearned",
  },
  {
    id: "c1f2e3d4-0009-4a5b-8c9d-999999999999",
    creator: "BBC Earth",
    accent: "英音",
    duration: "12:05",
    title: "The Great Barrier Reef: Secrets Beneath the Surface",
    description:
      "BBC 经典纪录片片段，David Attenborough 旁白浑厚，词汇考究，是提升学术英语听力的绝佳素材。",
    topics: ["自然"],
    difficulty: "⭐⭐⭐⭐⭐",
    updateTime: "2024-01-10T08:00:00Z",
    coverUrl: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=640&q=80",
    isFavorite: true,
    status: "unlearned",
  },
  {
    id: "c1f2e3d4-0010-4a5b-8c9d-aaaaaaaaaaaa",
    creator: "Travel Max",
    accent: "美音",
    duration: "4:40",
    title: "London Vlog: One Day, Five Hidden Gems",
    description:
      "旅行博主带你一日游伦敦冷门打卡地，口语自然随意，适合练习听懂快语速美音的学习者。",
    topics: ["旅行"],
    difficulty: "⭐⭐",
    updateTime: "2024-04-01T10:00:00Z",
    coverUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=640&q=80",
    isFavorite: false,
    status: "learned",
  },
  {
    id: "c1f2e3d4-0011-4a5b-8c9d-bbbbbbbbbbbb",
    creator: "TED",
    accent: "美音",
    duration: "14:37",
    title: "5 Ways to Change Your Mind — TED Talk",
    description:
      "TED 演讲精华，演讲者语速快且逻辑严密，大量使用连接词和隐喻，适合高级听力训练。",
    topics: ["励志"],
    difficulty: "⭐⭐⭐⭐⭐",
    updateTime: "2024-02-05T09:00:00Z",
    coverUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=640&q=80",
    isFavorite: false,
    status: "unlearned",
  },
  {
    id: "c1f2e3d4-0012-4a5b-8c9d-cccccccccccc",
    creator: "Emma",
    accent: "英音",
    duration: "2:10",
    title: "How to Politely Decline an Invitation in English",
    description:
      "Emma 演示如何用地道英语礼貌婉拒邀约，短句密集，配合场景演练，实用度极高。",
    topics: ["日常生活"],
    difficulty: "⭐⭐",
    updateTime: "2024-05-20T11:00:00Z",
    coverUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=640&q=80",
    isFavorite: true,
    status: "learned",
  },
  {
    id: "c1f2e3d4-0013-4a5b-8c9d-dddddddddddd",
    creator: "TechTalk",
    accent: "美音",
    duration: "4:55",
    title: "Silicon Valley Startup Pitch: What Makes It Work",
    description:
      "解析真实硅谷创业路演精华片段，涵盖 Pitch Deck 常用英语表达，适合商务英语方向学习者。",
    topics: ["科技", "职场"],
    difficulty: "⭐⭐⭐⭐",
    updateTime: "2024-03-15T15:00:00Z",
    coverUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=640&q=80",
    isFavorite: false,
    status: "unlearned",
  },
  {
    id: "c1f2e3d4-0014-4a5b-8c9d-eeeeeeeeeeee",
    creator: "Tom Scott",
    accent: "英音",
    duration: "4:12",
    title: "The World's Strangest Border: Two Countries, One Town",
    description:
      "Tom Scott 探访世界上最奇怪的国界线，全程走路采访风格，信息量大，英音标准流畅。",
    topics: ["旅行", "人物故事"],
    difficulty: "⭐⭐⭐",
    updateTime: "2024-01-30T08:00:00Z",
    coverUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80",
    isFavorite: false,
    status: "unlearned",
  },
]
