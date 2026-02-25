"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const filters = [
  {
    label: "难度",
    placeholder: "全部难度",
    options: [
      { value: "all", label: "全部难度" },
      { value: "beginner", label: "入门" },
      { value: "elementary", label: "初级" },
      { value: "intermediate", label: "中级" },
      { value: "advanced", label: "高级" },
    ],
  },
  {
    label: "时长",
    placeholder: "全部时长",
    options: [
      { value: "all", label: "全部时长" },
      { value: "1min", label: "1分钟" },
      { value: "2min", label: "2分钟" },
      { value: "5min", label: "5分钟" },
      { value: "10min", label: "10分钟以上" },
    ],
  },
  {
    label: "主持人",
    placeholder: "主持人",
    options: [
      { value: "all", label: "全部主持人" },
      { value: "ailing", label: "谷爱凌" },
      { value: "traveler", label: "旅行博主" },
      { value: "teacher", label: "英语老师" },
    ],
  },
  {
    label: "话题",
    placeholder: "话题",
    options: [
      { value: "all", label: "全部话题" },
      { value: "sports", label: "体育" },
      { value: "travel", label: "旅行" },
      { value: "daily", label: "日常生活" },
      { value: "tech", label: "科技" },
      { value: "culture", label: "文化" },
    ],
  },
]

export function FilterBar() {
  return (
    <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center md:gap-3">
      {filters.map((filter) => (
        <Select key={filter.label} defaultValue="all">
          <SelectTrigger className="w-full bg-card text-foreground md:w-[140px]">
            <SelectValue placeholder={filter.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  )
}
