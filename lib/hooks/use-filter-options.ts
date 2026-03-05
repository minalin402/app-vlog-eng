"use client"

import { useMemo } from "react"
import type { Video } from "@/lib/types"

interface FilterOptions {
  difficulties: string[]
  durations: string[]
  creators: string[]
  topics: string[]
}

export function useFilterOptions(videos: Video[]): FilterOptions {
  return useMemo(() => {
    const options: FilterOptions = {
      difficulties: [],
      durations: ["1分钟内", "2分钟内", "5分钟内", "10分钟以上"],
      creators: [],
      topics: [],
    }

    // 从视频数据中提取选项
    const creatorSet = new Set<string>()
    const topicSet = new Set<string>()
    const difficultySet = new Set<string>()

    videos.forEach(video => {
      // 提取博主名
      const creator = video.title.split('_')[1]?.replace(/_/g, ' ')
      if (creator) creatorSet.add(creator)

      // 提取话题
      video.topics.forEach(topic => topicSet.add(topic))

      // 提取难度
      if (video.difficulty) difficultySet.add(video.difficulty)
    })

    // 转换为排序后的数组
    options.creators = Array.from(creatorSet).sort()
    options.topics = Array.from(topicSet).sort()
    options.difficulties = Array.from(difficultySet)
      .map(d => parseInt(d))
      .sort((a, b) => a - b)
      .map(String)

    return options
  }, [videos])
}