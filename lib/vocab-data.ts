export interface ExampleSentence {
  en: string
  zh: string
}

export interface WordItem {
  word: string
  phonetic: string
  pos: string
  meaningZh: string
  meaningEn: string
  examples: ExampleSentence[]
}

export interface PhraseItem {
  phrase: string
  pos: string
  meaningZh: string
  meaningEn: string
  examples: ExampleSentence[]
}

export interface ExpressionItem {
  expression: string
  subtitleEn: string
  subtitleZh: string
  analysis: string
  usage: string
  similar: string
  example: ExampleSentence
  timestamp: string
}

export interface VideoItem {
  id: string
  title: string
  active?: boolean
}

export const videos: VideoItem[] = [
  { id: "1", title: "谷爱凌：霸气回应质疑", active: true },
  { id: "2", title: "谷爱凌：为热爱去赢，为奶奶勇敢" },
  { id: "3", title: "体验新加坡\"国民早餐\"" },
  { id: "4", title: "Birta的冬日穿搭分享" },
  { id: "5", title: "夜游新加坡滨海湾花园" },
  { id: "6", title: "2026年最有\"钱\"景的5个创意小生意" },
  { id: "7", title: "网红超市Erewhon的商业秘密" },
  { id: "8", title: "商场散步让我解压" },
  { id: "9", title: "致那些感觉人生\"掉队\"的人" },
  { id: "10", title: "伦敦超火的香蕉布丁" },
]

export const words: WordItem[] = [
  {
    word: "silver",
    phonetic: "/ˈsɪlvər/",
    pos: "n.",
    meaningZh: "银牌；银",
    meaningEn: "silver medal, second place",
    examples: [
      {
        en: '"Do you see, um, these as two silvers gained or two golds lost?"',
        zh: '"你会把这看作赢得了两枚银牌，还是错失了两枚金牌？"',
      },
      {
        en: '"She won a silver medal in the 100m dash."',
        zh: '"她在百米短跑中获得了银牌。"',
      },
    ],
  },
  {
    word: "gold",
    phonetic: "/ɡoʊld/",
    pos: "n.",
    meaningZh: "金牌；金",
    meaningEn: "gold medal, first place",
    examples: [
      {
        en: '"Do you see, um, these as two silvers gained or two golds lost?"',
        zh: '"你会把这看作赢得了两枚银牌，还是错失了两枚金牌？"',
      },
    ],
  },
  {
    word: "gain",
    phonetic: "/ɡeɪn/",
    pos: "vt.",
    meaningZh: "获得；赢得",
    meaningEn: "obtain, secure",
    examples: [
      {
        en: '"Do you see, um, these as two silvers gained or two golds lost?"',
        zh: '"你会把这看作赢得了两枚银牌，还是错失了两枚金牌？"',
      },
    ],
  },
  {
    word: "decorate",
    phonetic: "/ˈdekəreɪt/",
    pos: "vt.",
    meaningZh: "授予荣誉；使获奖",
    meaningEn: "honor, award",
    examples: [
      {
        en: '"I\'m the most decorated free skier... female free skier in history."',
        zh: '"我是历史上拿到奖牌最多的自由式滑雪选手……女性自由式滑雪选手。"',
      },
    ],
  },
  {
    word: "female",
    phonetic: "/ˈfiːmeɪl/",
    pos: "adj.",
    meaningZh: "女性的",
    meaningEn: "women's, feminine",
    examples: [
      {
        en: '"I\'m the most decorated free skier... female free skier in history."',
        zh: '"我是历史上拿到奖牌最多的自由式滑雪选手……女性自由式滑雪选手。"',
      },
    ],
  },
  {
    word: "athlete",
    phonetic: "/ˈæθliːt/",
    pos: "n.",
    meaningZh: "运动员",
    meaningEn: "sportsperson, competitor",
    examples: [
      {
        en: '"Winning a medal at the Olympics is a life-changing experience for every athlete."',
        zh: '"对每位运动员来说，在奥运会上拿到一枚奖牌都是会改变人生的经历。"',
      },
    ],
  },
  {
    word: "medal",
    phonetic: "/ˈmedəl/",
    pos: "n.",
    meaningZh: "奖牌",
    meaningEn: "award, honor",
    examples: [
      {
        en: '"Winning a medal at the Olympics is a life-changing experience for every athlete."',
        zh: '"对每位运动员来说，在奥运会上拿到一枚奖牌都是会改变人生的经历。"',
      },
    ],
  },
  {
    word: "exponentially",
    phonetic: "/ˌekspəˈnenʃəli/",
    pos: "adv.",
    meaningZh: "以指数级地",
    meaningEn: "dramatically, rapidly",
    examples: [
      {
        en: '"Doing it five times is exponentially harder."',
        zh: '"而做到五次，难度是指数级地更高。"',
      },
    ],
  },
  {
    word: "pressure",
    phonetic: "/ˈpreʃər/",
    pos: "n.",
    meaningZh: "压力",
    meaningEn: "stress, tension",
    examples: [
      {
        en: '"There\'s a lot of pressure on young athletes to perform."',
        zh: '"年轻运动员面临着很大的表现压力。"',
      },
    ],
  },
  {
    word: "qualify",
    phonetic: "/ˈkwɒlɪfaɪ/",
    pos: "vi.",
    meaningZh: "取得资格",
    meaningEn: "be eligible, meet requirements",
    examples: [
      {
        en: '"She qualified for the Olympics at just 18 years old."',
        zh: '"她年仅18岁就获得了奥运资格。"',
      },
    ],
  },
  {
    word: "inspire",
    phonetic: "/ɪnˈspaɪər/",
    pos: "vt.",
    meaningZh: "激励；鼓舞",
    meaningEn: "motivate, encourage",
    examples: [
      {
        en: '"Her story continues to inspire millions around the world."',
        zh: '"她的故事继续激励着全世界数百万人。"',
      },
    ],
  },
  {
    word: "compete",
    phonetic: "/kəmˈpiːt/",
    pos: "vi.",
    meaningZh: "竞争；比赛",
    meaningEn: "contend, participate",
    examples: [
      {
        en: '"She loves to compete at the highest level."',
        zh: '"她热爱在最高水平上竞争。"',
      },
    ],
  },
  {
    word: "champion",
    phonetic: "/ˈtʃæmpiən/",
    pos: "n.",
    meaningZh: "冠军",
    meaningEn: "winner, victor",
    examples: [
      {
        en: '"She became the youngest champion in the sport\'s history."',
        zh: '"她成为了这项运动历史上最年轻的冠军。"',
      },
    ],
  },
  {
    word: "triumph",
    phonetic: "/ˈtraɪʌmf/",
    pos: "n.",
    meaningZh: "胜利；成就",
    meaningEn: "victory, achievement",
    examples: [
      {
        en: '"It was a personal triumph for her after years of training."',
        zh: '"经过多年训练，这对她来说是个人的胜利。"',
      },
    ],
  },
  {
    word: "dedication",
    phonetic: "/ˌdedɪˈkeɪʃən/",
    pos: "n.",
    meaningZh: "奉献；专注",
    meaningEn: "commitment, devotion",
    examples: [
      {
        en: '"Her dedication to the sport is unmatched."',
        zh: '"她对这项运动的奉献无人能及。"',
      },
    ],
  },
  {
    word: "resilient",
    phonetic: "/rɪˈzɪliənt/",
    pos: "adj.",
    meaningZh: "有韧性的",
    meaningEn: "tough, adaptable",
    examples: [
      {
        en: '"Athletes need to be mentally resilient."',
        zh: '"运动员需要有强大的心理韧性。"',
      },
    ],
  },
  {
    word: "podium",
    phonetic: "/ˈpoʊdiəm/",
    pos: "n.",
    meaningZh: "领奖台",
    meaningEn: "platform, stage",
    examples: [
      {
        en: '"Standing on that podium was the greatest moment of her career."',
        zh: '"站在领奖台上��她职业生涯中最伟大的时刻。"',
      },
    ],
  },
]

export const phrases: PhraseItem[] = [
  {
    phrase: "a life-changing experience",
    pos: "phr.",
    meaningZh: "改变人生的经历",
    meaningEn: "an event that profoundly alters one's life",
    examples: [
      {
        en: '"Winning a medal at the Olympics is a life-changing experience."',
        zh: '"在奥运会上赢得奖牌是改变人生的经历。"',
      },
      {
        en: '"Traveling alone was a life-changing experience for her."',
        zh: '"独自旅行对她来说是一次改变人生的经历。"',
      },
    ],
  },
  {
    phrase: "at the highest level",
    pos: "phr.",
    meaningZh: "在最高水平上",
    meaningEn: "at the top tier of performance",
    examples: [
      {
        en: '"She competes at the highest level in her sport."',
        zh: '"她在自己的运动项目中以最高水平竞争。"',
      },
    ],
  },
  {
    phrase: "break the record",
    pos: "phr.",
    meaningZh: "打破纪录",
    meaningEn: "surpass a previous best achievement",
    examples: [
      {
        en: '"She broke the record with an incredible performance."',
        zh: '"她以令人难以置信的表现打破了纪录。"',
      },
    ],
  },
  {
    phrase: "push the boundaries",
    pos: "phr.",
    meaningZh: "突破极限",
    meaningEn: "go beyond the usual limits",
    examples: [
      {
        en: '"She always pushes the boundaries of what\'s possible."',
        zh: '"她总是突破可能性的极限。"',
      },
    ],
  },
  {
    phrase: "rise to the occasion",
    pos: "phr.",
    meaningZh: "迎接挑战",
    meaningEn: "perform well when it matters most",
    examples: [
      {
        en: '"Great athletes always rise to the occasion."',
        zh: '"伟大的运动员总能迎接挑战。"',
      },
    ],
  },
  {
    phrase: "under pressure",
    pos: "phr.",
    meaningZh: "在压力下",
    meaningEn: "in a stressful situation",
    examples: [
      {
        en: '"She performs brilliantly under pressure."',
        zh: '"她在压力下表现得非常出色。"',
      },
    ],
  },
  {
    phrase: "give it your all",
    pos: "phr.",
    meaningZh: "全力以赴",
    meaningEn: "put in maximum effort",
    examples: [
      {
        en: '"You have to give it your all if you want to win."',
        zh: '"如果你想赢，就必须全力以赴。"',
      },
    ],
  },
  {
    phrase: "stand out from the crowd",
    pos: "phr.",
    meaningZh: "脱颖而出",
    meaningEn: "be noticeably different or better",
    examples: [
      {
        en: '"Her talent helps her stand out from the crowd."',
        zh: '"她的天赋让她脱颖而出。"',
      },
    ],
  },
  {
    phrase: "in the spotlight",
    pos: "phr.",
    meaningZh: "在聚光灯下",
    meaningEn: "receiving public attention",
    examples: [
      {
        en: '"Young athletes are often in the spotlight."',
        zh: '"年轻运动员常常处于聚光灯下。"',
      },
    ],
  },
  {
    phrase: "make history",
    pos: "phr.",
    meaningZh: "创造历史",
    meaningEn: "do something that has never been done before",
    examples: [
      {
        en: '"She made history by winning three gold medals."',
        zh: '"她通过赢得三枚金牌创造了历史。"',
      },
    ],
  },
  {
    phrase: "on top of the world",
    pos: "phr.",
    meaningZh: "高兴极了；如日中天",
    meaningEn: "feeling extremely happy or successful",
    examples: [
      {
        en: '"After her victory, she felt on top of the world."',
        zh: '"获胜后，她感觉自己站在世界之巅。"',
      },
    ],
  },
  {
    phrase: "set the bar high",
    pos: "phr.",
    meaningZh: "树立高标准",
    meaningEn: "establish a high standard",
    examples: [
      {
        en: '"She sets the bar high for future competitors."',
        zh: '"她为未来的竞争者树立了高标准。"',
      },
    ],
  },
]

export const expressions: ExpressionItem[] = [
  {
    expression: "in and of itself",
    subtitleEn: "I think that's an answer in and of itself.",
    subtitleZh: "我觉得这本身就是答案。",
    analysis:
      '这个表达表示"就其本身而言"，强调某件事单独成立就足以说明问题，不需要再补充外部理由。口语里常用来收束争论、给出结论，语气简洁但很有分量。',
    usage: '用于回答质疑、强调"这本身就是证明"的场景。',
    similar: "by itself / in itself",
    example: {
      en: "I think that's an answer in and of itself.",
      zh: "我觉得这本身就是答案。",
    },
    timestamp: "9.80s - 12.37s",
  },
  {
    expression: "at the end of the day",
    subtitleEn: "At the end of the day, it's about passion.",
    subtitleZh: "归根结底，这是关于热爱。",
    analysis:
      '这个表达意为"归根结底、说到底"，用于总结或表达最终的观点。在口语中非常常见，用来引出最重要的结论。',
    usage: "用于总结观点、强调核心要素的场景。",
    similar: "ultimately / when all is said and done",
    example: {
      en: "At the end of the day, it's about passion.",
      zh: "归根结底，这是关于热爱。",
    },
    timestamp: "15.20s - 17.85s",
  },
  {
    expression: "speak for itself",
    subtitleEn: "I think the results speak for themselves.",
    subtitleZh: "我认为结果本身就是最好的证明。",
    analysis:
      '这个表达意为"不言自明"，表示某事物的质量或结果非常明显，不需要额外解释。常用于自信地回应质疑。',
    usage: "用于强调结果明显、无需多言的场景。",
    similar: "be self-evident / be obvious",
    example: {
      en: "I think the results speak for themselves.",
      zh: "我认为结果本身就是最好的证明。",
    },
    timestamp: "22.10s - 24.50s",
  },
  {
    expression: "come a long way",
    subtitleEn: "She's come a long way since her first competition.",
    subtitleZh: "从第一次比赛到现在，她已经走了很长的路。",
    analysis:
      '这个表达意为"取得了很大进步"，强调从起点到现在的显著变化和成长。既可以用于字面意义上的距离，也常用于比喻意义上的进步。',
    usage: "用于赞扬某人的进步和成就。",
    similar: "make great progress / improve significantly",
    example: {
      en: "She's come a long way since her first competition.",
      zh: "从第一次比赛到现在，她已经走了很长的路。",
    },
    timestamp: "30.00s - 33.15s",
  },
  {
    expression: "the sky's the limit",
    subtitleEn: "For someone like her, the sky's the limit.",
    subtitleZh: "对于像她这样的人来说，未来不可限量。",
    analysis:
      '这个表达意为"前途无量、没有上限"，用于表达对某人潜力的极高评价。语气积极、鼓舞人心。',
    usage: "用于鼓励他人、表达对未来的乐观期待。",
    similar: "there's no limit / anything is possible",
    example: {
      en: "For someone like her, the sky's the limit.",
      zh: "对于像她这样的人来说，未来不可限量。",
    },
    timestamp: "40.50s - 43.20s",
  },
  {
    expression: "take it to the next level",
    subtitleEn: "She's always looking to take it to the next level.",
    subtitleZh: "她总是在寻求更上一层楼。",
    analysis:
      '这个表达意为"更上一层楼、提升到新水平"，强调不满足于现状，追求更高的目标和成就。',
    usage: "用于描述追求进步、提升表现的场景。",
    similar: "step it up / raise the bar",
    example: {
      en: "She's always looking to take it to the next level.",
      zh: "她总是在寻求更上一层楼。",
    },
    timestamp: "48.00s - 50.75s",
  },
]
