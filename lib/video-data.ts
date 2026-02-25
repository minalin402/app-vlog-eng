export type HighlightType = "word" | "phrase" | "expression"

export interface ClickableWord {
  word: string
  phonetic: string
  pos: string
  meaningCn: string
  meaningEn: string
  exampleEn: string
  exampleCn: string
  highlightType: HighlightType
}

export interface SubtitleItem {
  id: number
  startTime: number
  endTime: number
  timeLabel: string
  english: string
  chinese: string
  clickableWords?: ClickableWord[]
}

export interface VocabWord {
  word: string
  phonetic: string
  pos: string
  meaningCn: string
  meaningEn: string
  examples: { en: string; cn: string }[]
  type: "word" | "phrase" | "expression"
  favorited?: boolean
  // Expression-only fields
  sourceEn?: string
  sourceCn?: string
  analysis?: string
  usageScene?: string
  similar?: string
}

export const subtitles: SubtitleItem[] = [
  {
    id: 0,
    startTime: 0,
    endTime: 5,
    timeLabel: "0:00",
    english: "Do you see, um, these as two silvers gained or two golds lost?",
    chinese: "你会把这看作赢得了两枚银牌，还是错失了两枚金牌？",
    clickableWords: [
      {
        word: "two silvers gained",
        phonetic: "/tuː ˈsɪlvərz ɡeɪnd/",
        pos: "phr.",
        meaningCn: "赢得两枚银牌",
        meaningEn: "winning two silver medals",
        exampleEn: "Do you see, um, these as two silvers gained or two golds lost?",
        exampleCn: "你会把这看作赢得了两枚银牌，还是错失了两枚金牌？",
        highlightType: "phrase",
      },
      {
        word: "two golds lost",
        phonetic: "/tuː ɡoʊldz lɒst/",
        pos: "phr.",
        meaningCn: "错失两枚金牌",
        meaningEn: "losing two gold medals",
        exampleEn: "Do you see, um, these as two silvers gained or two golds lost?",
        exampleCn: "你会把这看作赢得了两枚银牌，还是错失了两枚金牌？",
        highlightType: "phrase",
      },
    ],
  },
  {
    id: 1,
    startTime: 5,
    endTime: 7,
    timeLabel: "0:05",
    english: "[Laughs]",
    chinese: "[笑]",
  },
  {
    id: 2,
    startTime: 7,
    endTime: 10,
    timeLabel: "0:07",
    english: "I'm the most decorated free skier... female free skier in history.",
    chinese: "我是历史上拿到奖牌最多的自由式滑雪选手......女性自由式滑雪选手。",
    clickableWords: [
      {
        word: "decorated",
        phonetic: "/ˈdekəreɪtɪd/",
        pos: "adj.",
        meaningCn: "获得很多奖章的",
        meaningEn: "having received many awards or honors",
        exampleEn: "I'm the most decorated free skier in history.",
        exampleCn: "我是历史上拿到奖牌最多的自由式滑雪选手。",
        highlightType: "word",
      },
      {
        word: "female",
        phonetic: "/ˈfiːmeɪl/",
        pos: "adj.",
        meaningCn: "女性的",
        meaningEn: "of or relating to women",
        exampleEn: "...female free skier in history.",
        exampleCn: "......女性自由式滑雪选手。",
        highlightType: "word",
      },
    ],
  },
  {
    id: 3,
    startTime: 10,
    endTime: 13,
    timeLabel: "0:10",
    english: "I think that's an answer in and of itself.",
    chinese: "我觉得这本身就是答案。",
    clickableWords: [
      {
        word: "in and of itself",
        phonetic: "/ɪn ænd əv ɪtˈself/",
        pos: "expr.",
        meaningCn: "本身；就其本身而言",
        meaningEn: "by its very nature; inherently",
        exampleEn: "I think that's an answer in and of itself.",
        exampleCn: "我觉得这本身就是答案。",
        highlightType: "expression",
      },
    ],
  },
  {
    id: 4,
    startTime: 13,
    endTime: 16,
    timeLabel: "0:13",
    english: "Um, how do I say this?",
    chinese: "嗯，我该怎么说呢？",
    clickableWords: [
      {
        word: "how do I say this",
        phonetic: "/haʊ duː aɪ seɪ ðɪs/",
        pos: "expr.",
        meaningCn: "我该怎么说呢",
        meaningEn: "used when trying to find the right words",
        exampleEn: "Um, how do I say this?",
        exampleCn: "嗯，我该怎么说呢？",
        highlightType: "expression",
      },
    ],
  },
  {
    id: 5,
    startTime: 16,
    endTime: 21,
    timeLabel: "0:16",
    english: "Winning a medal at the Olympics is a life-changing experience for every athlete.",
    chinese: "对每位运动员来说，在奥运会上拿到一枚奖牌都是会改变人生的经历。",
    clickableWords: [
      {
        word: "medal",
        phonetic: "/ˈmedl/",
        pos: "n.",
        meaningCn: "奖牌；奖章",
        meaningEn: "a metal disc given as a prize",
        exampleEn: "Winning a medal at the Olympics is a life-changing experience.",
        exampleCn: "在奥运会上拿到一枚奖牌是会改变人生的经历。",
        highlightType: "word",
      },
      {
        word: "a life-changing experience",
        phonetic: "/ə laɪf-ˈtʃeɪndʒɪŋ ɪkˈspɪriəns/",
        pos: "phr.",
        meaningCn: "改变人生的经历",
        meaningEn: "an event that profoundly alters one's life",
        exampleEn: "Winning a medal at the Olympics is a life-changing experience for every athlete.",
        exampleCn: "对每位运动员来说，在奥运会上拿到一枚奖牌都是会改变人生的经历。",
        highlightType: "phrase",
      },
      {
        word: "athlete",
        phonetic: "/ˈæθliːt/",
        pos: "n.",
        meaningCn: "运动员",
        meaningEn: "a person who is proficient in sports",
        exampleEn: "...a life-changing experience for every athlete.",
        exampleCn: "......对每位运动员来说都是改变人生的经历。",
        highlightType: "word",
      },
    ],
  },
  {
    id: 6,
    startTime: 21,
    endTime: 24,
    timeLabel: "0:21",
    english: "Doing it five times is exponentially harder.",
    chinese: "而做到五次，难度是指数级地更高。",
    clickableWords: [
      {
        word: "exponentially harder",
        phonetic: "/ˌekspəˈnenʃəli ˈhɑːrdər/",
        pos: "phr.",
        meaningCn: "指数级地更难",
        meaningEn: "increasingly difficult at a rapid rate",
        exampleEn: "Doing it five times is exponentially harder.",
        exampleCn: "而做到五次，难度是指数级地更高。",
        highlightType: "phrase",
      },
    ],
  },
  {
    id: 7,
    startTime: 24,
    endTime: 27,
    timeLabel: "0:24",
    english: "Because every medal is equally hard for me,",
    chinese: "因为对我来说，每一枚奖牌都同样难拿。",
    clickableWords: [
      {
        word: "medal",
        phonetic: "/ˈmedl/",
        pos: "n.",
        meaningCn: "奖牌；奖章",
        meaningEn: "a metal disc given as a prize",
        exampleEn: "Because every medal is equally hard for me.",
        exampleCn: "因为对我来说，每一枚奖牌都同样难拿。",
        highlightType: "word",
      },
      {
        word: "equally hard for me",
        phonetic: "/ˈiːkwəli hɑːrd fɔːr miː/",
        pos: "phr.",
        meaningCn: "对我来说同样难",
        meaningEn: "just as difficult for me",
        exampleEn: "Because every medal is equally hard for me.",
        exampleCn: "因为对我来说，每一枚奖牌都同样难拿。",
        highlightType: "phrase",
      },
    ],
  },
  {
    id: 8,
    startTime: 27,
    endTime: 30,
    timeLabel: "0:27",
    english: "But everybody else's expectations rise, right?",
    chinese: "但大家对我的期待会越来越高，对吧？",
    clickableWords: [
      {
        word: "expectations rise",
        phonetic: "/ˌekspekˈteɪʃənz raɪz/",
        pos: "phr.",
        meaningCn: "期望值上升",
        meaningEn: "expectations increase",
        exampleEn: "But everybody else's expectations rise, right?",
        exampleCn: "但大家对我的期待会越来越高，对吧？",
        highlightType: "phrase",
      },
    ],
  },
  {
    id: 9,
    startTime: 30,
    endTime: 35,
    timeLabel: "0:30",
    english: "And to be quite frank with you, have never been done before.",
    chinese: "而且坦白说，这是前所未有的。",
    clickableWords: [
      {
        word: "to be quite frank with you",
        phonetic: "/tə biː kwaɪt fræŋk wɪð juː/",
        pos: "expr.",
        meaningCn: "坦白地跟你说",
        meaningEn: "to be completely honest with you",
        exampleEn: "And to be quite frank with you, have never been done before.",
        exampleCn: "坦白说，这是前所未有的。",
        highlightType: "expression",
      },
    ],
  },
  {
    id: 10,
    startTime: 35,
    endTime: 40,
    timeLabel: "0:35",
    english: "So I choose to see it as two silvers gained.",
    chinese: "所以我选择把它看作赢得了两枚银牌。",
  },
  {
    id: 11,
    startTime: 40,
    endTime: 48,
    timeLabel: "0:40",
    english: "And I'm incredibly proud of myself.",
    chinese: "我为自己感到无比骄傲。",
    clickableWords: [
      {
        word: "incredibly proud",
        phonetic: "/ɪnˈkredɪbli praʊd/",
        pos: "phr.",
        meaningCn: "无比骄傲的",
        meaningEn: "extremely proud",
        exampleEn: "And I'm incredibly proud of myself.",
        exampleCn: "我为自己感到无比骄傲。",
        highlightType: "phrase",
      },
    ],
  },
]

export const allVocab: VocabWord[] = [
  // Words
  { word: "silver", phonetic: "/ˈsɪlvər/", pos: "n.", meaningCn: "银牌；银", meaningEn: "silver medal, second place", examples: [{ en: "Do you see, um, these as two silvers gained or two golds lost?", cn: "你会把这看作赢得了两枚银牌，还是错失了两枚金牌？" }, { en: "She won a silver medal in the 100m dash.", cn: "她在百米短跑中获得了银牌。" }], type: "word" },
  { word: "gold", phonetic: "/ɡoʊld/", pos: "n.", meaningCn: "金牌；金", meaningEn: "gold medal, first place", examples: [{ en: "Do you see, um, these as two silvers gained or two golds lost?", cn: "你会把这看作赢得了两枚银牌，还是错失了两枚金牌？" }, { en: "He dreamed of winning the gold at the Olympics.", cn: "他梦想在奥运会上赢得金牌。" }], type: "word" },
  { word: "decorated", phonetic: "/ˈdekəreɪtɪd/", pos: "adj.", meaningCn: "获得很多奖章的", meaningEn: "having received many awards", examples: [{ en: "I'm the most decorated free skier in history.", cn: "我是历史上拿到奖牌最多的自由式滑雪选手。" }, { en: "He is the most decorated soldier in the regiment.", cn: "他是团里获得最多勋章的士兵。" }], type: "word" },
  { word: "female", phonetic: "/ˈfiːmeɪl/", pos: "adj.", meaningCn: "女性的", meaningEn: "of or relating to women", examples: [{ en: "...female free skier in history.", cn: "......女性自由式滑雪选手。" }], type: "word" },
  { word: "medal", phonetic: "/ˈmedl/", pos: "n.", meaningCn: "奖牌；奖章", meaningEn: "a metal disc given as a prize", examples: [{ en: "Winning a medal at the Olympics.", cn: "在奥运会上赢得奖牌。" }, { en: "Every medal is equally hard for me.", cn: "每一枚奖牌对我来说都同样难拿。" }], type: "word" },
  { word: "athlete", phonetic: "/ˈæθliːt/", pos: "n.", meaningCn: "运动员", meaningEn: "a person proficient in sports", examples: [{ en: "...for every athlete.", cn: "......对每位运动员来说。" }, { en: "The athlete trained for years before the competition.", cn: "这位运动员在比赛前训练了多年。" }], type: "word" },
  { word: "exponentially", phonetic: "/ˌekspəˈnenʃəli/", pos: "adv.", meaningCn: "指数级地", meaningEn: "at an increasingly rapid rate", examples: [{ en: "Doing it five times is exponentially harder.", cn: "做到五次，难度是指数级地更高。" }], type: "word" },
  { word: "equally", phonetic: "/ˈiːkwəli/", pos: "adv.", meaningCn: "同样地", meaningEn: "to the same degree", examples: [{ en: "Every medal is equally hard for me.", cn: "每一枚奖牌对我来说都同样难拿。" }], type: "word" },
  { word: "expectations", phonetic: "/ˌekspekˈteɪʃənz/", pos: "n.", meaningCn: "期望；期待", meaningEn: "strong hopes or beliefs", examples: [{ en: "Everybody else's expectations rise.", cn: "大家的期待会越来越高。" }], type: "word" },
  { word: "frank", phonetic: "/fræŋk/", pos: "adj.", meaningCn: "坦白的；直率的", meaningEn: "open, honest, and direct", examples: [{ en: "To be quite frank with you.", cn: "坦白地跟你说。" }], type: "word" },
  { word: "incredibly", phonetic: "/ɪnˈkredɪbli/", pos: "adv.", meaningCn: "难以置信地；非常", meaningEn: "to a great degree; extremely", examples: [{ en: "I'm incredibly proud of myself.", cn: "我为自己感到无比骄傲。" }], type: "word" },
  { word: "proud", phonetic: "/praʊd/", pos: "adj.", meaningCn: "骄傲的；自豪的", meaningEn: "feeling deep pleasure from achievements", examples: [{ en: "I'm incredibly proud of myself.", cn: "我为自己感到无比骄傲。" }], type: "word" },
  { word: "reporter", phonetic: "/rɪˈpɔːrtər/", pos: "n.", meaningCn: "记者", meaningEn: "a person who reports news", examples: [{ en: "Eileen Gu corrects a reporter.", cn: "谷爱凌纠正了一位记者。" }], type: "word" },
  { word: "corrects", phonetic: "/kəˈrekts/", pos: "v.", meaningCn: "纠正", meaningEn: "puts right; makes accurate", examples: [{ en: "Eileen Gu corrects a reporter.", cn: "谷爱凌纠正了一位记者。" }], type: "word" },
  { word: "skier", phonetic: "/ˈskiːər/", pos: "n.", meaningCn: "滑雪者", meaningEn: "a person who skis", examples: [{ en: "I'm the most decorated free skier.", cn: "我是获得最多荣誉的自由式滑雪选手。" }], type: "word" },
  { word: "history", phonetic: "/ˈhɪstəri/", pos: "n.", meaningCn: "历史", meaningEn: "the study of past events", examples: [{ en: "...free skier in history.", cn: "......历史上的自由式滑雪选手。" }], type: "word" },
  { word: "Olympics", phonetic: "/əˈlɪmpɪks/", pos: "n.", meaningCn: "奥运会", meaningEn: "the Olympic Games", examples: [{ en: "Winning a medal at the Olympics.", cn: "在奥运会上赢得奖牌。" }], type: "word" },
  // Phrases
  { word: "a life-changing experience", phonetic: "", pos: "phr.", meaningCn: "改变人生的经历", meaningEn: "an event that profoundly alters one's life", examples: [{ en: "Winning a medal at the Olympics is a life-changing experience.", cn: "在奥运会上赢得奖牌是改变人生的经历。" }, { en: "Traveling alone was a life-changing experience for her.", cn: "独自旅行对她来说是一次改变人生的经历。" }], type: "phrase" },
  { word: "exponentially harder", phonetic: "", pos: "phr.", meaningCn: "指数级地更难", meaningEn: "increasingly difficult at a rapid rate", examples: [{ en: "Doing it five times is exponentially harder.", cn: "而做到五次，难度是指数级地更高。" }], type: "phrase" },
  { word: "equally hard for me", phonetic: "", pos: "phr.", meaningCn: "对我来说同样难", meaningEn: "just as difficult for me", examples: [{ en: "Every medal is equally hard for me.", cn: "每一枚奖牌对我来说都同样难拿。" }], type: "phrase" },
  { word: "expectations rise", phonetic: "", pos: "phr.", meaningCn: "期望值上升", meaningEn: "expectations increase", examples: [{ en: "Everybody else's expectations rise.", cn: "大家的期待会越来越高。" }], type: "phrase" },
  { word: "two silvers gained", phonetic: "", pos: "phr.", meaningCn: "赢得两枚银牌", meaningEn: "winning two silver medals", examples: [{ en: "Do you see these as two silvers gained?", cn: "你会把这看作赢得了两枚银牌？" }], type: "phrase" },
  { word: "two golds lost", phonetic: "", pos: "phr.", meaningCn: "错失两枚金牌", meaningEn: "losing two gold medals", examples: [{ en: "...or two golds lost?", cn: "......还是错失了两枚金牌？" }], type: "phrase" },
  { word: "free skier", phonetic: "", pos: "phr.", meaningCn: "自由式滑雪选手", meaningEn: "freestyle skier", examples: [{ en: "I'm the most decorated free skier.", cn: "我是获得最多荣誉的自由式滑雪选手。" }], type: "phrase" },
  { word: "incredibly proud", phonetic: "", pos: "phr.", meaningCn: "无比骄傲的", meaningEn: "extremely proud", examples: [{ en: "I'm incredibly proud of myself.", cn: "我为自己感到无比骄傲。" }], type: "phrase" },
  { word: "done before", phonetic: "", pos: "phr.", meaningCn: "之前做过的", meaningEn: "accomplished previously", examples: [{ en: "...have never been done before.", cn: "......是前所未有的。" }], type: "phrase" },
  { word: "choose to see", phonetic: "", pos: "phr.", meaningCn: "选择把......看作", meaningEn: "decide to view as", examples: [{ en: "I choose to see it as two silvers gained.", cn: "我选择把它看作赢得了两枚银牌。" }], type: "phrase" },
  // Expressions
  { word: "in and of itself", phonetic: "/ɪn ænd əv ɪtˈself/", pos: "expr.", meaningCn: "就其本身而言", meaningEn: "by its very nature; inherently", examples: [{ en: "I think that's an answer in and of itself.", cn: "我觉得这本身就是答案。" }], type: "expression", sourceEn: "I think that's an answer in and of itself.", sourceCn: "我觉得这本身就是答案。", analysis: "这个表达表示\"就其本身而言\"，强调某件事单独成立就足以说明问题，不需要再补充外部理由。口语里常用它来收束争论、给出结论，语气简洁但很有分量。", usageScene: "用于回答质疑、强调\"这本身就是证明\"的场景。", similar: "by itself / in itself" },
  { word: "to be quite frank with you", phonetic: "", pos: "expr.", meaningCn: "坦白地跟你说", meaningEn: "to be completely honest with you", examples: [{ en: "And to be quite frank with you, have never been done before.", cn: "坦白说，这是前所未有的。" }, { en: "To be quite frank with you, I don't think this plan will work.", cn: "坦白跟你说，我觉得这个计划行不通。" }], type: "expression", sourceEn: "And to be quite frank with you, have never been done before.", sourceCn: "坦白说，这是前所未有的。", analysis: "这个表达用于在说出可能直接或敏感的话之前做铺垫，表示\"我要实话实说了\"。常见于正式和非正式场合，语气比 honestly 更正式一些。", usageScene: "用于需要直言不讳、表达真实想法的场景。", similar: "honestly speaking / to tell you the truth" },
  { word: "how do I say this", phonetic: "", pos: "expr.", meaningCn: "我该怎么说呢", meaningEn: "used when trying to find the right words", examples: [{ en: "Um, how do I say this?", cn: "嗯，我该怎么说呢？" }], type: "expression", sourceEn: "Um, how do I say this?", sourceCn: "嗯，我该怎么说呢？", analysis: "口语中常见的思考停顿表达，表示说话者正在组织语言、寻找合适的措辞。常用于要说一些棘手或复杂的事情之前。", usageScene: "用于需要斟酌措辞、表达复杂想法的场景。", similar: "how should I put it / what's the word" },
  { word: "I choose to see it as", phonetic: "", pos: "expr.", meaningCn: "我选择把它看作", meaningEn: "I decide to interpret it as", examples: [{ en: "I choose to see it as two silvers gained.", cn: "我选择把它看作赢得了两枚银牌。" }], type: "expression", sourceEn: "So I choose to see it as two silvers gained.", sourceCn: "所以我选择把它看作赢得了两枚银牌。", analysis: "表达一种主动选择乐观视角的态度，强调\"看法是可以选择的\"。体现了积极心态和高情商的回应方式。", usageScene: "用于表达积极心态、重新定义处境的场景。", similar: "I prefer to think of it as / I'd rather view it as" },
  { word: "I'm incredibly proud of myself", phonetic: "", pos: "expr.", meaningCn: "我为自己感到无比骄傲", meaningEn: "I feel extremely proud of my achievements", examples: [{ en: "And I'm incredibly proud of myself.", cn: "我为自己感到无比骄傲。" }], type: "expression", sourceEn: "And I'm incredibly proud of myself.", sourceCn: "我为自己感到无比骄傲。", analysis: "直接表达对自己成就的自豪感，incredibly 加强了语气。这种自信的自我肯定在英语文化中很常见，表达了健康的自我认知。", usageScene: "用于总结成就、表达自我肯定的场景。", similar: "I'm extremely proud / I feel so proud" },
  { word: "everybody else's expectations rise", phonetic: "", pos: "expr.", meaningCn: "大家的期望越来越高", meaningEn: "other people's expectations keep increasing", examples: [{ en: "But everybody else's expectations rise, right?", cn: "但大家对我的期待会越来越高，对吧？" }], type: "expression", sourceEn: "But everybody else's expectations rise, right?", sourceCn: "但大家对我的期待会越来越高，对吧？", analysis: "用 rise 形象地表达了期望值\"上升\"的动态过程。everybody else's 强调了外界（而非自己）的压力来源，带有一定的反思意味。", usageScene: "用于讨论外部压力、他人期望变化的场景。", similar: "people's expectations grow / the bar keeps getting higher" },
]
